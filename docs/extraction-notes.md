# Boilerplate Extraction Notes

**File:** Boilerplate - Playground (Kelly) v5.2
**Figma file key:** u2ZUi1cEngp5ZdfVWBwcKJ
**Start node:** 8715:32 (Working page)
**MCP read:** confirmed via `get_metadata` and `get_screenshot`
**Date:** 2026-07-06
**Author:** Kelly Phillips (interview) + Claude (extraction)

## What this file is

This is not a plain component library. It is a self-contained course. Pages 00 through 06 are numbered modules ending in a capstone ("The Challenge"), and the file ships with a "Boilerplate Assistant" plugin that grades a design against a structural checklist. The learning tool is being built to teach this file, so the file's own module spine is the backbone of the concept map, reconciled with the deeper reasoning that lives in the Slab articles and in Kelly's and Carson's heads.

## Sourcing legend

Every claim below is tagged so an author can trust or challenge it.

- `[MCP]` observed directly in the file this session through the Figma MCP
- `[slab]` from the Slab articles (reasoning of record, dated on mechanism)
- `[carson]` from Carson's Boilerplate 5.0 presenter notes
- `[deck]` from the AutoLayout Structure & Naming training deck
- `[kelly]` from the interview in this session
- `[NC]` needs confirmation, not yet verified against the current file

## Traversal record

Walked, in order:

- Top-level page list `[MCP]`
- 00 Welcome (15721:2186) `[MCP]` + screenshot
- 02 Spacers (15721:2188) `[MCP]` + screenshot + `get_variable_defs`
- 01 Page Structure (15721:2187) `[MCP]`
- 03 Typography (15721:2189) `[MCP]`
- 04 Buttons & Icons (15721:2190) `[MCP]`
- 05 Effects (15721:2191) `[MCP]`
- _Utility (10743:10933) `[MCP]`
- Typography component internals seen via Kelly's screenshots of the Working page (heading component, ascender-offset frame, spacer child, Variables panel)

Skipped, on purpose:

- The two `---` divider pages (10856:6798, 4836:3791): cosmetic separators
- _Cover (1:3): file cover art
- _Archive (9450:3230): named as stale; not opened
- _Playground (17709:2242) and Working (8715:32) walked only through the screenshots Kelly shared, not a full traversal
- 06 The Challenge (15721:2192): not yet walked; it is the capstone and will be read when we build the capstone concept's exercise

Not yet pulled: per-component screenshots and the full variable tables. Those come during lesson generation, not for the concept map.

## Pages

| ID | Name | Purpose observed |
|---|---|---|
| 8715:32 | Working | Live design surface; holds the text/typography audit workspace and the "broken from boilerplate" holding area `[MCP]` `[kelly]` |
| 15721:2186 | 00 Welcome | Course syllabus: what the boilerplate is, why learn it, the six modules, how to pass `[MCP]` |
| 15721:2187 | 01 Page Structure | Breakpoint width frames `[MCP]` |
| 15721:2188 | 02 Spacers | The 14-step spacing scale `[MCP]` |
| 15721:2189 | 03 Typography | Text components, heading scale, ascender-offset `[MCP]` |
| 15721:2190 | 04 Buttons & Icons | Button sizes, icon types `[MCP]` |
| 15721:2191 | 05 Effects | Shadows, background blur, layer blur, glass `[MCP]` |
| 15721:2192 | 06 The Challenge | Capstone task (not yet walked) `[MCP]` name only |
| 10743:10933 | _Utility | Helper symbols: annotation, matrix axis labels, tag `[MCP]` |

Each module page follows one layout: header, intro with a one-line thesis, then a body of cards. Teaching pages 01 through 05 each contain an "In code" block showing the CSS or HTML the design maps to, a "Why this matters" card, and a "Key rule" card that names the plugin check it feeds. `[MCP]`

## The design-to-dev bridge (the core why)

The reason the boilerplate exists: Steadfast designs in Figma and builds in Craft CMS, and the boilerplate makes that handoff close to 1:1. `[slab]` `[kelly]` A designed section becomes fillable content fields in Craft, and structured Figma is what keeps that translation clean. `[slab]`

