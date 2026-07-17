import Link from "next/link";
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

const cardWidth = 196;
const cardHeight = 148;
const mapWidth = 1666;
const mapHeight = 900;

const nodePositions: Record<string, { x: number; y: number }> = {
  "why-boilerplate-exists": { x: 0, y: 180 },
  "autolayout-and-page-structure": { x: 210, y: 180 },
  "spacers-and-spacing": { x: 420, y: 70 },
  typography: { x: 630, y: 70 },
  "buttons-and-icons": { x: 420, y: 235 },
  effects: { x: 420, y: 400 },
  "building-without-breaking": { x: 630, y: 305 },
  "capstone-use": { x: 840, y: 305 },
  "duplicate-and-set-up": { x: 840, y: 700 },
  "customize-type": { x: 1050, y: 700 },
  "customize-spacing-and-effects": { x: 1260, y: 700 },
  "publish-link-and-verify": { x: 1470, y: 700 },
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
    .select("role, preference_setup_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.preference_setup_completed) {
    redirect("/settings?setup=1");
  }

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
  const completedUsingCount = usingConcepts.filter((concept) => concept.state === "complete").length;
  const usingTrackComplete = positionedBySlug.get("capstone-use")?.state === "complete";
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

            <div className="flex flex-wrap items-center gap-4">
              {profile.role === "author" ? (
                <Link
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                  href="/author"
                >
                  Author dashboard
                </Link>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                href="/settings"
              >
                Explanation settings
              </Link>
              <form action={signOut}>
                <button
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-[var(--radius-pill)] border border-ink bg-ink px-6 py-3 font-body text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-bone hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[var(--border)] px-6 py-5 text-sm text-ink-soft sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <p>
              {usingTrackComplete
                ? "Using track complete. The setup track is open."
                : `Work left to right. ${completedUsingCount} of ${usingConcepts.length} Using concepts are complete.`}
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

          {usingTrackComplete ? (
            <div className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--ti-harakeke)_12%,var(--ti-paper))] px-6 py-5 sm:px-10">
              <p className="text-sm font-medium text-ink">
                Capstone verified. You can now start setting up a boilerplate.
              </p>
            </div>
          ) : null}

          <div className="px-6 py-8 sm:px-10 lg:hidden">
            <div className="space-y-8">
              {[
                { label: "Using the boilerplate", concepts: usingConcepts },
                { label: "Setting up a boilerplate", concepts: setupConcepts },
              ].map((group) => (
                <section className="space-y-3" key={group.label}>
                  <h2 className="rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
                    {group.label}
                  </h2>
                  <div className="space-y-3">
                    {group.concepts.map((concept) => (
                      <article
                        className={`rounded-[var(--radius-md)] border-2 p-4 shadow-sm ${stateStyles[concept.state]}`}
                        key={concept.slug}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-xs text-ink-soft">
                            {String(concept.order_index).padStart(2, "0")}
                          </span>
                          <span
                            className={`shrink-0 rounded-[var(--radius-pill)] border px-2 py-1 text-[10px] font-medium leading-none ${badgeStyles[concept.state]}`}
                          >
                            {concept.statusLabel}
                          </span>
                        </div>
                        <h3 className="mt-3 !text-base font-semibold !leading-tight">
                          {concept.title}
                        </h3>
                        {concept.state === "locked" ? (
                          <p className="mt-3 text-sm font-medium text-ink-soft">
                            Needs{" "}
                            {concept.unmetPrerequisites
                              .map((slug) => conceptBySlug.get(slug)?.order_index)
                              .filter((orderIndex) => orderIndex !== undefined)
                              .map((orderIndex) => String(orderIndex).padStart(2, "0"))
                              .join(", ")}
                          </p>
                        ) : (
                          <>
                            <p className="mt-3 text-sm leading-normal text-ink-soft">
                              {concept.summary}
                            </p>
                            <Link
                              className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-ink bg-ink px-4 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                              href={`/concept/${concept.slug}`}
                            >
                              Open concept
                            </Link>
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="hidden overflow-x-auto px-6 py-8 sm:px-10 lg:block">
            <div className="relative h-[900px] min-w-[1666px]">
              <div className="absolute left-0 top-0 rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
                Using the boilerplate
              </div>
              <div className="absolute left-[840px] top-[620px] rounded-[var(--radius-pill)] bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-bone">
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
                  className={`absolute flex h-[148px] w-[196px] flex-col rounded-[var(--radius-md)] border-2 p-3 shadow-sm transition ${concept.state === "locked" ? "" : "hover:-translate-y-0.5 hover:shadow-md"} ${stateStyles[concept.state]}`}
                  data-map-card
                  key={concept.slug}
                  style={{ left: concept.x, top: concept.y }}
                >
                  <div>
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
                    <h2 className="mt-2 !text-[13px] font-semibold !leading-[1.2] tracking-normal [overflow-wrap:anywhere]">
                      {concept.title}
                    </h2>
                  </div>

                  {concept.state === "locked" ? (
                    <p className="mt-auto pt-2 text-[10px] font-medium leading-[1.3] text-ink-soft">
                      Needs{" "}
                      {concept.unmetPrerequisites
                        .map((slug) => conceptBySlug.get(slug)?.order_index)
                        .filter((orderIndex) => orderIndex !== undefined)
                        .map((orderIndex) => String(orderIndex).padStart(2, "0"))
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="mt-auto line-clamp-2 pt-2 text-[10px] leading-[1.3] text-ink-soft">
                      {concept.summary}
                    </p>
                  )}

                  {concept.state !== "locked" ? (
                    <Link
                      aria-label={`Open ${concept.title}`}
                      className="absolute inset-0 rounded-[var(--radius-md)] focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                      href={`/concept/${concept.slug}`}
                    />
                  ) : null}
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
