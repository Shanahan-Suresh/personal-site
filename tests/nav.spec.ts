import { test, expect } from "@playwright/test";

// ── 1. Nav + theme toggle present ────────────────────────────────────────────
test("nav links and theme toggle are present", async ({ page }) => {
  await page.goto("/");

  // Both nav links from navigation.ts
  const workLink = page.locator('a.nav-link[href="/#work"]');
  const contactLink = page.locator('a.nav-link[href="/#contact"]');
  await expect(workLink).toBeVisible();
  await expect(workLink).toHaveText("Work");
  await expect(contactLink).toBeVisible();
  await expect(contactLink).toHaveText("Contact");

  // Theme toggle button
  const toggle = page.locator("#theme-toggle");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-label", "Toggle dark mode");
});
// ── 5. Mobile ~600px layout ───────────────────────────────────────────────────
test("at 600px viewport nav links are hidden and hero is single-column", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/");

  // Nav links list is hidden via CSS display:none at max-width:768px
  // The element is in the DOM but not visible
  const navLinksList = page.locator(".nav-links");
  await expect(navLinksList).toBeHidden();

  // Hero inner switches to single-column grid at max-width:820px
  // Verify grid-template-columns is "1fr" (single column) by checking computed style
  const heroInnerCols = await page
    .locator(".hero-inner")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  // At 600px, the breakpoint fires — single column means one track value
  // The exact pixel value varies, but there should be only one track (no spaces between two values)
  const trackCount = heroInnerCols.trim().split(/\s+(?=\d)/).length;
  expect(trackCount).toBe(1);
});

test("mobile menu: the burger opens it; Escape, an outside tap or a link closes it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/");
  const burger = page.locator(".nav-burger");
  const links = page.locator(".nav-links");
  await expect(burger).toHaveAttribute("aria-label", "Menu");

  await burger.click();
  await expect(burger).toHaveAttribute("aria-expanded", "true");
  await expect(links).toBeVisible();
  await links.locator("a.nav-link").first().focus();
  await page.keyboard.press("Escape");
  await expect(burger).toHaveAttribute("aria-expanded", "false");
  await expect(links).toBeHidden();
  await expect(burger).toBeFocused();

  await burger.click();
  await expect(links).toBeVisible();
  await page.mouse.click(300, 800);
  await expect(burger).toHaveAttribute("aria-expanded", "false");

  await burger.click();
  await links.locator('a[href="/#about"]').click();
  await expect(burger).toHaveAttribute("aria-expanded", "false");
  await expect(links).toBeHidden();
});
// ── 8. Scrolled-nav ───────────────────────────────────────────────────────────
test("scrolled-nav: scrolling down adds is-scrolled to .nav-header; scrolling to top removes it", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator(".nav-header");
  await expect(header).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(header).toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveClass(/is-scrolled/);
});
// ── 9. Scroll-spy ─────────────────────────────────────────────────────────────
test("scroll-spy: scrolling to #work section activates the Work nav link", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#work").scrollIntoViewIfNeeded();
  const workLink = page.locator('a.nav-link[href="/#work"]');
  await expect(workLink).toHaveClass(/is-active/);
  await expect(workLink).toHaveAttribute("aria-current", "true");
});
// ── Skip link ────────────────────────────────────────────────────────────────
test("skip link is the first tab stop and jumps focus to <main>", async ({
  page,
}) => {
  await page.goto("/");
  const skip = page.locator("a.skip-link");
  await expect(skip).toHaveAttribute("href", "#main");

  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  // Focused: the link slides into view (it is parked above the viewport
  // otherwise). Poll, because the slide is a short CSS transition.
  await expect
    .poll(async () => (await skip.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});
