/**
 * The homepage order of the projects in projects.ts: corporate work first,
 * then side projects, then university. Every project appears here exactly
 * once. It lives apart from projects.ts, which imports images, so the
 * Playwright tests can import it too.
 */
export const projectOrder = [
  "rsvp",
  "hr",
  "ohse",
  "digest",
  "mcp",
  "censorit",
  "heatgen",
] as const;
