import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

type LessonAsset = {
  modality: "V" | "A" | "R" | "K";
  type: "diagram" | "script" | "written_guide" | "exercise";
  content: Record<string, unknown>;
  status: "published";
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const sampleAssets: LessonAsset[] = [
  {
    modality: "V",
    type: "diagram",
    status: "published",
    content: {
      title: "The handoff path",
      steps: [
        "Styles define the shared tokens.",
        "The Boilerplate file turns tokens into reusable structure.",
        "The Website file uses those components in real page sections.",
        "The live Q'Apel site proves the same choices can ship.",
      ],
      check: "When a Figma choice has a matching code name, the handoff is faster.",
    },
  },
  {
    modality: "A",
    type: "script",
    status: "published",
    content: {
      title: "Talk it through",
      script: [
        "The boilerplate is not a blank canvas.",
        "It is the shared structure that keeps design and code close.",
        "Your job is to build with the system first, then mark any intentional break.",
      ],
      prompt: "Say where Q'Apel shows the path from system files to shipped code.",
    },
  },
  {
    modality: "R",
    type: "written_guide",
    status: "published",
    content: {
      title: "What to remember",
      body: "A Steadfast page starts with the boilerplate because the boilerplate already knows the spacing, type, buttons, structure, and handoff language. Q'Apel is the reference case for why that matters. The same system shows up in the Styles file, the Boilerplate file, the Website file, and the shipped site.",
      rules: [
        "Keep components intact unless there is a clear reason to change one.",
        "Build inside AutoLayout so the page can map to code.",
        "Use the shared names so a developer can read the design without guessing.",
      ],
    },
  },
  {
    modality: "K",
    type: "exercise",
    status: "published",
    content: {
      task: "Open the practice file and find one Q'Apel section or page area that clearly follows the boilerplate path.",
      checklist: [
        "Find the matching section structure.",
        "Identify one shared spacing, type, or button choice.",
        "Add a short note in your practice frame explaining why that choice helps the handoff.",
      ],
      submit: "Submit the frame link with your note visible.",
    },
  },
];

async function main() {
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

  const { data: version, error: versionError } = await supabase
    .from("boilerplate_versions")
    .select("id")
    .eq("is_current", true)
    .single();

  if (versionError || !version) {
    throw versionError || new Error("No current boilerplate version found.");
  }

  const { data: concept, error: conceptError } = await supabase
    .from("concepts")
    .select("id")
    .eq("version_id", version.id)
    .eq("slug", "why-boilerplate-exists")
    .single();

  if (conceptError || !concept) {
    throw conceptError || new Error("Concept 01 was not found.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("lesson_assets")
    .select("id")
    .eq("concept_id", concept.id);

  if (existingError) {
    throw existingError;
  }

  if (existing.length) {
    const { error: deleteError } = await supabase
      .from("lesson_assets")
      .delete()
      .eq("concept_id", concept.id);

    if (deleteError) {
      throw deleteError;
    }
  }

  const { error: insertError } = await supabase.from("lesson_assets").insert(
    sampleAssets.map((asset) => ({
      ...asset,
      concept_id: concept.id,
    })),
  );

  if (insertError) {
    throw insertError;
  }

  console.log(
    JSON.stringify(
      {
        concept: "why-boilerplate-exists",
        assets: sampleAssets.length,
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
