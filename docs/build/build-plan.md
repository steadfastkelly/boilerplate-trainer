# Boilerplate Trainer — Build Plan for Codex

You are building the Boilerplate Trainer web app. This document is the source of truth for the build. Read it completely before writing anything. The person you report to, Kelly, is not a coder. Every time you stop, explain what you did and how to check it in plain language, and ask any open questions as simple choices.

## Context you must read first

These already exist in this repo and are the ground truth for the app's content and reasoning:

- `docs/boilerplate-learning-tool-plan.md` — the original product plan. Follow it. If anything here conflicts with it, flag the conflict, do not silently pick one.
- `docs/concept-map.json` — the 12 teachable concepts, two tracks, with prerequisites. This is the app's seed content.
- `docs/concept-map-review.md` — the plain-language version.
- `docs/extraction-notes.md` — what was pulled from the Figma boilerplate, with sources and open questions.
- `docs/qapel-reference-case-study.md` — the approved real-world case study. Q'Apel shows how Styles, Boilerplate, Website design, and shipped code connect. Use it to explain why the system matters, not as the learner's main practice file.
- `styles/two-islands-design.zip` — the visual design system. Use it for all styling.

## What the app does

A learner logs in with their Steadfast email, sets a one-time preference for how they want concepts explained first, works through a map of concepts, and completes each concept by doing a hands-on exercise in a practice copy of the real Figma boilerplate. A concept is only done when the exercise is done. The final concept is a capstone: rebuild a reference design using only boilerplate components until the Boilerplate Assistant plugin reports zero structural errors. Authors (Kelly, Kayla) edit lesson content, review submissions, and watch team progress.

The single metric to optimize: time from a designer's first login to a verified capstone. Prefer the choice that gets a designer doing real work in the file sooner.

Q'Apel is the reference case study for the course. It should appear in lesson reasoning and examples because it proves the chain from Figma system files to shipped code. It does not replace the practice file unless Kelly changes that decision later.

## Fixed technical decisions (do not substitute)

- **Framework:** Next.js, App Router, TypeScript.
- **Styling:** Tailwind CSS, with design tokens taken from the Two Islands system (see Phase 1).
- **Database, auth, storage:** Supabase (Postgres, Supabase Auth, Supabase Storage).
- **Hosting:** Vercel.
- **No runtime AI calls in v1.** The app serves pre-generated, human-reviewed content only.
- **Node:** use the current LTS.

These match Steadfast's existing Pathways stack on purpose, so the team can maintain it.

## Explicit non-goals for v1 (do not build these)

No text-to-speech or audio generation. No runtime "explain this differently" AI button. No zip or Canva or NotebookLM ingestion. No multi-tenant, client-facing access, or billing. No speculative abstractions or plugin systems for future inputs. Build only what is in this plan.

## How to work

- Work phase by phase, in order. Do not start a phase until the previous one meets its Definition of Done.
- At the end of each phase, commit your work to git with a clear message, then stop and report to Kelly in plain language: what you built, the link or screen to check, and anything you need decided.
- When you hit a decision that changes the product, stop and ask Kelly a simple this-or-that question with your recommendation. Never guess on anything user-facing.
- Keep secrets (Supabase keys) out of git. Use environment variables and Vercel's environment settings.
- Keep files small and readable. Match the style of the code around you.
- Follow the writing rules below for every word a human will read in the UI.

## Writing rules for all UI text

No em dashes. No rule-of-three cadence. No "delve, leverage, seamless, robust, comprehensive." No "not just X but Y." Concrete over abstract, one warm human voice, short sentences are fine. Do not use the phrase "learning styles" anywhere. The learner-facing label for the preference step is "How do you want this explained first?"

## Repository layout (target)

```
boilerplate-trainer/
  app/                      Next.js App Router pages
    (auth)/login/
    (learner)/map/          the course map
    (learner)/concept/[slug]/   a lesson
    (learner)/settings/     the modality blend
    (author)/author/        author dashboard, editing, review, team progress
    api/                    server routes (submissions, review actions)
    layout.tsx, globals.css
  components/                shared UI components
  lib/
    supabase/               server + browser Supabase clients
    types.ts                shared TypeScript types
  scripts/
    seed-concepts.ts        loads docs/concept-map.json into the database
  styles/tokens.css         the Two Islands tokens (from the zip)
  public/fonts/             the Two Islands fonts (from the zip)
  supabase/
    data-model.sql          copy of docs/build/data-model.sql, run in Supabase
  .env.local                secrets (never committed)
  .env.example              names of the required variables, no values
```

