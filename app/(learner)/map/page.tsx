import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";

type ConceptTrack = "using" | "setup";
type ExerciseStatus = "not_started" | "in_progress" | "submitted" | "verified";
type MapState = "available" | "locked" | "in_progress" | "submitted" | "complete";

type ConceptRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  track: ConceptTrack;
  order_index: number;
  prerequisites: string[];
};

type ProgressRow = {
  concept_id: string;
  exercise_status: ExerciseStatus;
};

type PositionedConcept = ConceptRow & {
  state: MapState;
  statusLabel: string;
  unmetPrerequisites: string[];
  x: number;
  y: number;
};

const cardWidth = 170;
const cardHeight = 128;
const mapWidth = 1440;
const mapHeight = 820;

const nodePositions: Record<string, { x: number; y: number }> = {
  "why-boilerplate-exists": { x: 0, y: 170 },
  "autolayout-and-page-structure": { x: 180, y: 170 },
  "spacers-and-spacing": { x: 360, y: 70 },
  typography: { x: 540, y: 70 },
  "buttons-and-icons": { x: 360, y: 210 },
  effects: { x: 360, y: 350 },
  "building-without-breaking": { x: 540, y: 280 },
  "capstone-use": { x: 720, y: 280 },
  "duplicate-and-set-up": { x: 720, y: 620 },
  "customize-type": { x: 900, y: 620 },
  "customize-spacing-and-effects": { x: 1080, y: 620 },
  "publish-link-and-verify": { x: 1260, y: 620 },
};

const stateStyles: Record<MapState, string> = {
  available: "border-ink bg-paper text-ink",
  locked: "border-[var(--border)] bg-cream text-ink-soft opacity-75",
  in_progress: "border-ocean bg-paper text-ink",
  submitted: "border-saffron bg-paper text-ink",
  complete: "border-harakeke bg-[color-mix(in_srgb,var(--ti-harakeke)_12%,var(--ti-paper))] text-ink",
};

const badgeStyles: Record<MapState, string> = {
  available: "border-ink bg-ink text-bone",
  locked: "border-[var(--border-strong)] bg-bone text-ink-soft",
  in_progress: "border-ocean bg-ocean text-bone",
  submitted: "border-saffron bg-saffron text-ink",
  complete: "border-harakeke bg-harakeke text-bone",
};

function getState(progress: ExerciseStatus | undefined, unmetPrerequisites: string[]): MapState {
  if (progress === "verified") {
    return "complete";
  }

  if (unmetPrerequisites.length > 0) {
    return "locked";
  }

  if (progress === "submitted") {
    return "submitted";
  }

  if (progress === "in_progress") {
    return "in_progress";
  }

  return "available";
}

function getStatusLabel(state: MapState) {
  switch (state) {
    case "available":
      return "Available";
    case "locked":
      return "Locked";
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Submitted";
    case "complete":
      return "Complete";
  }
}

