import { NextResponse, type NextRequest } from "next/server";
import { getProfileDestination } from "@/lib/profile-destination";
import { createClient } from "@/lib/supabase/server";

type SessionPayload = {
  access_token?: string;
  refresh_token?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as SessionPayload;

  if (!payload.access_token || !payload.refresh_token) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });

  if (error) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const destination = user ? await getProfileDestination(supabase, user.id) : "/login";

  return NextResponse.json({ ok: true, destination });
}
