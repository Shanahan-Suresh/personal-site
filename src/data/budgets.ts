/**
 * Transfer budgets for the home page. tests/home.spec.ts and
 * tests/media.spec.ts enforce them, and the colophon quotes them.
 */
export const transferBudget = {
  /** Encoded bytes on arrival, before any scroll. */
  arrivalKiB: 350,
  /** Encoded bytes after scrolling through every section. */
  scrolledMiB: 1.5,
} as const;
