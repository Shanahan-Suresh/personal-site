import { test, expect, type Page } from "@playwright/test";
import { STORY_IDS } from "./fixtures";
import { findClippedFrames } from "./helpers/clipped-frames";

test("home page loads with the hero headline", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  const headline = page.locator(".hero-headline");
  await expect(headline).toBeVisible();
  await expect(headline).toContainText(/full-stack/i);
});
// ── 2. Major sections visible ────────────────────────────────────────────────
test("major sections are present on the page", async ({ page }) => {
  await page.goto("/");

  // About section
  const aboutSection = page.locator("#about");
  await expect(aboutSection).toBeAttached();

  // Work section — all seven project rows, each with its story dialog
  const workSection = page.locator("#work");
  await expect(workSection).toBeAttached();
  await expect(workSection.locator(".projects .pr")).toHaveCount(
    STORY_IDS.length,
  );
  await expect(workSection.locator("dialog.story")).toHaveCount(
    STORY_IDS.length,
  );

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
// ── 404 ─────────────────────────────────────────────────────────────────────
test("an unknown address shows the 404 page with a way home", async ({
  page,
}) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("404");
  await expect(page.locator("main a[href='/']")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
});

// ── 7. Reduced motion ─────────────────────────────────────────────────────────
test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("revealed elements are immediately visible", async ({ page }) => {
    await page.goto("/");

    // With reduced motion the reveal script marks every .reveal block as in
    // at once, without waiting for IntersectionObserver.
    const headline = page.locator(".hero-headline");
    await expect(headline).toHaveClass(/\bin\b/);
    await expect(headline).toBeVisible();
    await expect(page.locator("#work h2.reveal")).toHaveClass(/\bin\b/);

    // The hero frames are not faded out.
    const face = page.locator(".shots .face");
    expect(await face.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });
});
// ── 10. Hero entrance ─────────────────────────────────────────────────────────
test("hero entrance: the headline and its frames reveal after page load", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-headline")).toHaveClass(/\bin\b/, {
    timeout: 3000,
  });
  await expect(page.locator(".shots")).toHaveClass(/\bin\b/);
});

// Let the headline lines finish rising (the caret blink never ends).
async function settleHeadline(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}

// A border or hard shadow inside a clipping box (the headline's reveal mask,
// say) loses the sides that fall outside it, leaving stray bars of ink.
for (const width of [390, 1440]) {
  test(`no border or hard shadow is cut off by a clipping box at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".hero-headline")).toHaveClass(/\bin\b/, {
      timeout: 3000,
    });
    await settleHeadline(page);
    expect(await findClippedFrames(page)).toEqual([]);
  });
}

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