## Environment variables

Create `.env.example` listing these names with empty values, and put real values in `.env.local` and in Vercel's project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never exposed to the browser)
- `PRACTICE_FILE_URL` (the Figma practice file link exercises point at; confirm with Kelly which file this is)
- `ALLOWED_EMAIL_DOMAIN` (default `steadfast.design`)

## The design system (Two Islands)

The zip at `styles/two-islands-design.zip` contains the app's look. Inside:

- `colors_and_type.css` — the design tokens as CSS variables (`--ti-*`): a warm neutral palette (bone, cream, sand, paper), deep ocean ink for text, and accents (ocean, harakeke, terracotta, saffron). Two typefaces: Zalando Sans Semi Expanded for display, Google Sans Flex for body and UI.
- `fonts/` and `uploads/` — the variable font files. Note the `@font-face` rules in the CSS point at `fonts/…`, but a font file ships under `uploads/`. Reconcile the paths: put every font the CSS references into one folder and fix the URLs so they load.
- `preview/*.html` — reference styling for buttons, inputs, chips, badges, type scale, spacing, radii. Match these when you build the matching UI.
- `README.md` and `SKILL.md` — usage guidance. Read them.

Extract the zip, move the tokens into `styles/tokens.css`, put the fonts in `public/fonts/`, import the tokens in `globals.css`, and wire the token values into your Tailwind theme so components use them. The app should look like it belongs to this system, not like default Tailwind.

## Data model

Run `docs/build/data-model.sql` in the Supabase SQL editor (Phase 2). It creates every table, the roles, the signup trigger, and the row-level security policies. Do not invent a different schema. The tables follow the original plan: `boilerplate_versions`, `concepts`, `lesson_assets`, `profiles`, `progress`, `exercise_submissions`.

Note: the `concepts` table carries a few extra columns beyond the original plan (`why`, `track`, `plugin_checks`, `source`) so `concept-map.json` maps in cleanly. The column that the plan calls `order` is named `order_index` because `order` is a reserved word.

## Phases

Each phase has a goal, steps, and a Definition of Done (DoD). Do not pass a phase until its DoD is true.

### Phase 0 — Accounts and prerequisites
Goal: confirm the ground is ready.
Steps: confirm Kelly has the GitHub repo, the Supabase project, and the Vercel account. Collect the Supabase URL, anon key, and service role key from her and place them in `.env.local`. Confirm which Figma file is the practice copy and set `PRACTICE_FILE_URL`.
DoD: `.env.local` has real values; you can reach the Supabase project.

### Phase 1 — Scaffold and deploy the skeleton
Goal: a live, styled, empty app.
Steps: create the Next.js App Router TypeScript project. Add Tailwind. Install `@supabase/supabase-js` and `@supabase/ssr`. Extract the Two Islands zip and wire in tokens and fonts. Build one styled placeholder home page that reads "Boilerplate Trainer" in the display font on the bone background. Push to GitHub. Connect the repo to Vercel, add the environment variables in Vercel, and deploy.
DoD: a Vercel URL opens and shows the styled placeholder using the Two Islands palette and fonts.

### Phase 2 — Database and authentication
Goal: only Steadfast people can get in, and the database exists.
Steps: run `data-model.sql` in Supabase. In Supabase Auth settings, turn on email sign-in and restrict sign-ups to the `steadfast.design` domain (also enforce it in your login code as a backstop using `ALLOWED_EMAIL_DOMAIN`). Build login and logout. On first sign-in, a `profiles` row is created by the database trigger with role `learner` and a balanced modality blend.
DoD: a `steadfast.design` email can sign in and out, the session persists across refresh, a non-Steadfast email is rejected, and a profile row appears.

