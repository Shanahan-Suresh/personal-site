# CLAUDE.md

Guidance for Claude Code agents working in this repo. Read this first.

## What this is

Personal website + portfolio for **Shanahan Suresh** (software engineer; BSc Computer Science
with AI, University of Nottingham). Single static site, deployed at `shanahansuresh.com`.
Audience is _everyone_ — clients, recruiters, colleagues, friends, strangers — so it reads as a
personal site, not a resume.

## Stack

- **Astro 7**, `output: 'static'` (see `astro.config.mjs`). Builds to `./dist`.
- **Tailwind CSS 4**, config-less, wired via `@tailwindcss/vite`. There is **no `tailwind.config.js`** —
  the entire theme (design tokens + component classes) lives in `src/styles/`, split into `tokens.css`,
  `components.css`, `motion.css`, and `prose.css`, all imported by `global.css`.
- **MDX** for posts (`@astrojs/mdx`), plus `@astrojs/sitemap` and `@astrojs/rss`.
- Self-hosted fonts: a condensed cut of Bricolage Grotesque in `src/assets/fonts/` (its README records how it
  was made), plus Archivo Variable and DM Mono via `@fontsource`.

## Commands

```bash
npm install
npm run dev          # dev server → http://localhost:4321
npm run build        # astro check + placeholder guard + static build + CSP hashes → ./dist
npm run guard        # placeholder guard on its own (see "Placeholder guard")
npm run preview      # preview the production build (detaches in an agent shell; `npx astro preview stop`)
npm run check        # type-check only (astro check)
npm run format       # format everything with Prettier
npm run format:check # verify formatting (CI-style, no writes)
npm test             # Playwright e2e/visual suite (tests/); starts and stops its own preview server
```

**Verification = `npm run build` then `npm test`.** `npm run build` runs `astro check` first (so type
errors fail the build), then the static build, which also catches broken Astro/MDX. `npm test` runs the
Playwright e2e/visual suite in `tests/` (Chromium/Firefox/WebKit; it builds + previews the
site). Formatting is enforced by Prettier (`prettier-plugin-astro`); run `npm run format` before committing.

## Where things live

```
src/
├── assets/       # project captures, portrait, licensed photography and media provenance
├── components/   # UI + prose copy (see split below)
├── content/posts/# blog posts as .md/.mdx (collection defined in content.config.ts)
├── data/         # structured, repeated content (projects, skills, interests, navigation)
├── layouts/      # BaseLayout.astro (wraps pages), PostLayout.astro (wraps posts)
├── lib/          # posts.ts (post helpers), site-config.ts (identity/meta), types.ts (shared types)
├── pages/        # routes: index.astro (homepage), writing/, rss.xml.ts
├── scripts/      # home-interactions.ts — bundled client JS extracted from BaseLayout
└── styles/       # global.css aggregator + tokens/components/motion/prose partials
public/           # favicon, og-image, robots.txt
scripts/          # build steps (placeholder guard, CSP hashes) and brand-images.py
design-previews/  # design mockups, NOT part of the site; only neo-2026/ (the redesign spec) is tracked
```

### Where content lives: structured data vs prose copy

The split is deliberate:

