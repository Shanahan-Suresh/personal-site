# personal-site

Personal website and portfolio for **Shanahan Suresh** — product-minded software engineer building full-stack products and AI tooling.

Live: [shanahansuresh.com](https://shanahansuresh.com) · [Colophon](https://shanahansuresh.com/colophon) (how it is built, with numbers)

[![CI](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml/badge.svg)](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-3d52ea.svg)](LICENSE)

## Why this repo is public

The site is meant to be its own code sample. Rather than describe how it is built, the source is
here to read: the design-token system in `src/styles/`, the single interaction module in
`src/scripts/`, the Playwright suite that runs against the production build, and the deploy
hardening in `public/_headers`. The footer of every page links to the exact commit it was built
from. The code is MIT. The owner's copy, project descriptions, portrait and project captures are
not licensed for reuse. Third-party photographs retain the Unsplash License; museum images retain
their public-domain or CC0 terms. Sources and licences are recorded in
[`src/assets/README.md`](src/assets/README.md) and `LICENSE`.

> **Design:** Refined neobrutalism as a poster: full-width colour slabs joined by ink seams, condensed display type, hard offset shadows on things you can press or open, light and dark themes.

## Tech stack

- **[Astro 7](https://astro.build/)** — static site generator (`output: 'static'`)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — CSS-first setup via `@tailwindcss/vite` (no `tailwind.config.js`; theme lives in `src/styles/`, split across `tokens.css`/`components.css`/`motion.css`/`prose.css` and aggregated by `global.css`)
- **MDX** (`@astrojs/mdx`) — blog/writing content
- **Sitemap + RSS** (`@astrojs/sitemap`, `@astrojs/rss`)
- Self-hosted fonts: a condensed Bricolage Grotesque cut in `src/assets/fonts/`, plus Archivo and DM Mono via `@fontsource`
- **Prettier** (`prettier-plugin-astro`) and `astro check` for formatting and type-checking
- **[Playwright](https://playwright.dev/)** — end-to-end tests and visual review captures (Chromium, Firefox, WebKit)

## Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or newer (`.nvmrc` pins the 22 release line)
- npm 9.6.5 or newer

## Getting started

```bash
npm install         # install dependencies
npm run dev         # start dev server → http://localhost:4321
npm run build       # type-check + build static site to ./dist
npm run preview     # preview the production build locally
npm run format      # format with Prettier
npm run check       # type-check only (astro check)
npm test            # run the Playwright test suite (see Testing)
```

## Testing

End-to-end tests and visual review captures live in `tests/` and run with [Playwright](https://playwright.dev/).

By default the suite builds the site and serves it with `astro preview` (so tests
exercise the production artifact). If a dev server is already running on port `4321`,
it's reused. First-time setup downloads the browser binaries:

```bash
npx playwright install      # one-time: download Chromium, Firefox, WebKit
npm test                    # run all tests headless across all three browsers
npm run test:ui             # interactive UI mode (watch, time-travel, pick tests)
npm run test:headed         # run with visible browser windows
npm run test:report         # open the last HTML report
```

Useful filters: `npm test -- --project=chromium` (one browser),
`npm test -- tests/home.spec.ts` (one file).

Current coverage (`tests/home.spec.ts`): home-page smoke (hero headline, major
sections, nav + theme toggle presence, contact mailto), theme-toggle dark-class
persistence to localStorage, the 600px mobile layout (nav hidden, hero
single-column), the project stories (paragraph split, the modal with Next and
Escape returning focus to its row, a shared `#story` link, the story view without
JavaScript), reduced-motion static render, the interactions (scrolled nav, scroll
spy, hero entrance), skip link, footer, colophon, writing noindex, placeholders and CSP hashes.
`tests/media.spec.ts` checks loaded images, reserved dimensions, captions, both themes and viewport
overflow at 390, 600 and 1440px. Fresh desktop/mobile contexts enforce 350 KiB initial transfer
and 1.5 MiB after scrolling through the homepage.

The homepage uses 12 images: the portrait, seven project captures and four photographs. Chromium captures full-page screenshots at each review width in both
themes with reduced motion; screenshots are reviewed for crops, legibility, overlaps and CTA visibility.
Cold transfers measured 6 Nov 2026 across all three browsers are 153–194 KiB initially and 208–405 KiB
after scrolling. The colophon reads the test count from Playwright at build time.

## Project structure

```
personal-site/
├── public/              # static assets (favicon, OG image, robots.txt)
├── src/
│   ├── components/      # Astro UI components (Hero, Work, Nav, project rows and stories)
│   ├── assets/          # project captures, portrait, licensed photography and provenance
│   ├── content/         # MDX content (blog posts)
│   ├── data/            # structured content (projects, learning, interests, navigation)
│   ├── layouts/         # BaseLayout + PostLayout
│   ├── lib/             # helpers: posts.ts, site-config.ts, types.ts
│   ├── pages/           # routes — index.astro, writing/, rss.xml.ts
│   ├── scripts/         # home-interactions.ts (bundled client JS for BaseLayout)
│   └── styles/          # global.css aggregator + tokens/components/motion/prose partials
├── scripts/             # build guards, CSP hashing, brand-images.py (favicon and OG image)
├── tests/               # Playwright e2e checks and visual review captures
├── astro.config.mjs     # Astro + integrations + Tailwind (Vite) config
├── playwright.config.ts # Playwright runner + dev-server config
└── package.json
```

## Design system

Shared design tokens and reusable styles live in `src/styles/` (the `global.css` entry point imports `tokens.css`, `components.css`, `motion.css`, and `prose.css`). Components define their layout and media rules locally. Light/dark themes and colour palettes use the shared tokens.

## Homepage media

Project captures, the retouched real headshot and licensed real photography live in `src/assets/`.
[`src/assets/README.md`](src/assets/README.md) records sources, sample-data boundaries and generation
prompts. Astro produces responsive WebP with explicit dimensions. The hero portrait and RSVP capture load
eagerly; other media loads lazily. Story images load only when their dialog opens. Photographer
credits remain accessible HTML links. Project captions describe the product and workflow; capture
fixtures and presentation choices are documented with the assets. The portrait sits on a flat butter
ground in an ink frame. Both mascot poses remain unreferenced assets.

Capture harnesses live under gitignored `design-previews/media` and leave source projects unchanged.
`npm run build` rejects `_placeholder-` files or references through `scripts/guard-placeholders.mjs`.
Normal builds require no override.

Local screenshots and a browser-suite report are saved in
`design-previews/media/profile-copy-v6`, alongside transfer measurements. Photography preparation
scripts and crop reviews live in `design-previews/media/free-use-v5`. These ignored files support
local review; asset sources, licences and generation notes are versioned under `src/assets/`.

## Security

Static output, no secrets, no forms. `public/_headers` ships a CSP whose `script-src` allows inline
scripts by sha256 hash only (`scripts/csp-hashes.mjs` writes the hashes at the end of every build),
plus HSTS, COOP, `frame-ancestors 'none'` and a Permissions-Policy. CI has a read-only token and
SHA-pinned actions; Dependabot watches npm and actions weekly. See `SECURITY.md` to report an issue.

## CI

`.github/workflows/ci.yml` runs on every push and pull request to `main`: `npm ci`, `format:check`,
`npm run build` (type-check + placeholder guard + static build, the same command Cloudflare runs),
then the Playwright suite in Chromium. The report is uploaded as an artifact on failure.

## Deployment

Static build (`./dist`) — deployable to any static host. No SSR adapter is needed
(`output: 'static'`).

### Cloudflare Pages

Connect the GitHub repo in the Cloudflare Pages dashboard and use:

| Setting                | Value                       |
| ---------------------- | --------------------------- |
| Framework preset       | Astro                       |
| Build command          | `npm run build`             |
| Build output directory | `dist`                      |
| Node version           | pinned to `22` via `.nvmrc` |

`npm run build` runs `astro check` (type-check) before `astro build`, so a deploy
fails fast on type errors rather than shipping a broken build. The `site` value in
`astro.config.mjs` (`https://shanahansuresh.com`) drives the sitemap/canonical URLs —
update it if the production domain changes.
