"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[var(--container-max)] items-center px-[var(--container-pad)] py-16">
        <div className="w-full border-b-[10px] border-ink bg-paper px-6 py-10 sm:px-12 md:py-16">
          <p className="ti-eyebrow">Boilerplate Trainer</p>
          <h1 className="mt-4 font-display text-[clamp(36px,6vw,72px)] font-display-normal leading-display tracking-normal">
            Something went wrong
          </h1>
          <p className="ti-p mt-5 max-w-[620px] text-ink-soft">
            Refresh the page. If it happens again, send Kelly the screen you were on.
          </p>
          <button
            className="mt-6 min-h-11 rounded-[var(--radius-pill)] border border-ink bg-ink px-5 text-sm font-medium !text-[var(--ti-paper)] transition hover:bg-paper hover:!text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
