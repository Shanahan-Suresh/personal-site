import { transferBudget } from "../src/data/budgets";

/** Every project's id, one row and one story each (src/data/projects.ts). */
export const STORY_IDS = [
  "rsvp",
  "hr",
  "ohse",
  "digest",
  "mcp",
  "censorit",
  "heatgen",
] as const;

/** The home page transfer budgets, in bytes. */
export const ARRIVAL_BUDGET = transferBudget.arrivalKiB * 1024;
export const SCROLLED_BUDGET = transferBudget.scrolledMiB * 1024 * 1024;
