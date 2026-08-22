import { site } from "@/lib/site-config";

/** Deep link into the repo, so every claim on the colophon is one click from its source. */
export const repoFile = (path: string) => `${site.repo}/blob/main/${path}`;

export interface Stat {
  label: string;
  value: string;
  note?: string;
}

/**
 * Measured against the production build. Re-measure when the numbers move:
 * gzip the files `dist/index.html` references and sum them. The Playwright
 * performance-budget test keeps the total honest (see tests/home.spec.ts).
 */
export const measuredOn = "22 Aug 2026";

export const stats: Stat[] = [
  {
    label: "Home page, over the wire",
    value: "~100 KB",
    note: "HTML + CSS + JS + four font files, gzipped",
  },
  {
    label: "Framework JavaScript",
    value: "0 KB",
    note: "No React, no hydration, no client router",
  },
  {
    label: "Interaction bundle",
    value: "2.7 KB",
    note: "One TypeScript module, gzipped",
  },
  {
    label: "Browsers in the test matrix",
    value: "3",
    note: "Chromium, Firefox, WebKit",
  },
];

export interface StackItem {
  name: string;
  detail: string;
  path?: string;
}

export const stack: StackItem[] = [
  {
    name: "Astro 5",
    detail: "Fully static output. Every page is HTML at build time.",
    path: "astro.config.mjs",
  },
  {
    name: "Tailwind CSS 4",
    detail:
      "Config-less. The whole theme is four CSS partials of custom properties and component classes.",
    path: "src/styles",
  },
  {
    name: "Self-hosted fonts",
    detail:
      "Anton, Archivo Variable and DM Mono via @fontsource, preloaded, no third-party font host.",
    path: "src/layouts/BaseLayout.astro",
  },
  {
    name: "One interaction module",
    detail:
      "Reveal, scroll-spy, tilt, magnetic buttons and the sticker physics live in a single file with a cleanup path.",
    path: "src/scripts/home-interactions.ts",
  },
  {
    name: "Playwright",
    detail:
      "End-to-end and visual checks run against the built site in three browser engines.",
    path: "tests/home.spec.ts",
  },
  {
    name: "Cloudflare Pages",
    detail:
      "Static deploy behind CSP (inline scripts allowed by hash only), HSTS, COOP and Permissions-Policy headers set in a _headers file.",
    path: "public/_headers",
  },
];

export const writingElsewhere = {
  title: "Wiring Django to Claude: Generating an MCP server from OpenAPI",
  href: "https://dev.to/shanahansuresh/wiring-django-to-claude-generating-an-mcp-server-from-openapi-1e8a",
  meta: "dev.to · 28 Jun 2026 · 9 min read",
  repo: {
    label: "django-openapi-mcp on GitHub",
    href: "https://github.com/Shanahan-Suresh/django-openapi-mcp",
  },
};
