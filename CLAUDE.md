# CLAUDE.md

Guidance for Claude Code agents working in this repo. Read this first.

## What this is

Personal website + portfolio for **Shanahan Suresh** (software engineer; BSc Computer Science
with AI, University of Nottingham). Single static site, deployed at `shanahansuresh.dev`.
Audience is _everyone_ — clients, recruiters, colleagues, friends, strangers — so it reads as a
personal site, not a resume.

## Stack

- **Astro 5**, `output: 'static'` (see `astro.config.mjs`). Builds to `./dist`.
- **Tailwind CSS 4**, config-less, wired via `@tailwindcss/vite`. There is **no `tailwind.config.js`** —
  the entire theme (design tokens + component classes) lives in `src/styles/`, split into `tokens.css`,
  `components.css`, `motion.css`, and `prose.css`, all imported by `global.css`.
- **MDX** for posts (`@astrojs/mdx`), plus `@astrojs/sitemap` and `@astrojs/rss`.
- Self-hosted fonts via `@fontsource` (Anton, Archivo Variable, DM Mono).

## Commands

```bash
npm install
npm run dev          # dev server → http://localhost:4321
npm run build        # astro check + static build → ./dist (verify changes compile)
npm run preview      # preview the production build
npm run check        # type-check only (astro check)
npm run format       # format everything with Prettier
npm run format:check # verify formatting (CI-style, no writes)
npm test             # Playwright e2e/visual suite (tests/home.spec.ts)
```

**Verification = `npm run build` then `npm test`.** `npm run build` runs `astro check` first (so type
errors fail the build), then the static build, which also catches broken Astro/MDX. `npm test` runs the
Playwright e2e/visual suite in `tests/home.spec.ts` (Chromium/Firefox/WebKit; it builds + previews the
site). Formatting is enforced by Prettier (`prettier-plugin-astro`); run `npm run format` before committing.

## Where things live

```
src/
├── components/   # UI + prose copy (see split below)
├── content/posts/# blog posts as .md/.mdx (collection defined in content.config.ts)
├── data/         # structured, repeated content (projects, skills, interests, navigation)
├── layouts/      # BaseLayout.astro (wraps pages), PostLayout.astro (wraps posts)
├── lib/          # posts.ts (post helpers), site-config.ts (identity/meta), types.ts (shared types)
├── pages/        # routes: index.astro (homepage), writing/, rss.xml.ts
├── scripts/      # home-interactions.ts — bundled client JS extracted from BaseLayout
└── styles/       # global.css aggregator + tokens/components/motion/prose partials
public/           # favicon, og-image, robots.txt
design-previews/  # throwaway design mockups — NOT part of the site (gitignored)
```

### Where content lives: structured data vs prose copy

The split is deliberate:

- **Structured / repeated data lives in `src/data/` and `src/lib/site-config.ts`.** Edit these to
  change the data, not the components that render them:
  - `data/projects.ts` — the `categories` array (personal / product / academic) consumed by `Work.astro`.
  - `data/skills.ts` — `mainTools`, `learning` (used by `Now.astro`) and `marqueeTools` (used by `Marquee.astro`).
  - `data/interests.ts` — the `Beyond.astro` sticker list.
  - `data/navigation.ts` — `navLinks` (nav) and `socialLinks` (re-exported from site-config; used by `Contact.astro`).
  - `lib/site-config.ts` — `site` object: name, url, jobTitle, default meta description, social URLs. Consumed by `BaseHead.astro`, `Nav.astro`, `Footer.astro`.
  - `lib/types.ts` — shared `Accent`, `Project` types. Import these instead of redeclaring unions.
- **Prose copy still lives in its component.** Hero paragraphs, About, Principles, the `Now` narrative,
  the `Beyond` narrative, and `Contact` copy are hardcoded in `Hero.astro`, `About.astro`,
  `Principles.astro`, `Now.astro`, `Beyond.astro`, `Contact.astro`. Per-page meta descriptions live in
  `index.astro` / `writing/index.astro`. To change wording, edit the component.

Use `@/*` import aliases (`@/data/...`, `@/lib/...`) — the alias maps to `src/`.

## Design system / theming

`src/styles/` is the single source of truth (`global.css` imports the tokens/components/motion/prose partials). It's a neobrutalist look: thick borders,
hard offset shadows, oversized display type. Colors come from CSS custom-property tokens.

- Light/dark themes are token swaps under `:root` and `.dark`. The brutalist structure **inverts**:
  `--ink` (text/borders/shadows) flips from near-black in light to cream in dark, and `--paper`
  flips the other way. When styling, prefer tokens (`--ink`, `--paper`, `--surface`, `--accent-1/2/pop`,
  `--on-*`) so both themes stay correct.
- Gotcha (already fixed, but illustrative): any element whose `background` is `var(--ink)` becomes
  _light_ in dark mode. The marquee relied on that and broke, so it has a `.dark .marquee` override
  to stay dark. Watch for the same trap when adding ink-backed bands.
- Accent `--accent-pop` is an acid yellow; it's only legible as **text on dark/ink fills** (e.g.
  `.tx-pop`). Don't put it as text on light surfaces.

## Writing conventions (the copy has a deliberate voice — keep it)

- **Human and confident, not corporate or resume-like.** Lead with the person; support with the engineer.
- **No em-dashes (`—`) in prose.** This is a hard rule the owner cares about (it reads as AI-written).
  Use periods, commas, or parentheses instead. Em-dashes are only acceptable in page `<title>`
  separators and code comments.
- **Avoid AI tells:** "not X, it's Y" antithesis, explainer colons ("In plain terms:"), hedge words
  (genuinely/actually/just/a little), and decorative rule-of-three triads.
- **Positioning:** emphasize the UK / University of Nottingham education; do **not** foreground the
  Kuala Lumpur location (deliberately omitted). Don't undersell real work with self-deprecation.

## String quotes in data files

Project descriptions and other copy now live in `src/data/*.ts`. Prettier normalizes strings to
**double quotes**, so apostrophes no longer need escaping (`"don't"`, `"team's"` are fine). If you
hand-write a _single_-quoted literal with an apostrophe, escape it (`'don\'t'`) or just let
`npm run format` convert it — an unescaped apostrophe in a single-quoted literal breaks the build.

## Git / deployment

- The neobrutalism design is committed on `main` (the `Neobrutalism redesign…` commit). The previous
  glassmorphism design is preserved in history as the `Pre-redesign snapshot` commit.
- Static `./dist` deploys to any static host.
