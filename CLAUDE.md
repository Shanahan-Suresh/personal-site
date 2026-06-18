# CLAUDE.md

Guidance for Claude Code agents working in this repo. Read this first.

## What this is

Personal website + portfolio for **Shanahan Suresh** (software engineer; BSc Computer Science
with AI, University of Nottingham). Single static site, deployed at `shanahansuresh.dev`.
Audience is *everyone* — clients, recruiters, colleagues, friends, strangers — so it reads as a
personal site, not a resume.

## Stack

- **Astro 5**, `output: 'static'` (see `astro.config.mjs`). Builds to `./dist`.
- **Tailwind CSS 4**, config-less, wired via `@tailwindcss/vite`. There is **no `tailwind.config.js`** —
  the entire theme (design tokens + component classes) lives in `src/styles/global.css`.
- **MDX** for posts (`@astrojs/mdx`), plus `@astrojs/sitemap` and `@astrojs/rss`.
- Self-hosted fonts via `@fontsource` (Anton, Archivo Variable, DM Mono).

## Commands

```bash
npm install
npm run dev      # dev server → http://localhost:4321
npm run build    # static build → ./dist  (run this to verify changes compile)
npm run preview  # preview the production build
```

There are no tests. **`npm run build` is the verification step** — it catches broken Astro/MDX and,
importantly, unescaped apostrophes in JS string literals (see Work.astro note below).

## Where things live

```
src/
├── components/   # all UI + ALL user-facing copy (see below)
├── content/posts/# blog posts as .md/.mdx (collection defined in content.config.ts)
├── layouts/      # BaseLayout.astro (wraps pages), PostLayout.astro (wraps posts)
├── lib/posts.ts  # post sorting/formatting helpers
├── pages/        # routes: index.astro (homepage), writing/, rss.xml.ts
└── styles/global.css  # design tokens + every component class
public/           # favicon, og-image, robots.txt
design-previews/  # throwaway design mockups — NOT part of the site (gitignored)
```

### Copy lives in components, not data files
There is **no central content/JSON/YAML file for site copy**. Each section's text is hardcoded
inside its component: `Hero.astro`, `About.astro`, `Principles.astro`, `Now.astro`, `Work.astro`
(project descriptions are JS arrays at the top of the file), `Beyond.astro`, `Contact.astro`.
Meta descriptions live in `BaseHead.astro` (default) and per-page in `index.astro` /
`writing/index.astro`. To change wording, edit the relevant component directly.

## Design system / theming

`src/styles/global.css` is the single source of truth. It's a neobrutalist look: thick borders,
hard offset shadows, oversized display type. Colors come from CSS custom-property tokens.

- Light/dark themes are token swaps under `:root` and `.dark`. The brutalist structure **inverts**:
  `--ink` (text/borders/shadows) flips from near-black in light to cream in dark, and `--paper`
  flips the other way. When styling, prefer tokens (`--ink`, `--paper`, `--surface`, `--accent-1/2/pop`,
  `--on-*`) so both themes stay correct.
- Gotcha (already fixed, but illustrative): any element whose `background` is `var(--ink)` becomes
  *light* in dark mode. The marquee relied on that and broke, so it has a `.dark .marquee` override
  to stay dark. Watch for the same trap when adding ink-backed bands.
- Accent `--accent-pop` is an acid yellow; it's only legible as **text on dark/ink fills** (e.g.
  `.tx-pop`). Don't put it as text on light surfaces.

## Writing conventions (the copy has a deliberate voice — keep it)

- **Human and confident, not corporate or resume-like.** Lead with the person; support with the engineer.
- **No em-dashes (` — `) in prose.** This is a hard rule the owner cares about (it reads as AI-written).
  Use periods, commas, or parentheses instead. Em-dashes are only acceptable in page `<title>`
  separators and code comments.
- **Avoid AI tells:** "not X, it's Y" antithesis, explainer colons ("In plain terms:"), hedge words
  (genuinely/actually/just/a little), and decorative rule-of-three triads.
- **Positioning:** emphasize the UK / University of Nottingham education; do **not** foreground the
  Kuala Lumpur location (deliberately omitted). Don't undersell real work with self-deprecation.

## Work.astro gotcha

Project descriptions are single-quoted JS string literals. Apostrophes must be escaped: `don\'t`,
`team\'s`, `It\'s`, `API\'s`. An unescaped one breaks the build.

## Git / deployment

- Active redesign work happens on branch `redesign/neobrutalism`. `main` holds the previous
  glassmorphism design (preserved as the `Pre-redesign snapshot` commit).
- Static `./dist` deploys to any static host.
