# personal-site

Personal website and portfolio for **Shanahan Suresh** — product-minded software engineer building full-stack products and AI tooling.

Live: [shanahansuresh.com](https://shanahansuresh.com) · [Colophon](https://shanahansuresh.com/colophon) (how it is built, with numbers)

[![CI](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml/badge.svg)](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-2b4cf0.svg)](LICENSE)

## Why this repo is public

The site is meant to be its own code sample. Rather than describe how it is built, the source is
here to read: the design-token system in `src/styles/`, the single interaction module in
`src/scripts/`, the Playwright suite that runs against the production build, and the deploy
hardening in `public/_headers`. The footer of every page links to the exact commit it was built
from. The code is MIT; the copy, project descriptions and images are not licensed for reuse
(see `LICENSE`).

> **Design:** Refined neobrutalism — bold borders, hard offset shadows, oversized type, light/dark themes. The previous glassmorphism design is preserved in the commit history.

## Tech stack

- **[Astro 5](https://astro.build/)** — static site generator (`output: 'static'`)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — CSS-first setup via `@tailwindcss/vite` (no `tailwind.config.js`; theme lives in `src/styles/`, split across `tokens.css`/`components.css`/`motion.css`/`prose.css` and aggregated by `global.css`)
- **MDX** (`@astrojs/mdx`) — blog/writing content
- **Sitemap + RSS** (`@astrojs/sitemap`, `@astrojs/rss`)
- Self-hosted fonts via `@fontsource`
- **Prettier** (`prettier-plugin-astro`) and `astro check` for formatting and type-checking
- **[Playwright](https://playwright.dev/)** — end-to-end / visual-regression tests (Chromium, Firefox, WebKit)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm

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

End-to-end and visual-regression tests live in `tests/` and run with [Playwright](https://playwright.dev/).

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
single-column), the project-card paragraph split, reduced-motion static render,
and the extracted BaseLayout interactions (scrolled-nav, scroll-spy, hero entrance).

## Project structure

```
personal-site/
├── public/              # static assets (favicon, OG image, robots.txt)
├── src/
│   ├── components/      # Astro UI components (Hero, Work, Nav, cards, etc.)
│   ├── content/         # MDX content (blog posts)
│   ├── data/            # structured content (projects, skills, interests, navigation)
│   ├── layouts/         # BaseLayout + PostLayout
│   ├── lib/             # helpers: posts.ts, site-config.ts, types.ts
│   ├── pages/           # routes — index.astro, writing/, rss.xml.ts
│   ├── scripts/         # home-interactions.ts (bundled client JS for BaseLayout)
│   └── styles/          # global.css aggregator + tokens/components/motion/prose partials
├── tests/               # Playwright e2e / visual-regression specs
├── astro.config.mjs     # Astro + integrations + Tailwind (Vite) config
├── playwright.config.ts # Playwright runner + dev-server config
└── package.json
```

## Design system

All visual styling is centralized in `src/styles/` (the `global.css` entry point imports `tokens.css`, `components.css`, `motion.css`, and `prose.css`) using CSS custom properties (design tokens) plus a small set of component classes. Theming (light/dark and color palettes) is driven by tokens, so the look can be retuned from one place.

## Placeholder images

Featured project cards can point at a stand-in image whose filename starts with `_placeholder-`.
`npm run build` runs `scripts/guard-placeholders.mjs` first and fails if one exists or is referenced,
so Cloudflare can never deploy a placeholder. For a local build while images are being sourced:
`ALLOW_PLACEHOLDERS=1 npm run build` (PowerShell: `$env:ALLOW_PLACEHOLDERS=1; npm run build`).
See `CLAUDE.md` for the swap procedure.

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
