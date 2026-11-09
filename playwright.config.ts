import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for personal-site.
 *
 * Tests run against the *built* static site (`astro build` → `astro preview`),
 * so they exercise the same artifact that ships to production. Locally, if a
 * server is already listening on PORT (e.g. `npm run dev`), it's reused.
 */
const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // guard.spec.ts checks a Node script, so one browser is enough.
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /guard\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /guard\.spec\.ts/,
    },
  ],
  webServer: {
    // CI builds in its own step first (.github/workflows/ci.yml), so it only previews.
    command: process.env.CI
      ? `npm run preview -- --port ${PORT}`
      : `npm run build && npm run preview -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Astro 7 detaches `astro preview` when it detects an AI agent shell, and
    // Playwright then reports that the server exited early. Any value here
    // keeps the server in the foreground (node_modules/astro/dist/cli/preview).
    env: { ASTRO_PREVIEW_BACKGROUND: "0" },
  },
});