function getEdgePath(from: PositionedConcept, to: PositionedConcept) {
  const startX = from.x + cardWidth;
  const startY = from.y + cardHeight / 2;
  const endX = to.x;
  const endY = to.y + cardHeight / 2;
  const middleX = startX + (endX - startX) / 2;

  return `M ${startX} ${startY} L ${middleX} ${startY} L ${middleX} ${endY} L ${endX} ${endY}`;
}

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: version, error: versionError } = await supabase
    .from("boilerplate_versions")
    .select("id, version_label")
    .eq("is_current", true)
    .single();

  if (versionError || !version) {
    return (
      <main className="min-h-screen bg-bone text-ink">
        <section className="mx-auto flex min-h-screen w-full max-w-[var(--container-max)] items-center px-[var(--container-pad)] py-16">
          <div className="w-full border-b-[10px] border-ink bg-paper px-6 py-10 sm:px-12 md:py-16">
            <p className="ti-eyebrow">Boilerplate Trainer</p>
            <h1 className="mt-5 font-display text-[clamp(44px,8vw,104px)] font-display-normal leading-display tracking-normal">
              Course map unavailable
            </h1>
            <p className="ti-p mt-5 max-w-[620px]">
              Seed the concept map, then refresh this page.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const { data: concepts, error: conceptsError } = await supabase
    .from("concepts")
    .select("id, slug, title, summary, track, order_index, prerequisites")
    .eq("version_id", version.id)
    .order("order_index");

  if (conceptsError) {
    throw conceptsError;
  }

  const conceptRows = (concepts || []) as ConceptRow[];
  const conceptIds = conceptRows.map((concept) => concept.id);

  const { data: progressRows, error: progressError } = await supabase
    .from("progress")
    .select("concept_id, exercise_status")
    .eq("user_id", user.id)
    .in("concept_id", conceptIds);

  if (progressError) {
    throw progressError;
  }

  const progressByConceptId = new Map(
    ((progressRows || []) as ProgressRow[]).map((progress) => [
      progress.concept_id,
      progress.exercise_status,
    ]),
  );
  const conceptBySlug = new Map(conceptRows.map((concept) => [concept.slug, concept]));
  const completedSlugs = new Set(
    conceptRows
      .filter((concept) => progressByConceptId.get(concept.id) === "verified")
      .map((concept) => concept.slug),
  );

  const positionedConcepts = conceptRows.map((concept) => {
    const unmetPrerequisites = concept.prerequisites.filter(
      (prerequisite) => !completedSlugs.has(prerequisite),
    );
    const state = getState(progressByConceptId.get(concept.id), unmetPrerequisites);
    const fallbackPosition = {
      x: 40 + ((concept.order_index - 1) % 4) * 280,
      y: concept.track === "using" ? 150 : 760,
    };

    return {
      ...concept,
      ...fallbackPosition,
      ...nodePositions[concept.slug],
      state,
      statusLabel: getStatusLabel(state),
      unmetPrerequisites,
    };
  }) as PositionedConcept[];

  const positionedBySlug = new Map(positionedConcepts.map((concept) => [concept.slug, concept]));
  const usingConcepts = positionedConcepts.filter((concept) => concept.track === "using");
  const setupConcepts = positionedConcepts.filter((concept) => concept.track === "setup");
  const edges = positionedConcepts.flatMap((concept) =>
    concept.prerequisites
      .map((prerequisiteSlug) => {
        const prerequisite = positionedBySlug.get(prerequisiteSlug);

        if (!prerequisite) {
          return null;
        }

        return {
          from: prerequisite,
          to: concept,
        };
      })
      .filter(Boolean),
  ) as Array<{ from: PositionedConcept; to: PositionedConcept }>;

  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto min-h-screen w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-10 sm:py-14">
        <div className="border-b-[10px] border-ink bg-paper">
          <div className="grid gap-8 border-b border-[var(--border)] px-6 py-8 sm:px-10 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-4">
              <p className="ti-eyebrow">Boilerplate Trainer</p>
              <h1 className="font-display text-[clamp(44px,8vw,96px)] font-display-normal leading-display tracking-normal">
                Course map
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                <p>{version.version_label}</p>
                <p>{conceptRows.length} concepts loaded</p>
                <p>{user.email}</p>
                {profile?.role ? <p>Role: {profile.role}</p> : null}
              </div>
            </div>

            <form action={signOut}>
              <button
                className="inline-flex rounded-[var(--radius-pill)] border border-ink bg-ink px-6 py-3 font-body text-sm font-medium text-bone transition hover:bg-bone hover:text-ink"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>

          <div className="grid gap-4 border-b border-[var(--border)] px-6 py-5 text-sm text-ink-soft sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <p>
              Work left to right. Locked concepts show what they need first.
            </p>
            <div className="flex flex-wrap gap-2">
              {(["available", "locked", "in_progress", "submitted", "complete"] as MapState[]).map(
                (state) => (
                  <span
                    className={`rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium ${badgeStyles[state]}`}
                    key={state}
                  >
                    {getStatusLabel(state)}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="overflow-x-auto px-6 py-8 sm:px-10">
            <div className="relative h-[820px] min-w-[1440px]">
              <div className="absolute left-0 top-0 rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
                Using the boilerplate
              </div>
              <div className="absolute left-[720px] top-[540px] rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
                Setting up a boilerplate
              </div>

              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                focusable="false"
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              >
                {edges.map((edge) => (
                  <path
                    d={getEdgePath(edge.from, edge.to)}
                    fill="none"
                    key={`${edge.from.slug}-${edge.to.slug}`}
                    opacity={edge.to.state === "locked" ? 0.18 : 0.38}
                    stroke="var(--ti-ink)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {[...usingConcepts, ...setupConcepts].map((concept) => (
                <article
                  className={`absolute flex h-[128px] w-[170px] flex-col justify-between rounded-[var(--radius-md)] border-2 p-3 shadow-sm ${stateStyles[concept.state]}`}
                  key={concept.slug}
                  style={{ left: concept.x, top: concept.y }}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] text-ink-soft">
                        {String(concept.order_index).padStart(2, "0")}
                      </span>
                      <span
                        className={`shrink-0 rounded-[var(--radius-pill)] border px-2 py-1 text-[10px] font-medium leading-none ${badgeStyles[concept.state]}`}
                      >
                        {concept.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-xs font-medium leading-[1.25] tracking-normal">
                      {concept.title}
                    </h3>
                  </div>

                  {concept.state === "locked" ? (
                    <p className="line-clamp-2 text-xs leading-normal text-ink-soft">
                      Waiting on:{" "}
                      {concept.unmetPrerequisites
                        .map((slug) => conceptBySlug.get(slug)?.title || slug)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="line-clamp-2 text-xs leading-normal text-ink-soft">
                      {concept.summary}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border)] px-6 py-6 sm:px-10">
            <p className="ti-eyebrow">Boilerplate Trainer</p>
            <p className="ti-p mt-3 max-w-[760px]">
              Complete each concept by doing the Figma exercise. The map will open up as your
              work is verified.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
