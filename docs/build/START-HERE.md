# Start Here (read this first)

This is for you, Kelly. Not for Codex, not for a developer. You do not need to read or write a single line of code to use this. Your job is to set up three accounts, paste one prompt into Codex, and approve the work one step at a time. This page tells you how.

## What we're building

A web app that teaches Steadfast designers how the boilerplate works, ending in a real task they complete in a practice Figma file. The teaching plan is already done and lives in this folder:

- `docs/concept-map.json` — the 12 concepts the course teaches, in order
- `docs/concept-map-review.md` — the plain-language version of that map
- `docs/extraction-notes.md` — everything we pulled from the Figma file, with sources

This build package turns that plan into a working app.

## The three accounts you need

Codex writes the app, but the app has to live somewhere and store data somewhere. You set these up once. Each has a free tier that is plenty for this.

1. **GitHub** (github.com) — where the app's code is stored. Make an account, then create one empty repository named `boilerplate-trainer`. Codex will put the code here.
2. **Supabase** (supabase.com) — the app's database and login system. Make an account, create one project, and keep the tab open. You'll need three values from it (Codex will tell you exactly where to paste them): the Project URL, the anon key, and the service role key. They live under Project Settings, then API.
3. **Vercel** (vercel.com) — where the app goes live on the internet. Make an account and connect it to your GitHub. Vercel turns the code into a real website with a link you can open.

You will also need access to Codex with the ability to run commands and edit files, pointed at this `Boilerplate Trainer` folder.

Write the Supabase values somewhere safe for a few minutes. Never paste them into a public place. Codex will store them the right way.

## How to hand off to Codex

1. Open Codex in this `Boilerplate Trainer` folder.
2. Open `docs/build/codex-kickoff-prompt.md`, copy the whole thing, and paste it in as your first message.
3. That prompt tells Codex to read the full build plan and work through it in phases, stopping after each phase to show you what it did.

That's the whole handoff. The kickoff prompt does the rest.

## How the build goes, and your part in it

Codex works in nine phases. After each one it stops and tells you, in plain language, what it built and how to check it. Your part is to look at the thing it points you to (usually a link or a screen) and say "looks good, keep going" or "this part is wrong." You are the approver, not the builder.

The phases, in human terms:

0. **Setup.** Codex confirms your three accounts and keys are ready.
1. **Skeleton.** A live link that shows a styled but empty app. Proof the plumbing works.
2. **Login.** Only Steadfast emails can get in. You'll test logging in.
3. **Load the map.** The 12 concepts from the plan show up in the database.
4. **The course map.** You see the concepts as a map with locked and unlocked steps.
5. **A lesson.** You open a concept and see its four ways of explaining, with the hands-on exercise pinned at the bottom.
6. **Your learning-style setup.** The one-time "how do you want this explained first" screen.
7. **Author tools.** You can edit lessons and see who's completed what.
8. **The capstone.** The final build-a-page task and how it gets marked passed.
9. **Polish and ship.** Final cleanup and the real, shareable link.

You can stop after any phase and still have something that works. Phase 4 alone gives you a browsable map. That's on purpose.

## When Codex asks you something

Codex is told to ask you simple yes-or-no or this-or-that questions whenever it hits a decision, and to never guess on anything that matters. If a question uses a word you don't know, ask it to explain the choice in plain language and tell you what it recommends. You are allowed to say "pick what you think is best and tell me why."

## When something breaks

Tell Codex exactly what you see, including any red error text, and paste it back in. It is built to fix its own errors. If a phase won't pass, do not move on. A broken phase 2 makes phase 3 worse, not better.

## What this app will not do in version 1

So no one talks you into scope creep: no audio narration, no "explain it differently" AI button, no importing zip folders or other courses, no client-facing access, no billing. Those are later. Version 1 gets a Steadfast designer from logging in to passing the capstone.

## The one number that matters

Every choice in the build should make a designer reach a verified capstone faster. Not more features, not higher quiz scores. If a decision doesn't move that, it waits.

## The rest of this folder

- `docs/build/build-plan.md` — the full instructions Codex follows. You can skim it, but it's written for Codex.
- `docs/build/data-model.sql` — the database setup Codex runs in Supabase.
- `docs/build/codex-kickoff-prompt.md` — the thing you paste into Codex to begin.
