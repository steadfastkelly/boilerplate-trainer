import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePreferences, skipPreferences } from "./actions";
import { PreferenceSliders } from "./preference-sliders";

type Modality = "V" | "A" | "R" | "K";
type SliderValues = Record<Modality, number>;

const balancedValues: SliderValues = { V: 25, A: 25, R: 25, K: 25 };

function toSliderValues(value: unknown): SliderValues {
  if (!value || typeof value !== "object") {
    return balancedValues;
  }

  const weights = value as Partial<Record<Modality, unknown>>;
  const values = {
    V: typeof weights.V === "number" ? weights.V : 0.25,
    A: typeof weights.A === "number" ? weights.A : 0.25,
    R: typeof weights.R === "number" ? weights.R : 0.25,
    K: typeof weights.K === "number" ? weights.K : 0.25,
  };

  return {
    V: Math.round(values.V * 100),
    A: Math.round(values.A * 100),
    R: Math.round(values.R * 100),
    K: Math.round(values.K * 100),
  };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const isSetup = params.setup === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("modality_weights")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-8 sm:py-12">
        <div className="border-b-[10px] border-ink bg-paper">
          <header className="border-b border-[var(--border)] px-6 py-8 sm:px-10 md:py-12">
            {!isSetup ? (
              <Link
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean"
                href="/map"
              >
                Back to course map
              </Link>
            ) : null}
            <p className={`ti-eyebrow ${isSetup ? "" : "mt-8"}`}>Boilerplate Trainer</p>
            <h1 className="mt-4 max-w-[920px] font-display text-[clamp(36px,6vw,72px)] font-display-normal leading-display tracking-normal">
              How do you want this explained first?
            </h1>
            <p className="ti-lead mt-6 mb-0 max-w-[760px] text-ink-soft">
              Move a slider right when you want that format to appear earlier. Every lesson still
              includes each available format and ends with practice.
            </p>
          </header>

          <form action={savePreferences} className="px-6 py-8 sm:px-10 md:py-12">
            <input name="setup" type="hidden" value={isSetup ? "1" : "0"} />
            <PreferenceSliders initialValues={toSliderValues(profile?.modality_weights)} />

            {params.saved ? (
              <p className="mt-6 text-sm font-medium text-harakeke" role="status">
                Your preferences were saved.
              </p>
            ) : null}
            {params.error ? (
              <p className="mt-6 text-sm font-medium text-[var(--ti-error)]" role="alert">
                Your preferences could not be saved. Try again.
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-8">
              <button
                className="min-h-12 whitespace-nowrap rounded-[var(--radius-pill)] border border-ink bg-ink px-6 py-3 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                type="submit"
              >
                Save preferences
              </button>
            </div>
          </form>

          {isSetup ? (
            <form action={skipPreferences} className="border-t border-[var(--border)] px-6 py-6 sm:px-10">
              <button
                className="min-h-11 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
                type="submit"
              >
                Skip and use a balanced order
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
