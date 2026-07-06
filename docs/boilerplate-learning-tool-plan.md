# Boilerplate Learning Tool — Build Plan for Opus

## Product overview

**Working name:** Boilerplate Academy (rename later)
**Version:** v1 plan, July 2026
**Owner:** Kelly Phillips, Creative Director, Steadfast

A web app that teaches Steadfast designers how the Figma boilerplate works. It breaks the boilerplate into a concept map, then delivers each concept through four modalities (visual, auditory, reading/writing, kinesthetic). The learner sets a modality blend that changes the *order and emphasis* of the material, not what they receive. Every concept ends with a hands-on exercise performed in a practice copy of the actual boilerplate, because the job to be done is "can this designer work in the file," and that is verified by doing, not by reading.

## The learning model (read this before writing any code)

The VARK research consensus is that style-matched instruction does not improve outcomes, but multimodal instruction does. So this tool does NOT build four separate versions of each lesson and hide three of them. Instead:

1. Every concept lesson contains all four modality assets.
2. The learner's stated preference controls the **on-ramp**: which asset opens first and gets visual priority.
3. The **off-ramp is always kinesthetic**: no concept is marked complete until the learner finishes the hands-on exercise in the practice Figma file. The other three modalities are preparation for that exercise.
4. Preference is a blend (sliders or ranked list), not a single pick. Store it as weights, e.g. `{V: 0.5, A: 0.1, R: 0.2, K: 0.2}`.

Do not use the phrase "learning styles" in the UI. Use "How do you want this explained first?" This keeps the tool honest about the science and keeps designers from boxing themselves in.

## Goals

**Business goals**
- Cut the time it takes a new or existing designer to become independently productive in the boilerplate. Baseline: current onboarding requires repeated 1:1 walkthroughs from Kayla or Kelly. Target: a designer completes the course and passes the capstone with zero live walkthrough time.
- Create a durable artifact that survives boilerplate updates (re-run the content pipeline, not rewrite the course).

**User goals**
- Understand what each part of the boilerplate is for, why it is structured that way, and what breaks if you fight it.
- Practice in a safe copy of the real file, not a toy example.
- Get explanations in the format they absorb fastest.

**Non-goals (v1)**
- Generic ingestion of arbitrary zip folders. Cut.
- Canva link ingestion. Cut.
- NotebookLM link ingestion. Cut permanently until Google exposes an API; shared NotebookLM links sit behind Google auth and render client-side, so there is no reliable programmatic path.
- Client-facing use, multi-tenant anything, billing.
- Generating audio narration with TTS. v1 ships scripts and discussion prompts; actual audio is a v2 flag.

## Users

- **Designer (learner).** Steadfast designers: Joy, Jen, Miranda, Rachel, Carson, Jack, plus new hires. Logs in, sets modality blend, works through concepts, completes exercises.
- **Author (Kelly / Kayla).** Reviews and edits generated lesson content, reorders concepts, marks a boilerplate version as current, sees team progress.

Auth: Supabase email auth restricted to the Steadfast domain. Two roles: learner, author.

## Architecture

Match the existing Pathways stack so nothing new has to be learned to maintain it:

- **Next.js (App Router) + TypeScript** on Vercel
- **Supabase** for auth, Postgres, and storage (screenshots, exported diagrams)
- **Content pipeline runs in Claude Code with the Figma MCP**, offline, not at runtime. The app serves pre-generated, human-reviewed content. No runtime LLM calls in v1. This keeps the app cheap, fast, and predictable, and it means a bad generation gets caught in review instead of in front of a designer.

### Data model (Supabase)

- `boilerplate_versions` — id, figma_file_key, version_label, published_at
- `concepts` — id, version_id, title, slug, summary, order, prerequisites (self-referencing array)
- `lesson_assets` — id, concept_id, modality (`V|A|R|K`), type (`diagram|annotated_screenshot|script|discussion_prompts|written_guide|quiz|exercise`), content (jsonb), media_url
- `profiles` — user_id, role, modality_weights (jsonb)
- `progress` — user_id, concept_id, exercise_status (`not_started|in_progress|submitted|verified`), quiz_score, completed_at
- `exercise_submissions` — user_id, concept_id, figma_link_to_practice_frame, notes, reviewed_by, review_status

## Content pipeline (Phase 1, this is the real work)

Run in Claude Code against the boilerplate file via Figma MCP.

