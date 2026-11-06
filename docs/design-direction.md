# Design direction

The owner's taste for this site, what polished neobrutalism means, why the live design reads as
generic, and how the mockups are built and checked. Read this before any redesign or restyle.

## The bar

The site must read as the work of a **senior web developer**: deliberate, polished, with
personality. "Clean" alone is not enough (it reads as safe), and "friendly" pastel styling reads as
a beginner's work. A palette that a visitor can trace to a known brand fails, even if the layout is
good.

## Directions tried, and the owner's verdict

Ten full-homepage mockups (real content, both themes, phone layouts) were rated on a review page.
The four loved directions were then rebuilt around the owner's notes (the `*-v2.html` files), and
the owner loved all four rebuilds. **Poster (10) is the chosen direction**; `ROADMAP.md` ports it.

| Direction | What it is | Verdict | Owner's reason |
|---|---|---|---|
| 01 Disciplined | The live site cleaned up: one blue, shadows only on controls | No | Clean but too safe |
| 02 Product | Shop-like, pink and yellow, flat until hover, project filter | Love | The Gumroad palette gives the source away; change the colours |
| 03 Editorial | Magazine cover, contents with page numbers, stories | Love | The headline font changes shape between sections, and some type is hard to read |
| 04 Swiss Grid | One ruled 12-column grid, projects as an index table | No | Feels like a task tracker |
| 05 Desktop | Retro OS windows that drag, projects as files | Love | Very fun, can consider it |
| 06 Soft | Pastels, rounded corners, short shadows | No | Looks like a beginner's work |
| 07 Terminal | Dark first, each section a command | No | Not impressive; the live site already uses a terminal element |
| 08 Riso Zine | Two-ink overprint, halftone photos | No | Not the owner's style |
| 09 Datasheet | Projects as spec sheets, grey and orange | No | Boring |
| 10 Poster | Flat colour slabs, giant type | Love | The next evolution of the live site: a better version of it |

What the loved four share: a strong concept that holds the whole page together (a shop, a magazine,
an operating system, a poster wall), big confident type, and interaction that rewards a visitor.
What the rejected six share: either no concept beyond tidiness (01, 04, 09), a register that reads
junior (06), or a gimmick the owner has already seen (07, 08).

What the rebuilds settled:

- 02: a palette that points at a known brand fails even when the layout wins. Its three ownable
  replacements (Apricot and Cobalt, Moss and Vermilion, Plum and Sky) live in `02-product-v2.html`.
- 05: a playful concept reads senior when it works like the real thing (focus, minimise, taskbar,
  keyboard access, a phone home screen) and its reading text stays in a calm face.
- 10: the owner prefers their own face over a second app screenshot at the top of the poster
  (`10-poster-v3.html`). A personal site leads with the person, supported by the work.
- Pixel and mono display faces can make digits ambiguous ("5" read as "8"). Set numbers that carry
  meaning in the body face.

Typography lessons from 03: one face per role, one style per role. Hairline Didones (Bodoni Moda)
break up at middle sizes, and a variable optical-size axis makes the same face look different from
section to section. Small uppercase labels under 12px are hard to read.

## What polished neobrutalism means

Sources: the neubrutalism.com guide, the Really Good Designs roundup, the daisyUI trend page, and
these sites: Gumroad, Tony's Chocolonely, Panda CSS, Dodonut, lydiaamaruch.com.

- One stroke width (2-3px) everywhere. Shadow sizes by meaning (for example 3px for small controls,
  5px for cards, 8px for lead blocks), always zero blur. Radius 0, or one small radius used
  everywhere.
- Borders and shadows only where they mean something: a container, a control, focus, a selected
  state. A border and shadow on every block flattens the hierarchy.
- One neutral base, one ink, one to three accents. Body text stays plain and calm.
- Asymmetry at the large scale only. Small parts stay on the grid ("broken but not random").
- Hover lifts into the shadow. Press sinks and drops it. Transitions near 0.1-0.15s.
- The loud style belongs on hero and editorial blocks. Dense content stays quiet.

## Why the live design reads as AI-made

- Six accent colours (blue, coral, acid, green, violet, pink) with no colour story.
- The same 3px border and 6px shadow on every block, so nothing leads the eye.
- Template cliches: a tool marquee with ✦ separators, rotated stickers, bento tiles, ghost numbers,
  magnetic and tilt hover.
- Anton, Archivo and DM Mono: the default "loud" pairing.
- A stock photograph (a copper coil) leads the hero instead of the owner's own work.

## Mockup workspace

Mockups live in `design-previews/neo-2026/`, the one tracked folder under `design-previews/`
(its `shots/` stay untracked, and Prettier skips the folder). Each mockup is a standalone
HTML file that renders from `data.js` (`window.SITE`, the real site content) and `img/*.webp`.
`showcase.html` is the review page, published as a claude.ai Artifact with the mockups as files and
the owner's verdicts in its database.

- `tools/shot.py url out --widths 1440,390 --themes light,dark --full 1` captures each width and
  theme with Playwright and prints horizontal overflow per shot. A `file:///` URL works, so no
  server is needed.
- `tools/sheet.py` folds a tall screenshot into a side-by-side sheet for one-look review.

Capture and build traps:

- Playwright with `channel="chrome"` gives a true 390px phone viewport. Headless Edge clamps narrow
  windows to 500px, so its phone shots run the wrong media queries.
- Lazy images are blank in full-page shots unless the script scrolls through the page first;
  `shot.py` does this.
- A local `python -m http.server` sends HTML with no charset. A page with no `<meta charset>` then
  shows UTF-8 punctuation as mojibake (`Â·`). Artifact publishing adds the charset.
- Headline lines built from inline spans run together when a reduced-motion rule removes their
  animation; give each line `display: block`.
- "full-stack" breaks at its hyphen in large display type; wrap it in a `white-space: nowrap` span
  or use a non-breaking hyphen (`&#8209;`).
- Split sentences with a lookbehind on sentence punctuation followed by a capital
  (`/(?<=[.!?])\s+(?=[A-Z])/`). A plain `split(". ")` breaks names such as "Respond.io".

## Current state

The Poster direction is chosen. Its spec is `design-previews/neo-2026/10-poster-v3.html`, and
`ROADMAP.md` holds the port: settled decisions, phases and status. The other mockups stay as
reference for later work.
