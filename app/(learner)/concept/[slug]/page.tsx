import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRequiredEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { submitExercise } from "./actions";

type Modality = "V" | "A" | "R" | "K";
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type LessonAsset = {
  id: string;
  modality: Modality;
  type: string;
  content: JsonValue;
  media_url: string | null;
};

type ModalityWeights = Record<Modality, number>;

const modalityNames: Record<Modality, string> = {
  V: "Visual",
  A: "Listen and discuss",
  R: "Read and write",
  K: "Practice",
};

const assetTypeNames: Record<string, string> = {
  diagram: "Diagram",
  annotated_screenshot: "Annotated screenshot",
  script: "Walkthrough script",
  discussion_prompts: "Discussion prompts",
  written_guide: "Written guide",
  quiz: "Quiz",
  exercise: "Exercise",
};

const balancedWeights: ModalityWeights = { V: 0.25, A: 0.25, R: 0.25, K: 0.25 };

function asWeights(value: unknown): ModalityWeights {
  if (!value || typeof value !== "object") {
    return balancedWeights;
  }

  const candidate = value as Partial<Record<Modality, unknown>>;

  return {
    V: typeof candidate.V === "number" ? candidate.V : balancedWeights.V,
    A: typeof candidate.A === "number" ? candidate.A : balancedWeights.A,
    R: typeof candidate.R === "number" ? candidate.R : balancedWeights.R,
    K: typeof candidate.K === "number" ? candidate.K : balancedWeights.K,
  };
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderContent(value: JsonValue, keyPrefix: string): React.ReactNode {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return <p className="ti-p mb-0 whitespace-pre-wrap">{value}</p>;
  }

  if (typeof value === "boolean") {
    return <p className="ti-p mb-0">{value ? "Yes" : "No"}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="space-y-2 pl-5 text-ink-soft">
        {value.map((item, index) => (
          <li className="list-disc" key={`${keyPrefix}-${index}`}>
            {typeof item === "object" && item !== null
              ? renderContent(item, `${keyPrefix}-${index}`)
              : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(value).map(([key, item]) => {
        if (item === null || item === "") {
          return null;
        }

        return (
          <section className="space-y-2" key={`${keyPrefix}-${key}`}>
            <h4 className="!text-sm font-semibold !leading-normal">{titleCase(key)}</h4>
            {renderContent(item, `${keyPrefix}-${key}`)}
          </section>
        );
      })}
    </div>
  );
}

function getPracticeUrl(baseUrl: string, exercise: LessonAsset | undefined) {
  if (!exercise || !exercise.content || typeof exercise.content !== "object" || Array.isArray(exercise.content)) {
    return baseUrl;
  }

  const content = exercise.content as Record<string, JsonValue>;
  const directUrl = content.figma_url || content.frame_url;

  if (typeof directUrl === "string" && directUrl.startsWith("https://")) {
    return directUrl;
  }

  if (typeof content.frame_node_id === "string") {
    const url = new URL(baseUrl);
    url.searchParams.set("node-id", content.frame_node_id);
    return url.toString();
  }

  return baseUrl;
}

function submissionMessage(state: string | undefined) {
  switch (state) {
    case "saved":
      return { tone: "success", text: "Your frame was submitted for review." };
    case "missing":
      return { tone: "error", text: "Paste the link to your completed Figma frame." };
    case "invalid":
      return { tone: "error", text: "Use a Figma frame link that includes a node ID." };
    case "error":
      return { tone: "error", text: "Your submission could not be saved. Try again." };
    default:
      return null;
  }
}

function CapstoneInstructions() {
  return (
    <div className="space-y-4">
      <p className="ti-p mb-0">
        Rebuild the reference design in the practice file using only boilerplate components.
        Keep the page inside AutoLayout and use the boilerplate spacers, text components,
        buttons, icons, and defined effects.
      </p>
      <div className="border border-[var(--border-strong)] bg-paper p-5">
        <h3 className="!text-base font-semibold !leading-normal">Pass condition</h3>
        <p className="ti-p mt-2 mb-0">
          Run the Boilerplate Assistant on your frame. Submit the frame link when it reports 0
          structural errors.
        </p>
      </div>
    </div>
  );
}

export default async function ConceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submission?: string }>;
}) {
  const { slug } = await params;
  const { submission } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: version } = await supabase
    .from("boilerplate_versions")
    .select("id, version_label")
    .eq("is_current", true)
    .single();

  if (!version) {
    redirect("/map");
  }

  const { data: concept } = await supabase
    .from("concepts")
    .select("id, slug, title, summary, why, track, order_index, prerequisites, plugin_checks")
    .eq("version_id", version.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!concept) {
    notFound();
  }

  const { data: versionConcepts } = await supabase
    .from("concepts")
    .select("id, slug")
    .eq("version_id", version.id);
  const conceptIds = (versionConcepts || []).map((item) => item.id);
  const { data: progressRows } = conceptIds.length
    ? await supabase
        .from("progress")
        .select("concept_id, exercise_status")
        .eq("user_id", user.id)
        .in("concept_id", conceptIds)
    : { data: [] };
  const completedIds = new Set(
    (progressRows || [])
      .filter((item) => item.exercise_status === "verified")
      .map((item) => item.concept_id),
  );
  const completedSlugs = new Set(
    (versionConcepts || [])
      .filter((item) => completedIds.has(item.id))
      .map((item) => item.slug),
  );
  const isLocked = concept.prerequisites.some(
    (prerequisite: string) => !completedSlugs.has(prerequisite),
  );

  if (isLocked) {
    redirect("/map");
  }

  const [{ data: profile }, { data: assetRows }, { data: latestSubmission }] = await Promise.all([
    supabase.from("profiles").select("modality_weights").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("lesson_assets")
      .select("id, modality, type, content, media_url")
      .eq("concept_id", concept.id)
      .eq("status", "published"),
    supabase
      .from("exercise_submissions")
      .select("figma_link, review_status, review_note, created_at")
      .eq("user_id", user.id)
      .eq("concept_id", concept.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const assets = (assetRows || []) as LessonAsset[];
  const exercise = assets.find((asset) => asset.type === "exercise");
  const lessonAssets = assets.filter((asset) => asset.type !== "exercise");
  const weights = asWeights(profile?.modality_weights);
  const modalityOrder = (Object.keys(modalityNames) as Modality[]).sort(
    (left, right) => weights[right] - weights[left],
  );
  const visibleModalities = modalityOrder.filter((modality) =>
    lessonAssets.some((asset) => asset.modality === modality),
  );
  const firstOpenModality = visibleModalities[0];
  const practiceUrl = getPracticeUrl(getRequiredEnv("PRACTICE_FILE_URL"), exercise);
  const notice = submissionMessage(submission);
  const isUsingCapstone = concept.track === "using" && concept.slug === "capstone-use";

  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-8 sm:py-12">
        <div className="border-b-[10px] border-ink bg-paper">
          <header className="border-b border-[var(--border)] px-6 py-8 sm:px-10 md:py-12">
            <Link className="text-sm font-medium text-ocean underline-offset-4 hover:underline" href="/map">
              Back to course map
            </Link>
            <p className="ti-eyebrow mt-8">
              {isUsingCapstone ? "Using track capstone" : `Concept ${String(concept.order_index).padStart(2, "0")}`}
            </p>
            <h1 className="mt-4 max-w-[900px] font-display text-[clamp(36px,6vw,72px)] font-display-normal leading-display tracking-normal">
              {concept.title}
            </h1>
            <p className="ti-lead mt-6 max-w-[820px] text-ink-soft">{concept.summary}</p>
            {concept.why ? (
              <div className="mt-8 max-w-[820px] border-l-4 border-saffron pl-5">
                <h2 className="!text-lg font-semibold !leading-normal">Why this matters</h2>
                <p className="ti-p mt-2 mb-0">{concept.why}</p>
              </div>
            ) : null}
          </header>

          <div className="px-6 py-8 sm:px-10 md:py-12">
            {lessonAssets.length > 0 ? (
              <div className="space-y-4">
                {visibleModalities.map((modality) => {
                  const modalityAssets = lessonAssets.filter((asset) => asset.modality === modality);

                  return (
                    <details
                      className="group border border-[var(--border-strong)] bg-bone open:bg-paper"
                      key={modality}
                      open={modality === firstOpenModality}
                    >
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium marker:content-none focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean">
                        <span>{modalityNames[modality]}</span>
                        <span aria-hidden="true" className="text-xl leading-none group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <div className="space-y-8 border-t border-[var(--border)] px-5 py-6">
                        {modalityAssets.map((asset) => (
                          <article className="space-y-4" key={asset.id}>
                            <h3 className="!text-base font-semibold !leading-normal">
                              {assetTypeNames[asset.type] || titleCase(asset.type)}
                            </h3>
                            {asset.media_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={`${concept.title} ${assetTypeNames[asset.type] || asset.type}`}
                                className="h-auto max-h-[680px] w-full object-contain object-left"
                                src={asset.media_url}
                              />
                            ) : null}
                            {renderContent(asset.content, asset.id)}
                          </article>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div className="border border-[var(--border-strong)] bg-cream px-5 py-6 sm:px-8 sm:py-8">
                <p className="ti-eyebrow">Lesson content coming</p>
                <h2 className="mt-3 !text-xl font-semibold !leading-tight">
                  This lesson is being prepared.
                </h2>
                <p className="ti-p mt-3 mb-0 max-w-[680px]">
                  The concept summary and reason are ready above. You can still open the practice
                  file and submit your work below.
                </p>
              </div>
            )}
          </div>

          <section className="border-t-[10px] border-ink bg-cream px-6 py-8 sm:px-10 md:py-12" id="exercise">
            <p className="ti-eyebrow">Completion step</p>
            <h2 className="mt-4 max-w-[760px] text-[clamp(28px,4vw,44px)] !leading-tight">
              Practice in Figma
            </h2>

            <div className="mt-6 max-w-[820px] space-y-5">
              {exercise ? renderContent(exercise.content, exercise.id) : isUsingCapstone ? (
                <CapstoneInstructions />
              ) : (
                <p className="ti-p mb-0">
                  Exercise instructions are still being prepared. Open the practice file, complete
                  the concept work, then submit a link to your finished frame.
                </p>
              )}

              <a
                className="inline-flex min-h-11 w-fit max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border border-ink bg-ink px-6 py-3 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                href={practiceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open practice file
              </a>
            </div>

            <form action={submitExercise} className="mt-10 max-w-[820px] border-t border-[var(--border-strong)] pt-8">
              <input name="concept_id" type="hidden" value={concept.id} />
              <input name="slug" type="hidden" value={concept.slug} />
              <label className="ti-eyebrow" htmlFor="figma_link">
                Completed frame link
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  className="min-h-12 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-paper px-4 text-base text-ink outline-none placeholder:text-[var(--ti-ink-muted)] focus:border-ocean focus:ring-2 focus:ring-ocean"
                  id="figma_link"
                  name="figma_link"
                  placeholder="https://www.figma.com/design/...?node-id=..."
                  required
                  type="url"
                />
                <button
                  className="min-h-12 shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] border border-ink bg-ink px-6 py-3 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                  type="submit"
                >
                  Submit for review
                </button>
              </div>

              {notice ? (
                <p
                  className={`mt-3 text-sm font-medium ${notice.tone === "success" ? "text-harakeke" : "text-[var(--ti-error)]"}`}
                  role="status"
                >
                  {notice.text}
                </p>
              ) : null}

              {latestSubmission ? (
                <div className="mt-6 border-l-4 border-ocean pl-4 text-sm text-ink-soft">
                  <p className="mb-1 font-semibold text-ink">
                    Latest submission: {titleCase(latestSubmission.review_status)}
                  </p>
                  <a
                    className="break-all text-ocean underline underline-offset-4"
                    href={latestSubmission.figma_link}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open submitted frame
                  </a>
                  {latestSubmission.review_note ? (
                    <p className="mt-3 mb-0">Reviewer note: {latestSubmission.review_note}</p>
                  ) : null}
                </div>
              ) : null}
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
