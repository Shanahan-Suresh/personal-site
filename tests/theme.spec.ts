import { test, expect } from "@playwright/test";

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

test("the theme button works from the keyboard and reports its state", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.locator("#theme-toggle");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Space");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("every mouse click on the theme button counts, even mid-switch", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await page.goto("/");
  const html = page.locator("html");
  const box = await page.locator("#theme-toggle").boundingBox();
  if (!box) throw new Error("theme button has no box");
  // Four real clicks 200ms apart: each lands while the last switch still runs,
  // so the page ends light again only if every click counted.
  for (let i = 0; i < 4; i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
  }
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(page.locator("#theme-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator("#theme-ring")).toHaveCount(0);
});