The handoff is human, not automated. The developer keeps a matching boilerplate in code, turns on guides in Figma (Shift+G), reads a spacer's name, size, and bound variable, and picks the equivalent CSS class or token. `[kelly]` So the designer's real job is to name and structure precisely, because a person on the other side reads it.

Origin: a former creative director obsessed over the spacing between every element down to the pixel. The system was built so a developer could match the design without that person reviewing every detail. `[kelly]` The Welcome page hints at this ("no more pixel-nudging debates") but frames the why generically as HTML and CSS, and never names Craft. `[MCP]` That is a teachability gap on page 00.

## Components observed

- **Spacer** `[MCP]` `[kelly]`. A component, color-coded, placed in the layout to hold vertical space. Scale runs sp-1 to sp-14. Inside typography components it appears as a `spacer` child (seen at height 96px, color purple, tied to a `spacer-color/purple` layout guide).
- **Text / typography** `[MCP]` `[slab]` `[carson]`. A component set. Variant properties seen: category (heading), type (h1-super, h1 through h6), variant (default, alt, alt-2), case (sentence, title, caps), plus a desktop/mobile screen axis handled by modes. Each instance contains an `ascender-offset` frame and a `spacer` child. Functional names per Slab: Heading, Paragraph, Special Paragraph, UI Text. `[slab]` The component houses desktop only; other breakpoints come from modes. `[carson]`
- **Buttons** `[MCP]`. `button-base` is the foundational component. Three sizes: Small (36px), Medium (44px), Large (61px). Each maps to `button/{size}/padding-h · padding-v · radius · gap` variables. Full matrix per Carson: sm/md/lg by solid/glass/outlined/underlined/borderless across three breakpoints; states now handled in the Working file. `[carson]`
- **Icons** `[MCP]`. Two kinds: `icon-ui` (interface actions: arrows, close, menu, search, check, star) and `icon-social` (brand logos: X, LinkedIn, GitHub, Instagram, YouTube). Icons live in the boilerplate so `button-base` maps to them. `[carson]` Source library is Nucleo, applied as styles; custom icons enter only when scoped. `[slab]` `[carson]` `[NC]` (page 04 does not name Nucleo)
- **Effects** `[MCP]`. Four types with named CSS equivalents: Shadows (`box-shadow`), Background Blur (`backdrop-filter: blur()`), Layer Blur (`filter: blur()`), Glass (backdrop-filter plus an rgba fill and border). Token names seen: `shadow/drop-shadow/{sm,md}`, `background-blur/{md,lg}`, `background-blur/overlay-fill`, `layer-blur/{sm,md}`, `color/alpha/white-20`.
- **_Utility symbols** `[MCP]`. An `annotation` symbol, a `matrix label` set with Axis=X/Y and Level 1/2/3, and a `tag` symbol. These are the file's own chrome, matching the `utility` variable collection.

## Variables and tokens

