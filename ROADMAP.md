# Roadmap: the poster redesign

The site moves to the **Poster** direction: flat colour slabs held by 3px ink seams, giant condensed
type, and the owner's real work and face on the first screen. The owner chose it as "the next
evolution of the current site". Why this direction won, and what the owner rejected, is in
`docs/design-direction.md`.

## The spec

- **Visual spec:** `design-previews/neo-2026/10-poster-v3.html`. It is a working page: open it in a
  browser and try the hover preview, the story dialog, both themes and a phone width.
  `10-poster-v2.html` is the same design with the HR screenshot in the hero instead of the portrait.
- **Content:** `src/data/` and the component copy stay the source of truth. The mockup's
  `data.js` is a hand copy of them and is not ported.
- **Rules that the spec does not override:** the copy rules in `CLAUDE.md` (no em dashes, no AI
  tells, Kuala Lumpur not foregrounded), the hashed CSP in `public/_headers`, the image provenance
  rules in `src/assets/README.md`, and the transfer budgets in `tests/`.

When the code and the spec disagree on a visual detail, the spec wins. When the spec has a defect
(contrast, overflow, a broken line), fix it in the code and in the spec file, so they stay equal.

## Settled decisions

1. **Palette.** Six slab colours plus paper and card, light and dark, taken from the spec's `:root`
   and dark blocks. The six old accents (`--accent-1/2/pop` and the rest) go.
   - Light: sky `#8ec5ff`, tomato `#ff6a45`, butter `#ffd24a`, cobalt `#3d52ea`, green `#0c7a4d`,
     night `#15120e`, paper `#f5f0e4`, card `#fffdf7`.
   - Dark: sky `#6aa6e8`, tomato `#e9583a`, butter `#eec23d`, cobalt `#3346dc`, green `#0a6c44`,
     night `#0a0907`, paper `#14120f`, card `#1f1c17`, text `#f3eee3`.
   - Slab text colour is fixed per slab (ink on sky, tomato and butter, white on cobalt, green
     and night) and does not invert with the theme. Only paper, card, text and edge invert.
2. **Theme switch.** Keep the existing mechanism: the `.dark` class on `<html>`, the `theme` key in
   `localStorage` and the inline boot script in `BaseLayout.astro`. The spec's
   `[data-theme="dark"]` and `prefers-color-scheme` blocks become one `.dark` block, because the
   boot script already applies the system preference.
3. **Type.** Bricolage Grotesque (weight 800, width 75%) for display, Archivo for body (already
   installed), DM Mono for labels (already installed). Anton goes. The CSP has `font-src 'self'`,
   so every face is self-hosted. Use `@fontsource-variable/bricolage-grotesque` if its files carry
   the `wdth` axis. If they do not, subset Google's variable font with `fonttools` into one
   latin woff2 file in `src/assets/fonts/` and record its source and licence (OFL) there.
4. **Hero.** The headline, the lead card with two buttons, and a picture stack: the portrait
   (`portrait-cutout-v4.png` on a cream ground) with the RSVP capture overlapping its lower right
   corner. The copper-coil photograph leaves the site with its provenance entry.
5. **Homepage order.** Nav, hero (sky), numbers strip (cobalt), work (green), the short
   version (cobalt), rules I build by (paper), what I'm into lately (butter), off hours (photo strip),
   contact (night), footer. The marquee goes. `Now` merges into "What I'm into lately".
6. **Projects.** One ordered list of seven rows: RSVP, HR, OHSE, Tech Scout Digest, OpenAPI to
   MCP, artwork censoring, HeatGen. Each row shows index, group, title, one fact, a one-line
   summary and a Story button.
   - Add `id`, `summary` and `fact: { value, label }` to `Project` in `src/lib/types.ts`, and
     fill them in `src/data/projects.ts`. The facts are those in the spec's rows.
   - The `categories` grouping stays only as each project's group label.
7. **Story dialogs, with no JavaScript needed to read them.** Each project's full story is
   rendered at build time inside `<dialog id="story-<id>">`. Each row is a link to `#story-<id>`.
   Script turns the click into `showModal()`, adds the Next button and returns focus to the row
   on close. Without script, `dialog:target` shows the story in the page.
8. **Hover preview.** On a fine pointer above 960px, a preview in each picture's own shape (30%
   of the window wide, 380 to 460px) follows the pointer and the row turns butter. The preview
   images are small WebP files made with `getImage` (480px wide, 960px on dense screens) and load
   on the first hover, not with the page. Below 960px each row shows its
   screenshot inline instead.
9. **Mobile nav.** The spec hides the nav links below 560px. The site keeps its menu button and
   sheet (the tests cover it), restyled as a night slab.
