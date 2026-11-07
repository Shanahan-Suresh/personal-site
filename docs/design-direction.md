# Design direction

The owner's taste for this site, what polished neobrutalism means, what makes a design read as
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

| Direction      | What it is                                                   | Verdict | Owner's reason                                                                  |
| -------------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------- |
| 01 Disciplined | The live site cleaned up: one blue, shadows only on controls | No      | Clean but too safe                                                              |
| 02 Product     | Shop-like, pink and yellow, flat until hover, project filter | Love    | The Gumroad palette gives the source away; change the colours                   |
| 03 Editorial   | Magazine cover, contents with page numbers, stories          | Love    | The headline font changes shape between sections, and some type is hard to read |
| 04 Swiss Grid  | One ruled 12-column grid, projects as an index table         | No      | Feels like a task tracker                                                       |
| 05 Desktop     | Retro OS windows that drag, projects as files                | Love    | Very fun, can consider it                                                       |
| 06 Soft        | Pastels, rounded corners, short shadows                      | No      | Looks like a beginner's work                                                    |
| 07 Terminal    | Dark first, each section a command                           | No      | Not impressive; the live site already uses a terminal element                   |
| 08 Riso Zine   | Two-ink overprint, halftone photos                           | No      | Not the owner's style                                                           |
| 09 Datasheet   | Projects as spec sheets, grey and orange                     | No      | Boring                                                                          |
| 10 Poster      | Flat colour slabs, giant type                                | Love    | The next evolution of the live site: a better version of it                     |

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

## What reads as AI-made

These marks of the default neobrutalism kit stay off the site:

- Many accent colours (blue, coral, acid, green, violet, pink) with no colour story.
- The same border and shadow on every block, so nothing leads the eye.
- Template cliches: a tool marquee with ✦ separators, rotated stickers, bento tiles, ghost numbers,
  magnetic and tilt hover.
- Anton, Archivo and DM Mono: the default "loud" pairing.
- A stock photograph leading the hero instead of the owner's face or work.

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
- `tools/baseline.py capture <url> <dir>` shoots every page and interaction state; `diff <a> <b>`
  counts changed pixels per shot. A CSS refactor is safe when the diff is 0. Capture both sets from
  the same commit, because the footer prints its hash.

Capture and build traps:

- Playwright with `channel="chrome"` gives a true 390px phone viewport. Headless Edge clamps narrow
  windows to 500px, so its phone shots run the wrong media queries.
- Lazy images are blank in full-page shots unless the script scrolls through the page first;
  `shot.py` does this.
- A local `python -m http.server` sends HTML with no charset. A page with no `<meta charset>` then
  shows UTF-8 punctuation as mojibake (`Â·`). Artifact publishing adds the charset.
- Headline lines built from inline spans run together when a reduced-motion rule removes their
  animation; give each line `display: block`.
- "full-stack" breaks at its hyphen in large display type; wrap it in a `white-space: nowrap` span.
  A non-breaking hyphen (`&#8209;`) does not work on the site, because the display face has no
  glyph for it.
- Split sentences with a lookbehind on sentence punctuation followed by a capital
  (`/(?<=[.!?])\s+(?=[A-Z])/`). A plain `split(". ")` breaks names such as "Respond.io".

## Current state

The site is built in the Poster direction. Its spec is `design-previews/neo-2026/10-poster-v3.html`,
with the owner's face at the top of the hero in place of the HR platform. The hero is sky blue
over a cobalt numbers strip, with butter only on the label and the main button: the owner found
the tomato and butter opening too orange, and picked sky over cobalt, night and green heroes
because black headline type on a bright slab is the strongest part of the look. `ROADMAP.md` holds the
settled decisions, the phases and what is still owed. On top of the spec, the site adds a
polish layer (ROADMAP phase 9): every number and the hero's RSVP frame open their story, stories
browse with Previous, Next, arrow keys, swipe and the Back button, the pointer preview sits clear
of the row it shows, and the theme switch is an 8-bit pixel dissolve from its button (a cross-fade on touch screens). A mouse also finds small rewards: a name plate on the portrait, crop marks on the slab under the pointer, hopping letters, a commit card on the build link, and a keyboard card on `?`. The spec file does not carry these; the code
is their reference. The other mockups stay as reference for later work.

Traps met in the polish layer:

- A view transition captures the whole page, so the theme circle needs `mix-blend-mode: normal` and
  no default cross-fade on `::view-transition-old(root)`, or the old theme ghosts through.
- While a view transition runs, Chromium sends every click to `<html>`, and `pointer-events: none`
  on the pseudo-elements does not change that. The theme button counts a click on `<html>` that
  falls inside its own box, so a press during a switch is not lost.
- A transition effect plays over the page as it is. It never paints a fill over content ahead of
  the reveal (the owner rejected squares of page colour that blacked the page out first). The theme
  dissolve's squares clip the pages, so each square shows one real page or the other; only the
  lemon sparkle draws on top. With no animation on its pseudo-elements a view transition ends at
  once, so a per-frame clip needs one held animation (a no-op opacity on the root group).
- A hover panel over a list of rows hides on the list's `pointerleave`, not each row's: the seams
  between rows otherwise start a fade on every crossing. Swap its picture only after `decode()`,
  on a new layer over the old one, or the frame flashes empty and the caption runs ahead.
- A hover effect that swaps the element under the pointer (splitting text into letters and joining
  it back) makes Chromium fire `pointerenter` again, so the effect loops. Change the DOM under the
  pointer only once it has left.
- A hidden overlay inside a clipping box stays inside it: clip it (`clip-path: inset(0 0 100% 0)`)
  rather than moving it out, or its border counts as cut.
- An item that spans an `auto` grid column gives that column its spare width. Give such a column
  a fixed width.
- The lower slabs do not use `content-visibility: auto`. Its estimated heights can move the
  target of an anchor jump (`/#contact`), and the gain on a page this size is small.

Traps met while porting the spec into Astro and Tailwind:

- Tailwind's preflight sets `margin: 0` on `dialog`, so a modal sits in the top-left corner until
  it gets `margin: auto` back.
- The display face needs its optical-size axis. An instance without it sets large type about 22%
  wider than Google Fonts does, and the hero headline clips (`src/assets/fonts/README.md`).
