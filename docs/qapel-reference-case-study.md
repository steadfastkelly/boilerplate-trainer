# Q'Apel Reference Case Study

**Status:** approved by Kelly as a reference case study
**Decision date:** 2026-07-13
**Use in trainer:** explain why the boilerplate matters and show the design-to-code chain
**Do not use as:** the learner's main practice file, unless Kelly changes that decision later

## Source Files

- Q'Apel Styles: `https://www.figma.com/design/LQzpd6xke7IyRLz4Slxaa1/_Q-Apel-Styles?m=dev`
- Q'Apel Boilerplate v5.0: `https://www.figma.com/design/VwX3P7qLCRDsbhe0YV1Qao/_Q-Apel-Boilerplate--v5.0-?m=dev`
- Q'Apel Website For Dev: `https://www.figma.com/design/NY8nldSJaZD8tKbJOChQsa/Q-Apel-Website--For-Dev-?m=dev`
- Live site: `https://qapelmedical.com/`
- Attached site files inspected from: `/Users/steadfast/Downloads/qapelmedical-com.zip`

## What It Proves

Q'Apel is the clearest case study for the course because it shows the full chain:

1. A Styles file defines brand assets, logos, and icon libraries.
2. A Boilerplate file organizes structure, components, text, spacers, radius, and effects.
3. A Website For Dev file applies those parts to real pages and export assets.
4. The shipped website keeps the same system language in code.

This supports the course's main point: designers move faster when their Figma work already speaks the same language as the build.

## Figma Findings

The Q'Apel Styles file has top-level pages for Overview, Logos, and Icons.

The Q'Apel Boilerplate Working page has four main areas:

- `start here`
- `structure`
- `components`
- `effects`

The Boilerplate sections match the trainer concepts:

- structure includes page width and radius
- components includes text, buttons, icons, and spacer
- effects includes layer blur, background blur, shadows, and glass

The Q'Apel Website For Dev file is organized by site route and export work:

- Home
- Technology
- About
- Leadership
- Products
- Case Examples
- Contact
- Resources
- News
- Exports

That makes it useful for showing learners how small system pieces become full pages.

## Code Findings

The shipped site uses code names that match the boilerplate ideas:

- Spacing and size: `gap-s6`, `py-s13`, `size-s9`
- Type: `t-h2-alt`, `t-ui-b-lg`, `t-p-lg`
- Buttons: `btn`, `btn-corporate`, `btn--lg`
- Icons: `icon-ui-arrow-right-white-16px`, `icon-social-linkedin-white`
- Color: `bg-corporate-indigo-900`, `text-utility-slate-200`
- Effects: `blur-13xl`, `blur-glow`
- Radius: `rounded-sm`

These are strong lesson examples because they show that Figma names become the developer's working vocabulary.

## Course Impact

Use Q'Apel in the lessons as the reference case for:

- why the boilerplate exists
- how Styles, Boilerplate, Website, and code relate
- why AutoLayout structure matters
- why spacers and variables need stable names
- why text, button, icon, and effect components should stay intact
- how the final capstone connects to real shipped work

Do not change the app architecture for Q'Apel. Do not add file ingestion. Do not add runtime AI. The Q'Apel material is source evidence and lesson context.
