# CLAUDE.md

## What this is

Personal website and portfolio for **Shanahan Suresh** (software engineer; BSc Computer Science
with AI, University of Nottingham), static, at `shanahansuresh.com`. The audience is everyone
(clients, recruiters, colleagues, friends, strangers), so it reads as a personal site, not a resume.

## Stack

- **Astro 7**, `output: 'static'`, builds to `./dist`. MDX posts, sitemap, RSS.
- **Tailwind CSS 4**, config-less (`@tailwindcss/vite`). There is no `tailwind.config.js`: the theme
  lives in `src/styles/` (`tokens.css`, `components.css`, `motion.css`, `prose.css`, aggregated by
  `global.css`). Each section's own layout lives in its component's scoped `<style>`.
- Self-hosted fonts: a condensed Bricolage Grotesque cut in `src/assets/fonts/` (its README records
  how it was made), plus Archivo Variable and DM Mono via `@fontsource`.
- Import aliases: `@/*` maps to `src/`.

## Commands

```bash
npm run dev          # http://localhost:4321
npm run build        # astro check + placeholder guard + static build + CSP hashes
npm run guard        # placeholder guard alone
npm run preview      # detaches in an agent shell; stop with `npx astro preview stop`
npm run format       # Prettier (run before committing); format:check verifies
npm test             # Playwright suite in tests/; builds, starts and stops its own preview
```

**Verification = `npm run build` then `npm test`.** Type errors fail the build.

## Where content lives

- **Structured, repeated data** is in `src/data/` (`projects`, `learning`, `interests`,
  `navigation`, `colophon`, `budgets`) and `src/lib/site-config.ts` (name, url, job title, default meta
  description, social URLs). Edit the data, not the components that render it. Shared types are in
  `src/lib/types.ts`; import them instead of redeclaring unions.
- **Prose copy lives in its component**: Hero, About, Principles, Now, Beyond and Contact. Per-page
  meta descriptions live in `index.astro` and `writing/index.astro`. To change wording, edit the
  component.
- Image provenance and licensing rules are in `src/assets/README.md`. Licensed third-party images
  and the owner's portrait and captures keep their own terms; the code's MIT licence does not cover
  them. Visitor captions describe each creation's purpose and workflow, not capture fixtures or
  harness details. Both mascots stay off pages. `design-previews/` is not part of the site; only
  `neo-2026/` (the redesign spec) is tracked.
- Data files use Prettier's double quotes. An unescaped apostrophe inside a hand-written
  single-quoted literal breaks the build; escape it or run `npm run format`.
