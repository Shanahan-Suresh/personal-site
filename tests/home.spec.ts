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

  const emailLink = page.locator('a[href="mailto:hello@shanahansuresh.com"]');
  await expect(emailLink).toBeAttached();
  await expect(emailLink).toHaveAttribute(
    "href",
    "mailto:hello@shanahansuresh.com",
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

// ── 6. Corporate-work descriptions split into multiple paragraphs ─────────────
test("corporate-work cards render multiple .project-desc paragraphs; personal cards render one; TODO marker absent", async ({
  page,
}) => {
  await page.goto("/");

  // Assert "TODO SPLIT IN PARAGRAPHS" does not appear anywhere on the page
  await expect(page.locator("body")).not.toContainText(
    "TODO SPLIT IN PARAGRAPHS",
  );

  // Locate the Corporate work section label, then find its sibling project cards.
  // The section-label text is "Corporate work"; project cards follow in the same grid.
  // Strategy: find all project cards within the #work section that are in the
  // "Corporate work" category by matching the title text of known corporate projects.
  const corporateTitles = [
    "OHSE incident-reporting module",
    "Automated RSVP & check-in web app",
    "Enterprise HR platform",
  ];

  for (const title of corporateTitles) {
    // Find the project card containing this title
    const card = page.locator(".project-card", { hasText: title });
    await expect(card).toBeAttached();
    // Must have more than one .project-desc paragraph
    const descs = card.locator(".project-desc");
    const count = await descs.count();
    expect(
      count,
      `Expected multiple .project-desc in card "${title}"`,
    ).toBeGreaterThan(1);
  }

  // A personal-section card should still have exactly one .project-desc
  const personalCard = page.locator(".project-card", {
    hasText: "Automated artwork censoring app",
  });
  await expect(personalCard).toBeAttached();
  const personalDescs = personalCard.locator(".project-desc");
  await expect(personalDescs).toHaveCount(1);
});

// ── 7. Reduced motion ─────────────────────────────────────────────────────────
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

// ── 8. Scrolled-nav ───────────────────────────────────────────────────────────
test("scrolled-nav: scrolling down adds is-scrolled to .nav-header; scrolling to top removes it", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator(".nav-header");
  await expect(header).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(200);
  await expect(header).toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await expect(header).not.toHaveClass(/is-scrolled/);
});

// ── 9. Scroll-spy ─────────────────────────────────────────────────────────────
test("scroll-spy: scrolling to #work section activates the Work nav link", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const workLink = page.locator('a.nav-link[href="/#work"]');
  await expect(workLink).toHaveClass(/is-active/);
  await expect(workLink).toHaveAttribute("aria-current", "true");
});

// ── 10. Hero entrance ─────────────────────────────────────────────────────────
test("hero entrance: .hero-section gets hero-loaded class after page load", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-section")).toHaveClass(/hero-loaded/, {
    timeout: 3000,
  });
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

// ── Footer links ─────────────────────────────────────────────────────────────
test("footer links to the colophon, the source repo, and the build commit", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator(".site-footer");
  await expect(footer.locator('a[href="/colophon"]')).toBeVisible();
  await expect(
    footer.locator(
      'a[href="https://github.com/Shanahan-Suresh/personal-site"]',
    ),
  ).toBeVisible();
  const build = footer.locator("a.footer-build");
  await expect(build).toHaveText(/build [0-9a-f]{7}/);
  await expect(build).toHaveAttribute(
    "href",
    /github\.com\/Shanahan-Suresh\/personal-site\/commit\/[0-9a-f]{40}/,
  );
});

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
test("home page stays under the 150 KB transfer budget", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const total = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const res = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    return nav.transferSize + res.reduce((sum, r) => sum + r.transferSize, 0);
  });
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThan(150 * 1024);
});

// ── Colophon ────────────────────────────────────────────────────────────────
test("colophon renders with a live test count and repo deep links", async ({
  page,
}) => {
  const response = await page.goto("/colophon/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("h2.section-title")).toContainText(
    /how this site is built/i,
  );
  const repoLinks = page.locator(
    'a[href^="https://github.com/Shanahan-Suresh/personal-site/blob/main/"]',
  );
  expect(await repoLinks.count()).toBeGreaterThan(3);
  // The test count is computed from the suite at build time; must be numeric
  await expect(page.locator(".stat-value").last()).toHaveText(/^\d+$/);
});