- Variable collections `[carson]` + panel screenshot `[MCP]`: `utility` (23), `primitives` (305), `font-families` (38), `type-styles` (450), `size+spacing` (16), `effects`. Governance-labelled groupings DO NOT EDIT, ADD ONLY, EDIT also appear in the panel. `[MCP]`
- Edit tiers `[carson]` `[kelly]`: `utility` = DO NOT EDIT (the boilerplate file's own UI chrome). `primitives` = ADD ONLY (never change an existing value; add new ones with an `-alt` suffix, added to primitives first, then referenced). `font-families`, `type-styles`, `size+spacing`, `effects` = EDIT, customized per brand.
- Modes `[carson]` `[MCP]`: `desktop*` / `tablet` / `mobile` on layout (tablet doubles as email sizing); `brand` / `websafe` on font-families (seen: Zalando Sans SemiExpanded falling back to Arial).
- Observed sample `[MCP]`: `get_variable_defs` on page 02 returned a `base-unit/scale/sc-N` set whose values match the spacer scale (sc-2 = 8, sc-4 = 16, sc-7 = 32, sc-11 = 80), plus `boilerplate/text-primary`, `boilerplate/section-fill`, `page/width` = 1440, and `color/alpha/black`.
- Variables vs styles `[carson]`: a variable holds one value and talks to code; a style bundles properties (a shadow's x, y, blur, spread, color). Effect styles are built on variables. Never edit a style directly; change the variable.

## Naming conventions

- Layout structure and naming `[deck]`: `page-home` > `content` (section) > `row-1` > `column-1`. Maps 1:1 to `<body id="page-home"><section id="content"><div id="row-1"><div id="column-1">`.
- Structure hierarchy `[deck]`: Viewport Window > Section > Row > Column. Rows sit in sections, columns sit in rows.
- Spacer scale `[MCP]`: `sp-1` (4px) through `sp-14` (160px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160.
- Type-style naming `[carson]`: `*` = default, `i` = italic, `em` = bold, `em-i` = bold italic.
- T-shirt sizing on most scales `[carson]`: none, xxs, xs, sm, md*, lg, xl, 2xl and up, with `*` marking the default.
- `-alt` suffix `[carson]`: a project-specific addition to the standard scale, e.g. `object/radius/sm = 12px`, `object/radius/sm-alt = 14px`.
- Button tokens `[MCP]`: `button/{sm,md,lg}/{padding-h, padding-v, radius, gap}`.
- Effect tokens `[MCP]`: `shadow/drop-shadow/{size}`, `background-blur/{size}`, `layer-blur/{size}`.

## AutoLayout patterns

- AutoLayout is mandatory. Without it the boilerplate is useless, because AutoLayout is what lets a designer replicate code inside Figma for the 1:1 conversion. `[kelly]` `[carson]` `[deck]`
- Build rule `[kelly]`: vertical AutoLayout, 0px top and bottom padding, spacer variables for left and right padding. Bind a utility or primitive spacer variable to as many numeric values as possible.
- Zero-height container `[carson]` `[kelly]`: for backgrounds that bleed outside a section, use a frame with height 0 and clip content OFF, named like `hero-background-container`. It overflows visually but takes zero layout space.
- Breaking from the boilerplate `[carson]`: detach the component (full freedom, loses variable links) or disconnect a single variable (keep the component, override one property). Prefer disconnecting. Comment every intentional break on the element, which becomes the For Dev handoff note.

## The plugin contract (definition of "done")

The Boilerplate Assistant scans every node inside the selected page-width frame. `[kelly]` A design passes at 0 structural errors. Checks:

1. Page-width frame: design wrapped in a standard breakpoint frame; floating components flagged `[MCP]` `[kelly]`
2. Spacer components: all vertical spacing between elements uses spacer components; arbitrary frame heights fail `[MCP]` `[kelly]`
3. Text components: every text node uses the text component with its ascender-offset; raw text fails `[MCP]` `[kelly]`
4. Button components: CTAs use `button-base` `[kelly]`
5. Correct nesting and order `[kelly]`
6. Effect styles: applied effects match the defined effect styles; no custom values `[MCP]` `[kelly]`

Does not check: color, font content, copy, or aesthetics. Passing the plugin is the structural bar; "ready for dev" adds content, responsive states, and handoff docs. `[kelly]`

## Open questions and [needs confirmation]

1. **Spacer component vs spacer variable.** Resolved by Kelly: defer to Carson's practice, since she built the current variables-based boilerplate. Where Carson's rule conflicts with the plugin, the plugin gets updated to match her. Read the exact rule off Carson's components in the file when writing the spacer and padding exercises. `[kelly]`
2. **The ascender-offset reference.** Resolved by Kelly: the practice is the same across all framings (align optical spacing so Figma matches the browser). In dev they adjust the offset to the browser's text box, not Figma's default, so the reference point shifts from Figma to code while the practice holds. `[kelly]`
3. **Nucleo as the icon source.** Named in Slab and Carson, not on page 04. Confirm it still holds in v5.2. `[NC]`
4. **Practice copy vs master.** This file is named "Playground." Confirm whether it is the practice copy designers work in or the master, before exercises point at frames. `[NC]`
5. **06 The Challenge** not yet walked. Read before building the capstone exercise. `[NC]`

## Done-check for this document

Every entry above is either tagged `[MCP]` to a node I opened this session, tagged to a named source document, or marked `[NC]`. No claim is asserted from memory of a file I did not open.
