import { test, expect } from "@playwright/test";

// ── 6. Project stories ────────────────────────────────────────────────────────
test("corporate stories split into several paragraphs; personal stories have one; TODO marker absent", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("body")).not.toContainText(
    "TODO SPLIT IN PARAGRAPHS",
  );

  // Story text paragraphs sit after the large fact in each dialog.
  const paragraphs = (id: string) =>
    page.locator(`#story-${id} .st-body p:not(.st-fact)`);
  for (const id of ["rsvp", "ohse", "hr"]) {
    expect(
      await paragraphs(id).count(),
      `Expected several paragraphs in story "${id}"`,
    ).toBeGreaterThan(1);
  }
  await expect(paragraphs("censorit")).toHaveCount(1);
});

test("a project row opens its story as a modal; Next moves on; Escape returns focus to the row", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#row-rsvp").click();
  const rsvp = page.locator("#story-rsvp");
  await expect(rsvp).toBeVisible();
  expect(await rsvp.evaluate((d) => d.matches(":modal"))).toBe(true);
  // The address names the open story, so it can be shared.
  expect(new URL(page.url()).hash).toBe("#story-rsvp");

  await rsvp.locator("[data-next]").click();
  await expect(rsvp).toBeHidden();
  await expect(page.locator("#story-hr")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.story[open]")).toHaveCount(0);
  await expect(page.locator("#row-hr")).toBeFocused();
});

test("the close button and a backdrop click close a story and return focus to its row", async ({
  page,
}) => {
  await page.goto("/");
  const row = page.locator("#row-mcp");
  const story = page.locator("#story-mcp");

  await row.click();
  await expect(story).toBeVisible();
  await story.locator("[data-close]").click();
  await expect(story).toBeHidden();
  await expect(row).toBeFocused();

  await row.click();
  await expect(story).toBeVisible();
  // The dialog is centred and narrower than the viewport, so the corner is backdrop.
  await page.mouse.click(5, 5);
  await expect(story).toBeHidden();
  await expect(row).toBeFocused();
});

test("the arrow keys and Previous move between stories; Back closes the story and stays on the page", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#row-ohse").click();
  await expect(page.locator("#story-ohse")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#story-digest")).toBeVisible();
  await expect(page.locator("#story-ohse")).toBeHidden();
  expect(new URL(page.url()).hash).toBe("#story-digest");

  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#story-ohse")).toBeVisible();
  await page.locator("#story-ohse [data-dir='prev']").click();
  await expect(page.locator("#story-hr")).toBeVisible();

  // Moving between stories replaces the entry, so one Back closes them all.
  await page.goBack();
  await expect(page.locator("dialog.story[open]")).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(page.url()).hash).toBe("");
});

test("a number in the results strip opens the story behind it and gets focus back", async ({
  page,
}) => {
  await page.goto("/");
  const number = page.locator(".nums a[data-story='ohse']");
  await number.click();
  await expect(page.locator("#story-ohse")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.story[open]")).toHaveCount(0);
  await expect(number).toBeFocused();
  await expect.poll(() => new URL(page.url()).hash).toBe("");
});

test("the hero's RSVP frame opens the RSVP story", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero a[data-story='rsvp']").click();
  await expect(page.locator("#story-rsvp")).toBeVisible();
});

test("a focused row keeps an outline for forced-colors mode", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const row = page.locator("#row-rsvp");
  await row.focus();
  const outline = await row.evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.outlineStyle} ${s.outlineWidth}`;
  });
  expect(outline).toBe("solid 4px");
});

test("a shared #story link opens that story", async ({ page }) => {
  await page.goto("/#story-heatgen");
  await expect(page.locator("#story-heatgen")).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a story link still shows the story", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#story-mcp")).toBeHidden();
    await page.locator("#row-mcp").click();
    await expect(page.locator("#story-mcp")).toBeVisible();
    await expect(page.locator(".hero-headline")).toBeVisible();
  });

  test("Previous and Next still move between stories", async ({ page }) => {
    await page.goto("/#story-mcp");
    await expect(page.locator("#story-mcp")).toBeVisible();
    await page.locator("#story-mcp [data-dir='prev']").click();
    await expect(page.locator("#story-digest")).toBeVisible();
    await expect(page.locator("#story-mcp")).toBeHidden();
    await page.locator("#story-digest [data-dir='next']").click();
    await expect(page.locator("#story-mcp")).toBeVisible();
  });
});