10. **Photo credits.** The off-hours strip shows no photographer credits. Each one stays in
    `src/data/interests.ts` with its source page, as a record.
11. **Motion.** Headline lines rising on scroll, the hero frames fading up, the
    pointer preview, the dialog opening and sliding between stories, the theme switch (circle from the button, cross-fade on touch), the phone story sheet, nav bar and menu sheet, lazy
    pictures fading in, and the hover finds in `docs/interactions.md`. Each respects reduced motion. Stickers, magnetic buttons, tilt,
    scroll-velocity skew, idle loops, count-up numbers and the marquee stay off the site. The
    owner approved two exceptions: the hero label's flip when pushed, and the blinking cursor on
    the About code chip (both in `CLAUDE.md` and `docs/interactions.md`).
12. **New copy.** Only short labels and headings are new: "Things I've built", "The short version",
    "I build by", "What I'm into lately", "Learning next", "Story", "Let's build.". All other
    words stay as they are.

## Phases

Each phase ends with the fast checks (below) and one commit. Status: phases 1 to 10 are done. The branch is on GitHub (`origin/redesign/poster`); it is not merged to `main` or deployed, and that waits for the owner's word.

### 1. Foundation: tokens, type and base styles

- Replace `src/styles/tokens.css` with the poster palette (decision 1) and the `.dark` block
  (decision 2). Keep token names short and by role: `--paper`, `--card`, `--text`, `--edge`,
  `--ink`, and one token per slab colour.
- Add the fonts (decision 3). Preload Bricolage and Archivo in `BaseLayout.astro`, drop Anton and
  its preload, and remove `@fontsource/anton` from `package.json`.
- Port the base rules from the spec: body type, the `h1-h3` display style, `.slab` and the five
  slab classes, `.label`, `.btn` (hover lifts 2px, press sinks 4px and drops the shadow), the
  focus ring, `.wrap` with `--gut`, and `.frame`.
- Done when the current pages build and render in the new fonts and colours. They will look
  broken until phase 3, which is expected.

### 2. Shell: nav, footer and skip link

- `Nav.astro`: night bar, condensed name on the left, links with the butter underline on hover,
  the round theme button, the scroll-spy active state, and the mobile sheet (decision 9).
- `Footer.astro`: the night footer with the colophon, source and build-commit links that the
  tests expect.
- Keep the skip link as the first tab stop.

### 3. Homepage, top half: hero, numbers and work

- Data changes for decision 6.
- `Hero.astro` (decision 4) with the line-reveal headline, `AI tooling.` on a tilted butter label (full ink frame, small hard shadow), a
  non-breaking `full-stack`, and the headline sized to its column (`container-type: inline-size`
  with a `cqi` font size, as in the spec).
- New `Numbers.astro`: four results. Take the values from the project facts so they cannot drift.
- `Work.astro` with a new `ProjectRow.astro` and `ProjectStory.astro` (decisions 7 and 8).
  `MediaFrame.astro` keeps responsive WebP for the inline and dialog images.

### 4. Homepage, bottom half: about, rules, lately, off hours and contact

- `About.astro` as "The short version": the headline in the left column, the title and three
  paragraphs on the right, no portrait (it moved to the hero).
- `Principles.astro` as the three ruled "I build by" columns on paper.
- `Now.astro` folds into a new "What I'm into lately" slab with the learning list as boxed labels.
- `Beyond.astro` as the four-photo strip with captions and credits (decision 10).
- `Contact.astro`: the giant butter "Let's build.", the lead, the email in display type with the
  butter rule, and the LinkedIn and GitHub links.

### 5. Interactions and clean-up

- `src/scripts/home-interactions.ts` holds only the decision 11 moves (done in phase 3, because the
  rows and dialogs need it): reveal, scroll spy, scrolled nav, mobile nav, preview and dialogs.
- Delete the retired components and their CSS: `Marquee`, `BentoTile`, `StatusChip`, the sticker
  and tilt rules, and `marqueeTools` in `src/data/skills.ts`.
- Grep `src/`, `tests/`, `README.md` and `CLAUDE.md` for every removed class, component and
  token name, and remove each reference.

### 6. The other pages: colophon, writing and posts

- `colophon.astro`: a cobalt title slab, then the stack, stats and links as ruled rows instead
  of bento tiles and cards. The live test count stays.
- `writing/index.astro`, `PostCard.astro` and `PostLayout.astro`: a title slab and ruled post rows.
  Restyle `prose.css` for long reading: Archivo at 18px, display face for headings only, mono for
  code. `/writing` stays parked (noindex, out of the nav).