### Phase 3 — Seed the concept map
Goal: the 12 concepts live in the database.
Steps: write `scripts/seed-concepts.ts` that reads `docs/concept-map.json`, inserts one `boilerplate_versions` row (from the file's `figma_file_key` and `version_label`, marked current), and inserts all 12 `concepts` with every field, including `prerequisites`, `why`, `track`, and `plugin_checks`. The seeded concepts should preserve Q'Apel as a reference case source where the JSON names it. Make it idempotent, so running it again updates rather than duplicates.
DoD: the `concepts` table has 12 rows matching the JSON, and re-running the script does not create duplicates.

### Phase 4 — The course map
Goal: the learner sees the concepts as a map.
Steps: build `/map`. Render concepts as nodes with edges drawn from `prerequisites`, grouped by track (Using first, Setup second). Show each node's state from the learner's `progress`: locked (prerequisites not done), available, in progress, or complete. Locked nodes show what they're waiting on. Completed nodes look distinct.
DoD: matches user story US-003. A logged-in learner sees the map, locked concepts show their prerequisites, completed ones are visually distinct.

### Phase 5 — The lesson view
Goal: a learner can work a concept and submit the exercise.
Steps: build `/concept/[slug]`. Show the concept's lesson assets grouped by modality (visual, auditory, reading, kinesthetic). Order them by the learner's saved blend so the top-weighted one opens first and expanded, the rest collapsed but present and labeled. Pin the kinesthetic exercise at the bottom as the completion gate, with a button that opens the practice Figma file (use `PRACTICE_FILE_URL`, and the specific frame when the exercise names one). The learner submits a link to their completed frame, which writes an `exercise_submissions` row and sets `progress.exercise_status` to submitted. Because real lesson content is generated later, the view must work gracefully when a concept has no assets yet: show the concept's `summary` and `why`, and a clear "lesson content coming" state, and still allow the exercise submission flow.
DoD: matches US-004 and US-005. All present assets render, the exercise is pinned last, submitting stores the link and timestamp and marks the concept submitted.

### Phase 6 — The modality blend
Goal: capture how the learner wants things explained first.
Steps: build a one-time setup after first login and a `/settings` screen to change it later. Use a ranked drag or sliders over the four modes, stored as weights on `profiles.modality_weights` (for example `{ "V": 0.5, "A": 0.1, "R": 0.2, "K": 0.2 }`). Skippable, with a balanced default. The label is "How do you want this explained first?" Never the words "learning styles."
DoD: matches US-002. Weights save to the profile and the lesson view ordering reflects them immediately.

### Phase 7 — Author tools
Goal: authors can edit content and see progress.
Steps: build `/author`, visible only to profiles with role `author`. Let an author edit any `lesson_assets` content and publish the change. Let an author review `exercise_submissions` and mark them verified or returned with a note, which the learner then sees. Show a team grid of designers by concept with completion state, exportable as CSV. Add a config flag `AUTO_COMPLETE_ON_SUBMIT`: when true, a submission auto-verifies (with author spot checks); when false, an author must verify. Default false.
DoD: matches US-006, US-007, US-008.

### Phase 8 — Capstone and verification
Goal: the finish line works.
Steps: treat the final Using-track concept (`capstone-use`) as the capstone. Its exercise is to rebuild a reference design using only boilerplate components until the Boilerplate Assistant plugin reports zero structural errors. The learner submits their practice frame link and, per the config flag, an author verifies. Passing the capstone marks the Using track complete for that learner. (The Setup track and its capstone come later; keep its concepts visible and locked behind the Using capstone.)
DoD: a designer can go from first login all the way to a verified capstone with no live walkthrough. This is the core acceptance criterion from the plan.

### Phase 9 — Polish and ship
Goal: a real, shareable app.
Steps: make every screen work on a laptop and a phone. Add empty states, loading states, and clear error messages. Seed at least one concept with real sample lesson content so the app demos end to end. Final deploy.
DoD: the acceptance criteria in the plan hold: login to verified exercise without help, authors can edit any asset from the UI, progress persists.

## Definition of done for the whole build

- A Steadfast designer logs in, sets a blend, works the Using track, and reaches a verified capstone without anyone walking them through it.
- An author edits lesson content and reviews submissions from the UI.
- Progress persists across sessions.
- The app looks like the Two Islands system.
- No secrets are in git. The app is live on Vercel.

## What is still open (confirm with Kelly before the phase that needs it)

- Which Figma file is the practice copy learners work in (needed in Phase 0 and Phase 5).
- The exact spacer-versus-variable rule, read from Carson's components, before the spacer lesson is written (content, not app).
- Whether the Boilerplate Assistant plugin's checks need updating to match the finished course (a plugin task, not an app task).

Lesson content itself is generated separately in Claude Code with the Figma connection, reviewed by an author, and loaded into `lesson_assets`. The app must run and be navigable on the concept map alone before that content exists.
