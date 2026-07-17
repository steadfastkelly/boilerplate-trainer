import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reviewSubmission, saveLessonAsset } from "./actions";

type Concept = {
  id: string;
  slug: string;
  title: string;
  order_index: number;
};

type LessonAsset = {
  id: string;
  concept_id: string;
  modality: string;
  type: string;
  content: unknown;
  status: "draft" | "published";
  updated_at: string;
};

type Profile = {
  user_id: string;
  role: "learner" | "author";
};

type Progress = {
  user_id: string;
  concept_id: string;
  exercise_status: string;
};

type Submission = {
  id: string;
  user_id: string;
  concept_id: string;
  figma_link: string;
  review_status: string;
  review_note: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  verified: "Verified",
  pending: "Pending",
  returned: "Returned",
};

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function stateMessage(state: string | undefined) {
  switch (state) {
    case "asset-saved":
      return "Lesson asset saved.";
    case "asset-json":
      return "Check the JSON. It could not be saved.";
    case "asset-error":
      return "Lesson asset could not be saved.";
    case "review-verified":
      return "Submission marked verified.";
    case "review-returned":
      return "Submission returned with a note.";
    case "review-error":
      return "Submission review could not be saved.";
    default:
      return null;
  }
}

export default async function AuthorPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const params = await searchParams;
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

  if (profile?.role !== "author") {
    redirect("/map");
  }

  const admin = createAdminClient();
  const [{ data: version }, usersResult] = await Promise.all([
    admin.from("boilerplate_versions").select("id, version_label").eq("is_current", true).single(),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (!version) {
    redirect("/map");
  }

  const [{ data: concepts }, { data: assets }, { data: profiles }, { data: progress }, { data: submissions }] =
    await Promise.all([
      admin
        .from("concepts")
        .select("id, slug, title, order_index")
        .eq("version_id", version.id)
        .order("order_index"),
      admin
        .from("lesson_assets")
        .select("id, concept_id, modality, type, content, status, updated_at")
        .order("updated_at", { ascending: false }),
      admin.from("profiles").select("user_id, role").eq("role", "learner"),
      admin.from("progress").select("user_id, concept_id, exercise_status"),
      admin
        .from("exercise_submissions")
        .select("id, user_id, concept_id, figma_link, review_status, review_note, created_at")
        .order("created_at", { ascending: false }),
    ]);

  const conceptRows = (concepts || []) as Concept[];
  const assetRows = (assets || []) as LessonAsset[];
  const profileRows = (profiles || []) as Profile[];
  const progressRows = (progress || []) as Progress[];
  const submissionRows = (submissions || []) as Submission[];
  const conceptById = new Map(conceptRows.map((concept) => [concept.id, concept]));
  const progressByUserConcept = new Map(
    progressRows.map((row) => [`${row.user_id}:${row.concept_id}`, row.exercise_status]),
  );
  const emailById = new Map(
    usersResult.data.users.map((teamUser) => [teamUser.id, teamUser.email || teamUser.id]),
  );
  const notice = stateMessage(params.state);
  const hasError = params.state?.includes("error") || params.state === "asset-json";

  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-8 sm:py-12">
        <div className="border-b-[10px] border-ink bg-paper">
          <header className="border-b border-[var(--border)] px-6 py-8 sm:px-10 md:py-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                href="/map"
              >
                Back to course map
              </Link>
              <a
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-ink bg-ink px-4 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                href="/author/progress.csv"
              >
                Export CSV
              </a>
            </div>
            <p className="ti-eyebrow mt-8">Boilerplate Trainer</p>
            <h1 className="mt-4 max-w-[900px] font-display text-[clamp(36px,6vw,72px)] font-display-normal leading-display tracking-normal">
              Author dashboard
            </h1>
            <p className="ti-lead mt-6 mb-0 max-w-[760px] text-ink-soft">
              Edit lesson content, review submitted frames, and check team progress.
            </p>
            {notice ? (
              <p
                className={`mt-6 text-sm font-medium ${hasError ? "text-[var(--ti-error)]" : "text-harakeke"}`}
                role={hasError ? "alert" : "status"}
              >
                {notice}
              </p>
            ) : null}
          </header>

          <section className="border-b border-[var(--border)] px-6 py-8 sm:px-10 md:py-12">
            <p className="ti-eyebrow">Submissions</p>
            <h2 className="mt-3 !text-2xl font-semibold !leading-tight">Review exercises</h2>
            <div className="mt-6 space-y-4">
              {submissionRows.length ? (
                submissionRows.map((submission) => {
                  const concept = conceptById.get(submission.concept_id);

                  return (
                    <article
                      className="grid gap-5 border border-[var(--border-strong)] bg-bone p-5 lg:grid-cols-[1fr_320px]"
                      key={submission.id}
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-soft">
                          {emailById.get(submission.user_id) || submission.user_id}
                        </p>
                        <h3 className="mt-2 !text-lg font-semibold !leading-tight">
                          {concept ? `${String(concept.order_index).padStart(2, "0")} ${concept.title}` : "Unknown concept"}
                        </h3>
                        <p className="mt-2 text-sm text-ink-soft">
                          Status: {statusLabels[submission.review_status] || submission.review_status}
                        </p>
                        {submission.review_note ? (
                          <p className="mt-2 text-sm text-ink-soft">Note: {submission.review_note}</p>
                        ) : null}
                        <a
                          className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-paper px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                          href={submission.figma_link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open submitted frame
                        </a>
                      </div>
                      <form action={reviewSubmission} className="space-y-3">
                        <input name="submission_id" type="hidden" value={submission.id} />
                        <input name="user_id" type="hidden" value={submission.user_id} />
                        <input name="concept_id" type="hidden" value={submission.concept_id} />
                        <label className="text-sm font-medium" htmlFor={`note-${submission.id}`}>
                          Review note
                        </label>
                        <textarea
                          className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-paper p-3 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean"
                          defaultValue={submission.review_note || ""}
                          id={`note-${submission.id}`}
                          name="review_note"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            className="min-h-11 rounded-[var(--radius-pill)] border border-harakeke bg-harakeke px-4 text-sm font-medium !text-[var(--ti-paper)] focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                            name="review_status"
                            type="submit"
                            value="verified"
                          >
                            Mark verified
                          </button>
                          <button
                            className="min-h-11 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-paper px-4 text-sm font-medium text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                            name="review_status"
                            type="submit"
                            value="returned"
                          >
                            Return with note
                          </button>
                        </div>
                      </form>
                    </article>
                  );
                })
              ) : (
                <p className="ti-p mb-0 text-ink-soft">No submissions yet.</p>
              )}
            </div>
          </section>

          <section className="border-b border-[var(--border)] px-6 py-8 sm:px-10 md:py-12">
            <p className="ti-eyebrow">Lesson content</p>
            <h2 className="mt-3 !text-2xl font-semibold !leading-tight">Edit assets</h2>
            <div className="mt-6 space-y-4">
              {assetRows.length ? (
                assetRows.map((asset) => {
                  const concept = conceptById.get(asset.concept_id);

                  return (
                    <form
                      action={saveLessonAsset}
                      className="border border-[var(--border-strong)] bg-bone p-5"
                      key={asset.id}
                    >
                      <input name="asset_id" type="hidden" value={asset.id} />
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <p className="text-sm font-medium text-ink-soft">
                            {concept ? `${String(concept.order_index).padStart(2, "0")} ${concept.title}` : "Unknown concept"}
                          </p>
                          <h3 className="mt-2 !text-lg font-semibold !leading-tight">
                            {asset.modality} · {asset.type}
                          </h3>
                        </div>
                        <label className="grid gap-2 text-sm font-medium">
                          Status
                          <select
                            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-paper px-3 text-sm text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean"
                            defaultValue={asset.status}
                            name="status"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </label>
                      </div>
                      <label className="mt-5 block text-sm font-medium" htmlFor={`content-${asset.id}`}>
                        Content JSON
                      </label>
                      <textarea
                        className="mt-2 min-h-64 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-paper p-4 font-mono text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean"
                        defaultValue={formatJson(asset.content)}
                        id={`content-${asset.id}`}
                        name="content"
                        spellCheck={false}
                      />
                      <button
                        className="mt-4 min-h-11 rounded-[var(--radius-pill)] border border-ink bg-ink px-5 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                        type="submit"
                      >
                        Save asset
                      </button>
                    </form>
                  );
                })
              ) : (
                <p className="ti-p mb-0 text-ink-soft">No lesson assets yet.</p>
              )}
            </div>
          </section>

          <section className="px-6 py-8 sm:px-10 md:py-12">
            <p className="ti-eyebrow">Team progress</p>
            <h2 className="mt-3 !text-2xl font-semibold !leading-tight">Designer by concept</h2>
            <div className="mt-6 overflow-x-auto border border-[var(--border-strong)]">
              <table className="min-w-[980px] w-full border-collapse bg-paper text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] bg-bone text-left">
                    <th className="sticky left-0 bg-bone px-4 py-3 font-semibold">Designer</th>
                    {conceptRows.map((concept) => (
                      <th className="min-w-36 px-4 py-3 font-semibold" key={concept.id}>
                        {String(concept.order_index).padStart(2, "0")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileRows.map((designer) => (
                    <tr className="border-b border-[var(--border)]" key={designer.user_id}>
                      <th className="sticky left-0 bg-paper px-4 py-3 text-left font-medium">
                        {emailById.get(designer.user_id) || designer.user_id}
                      </th>
                      {conceptRows.map((concept) => {
                        const status = progressByUserConcept.get(`${designer.user_id}:${concept.id}`) || "not_started";

                        return (
                          <td className="px-4 py-3 text-ink-soft" key={concept.id}>
                            {statusLabels[status] || status}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
