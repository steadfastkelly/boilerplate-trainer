export default function Home() {
  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[var(--container-max)] flex-col justify-center px-[var(--container-pad)] py-16">
        <div className="flex min-h-[220px] flex-col justify-center border-b-[10px] border-ink bg-paper px-6 py-14 sm:px-12 md:min-h-[280px]">
          <h1 className="text-center font-display text-[clamp(44px,8vw,108px)] font-display-normal leading-display tracking-normal">
            Boilerplate Trainer
          </h1>
        </div>
      </section>
    </main>
  );
}
