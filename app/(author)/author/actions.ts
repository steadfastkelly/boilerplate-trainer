"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAuthor() {
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

  return user;
}

function authorUrl(state: string) {
  return `/author?state=${encodeURIComponent(state)}`;
}

export async function saveLessonAsset(formData: FormData) {
  await requireAuthor();

  const assetId = String(formData.get("asset_id") || "");
  const contentValue = String(formData.get("content") || "").trim();
  const status = String(formData.get("status") || "draft");

  if (!assetId || (status !== "draft" && status !== "published")) {
    redirect(authorUrl("asset-error"));
  }

  let content: unknown;

  try {
    content = contentValue ? JSON.parse(contentValue) : {};
  } catch {
    redirect(authorUrl("asset-json"));
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("lesson_assets")
    .update({
      content,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (error) {
    redirect(authorUrl("asset-error"));
  }

  revalidatePath("/author");
  redirect(authorUrl("asset-saved"));
}

export async function reviewSubmission(formData: FormData) {
  const author = await requireAuthor();
  const submissionId = String(formData.get("submission_id") || "");
  const userId = String(formData.get("user_id") || "");
  const conceptId = String(formData.get("concept_id") || "");
  const reviewStatus = String(formData.get("review_status") || "");
  const reviewNote = String(formData.get("review_note") || "").trim();

  if (
    !submissionId ||
    !userId ||
    !conceptId ||
    (reviewStatus !== "verified" && reviewStatus !== "returned")
  ) {
    redirect(authorUrl("review-error"));
  }

  const admin = createAdminClient();
  const { error: submissionError } = await admin
    .from("exercise_submissions")
    .update({
      review_status: reviewStatus,
      review_note: reviewNote || null,
      reviewed_by: author.id,
    })
    .eq("id", submissionId);

  if (submissionError) {
    redirect(authorUrl("review-error"));
  }

  const verified = reviewStatus === "verified";
  const { error: progressError } = await admin.from("progress").upsert(
    {
      user_id: userId,
      concept_id: conceptId,
      exercise_status: verified ? "verified" : "in_progress",
      completed_at: verified ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,concept_id" },
  );

  if (progressError) {
    redirect(authorUrl("review-error"));
  }

  revalidatePath("/author");
  revalidatePath("/map");
  redirect(authorUrl(verified ? "review-verified" : "review-returned"));
}
