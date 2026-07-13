import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

nextEnv.loadEnvConfig(process.cwd());

type Track = "using" | "setup";

type ConceptMapConcept = {
  id: string;
  track: Track;
  title: string;
  slug: string;
  summary: string;
  why?: string;
  order: number;
  prerequisites: string[];
  plugin_checks: string[];
  source: string[];
};

type ConceptMap = {
  figma_file_key: string;
  version_label: string;
  concepts: ConceptMapConcept[];
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function loadConceptMap() {
  const file = await readFile(path.join(process.cwd(), "docs/concept-map.json"), "utf8");
  return JSON.parse(file) as ConceptMap;
}

async function main() {
  const conceptMap = await loadConceptMap();
  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: existingVersion, error: versionReadError } = await supabase
    .from("boilerplate_versions")
    .select("id")
    .eq("figma_file_key", conceptMap.figma_file_key)
    .eq("version_label", conceptMap.version_label)
    .maybeSingle();

  if (versionReadError) {
    throw versionReadError;
  }

  let versionId = existingVersion?.id as string | undefined;

  if (!versionId) {
    const { data: insertedVersion, error: versionInsertError } = await supabase
      .from("boilerplate_versions")
      .insert({
        figma_file_key: conceptMap.figma_file_key,
        version_label: conceptMap.version_label,
        is_current: true,
      })
      .select("id")
      .single();

    if (versionInsertError) {
      throw versionInsertError;
    }

    versionId = insertedVersion.id as string;
  }

  const { error: clearCurrentError } = await supabase
    .from("boilerplate_versions")
    .update({ is_current: false })
    .neq("id", versionId);

  if (clearCurrentError) {
    throw clearCurrentError;
  }

  const { error: setCurrentError } = await supabase
    .from("boilerplate_versions")
    .update({ is_current: true })
    .eq("id", versionId);

  if (setCurrentError) {
    throw setCurrentError;
  }

  const conceptRows = conceptMap.concepts.map((concept) => ({
    version_id: versionId,
    slug: concept.slug,
    title: concept.title,
    summary: concept.summary,
    why: concept.why ?? null,
    track: concept.track,
    order_index: concept.order,
    prerequisites: concept.prerequisites,
    plugin_checks: concept.plugin_checks,
    source: concept.source,
  }));

  const { error: conceptsError } = await supabase
    .from("concepts")
    .upsert(conceptRows, { onConflict: "version_id,slug" });

  if (conceptsError) {
    throw conceptsError;
  }

  const { count, error: countError } = await supabase
    .from("concepts")
    .select("*", { count: "exact", head: true })
    .eq("version_id", versionId);

  if (countError) {
    throw countError;
  }

  if (count !== conceptMap.concepts.length) {
    throw new Error(`Expected ${conceptMap.concepts.length} concepts, found ${count}.`);
  }

  console.log(
    JSON.stringify(
      {
        versionId,
        versionLabel: conceptMap.version_label,
        concepts: count,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
