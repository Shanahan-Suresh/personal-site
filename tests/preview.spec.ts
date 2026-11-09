import { test, expect } from "@playwright/test";

test.describe("pointer preview", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a mouse over a row shows its preview", async ({ page }) => {
    await page.goto("/");
    await page.locator("#row-ohse").hover();
    await expect(page.locator("#peek")).toHaveClass(/\bon\b/);
    await expect(page.locator("#peek img").last()).toHaveAttribute(
      "src",
      /\.webp/,
    );
  });

  test("the preview never covers the row under the pointer", async ({
    page,
  }) => {
    await page.goto("/");
    for (const id of ["rsvp", "ohse", "heatgen"]) {
      const row = page.locator(`#row-${id}`);
      await row.scrollIntoViewIfNeeded();
      await row.hover();
      await expect(page.locator("#peek")).toHaveClass(/\bon\b/);
      // The panel eases into place; wait for it to settle, then compare boxes.
      await expect
        .poll(async () => {
          const r = await row.boundingBox();
          const p = await page.locator("#peek").boundingBox();
          if (!r || !p) return "missing";
          const apart = p.y >= r.y + r.height || p.y + p.height <= r.y;
          return apart ? "apart" : "overlap";
        })
        .toBe("apart");
    }
  });

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true });

    test("tapping a row opens its story and never shows the preview", async ({
      page,
    }) => {
      await page.goto("/");
      await page.locator("#row-ohse").tap();
      await expect(page.locator("#story-ohse")).toBeVisible();
      await expect(page.locator("#peek")).not.toHaveClass(/\bon\b/);
      await expect(
        page.locator("#peek img"),
        "The preview image should never load on touch",
      ).toHaveCount(0);
    });
  });
});
