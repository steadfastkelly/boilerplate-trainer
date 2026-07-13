# Concept Map Review

Plain-language walkthrough of [concept-map.json](concept-map.json) for your review. This version reflects your four answers, plus the approved Q'Apel reference case study. Q'Apel explains the real-world why. It does not replace the learner's practice file.

## The shape

Twelve concepts across two tracks, down from twenty. I cut the count on purpose so each concept is one thing a designer can learn, do, and remember.

- **Using the boilerplate** (8 concepts) is the first course. It ends when a designer can build a page that passes the Boilerplate Assistant at 0 errors.
- **Setting up a boilerplate** (4 concepts) is the later track, gated behind the using capstone so nobody sets one up before they can use one.

## Your two operating principles run through all of it

You said designers must always keep the boilerplate's components intact and always build inside AutoLayout. I did not make those two separate concepts, because a principle you meet once and move past is a principle you forget. Instead they are stated in concept 1, then reinforced in every concept and every exercise self-check. They also get one concept where they are taught head-on, "building without breaking," so there is a place a designer practices the restraint directly.

## Why eight, and why this order

I anchored the using track to the file's own modules, which your team already treats as digestible, and folded the fundamentals the file underplays into those modules rather than adding concepts.

1. **Why the boilerplate exists** opens the course and carries the whole weight of converting the freestyle skeptic. It introduces the Craft handoff, the Q'Apel proof, and the two principles.
2. **AutoLayout and page structure** is the foundation: build in AutoLayout, start in a width frame, nest and name so it reads as code. Q'Apel shows this at full website scale.
3. **Spacers and spacing** covers the scale, variables, and the padding question. Q'Apel shows the same idea in code classes like `gap-s6` and `py-s13`.
4. **Typography** covers text components and the ascender-offset. Q'Apel shows the type contract in classes like `t-h2-alt` and `t-ui-b-lg`.
5. **Buttons and icons** covers `button-base`, button sizing, and icon families. Q'Apel shows the matching code and asset names.
6. **Effects** covers the approved effect styles. Q'Apel shows shipped blur and glow classes.
7. **Building without breaking** is where keeping components intact gets taught directly, along with the escape hatches (disconnect a variable, comment the break, zero-height containers).
8. **Capstone** pulls it together, gated on the checks.

The order is a dependency chain. Foundation first, building blocks next, restraint once the rules are known, then the capstone.

## How it maps to the plugin

The six plugin checks live across the concepts so every exercise trains toward one:

- Page-width frame and correct nesting/order -> AutoLayout and page structure
- Spacer components -> spacers and spacing
- Text components -> typography
- Button components -> buttons and icons
- Effect styles -> effects

The capstone requires all six at once.

## Your four answers, and where they landed

1. **Spacer rule: defer to Carson.** Logged as the authoritative call. Where Carson's practice conflicts with the current plugin, the plugin gets updated to match her, not the reverse. I'll read the exact rule off her components in the file when I write the spacer and padding exercises, rather than trusting the loose quick-reference line. The concept itself is unchanged.
2. **Ascender-offset: it does both.** Resolved in the typography concept. The practice is consistent (align the optical space so Figma matches the browser); the technical reference shifts because dev adjusts to the browser's text box, not Figma's default. The lesson will teach the practice and name that shift.
3. **Concept count: tightened.** Twelve total, eight in the first track. If any concept still feels too packed (concept 2 is the densest), say so and I'll split it.
4. **Setup track: built for learning, kept lean.** Four concepts, each anchored to the fundamentals and to the same two principles. Its lessons come after the using track. If you want it expanded to the using track's depth now, say so.

## What's still open before lessons (not before map approval)

From the extraction notes: the exact spacer rule to read off Carson's components, whether Nucleo is still the icon source in v5.2, whether this Playground file is the practice copy or the master, and the contents of page 06 (the Challenge), which I have not walked. None block approving the map. Each blocks a specific exercise, and I'll clear them when we get there. Q'Apel is now resolved as reference-only source material.

## Your move

Approve the map, edit the JSON directly, or tell me what to change. Once you sign off, lessons for the using track start at concept 1, one concept at a time.
