import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "author") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: version }, usersResult] = await Promise.all([
    admin.from("boilerplate_versions").select("id").eq("is_current", true).single(),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (!version) {
    return new NextResponse("No current version", { status: 404 });
  }

  const [{ data: concepts }, { data: profiles }, { data: progress }] = await Promise.all([
    admin
      .from("concepts")
      .select("id, title, order_index")
      .eq("version_id", version.id)
      .order("order_index"),
    admin.from("profiles").select("user_id").eq("role", "learner"),
    admin.from("progress").select("user_id, concept_id, exercise_status"),
  ]);

  const conceptRows = concepts || [];
  const emailById = new Map(
    usersResult.data.users.map((teamUser) => [teamUser.id, teamUser.email || teamUser.id]),
  );
  const progressByUserConcept = new Map(
    (progress || []).map((row) => [`${row.user_id}:${row.concept_id}`, row.exercise_status]),
  );
  const rows = [
    ["Designer", ...conceptRows.map((concept) => `${String(concept.order_index).padStart(2, "0")} ${concept.title}`)],
    ...(profiles || []).map((designer) => [
      emailById.get(designer.user_id) || designer.user_id,
      ...conceptRows.map(
        (concept) => progressByUserConcept.get(`${designer.user_id}:${concept.id}`) || "not_started",
      ),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="boilerplate-trainer-progress.csv"',
    },
  });
}