- **Structured / repeated data lives in `src/data/` and `src/lib/site-config.ts`.** Edit these to
  change the data, not the components that render them:
  - `data/projects.ts` — `categories` (personal / corporate / academic, each project's group label) and
    `projects`, the ordered list that `Work.astro`, `Hero.astro` and `Numbers.astro` render.
  - `data/skills.ts` — `learning`, the boxed list in `Now.astro`.
  - `data/interests.ts` — the `Beyond.astro` photographs, captions, crop settings and photographer credits.
  - `data/navigation.ts` — `navLinks` (nav) and `socialLinks` (re-exported from site-config; used by `Contact.astro`).
  - `lib/site-config.ts` — `site` object: name, url, jobTitle, default meta description, social URLs. Consumed by `BaseHead.astro`, `Nav.astro`, `Footer.astro`.
  - `lib/types.ts` — shared `Project` and media types. Import these instead of redeclaring unions.
- **Prose copy still lives in its component.** Hero paragraphs, About, Principles, the `Now` narrative,
  the `Beyond` narrative, and `Contact` copy are hardcoded in `Hero.astro`, `About.astro`,
  `Principles.astro`, `Now.astro`, `Beyond.astro`, `Contact.astro`. Per-page meta descriptions live in
  `index.astro` / `writing/index.astro`. To change wording, edit the component.

Use `@/*` import aliases (`@/data/...`, `@/lib/...`) — the alias maps to `src/`.

## Design system / theming

`src/styles/` holds the shared layer (`global.css` imports the tokens, components, motion and prose
partials); each section's own layout lives in its component's scoped `<style>`. Every colour is a
CSS custom-property token.

The poster redesign is in progress: `ROADMAP.md` holds its settled decisions, phases and status.
Before any redesign or restyle, read `docs/design-direction.md`: the owner's taste and verdicts on
ten tried directions, what polished neobrutalism means, what reads as generic, and the mockup
tools and capture traps.

- **The look:** full-width colour slabs (tomato, butter, cobalt, green, night, paper) joined by
  3px ink seams, condensed uppercase display type, and hard offset shadows on frames, cards and
  buttons only. The spec is `design-previews/neo-2026/10-poster-v3.html`.
- **Themes:** the `.dark` class on `<html>` swaps tokens in `tokens.css`. Slab colours deepen a
  little, but text on a slab is fixed per slab class (`.s-tomato`, `.s-cobalt` and the rest) and
  never inverts. Only `--paper`, `--card`, `--text`, `--muted` and `--edge` invert.
- **Two stroke tokens:** `--ink` stays near-black in both themes, for seams, borders and shadows on
  slabs. `--edge` inverts with the page, for borders and shadows on paper and card surfaces.
- **Butter as text** reads only on night or ink fills (the contact headline, the active mobile
  link). On light surfaces butter is a fill under ink text.
- **Focus:** one `:focus-visible` ring in `var(--focus)`. Each slab class sets `--focus` to a colour
  that shows on it.
- **Motion:** four moves only: headline lines rising (`.reveal` with `.ln` lines), the hero frames
  fading up (`.rise`), the pointer preview on project rows, and the story dialog opening. All wait
  for `prefers-reduced-motion: no-preference`. The boot script in `BaseLayout.astro` sets `.js`
  before paint, so a page without script shows everything in place.
- **Favicon and share image:** `python scripts/brand-images.py` writes `public/favicon.svg`,
  `og-image.svg` and `og-image.jpg` from the poster tokens and the display font. Edit the script,
  then rerun it, rather than editing the files by hand.

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

Project descriptions and other copy live in `src/data/*.ts`. Prettier normalizes strings to
**double quotes**, so apostrophes need no escaping (`"don't"`, `"team's"` are fine). If you
hand-write a _single_-quoted literal with an apostrophe, escape it (`'don\'t'`) or just let
`npm run format` convert it — an unescaped apostrophe in a single-quoted literal breaks the build.

## Homepage media

`Project.media` holds the image, alt text, caption, fit and optional aspect ratio.
`MediaFrame.astro` wraps an image in the ink `.frame` with a mono caption and emits responsive WebP
with reserved dimensions, lazy loading, optional crop position and linked credit metadata. The hero
portrait (the cutout on a butter ground) loads first with `priority`. Each project row carries a
480px WebP in `data-peek` that the pointer preview loads on first hover, and an inline thumbnail
that shows below 960px. Story dialog images load only when their dialog opens. Interest photographs
are square `cover` crops placed by each one's `objectPosition`. Both mascots stay off pages.

Final assets and their provenance live in `src/assets/`. Capture harnesses live under gitignored
`design-previews/media`, excluded from Astro type-checking. Preserve source-project repositories.
Visitor captions describe each creation's purpose and workflow. Keep capture fixtures, isolated
harness details and presentation changes in the asset documentation rather than homepage copy.
Licensed Unsplash originals and retained museum sources keep their own terms; do not apply the
code's MIT licence to third-party images or the owner's portrait and project captures.

`scripts/guard-placeholders.mjs` runs before `astro build` and fails if any `_placeholder-` file
exists under `src/` or is referenced from it. Normal builds and tests require no override.
`tests/media.spec.ts` checks image loading, dimensions and overflow at 390, 600 and 1440px, with
cold-load budgets of 350 KiB initially and 1.5 MiB after scrolling through the homepage.

## Placeholder guard

`scripts/guard-placeholders.mjs` runs inside `npm run build` and fails while any `_placeholder-`
file exists under `src/` or is referenced from it, so placeholder art can never deploy by accident.
No placeholder is in use. While one is, local builds and tests need `ALLOW_PLACEHOLDERS=1`.

- The guard is a substring match that also hits comments, so never write the literal marker under
  `src/` except in the import that uses the file.
- SiteMedic is not on the site yet (still in testing). `/writing` is parked (noindex, no nav); the
  dev.to MCP article is linked from /colophon and the OpenAPI to MCP story instead.

## Security posture (keep it this way)

- Static site, no secrets in the repo or its history, no forms, no user content. `SECURITY.md` is the
  public statement; keep it true.
- `public/_headers` is a template: `scripts/csp-hashes.mjs` runs at the end of `npm run build` and
  replaces `__CSP_SCRIPT_HASHES__` with sha256 hashes of every inline `<script>` in `dist/*.html`.
  `script-src` has **no `'unsafe-inline'`**; the build fails if it ever does. Adding a new inline
  script needs nothing from you (it gets hashed); adding a new third-party script origin means
  editing the CSP in `public/_headers` deliberately.
- CI runs with `permissions: contents: read` and SHA-pinned actions. Dependabot (`.github/dependabot.yml`)
  opens weekly PRs for npm and actions. Repo settings: secret scanning + push protection, Dependabot
  alerts and security updates, private vulnerability reporting, branch `main` protected from
  force-push and deletion.
- Cloudflare dashboard settings this repo cannot enforce: Rocket Loader OFF (breaks the hashed CSP),
  Pages preview builds only from this repo's branches (never from forks).

## Git / deployment

- Work on the current branch. Create a branch, commit, push or deploy only when the owner requests it.
- Static `./dist` deploys to any static host.
