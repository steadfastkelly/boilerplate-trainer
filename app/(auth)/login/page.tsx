import Link from "next/link";
import { redirect } from "next/navigation";
import { requestSignIn } from "./actions";
import { getAllowedEmailDomain } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    email?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  domain: "Use your Steadfast email address.",
  send: "We could not send the sign-in link. Try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/map");
  }

  const params = await searchParams;
  const allowedDomain = getAllowedEmailDomain();
  const message = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-bone text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[var(--container-max)] items-center px-[var(--container-pad)] py-16">
        <div className="grid w-full gap-10 border-b-[10px] border-ink bg-paper px-6 py-10 sm:px-12 md:grid-cols-[1.1fr_0.9fr] md:py-16">
          <div className="flex flex-col justify-end gap-5">
            <p className="ti-eyebrow">Boilerplate Trainer</p>
            <h1 className="max-w-[780px] font-display text-[clamp(44px,8vw,104px)] font-display-normal leading-display tracking-normal">
              Sign in
            </h1>
          </div>

          <div className="flex flex-col justify-center gap-6">
            {params.sent ? (
              <div className="space-y-4">
                <h2 className="ti-h3">Check your email</h2>
                <p className="ti-p">
                  Open the link sent to {params.email || `your @${allowedDomain} address`}.
                </p>
                <Link className="ti-p inline-block" href="/login">
                  Use a different email
                </Link>
              </div>
            ) : (
              <form action={requestSignIn} className="space-y-5">
                <div className="space-y-2">
                  <label className="ti-eyebrow" htmlFor="email">
                    Email address
                  </label>
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-bone px-4 py-3 font-body text-base text-ink outline-none transition focus:border-ink"
                    id="email"
                    name="email"
                    placeholder={`name@${allowedDomain}`}
                    required
                    type="email"
                  />
                </div>

                {message ? <p className="ti-caption text-[var(--ti-error)]">{message}</p> : null}

                <button
                  className="inline-flex rounded-[var(--radius-pill)] border border-ink bg-ink px-6 py-3 font-body text-sm font-medium text-bone transition hover:bg-bone hover:text-ink"
                  type="submit"
                >
                  Send sign-in link
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
