# shanahansuresh.com

The personal site and portfolio of **Shanahan Suresh**, a software engineer who builds full-stack
products and AI tooling.

**[shanahansuresh.com](https://shanahansuresh.com)** · [Colophon](https://shanahansuresh.com/colophon)
(how the site is built, with numbers)

[![CI](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml/badge.svg)](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-3d52ea.svg)](LICENSE)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/home-desktop-dark.webp">
  <img alt="The homepage: a condensed headline reading 'I build full-stack products and AI tooling' on a sky-blue slab, beside a framed portrait." src="docs/screenshots/home-desktop-light.webp">
</picture>

The site is its own code sample. It is a static Astro build with no framework JavaScript: full-width
colour slabs, condensed display type, hard offset shadows on everything you can press, and light and
dark themes.

## Worth a look

| What                                                                                                                             | Where                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Design tokens for both themes. Every colour is a custom property.                                                                | [`src/styles/tokens.css`](src/styles/tokens.css)                                         |
| Page behaviour, one small module per behaviour: scroll spy, the pointer preview, story dialogs, keyboard shortcuts.              | [`src/scripts/home/`](src/scripts/home)                                                  |
| Project stories that open as modals, and still open as plain panels without JavaScript.                                          | [`src/components/ProjectStory.astro`](src/components/ProjectStory.astro)                 |
| A Content Security Policy that allows inline scripts by SHA-256 hash only, with no `unsafe-inline`. The build writes the hashes. | [`scripts/csp-hashes.mjs`](scripts/csp-hashes.mjs), [`public/_headers`](public/_headers) |
| Transfer budgets the tests enforce: 350 KiB on arrival and 1.5 MiB after a full scroll.                                          | [`src/data/budgets.ts`](src/data/budgets.ts)                                             |
| A Playwright suite that runs against the production build in Chromium, Firefox and WebKit.                                       | [`tests/`](tests)                                                                        |
| Every page footer links to the exact commit that built it.                                                                       | [`src/components/Footer.astro`](src/components/Footer.astro)                             |
| A catalogue of every motion, hover and phone behaviour.                                                                          | [`docs/interactions.md`](docs/interactions.md)                                           |

## Stack

- [Astro 7](https://astro.build/), static output, with MDX, a sitemap and RSS
- [Tailwind CSS 4](https://tailwindcss.com/), configured in CSS (`src/styles/`), with no `tailwind.config.js`
- TypeScript, checked by `astro check` on every build
- Self-hosted fonts: a condensed cut of Bricolage Grotesque, Archivo and DM Mono
- [Playwright](https://playwright.dev/) for end-to-end tests
- Deployed on Cloudflare Workers as static assets, with no server code

## Run it locally

Needs Node.js 22.12 or newer (`.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check, static build to ./dist, CSP hashes
npm run preview    # serve the production build
```

## Tests

```bash
npx playwright install   # once: download Chromium, Firefox and WebKit
npm test                 # builds the site, then runs every test in all three browsers
npm test -- --project=chromium
npm run test:ui          # Playwright's interactive mode
```

CI runs formatting, the build and the Chromium suite on every pull request. `main` accepts a merge
only when that check passes.

## Deployment

Cloudflare Workers Builds deploys every push to `main`: it runs `npm run build`, then
`npx wrangler versions upload`. `wrangler.jsonc` serves `dist/` as static assets. Security headers live in `public/_headers`. To report a security issue, see
[`SECURITY.md`](SECURITY.md).

## Licence

The **code** is MIT licensed ([`LICENSE`](LICENSE)).

The **content** is not: the written copy, project descriptions, the portrait, the project captures,
and the Shanahan Suresh name and likeness are not licensed for reuse.

Third-party material keeps its own terms. The photographs are under the
[Unsplash License](https://unsplash.com/license), the museum images are public domain or CC0, and
the display font is under the SIL Open Font License 1.1. Each source and its terms are recorded in
[`src/assets/README.md`](src/assets/README.md).
