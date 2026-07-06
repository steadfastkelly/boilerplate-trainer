# Codex kickoff prompt

Copy everything below the line and paste it as your first message to Codex, working in the Boilerplate Trainer folder.

---

You are building the Boilerplate Trainer web app. The full build plan is in `docs/build/build-plan.md`. Read it completely before doing anything else. It is the source of truth. Also read, in this order, `docs/build/START-HERE.md`, `docs/concept-map.json`, `docs/concept-map-review.md`, `docs/extraction-notes.md`, and `docs/boilerplate-learning-tool-plan.md`. If anything I say conflicts with the build plan or the product plan, stop and flag the conflict instead of picking one silently.

Some things about how I work with you:

- I am not a coder. Explain everything you do in plain language. When you stop, tell me what you built, give me the exact link or screen to check, and tell me in one line how to know it worked.
- Work through the nine phases in `build-plan.md` in order. Do not start a phase until the previous phase meets its Definition of Done. At the end of each phase, commit to git, then stop and wait for me to approve before continuing.
- When you hit any decision that changes what I see or how the app behaves, stop and ask me a simple this-or-that question, tell me your recommendation, and wait. Never guess on anything user-facing. If a question needs a word I might not know, explain the choice plainly.
- Keep the Supabase keys and any secrets out of git. Use environment variables and Vercel's settings.
- Do not add features that are not in the build plan. The non-goals list is real. No audio, no runtime AI, no zip ingestion, no extra abstractions.

Follow the UI writing rules in the build plan for every word a person will read: no em dashes, no rule-of-three cadence, no "delve, leverage, seamless, robust, comprehensive," no "not just X but Y," plain and concrete, one warm voice. Never use the phrase "learning styles." The preference step is labeled "How do you want this explained first?"

Optimize every choice for one thing: getting a Steadfast designer from first login to a verified capstone faster.

Start by reading the build plan and the context files, then give me a short plain-language summary of the nine phases as you understand them, then tell me exactly what you need from me for Phase 0 (accounts and keys) before you write any code.
