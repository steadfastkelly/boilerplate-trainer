export default function Loading() {
  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[var(--container-max)] items-center px-[var(--container-pad)] py-16">
        <div className="w-full border-b-[10px] border-ink bg-paper px-6 py-10 sm:px-12 md:py-16">
          <p className="ti-eyebrow">Boilerplate Trainer</p>
          <h1 className="mt-4 font-display text-[clamp(36px,6vw,72px)] font-display-normal leading-display tracking-normal">
            Loading
          </h1>
          <p className="ti-p mt-5 mb-0 max-w-[620px] text-ink-soft">
            Getting your training view ready.
          </p>
        </div>
      </section>
    </main>
  );
}
