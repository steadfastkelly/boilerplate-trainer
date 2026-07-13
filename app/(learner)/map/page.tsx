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

const nodePositions: Record<string, { x: number; y: number }> = {
  "why-boilerplate-exists": { x: 40, y: 150 },
  "autolayout-and-page-structure": { x: 320, y: 150 },
  "spacers-and-spacing": { x: 600, y: 40 },
  typography: { x: 880, y: 40 },
  "buttons-and-icons": { x: 600, y: 250 },
  effects: { x: 600, y: 460 },
  "building-without-breaking": { x: 1160, y: 250 },
  "capstone-use": { x: 1440, y: 250 },
  "duplicate-and-set-up": { x: 320, y: 760 },
  "customize-type": { x: 600, y: 650 },
  "customize-spacing-and-effects": { x: 880, y: 760 },
  "publish-link-and-verify": { x: 1160, y: 760 },
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
  const startX = from.x + 240;
  const startY = from.y + 76;
  const endX = to.x;
  const endY = to.y + 76;
  const middleX = startX + (endX - startX) / 2;

  return `M ${startX} ${startY} C ${middleX} ${startY}, ${middleX} ${endY}, ${endX} ${endY}`;
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
              Follow the available node first. Locked concepts show the concepts they need.
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
            <div className="relative h-[980px] min-w-[1700px]">
              <div className="absolute left-0 top-0 rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
                Using the boilerplate
              </div>
              <div className="absolute left-0 top-[610px] rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
                Setting up a boilerplate
              </div>

              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                focusable="false"
                viewBox="0 0 1700 980"
              >
                <defs>
                  <marker
                    id="course-map-arrow"
                    markerHeight="8"
                    markerWidth="8"
                    orient="auto"
                    refX="7"
                    refY="4"
                  >
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--ti-ink)" opacity="0.45" />
                  </marker>
                </defs>
                {edges.map((edge) => (
                  <path
                    d={getEdgePath(edge.from, edge.to)}
                    fill="none"
                    key={`${edge.from.slug}-${edge.to.slug}`}
                    markerEnd="url(#course-map-arrow)"
                    opacity={edge.to.state === "locked" ? 0.28 : 0.6}
                    stroke="var(--ti-ink)"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              {[...usingConcepts, ...setupConcepts].map((concept) => (
                <article
                  className={`absolute flex h-[152px] w-[240px] flex-col justify-between rounded-[var(--radius-md)] border-2 p-4 shadow-sm ${stateStyles[concept.state]}`}
                  key={concept.slug}
                  style={{ left: concept.x, top: concept.y }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-xs text-ink-soft">
                        {String(concept.order_index).padStart(2, "0")}
                      </span>
                      <span
                        className={`shrink-0 rounded-[var(--radius-pill)] border px-2 py-1 text-[11px] font-medium leading-none ${badgeStyles[concept.state]}`}
                      >
                        {concept.statusLabel}
                      </span>
                    </div>
                    <h2 className="text-[18px] font-medium leading-[1.15] tracking-normal">
                      {concept.title}
                    </h2>
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
