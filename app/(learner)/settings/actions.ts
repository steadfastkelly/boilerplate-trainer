"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const modalities = ["V", "A", "R", "K"] as const;

function readWeight(formData: FormData, modality: string) {
  const value = Number(formData.get(modality));

  if (!Number.isFinite(value)) {
    return 25;
  }

  return Math.min(100, Math.max(0, value));
}

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rawWeights = Object.fromEntries(
    modalities.map((modality) => [modality, readWeight(formData, modality)]),
  );
  const total = Object.values(rawWeights).reduce((sum, value) => sum + value, 0);
  const weights = total === 0
    ? { V: 0.25, A: 0.25, R: 0.25, K: 0.25 }
    : Object.fromEntries(
        modalities.map((modality) => [modality, rawWeights[modality] / total]),
      );

  const { error } = await supabase
    .from("profiles")
    .update({
      modality_weights: weights,
      preference_setup_completed: true,
    })
    .eq("user_id", user.id);

  if (error) {
    redirect("/settings?error=save");
  }

  const isSetup = formData.get("setup") === "1";
  redirect(isSetup ? "/map" : "/settings?saved=1");
}

export async function skipPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      modality_weights: { V: 0.25, A: 0.25, R: 0.25, K: 0.25 },
      preference_setup_completed: true,
    })
    .eq("user_id", user.id);

  if (error) {
    redirect("/settings?setup=1&error=save");
  }

  redirect("/map");
}