- The icons (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`) and the share image come from
  `python scripts/brand-images.py` (needs `Pillow` and `playwright`). Edit the
  script and rerun it; never edit those files in `public/` by hand. The icon's S is read from
  `Nav.astro`, so a change to the nav's S reaches the icons on the next run.

## Design system

The poster redesign is in progress: `ROADMAP.md` holds its settled decisions, phases and status, and
the spec is `design-previews/neo-2026/10-poster-v3.html`. Before any redesign or restyle, read
`docs/design-direction.md` (the owner's taste and verdicts, what reads as generic, mockup tools and
capture traps). Every colour is a CSS custom-property token; use tokens only.

- **Themes:** `.dark` on `<html>` swaps tokens. Text on a slab is fixed per slab class (`.s-tomato`,
  `.s-cobalt` and the rest) and never inverts. Only `--paper`, `--card`, `--text`, `--muted` and
  `--edge` invert.
- **Two stroke tokens:** `--ink` stays near-black in both themes, for seams, borders and shadows on
  slabs. `--edge` inverts with the page, for borders and shadows on paper and card surfaces.
- **`@property` is global:** a registered custom property applies on every element, so give it a
  name no component uses for anything else (`--shadow-off`, `--mark`, `--ring-r`).
- **Shadows:** use the `--hard-3` to `--hard-10` offsets and add the colour:
  `box-shadow: var(--hard-4) var(--ink)`. Hard shadows go on frames, cards and buttons only.
- **Butter as text** reads only on night or ink fills. On light surfaces butter is a fill under ink
  text. `.row-link` is the shared butter hover and focus for rows that are one link.
- **Focus:** one `:focus-visible` ring in `var(--focus)`; each slab class sets `--focus` to a colour
  that shows on it.
- **Hover grammar:** hover lifts into the hard shadow, press sinks; a butter or night fill means
  "this is one link". Every hover state also shows on `:focus-visible`.
- **Motion:** every motion waits for `prefers-reduced-motion: no-preference`; hover-only effects
  wait for `(hover: hover)`. Banned: tilt hover, magnetic buttons, stickers, idle loops, count-up
  numbers, marquee. Two owner-approved exceptions: the hero label flip (moves only when pushed, like
  a real sign) and the blinking cursor on the About code chip. Every motion, hover find, the theme
  switch, stories and phone behaviour are catalogued in `docs/interactions.md`.

## Writing conventions (the copy has a deliberate voice, keep it)

- **Human and confident, not corporate or resume-like.** Lead with the person; support with the
  engineer.
- **No em dashes (`—`) in prose.** A hard rule the owner cares about (it reads as AI-written). Use
  periods, commas or parentheses. Allowed only in page `<title>` separators and code comments.
- **Avoid AI tells:** "not X, it's Y" antithesis, explainer colons ("In plain terms:"), hedge words
  (genuinely/actually/just/a little), and decorative rule-of-three triads.
- **Positioning:** emphasize the UK / University of Nottingham education; do **not** foreground the
  Kuala Lumpur location (deliberately omitted). Don't undersell real work with self-deprecation.

## Placeholder guard

`scripts/guard-placeholders.mjs` runs inside `npm run build` and fails while any `_placeholder-` file
exists under `src/` or is referenced from it, so placeholder art cannot deploy. No placeholder is in
use. While one is, local builds and tests need `ALLOW_PLACEHOLDERS=1`.

- The guard is a substring match that also hits comments, so never write the literal marker under
  `src/` except in the import that uses the file.
- SiteMedic is not on the site yet (still in testing). `/writing` is parked (noindex, no nav); the
  dev.to MCP article is linked from /colophon and the OpenAPI to MCP story instead.

## Security posture (keep it this way)

- Static site, no secrets in the repo or its history, no forms, no user content. `SECURITY.md` is the
  public statement; keep it true.
- `public/_headers` is a template: `scripts/csp-hashes.mjs` replaces `__CSP_SCRIPT_HASHES__` with
  sha256 hashes of every inline `<script>` in `dist/*.html`. `script-src` has **no
  `'unsafe-inline'`**; the build fails if it does. A new inline script needs nothing from you; a new
  third-party script origin means editing the CSP in `public/_headers` deliberately.
- CI runs with `permissions: contents: read` and SHA-pinned actions; Dependabot opens weekly PRs.
- Deploys run on Cloudflare Workers Builds: `wrangler.jsonc` serves `dist/` as static assets, with
  no Worker script and no adapter.
- Cloudflare settings this repo cannot enforce: Rocket Loader OFF (breaks the hashed CSP), preview
  builds only from this repo's branches (never forks).

## Settled, do not reopen

- `role="list"` on styled lists is a Safari fix: it keeps list semantics after `list-style` goes.
- The sitemap leaves out `/writing` and `/rss` on purpose (`astro.config.mjs`), because `/writing` is
  parked.
- Breakpoints stay per component. CSS custom properties do not work in media queries.
- Major upgrades (`@astrojs/mdx` 8, `prettier-plugin-astro` 1, TypeScript 7) each get their own pass,
  never a routine dependency update.

## Git

Work on the current branch. Create a branch, commit, push or deploy only when the owner requests it.
