import { test, expect } from "@playwright/test";
import { trackTransfers } from "./transfer";
import { ARRIVAL_BUDGET, SCROLLED_BUDGET, STORY_IDS } from "./fixtures";

test("project rows and stories carry the right media, captions and links", async ({
  page,
}) => {
  await page.goto("/");
  const rows = page.locator(".projects .pr");
  await expect(rows).toHaveCount(STORY_IDS.length);

  // Each row's pointer preview is a small WebP that loads on first hover.
  for (const row of await rows.all()) {
    await expect(row).toHaveAttribute("data-peek", /\.webp$/);
  }
  const story = (id: string) => page.locator(`#story-${id}`);
  for (const id of STORY_IDS) {
    await expect(story(id).locator(".media-frame img")).toHaveCount(1);
  }
  await expect(story("rsvp").locator(".media-frame img")).toHaveAttribute(
    "alt",
    /registration form.*scannable QR/,
  );
  await expect(story("censorit")).toContainText(
    "Cabanel's The Birth of Venus (1875)",
  );
  // The painting is public domain and needs no link; the record of its
  // source lives in src/assets/README.md.
  await expect(
    story("censorit").locator('a[href^="https://www.metmuseum.org"]'),
  ).toHaveCount(0);
  await expect(story("mcp").locator(".media-frame img")).toHaveAttribute(
    "alt",
    /MCP tools generated/,
  );
  await expect(
    story("heatgen").locator('a[href*="jestec.taylors.edu.my"]'),
  ).toHaveAttribute(
    "href",
    "https://jestec.taylors.edu.my/Vol%2018%20Issue%202%20April%202023/18_2_16.pdf",
  );
  await expect(story("heatgen")).toContainText("Read the paper");
  await expect(story("hr")).toContainText("page loads got 63% faster");
  await expect(page.locator("[class*='mascot']")).toHaveCount(0);
  await expect(page.locator("#work")).not.toContainText(
    /synthetic|sample data|illustrative redesign|source components|production HTML|public framework demo/i,
  );
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`media loads within transfer budgets at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    const transferredBytes = trackTransfers(page);
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "networkidle" });
    const initial = await transferredBytes();
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThan(ARRIVAL_BUDGET);

    // Shown images only: closed story dialogs and the thumbnails hidden on
    // wide screens load on demand, which is what keeps the budget.
    const images = page.locator("main img").filter({ visible: true });
    expect(await images.count()).toBeGreaterThan(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((element) => {
            const img = element as HTMLImageElement;
            return img.complete && img.naturalWidth > 0;
          }),
        )
        .toBe(true);
      expect(Number(await image.getAttribute("width"))).toBeGreaterThan(0);
      expect(Number(await image.getAttribute("height"))).toBeGreaterThan(0);
      if ((await image.getAttribute("aria-hidden")) !== "true") {
        expect((await image.getAttribute("alt"))?.trim()).toBeTruthy();
      }
    }
    await page.waitForLoadState("networkidle");
    const full = await transferredBytes();
    expect(full).toBeLessThan(SCROLLED_BUDGET);
    await testInfo.attach("transfer-measurements", {
      body: JSON.stringify({ viewport, initial, full }),
      contentType: "application/json",
    });
  });
}

for (const width of [390, 600, 1440]) {
  test(`media stays within the viewport in both themes at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion });
      await page.goto("/");
      for (const theme of ["light", "dark"]) {
        await page.evaluate((nextTheme) => {
          document.documentElement.classList.toggle(
            "dark",
            nextTheme === "dark",
          );
        }, theme);
        const bounds = await page
          .locator(".media-frame")
          .evaluateAll((frames) =>
            frames.map((frame) => {
              const rect = frame.getBoundingClientRect();
              return { left: rect.left, right: rect.right };
            }),
          );
        for (const frame of bounds) {
          expect(frame.left).toBeGreaterThanOrEqual(0);
          expect(frame.right).toBeLessThanOrEqual(width);
        }
        // On failure, name what runs past the edge: the innermost boxes,
        // text that spills out of its box, and whether the fonts are in.
        const overflow = await page.evaluate((vw) => {
          const name = (el: Element) => {
            const cls = [...el.classList].join(".");
            return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
          };
          const past = (el: Element) => el.getBoundingClientRect().right > vw;
          const boxes = [...document.querySelectorAll("*")]
            .filter((el) => past(el) && ![...el.children].some(past))
            .map(
              (el) =>
                `${name(el)} right=${Math.round(el.getBoundingClientRect().right)}`,
            );
          const texts: string[] = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
          );
          const range = document.createRange();
          while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            if (!node.data.trim() || !node.parentElement) continue;
            range.selectNodeContents(node);
            const right = Math.max(
              0,
              ...[...range.getClientRects()].map((r) => r.right),
            );
            if (right > vw)
              texts.push(
                `text in ${name(node.parentElement)} "${node.data.trim().slice(0, 24)}" right=${Math.round(right)}`,
              );
          }
          const fonts = [...document.fonts]
            .map((f) => `${f.family} ${f.weight} ${f.status}`)
            .join(", ");
          return {
            width: document.documentElement.scrollWidth,
            culprits: [...boxes, ...texts].slice(0, 6),
            fonts,
          };
        }, width);
        expect(
          overflow.width,
          `${theme}, ${reducedMotion}: ${overflow.culprits.join("; ")} | fonts: ${overflow.fonts}`,
        ).toBeLessThanOrEqual(width);
        if (reducedMotion === "reduce") {
          await expect(page.locator(".shots .face")).toHaveCSS("opacity", "1");
          if (testInfo.project.name === "chromium") {
            for (const image of await page
              .locator("main img")
              .filter({ visible: true })
              .all()) {
              await image.scrollIntoViewIfNeeded();
              await expect
                .poll(() =>
                  image.evaluate((element) => {
                    const img = element as HTMLImageElement;
                    return img.complete && img.naturalWidth > 0;
                  }),
                )
                .toBe(true);
            }
            await page.evaluate(() => window.scrollTo(0, 0));
            await testInfo.attach(`layout-${width}-${theme}`, {
              body: JSON.stringify(
                await page.locator("main > section").evaluateAll((sections) =>
                  sections.map((section) => {
                    const element = section as HTMLElement;
                    return {
                      id: element.id,
                      top: element.offsetTop,
                      height: element.offsetHeight,
                    };
                  }),
                ),
              ),
              contentType: "application/json",
            });
            await testInfo.attach(`media-${width}-${theme}-reduced-motion`, {
              body: await page.screenshot({
                fullPage: true,
                type: "jpeg",
                quality: 90,
                animations: "disabled",
              }),
              contentType: "image/jpeg",
            });
          }
        }
      }
    }
  });
}
