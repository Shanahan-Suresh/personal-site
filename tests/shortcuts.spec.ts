import { test, expect } from "@playwright/test";

// ── Hover finds and keyboard shortcuts ──────────────────────────────────────
test.describe("hover finds and shortcuts", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("? opens the keyboard card, T switches the theme, and the card turns the letter keys off", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.locator("#keys");
    await expect(card).toBeHidden();
    await page.keyboard.press("?");
    await expect(card).toBeVisible();
    await expect(card).toContainText("switch theme");

    const html = page.locator("html");
    const wasDark = await html.evaluate((el) => el.classList.contains("dark"));
    await page.keyboard.press("t");
    await expect
      .poll(() => html.evaluate((el) => el.classList.contains("dark")))
      .toBe(!wasDark);

    await card.getByRole("button", { name: "Turn letter keys off" }).click();
    // T reaches the theme only through a click on its button, so count them.
    type Win = { themeClicks: number };
    await page.locator("#theme-toggle").evaluate((b) => {
      (window as unknown as Win).themeClicks = 0;
      b.addEventListener(
        "click",
        () => (window as unknown as Win).themeClicks++,
      );
    });
    await page.keyboard.press("t");
    // "?" goes through the same key handler, so once the card hides, T has
    // been handled too.
    await page.keyboard.press("?");
    await expect(card).toBeHidden();
    expect(
      await page.evaluate(() => (window as unknown as Win).themeClicks),
    ).toBe(0);
    expect(await html.evaluate((el) => el.classList.contains("dark"))).toBe(
      !wasDark,
    );
    await page.keyboard.press("?");
    await expect(card).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
  });

  test("letter keys do nothing while a story is open", async ({ page }) => {
    await page.goto("/#story-rsvp");
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.keyboard.press("?");
    await expect(page.locator("#keys")).toBeHidden();
  });

  test("the build link names its commit and shows the commit card on hover", async ({
    page,
  }) => {
    await page.goto("/");
    const build = page.locator("a.footer-build");
    await expect(build).toHaveAttribute(
      "aria-label",
      /^build [0-9a-f]{7}, the commit this page was built from/,
    );
    const card = build.locator(".build-card");
    await expect(card).toBeHidden();
    await build.hover();
    await expect(card).toBeVisible();
  });

  test("letters hop once per visit and join back into the same text", async ({
    page,
  }) => {
    await page.goto("/#contact");
    const h = page.locator("#contact h2");
    const before = await h.innerHTML();
    await h.hover();
    await expect(h.locator(".hop-ch").first()).toBeAttached();
    // One hop, then still: nothing loops while the pointer stays. Paused
    // animations (the Learning next icons wait paused off hover) do not move,
    // and the About code chip's cursor blink is an owner-approved exception.
    await page.waitForTimeout(1500);
    const moving = await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            (a as CSSAnimation).animationName !== "caret-blink",
        )
        .map((a) => (a as CSSAnimation).animationName ?? "transition"),
    );
    expect(moving).toEqual([]);
    await page.mouse.move(1400, 880);
    await expect(h.locator(".hop-ch")).toHaveCount(0);
    expect(await h.innerHTML()).toBe(before);
  });
});
