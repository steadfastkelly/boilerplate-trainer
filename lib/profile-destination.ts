import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getProfileDestination(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("preference_setup_completed")
    .eq("user_id", userId)
    .maybeSingle();

  return profile?.preference_setup_completed ? "/map" : "/settings?setup=1";
}
