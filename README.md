# shanahansuresh.com

The source for my personal site and portfolio, live at
[shanahansuresh.com](https://shanahansuresh.com).

[![CI](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml/badge.svg)](https://github.com/Shanahan-Suresh/personal-site/actions/workflows/ci.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-3d52ea.svg)](LICENSE)

I build full-stack products and AI tooling, and this site is where that work lives. I made the repo
public so anyone curious can read the code behind it. The
[colophon](https://shanahansuresh.com/colophon) covers how it's built, with numbers.

## What's in here

It's a static [Astro](https://astro.build/) site styled with
[Tailwind CSS 4](https://tailwindcss.com/). The browser gets a small amount of TypeScript and no
framework. Some parts you might want to look at:

- `src/styles/tokens.css` holds every colour for the light and dark themes as CSS custom
  properties.
- `src/scripts/home/` has the page behaviour, with one small module per feature.
- `src/components/ProjectStory.astro` is a project story. It opens as a modal, and it still works
  as a plain panel if the script never loads.
- `scripts/csp-hashes.mjs` hashes every inline script at build time, so the Content Security Policy
  in `public/_headers` doesn't need `unsafe-inline`.
- `src/data/budgets.ts` sets the page weight limits: 350 KiB on first load and 1.5 MiB after
  scrolling to the bottom. The tests fail if the homepage goes over either one.
- `src/components/Footer.astro` links every page to the commit it was built from.
- `tests/` is a Playwright suite that runs against the production build in Chromium, Firefox and
  WebKit.
- `docs/interactions.md` lists every animation and hover effect, and how the site behaves on a
  phone.

## Running it

You'll need Node.js 22.12 or newer (there's an `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check, build to ./dist and hash the inline scripts
npm run preview    # serve the built site
```

To run the tests:

```bash
npx playwright install           # first time only, downloads the browsers
npm test                         # builds the site and runs every test in all three browsers
npm test -- --project=chromium   # one browser
```

CI runs the format check, the build and the Chromium tests on every pull request. `main` won't take
a merge until they pass.

## Deploying

Every push to `main` deploys through Cloudflare Workers Builds, which runs `npm run build` and then
`npx wrangler versions upload`. The site is served as static files from `dist/` (see
`wrangler.jsonc`), and the security headers live in `public/_headers`. If you find a security
problem, [`SECURITY.md`](SECURITY.md) says how to report it.

## Licence

The code is MIT licensed (see [`LICENSE`](LICENSE)), so feel free to borrow from it.

The content is a different matter. Please don't reuse my writing, project descriptions, portrait
or project screenshots, or my name and likeness.

Photos from Unsplash are under the [Unsplash License](https://unsplash.com/license), the museum
images are public domain or CC0, and the display font uses the SIL Open Font License 1.1.
[`src/assets/README.md`](src/assets/README.md) lists every source.