- `Card.astro`, `Tag.astro`, `SectionHeading.astro` and `BentoTile.astro` serve only these pages:
  restyle them to the poster system or delete them if no page still uses them. The `Accent` and
  `StickerAccent` types in `src/lib/types.ts` go with the last of them.

### 7. Assets, metadata and docs

- A new `public/og-image.jpg` and `og-image.svg` in the poster style: the sky slab with the
  headline and the name.
- A new `favicon.svg`: a condensed "S" in butter on night.
- Remove the copper-coil file and its entry in `hero-provenance-v5.json`. Record the new hero
  composition in `src/assets/README.md`.
- Read `CLAUDE.md` and `README.md` once more against the finished site.
- Rewrite the "Current state" section of `docs/design-direction.md`.

### 8. Tests, release check and launch

- Update `tests/home.spec.ts` and `tests/media.spec.ts` to the new structure. Keep what they
  guard: hero headline, nav and theme toggle, mailto link, theme persistence, mobile nav, reduced
  motion, scrolled nav, scroll spy, skip link, footer links, writing noindex, colophon count, no
  placeholders, CSP hashes, transfer budgets and no overflow at 390, 600 and 1440px.
- Add tests for the new behaviour: each row opens its story and Escape returns focus to the row,
  the story is readable without script, and the preview never shows on touch.
- Run the slow gate once: `npm run build` then `npm test` (three browsers).
- Re-measure the colophon numbers from that run: `measuredOn` and the KiB values in
  `src/data/colophon.ts`, and the transfer line in `README.md`, from the media spec's transfer
  attachments.
- Shoot every page at 1440 and 390 in both themes with `design-previews/neo-2026/tools/shot.py`
  against `npm run preview`, and compare the homepage with the spec.
- The owner reviews a preview build. Push and deploy only on the owner's word.

### 9. Polish pass: interaction, images and layout

- Every number in the strip and the hero's RSVP frame open the story behind them
  (`a[data-story]`). Focus returns to the link that opened a story.
- Stories: Previous beside Next, the arrow keys and a sideways swipe. Opening pushes
  `#story-<id>`; Back closes the story. A compact head on phones. Each dialog caption links the
  capture at full size.
- Hover grammar on every control: rows slide their title and turn the index into an arrow, the
  nav underline wipes in, arrows nudge, buttons lift on focus too, photos lean in, a tap fills a
  row. The pointer preview sits above or below its row and keeps that side while it fits (a
  short fade when it must change sides), wipes each decoded picture over the last, loads a
  960px file on screens denser than 1x and carries the capture's caption.
- Phone rows lead with a 16:9 thumbnail with the Story tab on its corner; the OHSE crop anchors
  left. Dark mode dims white captures a step. Lazy pictures fade in.
- The theme switch and a 404 page.

### 10. Phone pass: touch that feels native

- Stories open as a bottom sheet on phones: a grab bar to pull it closed, a slide down on close,
  and Previous and Next pinned in a bar under the thumb.
- The nav bar slides away on a scroll down and returns on a scroll up. The menu sheet drops over
  a dimmed page that holds still, and a tap on the dim closes it.
- Hover lifts wait for a real pointer, so a tapped button does not stay raised. Small links get
  44px hit areas under a coarse pointer. No tap flash, no font boost on rotation, and the gutter
  clears a notch.

## Checks

- **Fast checks, every commit:** `npm run check`, `npm run format:check`, `npm run build`, and one
  `shot.py` capture of the section the commit touched (1440 and 390, light and dark).
- **Slow gate, once in phase 8:** the full `npm test` suite. A phase that changes what a test
  guards updates that test in the same commit, but the suite itself runs in phase 8.

## Risks to watch

- **Transfer budget.** The first screen now loads the portrait, the RSVP capture and three font
  families against the 350 KiB initial budget. Subset the fonts to latin, size the hero images
  with `srcset`, and keep the preview images out of the initial load.
- **The width axis.** The display style depends on Bricolage's 75% width. A font file without the
  `wdth` axis renders the headlines at full width, which overflows. Check that the axis is in the
  file before phase 1 ends.
- **Test coupling.** The current tests select on class names (`.nav-header`, `hero-loaded`,
  `.project-desc`). Expect them to fail from phase 2 until phase 8, and do not chase them earlier.
- **Inline styles.** The CSP allows inline styles, but not inline scripts without a hash. Keep all
  behaviour in the bundled script, never in `onclick` attributes.

## Out of scope

- New content: no new projects, posts or rewritten paragraphs.
- Per-project pages (`/work/<id>`). The story dialogs can become pages later without changing the
  rows.
- Reopening `/writing`.
