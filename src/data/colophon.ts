import { site } from "@/lib/site-config";

/** Deep link into the repo, so each stack row on the colophon links to its source file. */
export const repoFile = (path: string) => `${site.repo}/blob/main/${path}`;

export interface Stat {
  label: string;
  value: string;
  note?: string;
}

/**
 * Cold production-preview responses at 390px and 1440px across all three
 * browser engines. tests/media.spec.ts records encoded bodies plus headers
 * on arrival and after scrolling. The interaction bundle is measured with gzip.
 */
export const measuredOn = "7 Nov 2026";

export const stats: Stat[] = [
  {
    label: "Home page on arrival",
    value: "~161–234 KiB",
    note: "Fresh mobile/desktop contexts across all three engines",
  },
  {
    label: "Home page after scrolling",
    value: "~216–427 KiB",
    note: "Includes every responsive image, fonts, CSS and JavaScript",
  },
  {
    label: "Framework JavaScript",
    value: "0 KB",
    note: "Astro sends plain HTML with no React",
  },
  {
    label: "Interaction bundle",
    value: "4.8 KiB",
    note: "One bundled script, gzipped",
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
    name: "Astro 7",
    detail: "Fully static output. Every page is HTML at build time.",
    path: "astro.config.mjs",
  },
  {
    name: "Tailwind CSS 4",
    detail:
      "Config-less. Four CSS partials hold the tokens and shared pieces, and each section styles its own layout.",
    path: "src/styles",
  },
  {
    name: "Self-hosted fonts",
    detail:
      "Bricolage Grotesque cut to one weight and width, plus Archivo Variable and DM Mono via @fontsource. The display face is preloaded and no third-party font host is involved.",
    path: "src/layouts/BaseLayout.astro",
  },
  {
    name: "One interaction entry",
    detail:
      "The headline reveal, scroll spy, mobile menu, pointer preview, story dialogs and keyboard shortcuts each live in a small module, started from one file with a shared cleanup path.",
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
