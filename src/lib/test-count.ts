import { execFileSync } from "node:child_process";
import { join } from "node:path";

/* The shape of `playwright test --list --reporter=json`, as far as counting
   needs it. */
interface TestSuite {
  suites?: TestSuite[];
  specs?: { tests: unknown[] }[];
}

const countTests = (suites: TestSuite[]): number =>
  suites.reduce(
    (total, suite) =>
      total +
      (suite.specs?.reduce((n, spec) => n + spec.tests.length, 0) ?? 0) +
      countTests(suite.suites ?? []),
    0,
  );

/** Every Playwright test case, with parameterized cases and every configured
 *  browser expanded. Runs at build time, for the colophon. */
export function playwrightTestCount(): number {
  const listing = JSON.parse(
    execFileSync(
      process.execPath,
      [
        join(process.cwd(), "node_modules/@playwright/test/cli.js"),
        "test",
        "--list",
        "--reporter=json",
      ],
      { encoding: "utf8" },
    ),
  ) as { suites: TestSuite[] };
  return countTests(listing.suites);
}
