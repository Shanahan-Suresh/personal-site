import { test, expect } from "@playwright/test";
import { trackTransfers } from "./transfer";
import { ARRIVAL_BUDGET } from "./fixtures";

// ── /writing is parked: noindex, not in nav ─────────────────────────────────
test("writing pages carry noindex while the section is parked", async ({
  page,
}) => {
  await page.goto("/writing/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
  await page.goto("/writing/hello/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('a.nav-link[href^="/writing"]')).toHaveCount(0);
});

// ── Performance budget ──────────────────────────────────────────────────────
// The colophon quotes a wire size for the home page; this keeps it honest.
test("home page stays under the 350 KiB initial transfer budget", async ({
  page,
}) => {
  const transferredBytes = trackTransfers(page);
  await page.goto("/", { waitUntil: "networkidle" });
  const total = await transferredBytes();
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThan(ARRIVAL_BUDGET);
});

// ── Colophon ────────────────────────────────────────────────────────────────
test("colophon renders with a live test count and repo deep links", async ({
  page,
}) => {
  const response = await page.goto("/colophon/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("h1")).toContainText(/how this site is built/i);
  const repoLinks = page.locator(
    'a[href^="https://github.com/Shanahan-Suresh/personal-site/blob/main/"]',
  );
  expect(await repoLinks.count()).toBeGreaterThan(3);
  // The test count is computed from the suite at build time; must be numeric
  await expect(page.locator(".stat-value").last()).toHaveText(/^\d+$/);
});

// ── Placeholder guard (belt and braces to scripts/guard-placeholders.mjs) ───
// Without ALLOW_PLACEHOLDERS the build itself refuses to run, so this test
// only ever sees a site with no placeholders in it. With the flag set (local
// builds) it is skipped with a note, so the suite stays usable while images
// are being sourced.
test("no placeholder image is rendered", async ({ page }) => {
  test.skip(
    process.env.ALLOW_PLACEHOLDERS === "1",
    "ALLOW_PLACEHOLDERS=1: local build, placeholder images permitted",
  );
  await page.goto("/");
  // Astro keeps the source file name in front of its hash, so a placeholder
  // would show up here. The sentinel proves the names survive.
  await expect(page.locator('img[src*="rsvp-glass"]').first()).toBeAttached();
  const placeholders = page.locator('img[src*="placeholder"]');
  await expect(placeholders).toHaveCount(0);
});

// ── CSP: hashed inline scripts, no unsafe-inline ────────────────────────────
// Cloudflare applies dist/_headers; astro preview does not, so assert on the
// file the build produced rather than on a response header.
test("built _headers carries a hash for every inline script and no unsafe-inline in script-src", async () => {
  const { readFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  const headers = readFileSync("dist/_headers", "utf8");
  const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1] ?? "";
  const scriptSrc = /script-src\s+([^;]+)/.exec(csp)?.[1] ?? "";
  expect(scriptSrc).not.toContain("unsafe-inline");
  expect(scriptSrc).not.toContain("__CSP_SCRIPT_HASHES__");

  const html = readFileSync("dist/index.html", "utf8");
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .map(([, attrs, body]) => {
      if (attrs === undefined || body === undefined)
        throw new Error("inline script regex matched without its groups");
      return { attrs, body };
    })
    .filter(({ attrs }) => !/\bsrc=/.test(attrs) && !/ld\+json/.test(attrs))
    .map(({ body }) => createHash("sha256").update(body).digest("base64"));
  expect(inline.length).toBeGreaterThan(0);
  for (const h of inline) expect(scriptSrc).toContain(`'sha256-${h}'`);
});

// RFC 9116 requires an Expires date. The test fails 30 days before it, so the
// date moves forward a year before the file goes stale.
test("security.txt names a contact and expires more than 30 days from now", async ({
  request,
}) => {
  const res = await request.get("/.well-known/security.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Contact: mailto:hello@shanahansuresh.com");
  const expires = Date.parse(/^Expires:\s*(.+)$/m.exec(body)?.[1] ?? "");
  expect(expires - Date.now()).toBeGreaterThan(30 * 24 * 60 * 60 * 1000);
});
