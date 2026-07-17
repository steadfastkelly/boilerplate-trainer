"use server";

import { redirect } from "next/navigation";
import { getBooleanEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function submissionUrl(slug: string, state: string) {
  return `/concept/${encodeURIComponent(slug)}?submission=${state}#exercise`;
}

export async function submitExercise(formData: FormData) {
  const conceptId = String(formData.get("concept_id") || "");
  const slug = String(formData.get("slug") || "");
  const figmaLink = String(formData.get("figma_link") || "").trim();

  if (!conceptId || !slug || !figmaLink) {
    redirect(submissionUrl(slug, "missing"));
  }

  let url: URL;

  try {
    url = new URL(figmaLink);
  } catch {
    redirect(submissionUrl(slug, "invalid"));
  }

  const isFigmaLink = url.protocol === "https:" &&
    (url.hostname === "figma.com" || url.hostname.endsWith(".figma.com"));
  const hasFrame = url.searchParams.has("node-id");

  if (!isFigmaLink || !hasFrame) {
    redirect(submissionUrl(slug, "invalid"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: concept } = await supabase
    .from("concepts")
    .select("id")
    .eq("id", conceptId)
    .eq("slug", slug)
    .maybeSingle();

  if (!concept) {
    redirect("/map");
  }

  const { data: submission, error: submissionError } = await supabase
    .from("exercise_submissions")
    .insert({
      user_id: user.id,
      concept_id: conceptId,
      figma_link: url.toString(),
      review_status: getBooleanEnv("AUTO_COMPLETE_ON_SUBMIT") ? "verified" : "pending",
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    redirect(submissionUrl(slug, "error"));
  }

  const autoComplete = getBooleanEnv("AUTO_COMPLETE_ON_SUBMIT");
  const { error: progressError } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      concept_id: conceptId,
      exercise_status: autoComplete ? "verified" : "submitted",
      completed_at: autoComplete ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,concept_id" },
  );

  if (progressError) {
    await supabase.from("exercise_submissions").delete().eq("id", submission.id);
    redirect(submissionUrl(slug, "error"));
  }

  redirect(submissionUrl(slug, "saved"));
}
