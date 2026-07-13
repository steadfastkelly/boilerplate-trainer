"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function requestSignIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !isAllowedEmail(email)) {
    redirect("/login?error=domain");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=send");
  }

  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}
