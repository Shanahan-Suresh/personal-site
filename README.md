# personal-site

Personal website and portfolio for **Shanahan Suresh** — product-minded software engineer building full-stack products and AI tooling.

Live: [shanahansuresh.dev](https://shanahansuresh.dev)

> **Status:** A refined-neobrutalism visual redesign is in progress (bold borders, hard offset shadows, oversized type, swappable color palettes, light/dark themes). The commit history preserves the previous glassmorphism design.

## Tech stack

- **[Astro 5](https://astro.build/)** — static site generator (`output: 'static'`)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — CSS-first setup via `@tailwindcss/vite` (no `tailwind.config.js`; theme lives in `src/styles/global.css`)
- **MDX** (`@astrojs/mdx`) — blog/writing content
- **Sitemap + RSS** (`@astrojs/sitemap`, `@astrojs/rss`)
- Self-hosted fonts via `@fontsource`

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start dev server → http://localhost:4321
npm run build      # build static site to ./dist
npm run preview    # preview the production build locally
```

## Project structure

```
personal-site/
├── public/              # static assets (favicon, OG image, robots.txt)
├── src/
│   ├── components/      # Astro UI components (Hero, Work, Nav, cards, etc.)
│   ├── content/         # MDX content (blog posts)
│   ├── layouts/         # BaseLayout + PostLayout
│   ├── lib/             # helpers (e.g. posts.ts)
│   ├── pages/           # routes — index.astro, writing/, rss.xml.ts
│   └── styles/          # global.css (design tokens + component classes)
├── astro.config.mjs     # Astro + integrations + Tailwind (Vite) config
└── package.json
```

## Design system

All visual styling is centralized in `src/styles/global.css` using CSS custom properties (design tokens) plus a small set of component classes. Theming (light/dark and color palettes) is driven by tokens, so the look can be retuned from one place.

## Deployment

Static build (`./dist`) — deployable to any static host.
