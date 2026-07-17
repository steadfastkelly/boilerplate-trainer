import { redirect } from "next/navigation";
import { getProfileDestination } from "@/lib/profile-destination";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(await getProfileDestination(supabase, user.id));
  }

  redirect("/login");
}
