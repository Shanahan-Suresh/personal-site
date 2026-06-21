import { test, expect } from "@playwright/test";

test("home page loads with the hero headline", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  const headline = page.locator(".hero-headline");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText(/full-stack/i);
});

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

// ── 2. Major sections visible ────────────────────────────────────────────────
test("major sections are present on the page", async ({ page }) => {
  await page.goto("/");

  // About section
  const aboutSection = page.locator("#about");
  await expect(aboutSection).toBeAttached();

  // Work section — at least one project card rendered
  const workSection = page.locator("#work");
  await expect(workSection).toBeAttached();
  const firstProjectCard = page.locator(".project-card").first();
  await expect(firstProjectCard).toBeAttached();

  // Contact — headline text and email link
  const contactSection = page.locator("#contact");
  await expect(contactSection).toBeAttached();
  await expect(contactSection.locator(".contact-headline")).toContainText(
    "build.",
  );

  // Footer
  const footer = page.locator(".site-footer");
  await expect(footer).toBeAttached();
  await expect(footer).toContainText("Shanahan Suresh");
});

// ── 3. Contact mailto ────────────────────────────────────────────────────────
test("contact email link has correct mailto href", async ({ page }) => {
  await page.goto("/");

  const emailLink = page.locator('a[href="mailto:hello@shanahansuresh.dev"]');
  await expect(emailLink).toBeAttached();
  await expect(emailLink).toHaveAttribute(
    "href",
    "mailto:hello@shanahansuresh.dev",
  );
});

// ── 4. Theme toggle behavior ─────────────────────────────────────────────────
test("theme toggle adds dark class to <html> and persists to localStorage", async ({
  page,
}) => {
  // Start in a known state: clear storage so no prefers-color-scheme interference
  await page.goto("/");

  // Force light mode as baseline by removing dark class and setting theme=light
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  });

  // Verify baseline: not dark
  const htmlEl = page.locator("html");
  await expect(htmlEl).not.toHaveClass(/dark/);

  // Click the toggle — should switch to dark
  await page.locator("#theme-toggle").click();

  await expect(htmlEl).toHaveClass(/dark/);
  const storedAfterDark = await page.evaluate(() =>
    localStorage.getItem("theme"),
  );
  expect(storedAfterDark).toBe("dark");

  // Click again — should switch back to light
  await page.locator("#theme-toggle").click();

  await expect(htmlEl).not.toHaveClass(/dark/);
  const storedAfterLight = await page.evaluate(() =>
    localStorage.getItem("theme"),
  );
  expect(storedAfterLight).toBe("light");
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

// ── 6. Reduced motion ─────────────────────────────────────────────────────────
test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("revealed elements are immediately visible", async ({ page }) => {
    await page.goto("/");

    // The reveal script checks prefers-reduced-motion and if true, adds .is-visible
    // to all .reveal elements immediately without waiting for IntersectionObserver.
    const contactBlock = page.locator(".contact-block");
    await expect(contactBlock).toHaveClass(/is-visible/);

    // Hero section gets hero-loaded class immediately when reduced motion is on
    const heroSection = page.locator(".hero-section");
    await expect(heroSection).toHaveClass(/hero-loaded/);

    // The hero headline should be visible without waiting for animation
    const headline = page.locator(".hero-headline");
    await expect(headline).toBeVisible();
  });
});
