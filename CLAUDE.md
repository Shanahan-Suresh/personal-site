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
- Self-hosted fonts via `@fontsource` (Anton, Archivo Variable, DM Mono).

## Commands

```bash
npm install
npm run dev          # dev server → http://localhost:4321
npm run build        # astro check + placeholder guard + static build + CSP hashes → ./dist
npm run guard        # placeholder guard on its own (see "Placeholder images")
npm run preview      # preview the production build
npm run check        # type-check only (astro check)
npm run format       # format everything with Prettier
npm run format:check # verify formatting (CI-style, no writes)
npm test             # Playwright e2e/visual suite (tests/)
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
design-previews/  # design mockups, NOT part of the site; only neo-2026/ (the redesign spec) is tracked
```

### Where content lives: structured data vs prose copy

The split is deliberate:

- **Structured / repeated data lives in `src/data/` and `src/lib/site-config.ts`.** Edit these to
  change the data, not the components that render them:
  - `data/projects.ts` — the `categories` array (personal / product / academic) consumed by `Work.astro`.
  - `data/skills.ts` — `learning` (used by `Now.astro`) and `marqueeTools` (used by `Marquee.astro`).
  - `data/interests.ts` — the `Beyond.astro` photographs, captions, crop settings and photographer credits.
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

The poster redesign is in progress: `ROADMAP.md` holds its settled decisions, phases and status.
Before any redesign or restyle, read `docs/design-direction.md`: the owner's taste and verdicts on
ten tried directions, what polished neobrutalism means, why the live design reads as generic, and
the mockup tools and capture traps.

- Light/dark themes are token swaps under `:root` and `.dark`. The brutalist structure **inverts**:
  `--ink` (text/borders/shadows) flips from near-black in light to cream in dark, and `--paper`
  flips the other way. When styling, prefer tokens (`--ink`, `--paper`, `--surface`, `--accent-1/2/pop`,
  `--on-*`) so both themes stay correct.
- Gotcha: any element whose `background` is `var(--ink)` becomes _light_ in dark mode. The marquee
  has a `.dark .marquee` override to stay dark for this reason; an ink-backed band needs the same.
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

Project descriptions and other copy live in `src/data/*.ts`. Prettier normalizes strings to
**double quotes**, so apostrophes need no escaping (`"don't"`, `"team's"` are fine). If you
hand-write a _single_-quoted literal with an apostrophe, escape it (`'don\'t'`) or just let
`npm run format` convert it — an unescaped apostrophe in a single-quoted literal breaks the build.

## Homepage media

`Project.featured` is a boolean controlling card width. Independent optional `Project.media`
contains the image, alt text, caption, fit and optional aspect ratio. `MediaFrame.astro` emits
responsive WebP with reserved dimensions and lazy loading, optional crop position and linked
credit metadata. The hero photograph loads eagerly. Project captures default to `contain`; taller
RSVP/HR previews reserve their native proportions. Hero and interest photographs use deliberate
`cover` crops. Portrait RGB matches the existing retouch, with a generated background mask, cream
outline, soft neutral shadow and static warm-grey CSS background. Both mascots stay off pages.

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

## Placeholder images

The featured cards for the AI digest and RSVP projects use `src/assets/work/_placeholder-*.svg`. `scripts/guard-placeholders.mjs` runs inside `npm run build` and fails while any `_placeholder-` file exists or is referenced under `src/`, so Cloudflare cannot deploy them and CI is red by design. The owner's rule: placeholders must never deploy by accident.

- Local builds and tests need `ALLOW_PLACEHOLDERS=1`.
- The guard is a substring match that also hits comments, so never write the literal marker under `src/` except in the import.
- SiteMedic is not on the site yet (still in testing). `/writing` is parked (noindex, no nav); the dev.to MCP article is linked from /colophon and the OpenAPI card instead.

Swap procedure when real screenshots arrive: drop the image into `src/assets/work/`, change the import in `src/data/projects.ts`, delete the `_placeholder-` file, run `npm run build` with no override, push.

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
