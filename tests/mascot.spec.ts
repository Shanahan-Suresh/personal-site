import { test, expect } from "@playwright/test";

/**
 * Behaviour + regression coverage for the hero rappel mascot.
 *
 * The headline regression locked down here: the sprite is a height-sized <img>
 * inside a width:0 transform anchor. The global `img { max-width: 100% }` reset
 * resolved that 100% against the zero-width parent and clamped the sprite to ~2px
 * wide — rope visible, character invisible. `max-width: none` on .mascot-sprite
 * restores intrinsic-ratio sizing. The first test fails if that regresses.
 */
// SKIPPED: the hero mascot is parked as WIP and is not mounted (see src/components/Mascot.astro
// and the commented-out <Mascot /> in src/pages/index.astro). These specs are kept, not deleted,
// and should be re-enabled (.skip removed) when the mascot is brought back. Do not delete them.
test.describe.skip("hero mascot", () => {
  test("renders the settled sprite at its image-derived width", async ({ page }) => {
    await page.goto("/");

    const stage = page.locator(".mascot-stage");
    await expect(stage).toBeAttached();
    // entrance runs a rAF timeline, then flips to the settled hang
    await expect(stage).toHaveClass(/is-settled/, { timeout: 10_000 });

    const sprite = page.locator(".mascot-sprite");
    await expect(sprite).toBeVisible();

    const box = await sprite.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(20); // the bug rendered this ~2px
    expect(box!.height).toBeGreaterThan(20);

    // width must track the loaded image's aspect ratio, not collapse to 0
    const img = await sprite.evaluate((el: HTMLImageElement) => ({
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      complete: el.complete,
    }));
    expect(img.complete).toBe(true);
    expect(img.naturalWidth).toBeGreaterThan(0);
    expect(box!.width / box!.height).toBeCloseTo(img.naturalWidth / img.naturalHeight, 1);
  });

  test("hides on mobile viewports (<820px)", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto("/");
    await expect(page.locator(".mascot-stage")).toBeHidden();
  });

  test("parks a static sprite with no rope under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".mascot-sprite")).toBeVisible();
    await expect(page.locator(".mascot-rope")).toBeHidden();
    // reduced motion parks the static standing pose — confirm the correct sprite
    const src = await page.locator(".mascot-sprite").getAttribute("src");
    expect(src).toMatch(/mascot-static\.png$/);
  });

  test("settles standing beside the card with the rope gone", async ({ page }) => {
    // Use a standard desktop viewport; the config default is fine but pin it for clarity
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const stage = page.locator(".mascot-stage");
    // Wait for the full rope-swing entrance to complete and reach the settled state
    await expect(stage).toHaveClass(/is-settled/, { timeout: 10_000 });

    // Sprite should be visible and showing the standing-wave pose
    const sprite = page.locator(".mascot-sprite");
    await expect(sprite).toBeVisible();
    const src = await sprite.getAttribute("src");
    expect(src).toMatch(/mascot-wave\.png$/);

    // Rope should not be visible once settled (its height animates to 0)
    await expect(page.locator(".mascot-rope")).toBeHidden();

    // Mascot stands in the right gutter — its horizontal centre must be to the
    // right of the .hero-facts card's right edge (allow 4px snug-fit tolerance)
    const spriteBox = await sprite.boundingBox();
    const card = page.locator(".hero-facts");
    const cardBox = await card.boundingBox();
    expect(spriteBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    const spriteCenterX = spriteBox!.x + spriteBox!.width / 2;
    const cardRight = cardBox!.x + cardBox!.width;
    expect(spriteCenterX).toBeGreaterThan(cardRight - 4);
  });
});
