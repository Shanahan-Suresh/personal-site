# personal-site

Personal website and portfolio for **Shanahan Suresh** — product-minded software engineer building full-stack products and AI tooling.

Live: [shanahansuresh.dev](https://shanahansuresh.dev)

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

## Deployment

Static build (`./dist`) — deployable to any static host.
