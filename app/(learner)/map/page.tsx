import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[var(--container-max)] items-center px-[var(--container-pad)] py-16">
        <div className="grid w-full gap-8 border-b-[10px] border-ink bg-paper px-6 py-10 sm:px-12 md:grid-cols-[1fr_auto] md:items-end md:py-16">
          <div className="space-y-5">
            <p className="ti-eyebrow">Boilerplate Trainer</p>
            <h1 className="font-display text-[clamp(44px,8vw,104px)] font-display-normal leading-display tracking-normal">
              You are signed in
            </h1>
            <div className="space-y-2">
              <p className="ti-p">{user.email}</p>
              {profile?.role ? <p className="ti-caption">Role: {profile.role}</p> : null}
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
      </section>
    </main>
  );
}
