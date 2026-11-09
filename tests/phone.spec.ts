import { test, expect, type Locator } from "@playwright/test";

// ── 8b. On a phone ────────────────────────────────────────────────────────────
test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  /* The sheet rises from the bottom edge; measure it once it has landed. */
  const settle = (story: Locator) =>
    story.evaluate((d) =>
      Promise.all(d.getAnimations().map((a) => a.finished)),
    );

  test("the bar slides away on a scroll down and comes back on a scroll up", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.locator(".nav-header");
    await page.evaluate(() =>
      window.scrollTo({ top: 1200, behavior: "instant" }),
    );
    await expect(header).toHaveClass(/nav-away/);
    await expect
      .poll(async () => (await header.boundingBox())?.y ?? 0)
      .toBeLessThan(-40);
    await page.evaluate(() =>
      window.scrollTo({ top: 900, behavior: "instant" }),
    );
    await expect(header).not.toHaveClass(/nav-away/);
  });

  test("the open menu dims the page, holds it still, and a tap on the dim closes it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".nav-burger").tap();
    await expect(page.locator(".nav-links")).toBeVisible();
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
    ).toBe("hidden");
    await page.touchscreen.tap(195, 700);
    await expect(page.locator(".nav-burger")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.locator(".nav-links")).toBeHidden();
  });

  test("a story is a full-width sheet with Previous and Next pinned in view", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#row-ohse").tap();
    const story = page.locator("#story-ohse");
    await expect(story).toBeVisible();
    await settle(story);
    const box = await story.boundingBox();
    expect(box?.width).toBe(390);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(844, 0);
    // Before any scroll, the bar sits on the bottom edge, inside the screen.
    const bar = await story.locator(".st-nav").boundingBox();
    expect((bar?.y ?? 0) + (bar?.height ?? 0)).toBeLessThanOrEqual(844);
    expect(bar?.y ?? 0).toBeGreaterThan(700);
    await story.locator("[data-dir='next']").tap();
    await expect(page.locator("#story-digest")).toBeVisible();
  });

  test("pulling the sheet down by its head closes it", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "touch drags go through CDP");
    await page.goto("/");
    await page.locator("#row-mcp").tap();
    const story = page.locator("#story-mcp");
    await expect(story).toBeVisible();
    await settle(story);
    const head = await story.locator(".st-head").boundingBox();
    const x = (head?.x ?? 0) + 120;
    const y = (head?.y ?? 0) + 30;
    const cdp = await page.context().newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      dy?: number,
    ) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: dy === undefined ? [] : [{ x, y: y + dy }],
      });
    await touch("touchStart", 0);
    for (let dy = 20; dy <= 140; dy += 20) await touch("touchMove", dy);
    await touch("touchEnd");
    await expect(story).toBeHidden();
    await expect(page.locator("#row-mcp")).toBeFocused();
  });
});
