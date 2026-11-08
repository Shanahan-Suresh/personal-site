import { transferBudget } from "../src/data/budgets";
import { projectOrder } from "../src/data/project-order";

/** Every project's id, one row and one story each, in page order. */
export const STORY_IDS = projectOrder;

/** The home page transfer budgets, in bytes. */
export const ARRIVAL_BUDGET = transferBudget.arrivalKiB * 1024;
export const SCROLLED_BUDGET = transferBudget.scrolledMiB * 1024 * 1024;