1. **Extract.** Use `get_metadata` and `get_design_context` to walk the boilerplate: pages, components, variants, styles, variables/tokens, naming conventions, auto-layout patterns. Use `get_screenshot` per component and per page.
2. **Build the concept map.** Cluster the extraction into 10 to 20 teachable concepts (examples: token structure, the grid, component naming, how variants are organized, page templates, what to detach vs. never detach). Output as JSON matching the `concepts` schema, with prerequisites. **Stop here for human review.** Kelly approves or edits the concept map before any lesson generation. This is the checkpoint that prevents 20 confidently wrong lessons.
3. **Generate four assets per concept:**
   - **Visual:** a Mermaid or SVG diagram of the concept's structure plus 2 to 4 annotated screenshots (callouts drawn on the Figma screenshots).
   - **Auditory:** a 2 to 4 minute conversational walkthrough script (written for future TTS) plus 3 discussion questions for a pairing session with a senior designer.
   - **Reading/writing:** a written guide (500 to 800 words, Steadfast internal voice: warm, direct, no jargon) plus a 5-question quiz with answer explanations.
   - **Kinesthetic:** a step-by-step exercise performed in the practice file. Each exercise names the exact frame to duplicate, the task, and a self-check ("your result should look like frame X"). Exercises must use the real boilerplate, not descriptions of it.
4. **Review pass.** All generated content lands as draft. Author approves per concept.

Acceptance criteria for Phase 1: concept map approved by Kelly; every concept has all four asset types in draft; every exercise references a real, existing frame in the practice file.

## App (Phase 2)

**Entry:** login, then a one-time "how do you want this explained first?" setup (ranked drag of the four modes, stored as weights). Skippable; default is balanced.

**Course view:** concept map rendered as an actual map (nodes and prerequisite edges), not a flat list. Visual-first by design. Completed nodes fill in.

**Lesson view:** the learner's top-weighted asset renders first and expanded; the others are collapsed but present and labeled. The kinesthetic exercise is always pinned at the bottom as the completion gate, with a link that opens the practice Figma file to the right frame. Learner submits a link to their completed frame; an author verifies (or auto-complete on submit, with spot checks, if review load is too high; make this a config flag).

**Progress:** learner sees their own map; authors see a team grid (designer × concept).

**Capstone:** final "concept" is a small real task built entirely from the boilerplate. Passing it is the definition of done for a learner.

Acceptance criteria for Phase 2: a designer can go from login to a verified exercise completion without help; author can edit any asset's content from the UI; progress persists.

## Phase 3 (only after v1 is used by at least 4 designers)

- TTS audio for the auditory scripts (OpenAI or ElevenLabs voice, generated in the pipeline, stored in Supabase storage).
- "Explain this differently" button: runtime Claude call that re-explains the current concept using the lesson content as context. This is the one runtime LLM feature worth having.
- Zip ingestion for non-Figma source material, generalizing the pipeline. Only build this if a second real course is actually wanted.

## User stories

- **US-001 Login.** As a designer, I sign in with my Steadfast email and land on my course map. AC: non-Steadfast emails rejected; session persists.
- **US-002 Set blend.** As a designer, I rank the four explanation modes once and can change them in settings. AC: weights saved to profile; lesson ordering reflects them immediately.
- **US-003 View map.** As a designer, I see concepts as a prerequisite map with my completion state. AC: locked concepts show their prerequisites; completed concepts are visually distinct.
- **US-004 Take lesson.** As a designer, I open a concept and see my preferred asset first with the others available. AC: all four assets render; exercise pinned last.
- **US-005 Complete exercise.** As a designer, I follow the exercise in the practice Figma file and submit my frame link. AC: submission stores link and timestamp; concept marked submitted.
- **US-006 Verify exercise.** As an author, I review submissions and mark verified or returned with a note. AC: learner sees status change and note.
- **US-007 Edit content.** As an author, I edit any lesson asset in the UI and publish the change. AC: edits versioned against the boilerplate version.
- **US-008 Team progress.** As an author, I see a designer-by-concept completion grid. AC: reflects real progress; exportable as CSV.
- **US-009 New boilerplate version.** As an author, I re-run the pipeline against an updated file and diff which concepts changed. AC: unchanged concepts keep learner progress; changed concepts flag affected learners.
- **US-010 Quiz.** As a designer, I take the reading-mode quiz and see explanations for wrong answers. AC: score stored; retakes allowed.

## Instructions to Opus

1. Build Phase 1 first and stop at the concept-map checkpoint. Do not generate lessons until the map is approved.
2. Keep changes surgical. No speculative abstractions, no plugin systems, no "future-proofing" for zip ingestion in v1 code.
3. All written lesson content follows the anti-slop rules: no em dashes, no rule-of-three cadence, no "delve/leverage/seamless," concrete over abstract, one warm human voice.
4. Every claim in a lesson about how the boilerplate behaves must trace to something actually observed in the Figma file during extraction. If it wasn't observed, mark it `[needs confirmation]` for author review instead of asserting it.
5. Success metric to optimize for: time-to-verified-capstone per designer, not quiz scores.
