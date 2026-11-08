import { test, expect, type Page } from "@playwright/test";

/* Behaviour of src/scripts/home/ that home.spec.ts does not
   reach: the list stagger, the image fade, the hero label's brush and flip,
   the typing chip, the console note, the preview's keyboard path and shape,
   and the story swipe and Forward. */

/* Waits for every animation that ends (the headline rise, the reveals), so
   a box measured next is where the pointer will find it. Endless ones, such
   as the code chip's caret blink, are left running. */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const ends = () =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity);
    // A reveal starts a frame or two after its block is seen.
    await frame();
    await frame();
    for (let i = 0; i < 5 && ends().some((a) => a.playState === "running"); i++)
      await Promise.all(ends().map((a) => a.finished.catch(() => undefined)));
  });

/* The element's box once it holds still for two reads in a row. */
const box = async (page: Page, selector: string) => {
  await settle(page);
  const read = async () => {
    const b = await page.locator(selector).first().boundingBox();
    if (!b) throw new Error(`${selector} has no box`);
    return b;
  };
  let last = await read();
  await expect
    .poll(async () => {
      const b = await read();
      const still = b.x === last.x && b.y === last.y && b.width === last.width;
      last = b;
      return still;
    })
    .toBe(true);
  return last;
};

test.describe("list stagger", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("items rise in order as their list scrolls in", async ({ page }) => {
    await page.goto("/");
    const later = page.locator(".off[data-stagger] > *").first();
    await expect(later).not.toHaveClass(/\bin\b/);

    await page.locator("#work .projects").scrollIntoViewIfNeeded();
    const rows = page.locator("#work .projects > *");
    await expect(rows.first()).toHaveClass(/\bin\b/);
    const steps = await rows.evaluateAll((els) =>
      els
        .filter((el) => el.classList.contains("in"))
        .map((el) => (el as HTMLElement).style.getPropertyValue("--i")),
    );
    // Items of one batch take steps 0, 1, 2 ... in document order.
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toBe("0");
    steps.forEach((s) => expect(s).toMatch(/^\d+$/));
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("every item shows at once, with no step", async ({ page }) => {
      await page.goto("/");
      const items = page.locator("[data-stagger] > *");
      const states = await items.evaluateAll((els) =>
        els.map(
          (el) =>
            el.classList.contains("in") &&
            (el as HTMLElement).style.getPropertyValue("--i") === "",
        ),
      );
      expect(states.length).toBeGreaterThan(0);
      expect(states.every(Boolean)).toBe(true);
    });
  });
});

test.describe("image fade", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a picture that loads late fades in once it has loaded", async ({
    page,
  }) => {
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "image")
        await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });
    await page.goto("/");
    const thumb = page.locator("#work .thumb").first();
    await expect(thumb).toHaveClass(/\bfading\b/);
    await thumb.scrollIntoViewIfNeeded();
    await expect(thumb).toHaveClass(/\bloaded\b/);
    // The hero frames keep their own entrance and never take the fade.
    await expect(page.locator(".hero img.fading")).toHaveCount(0);
  });
});

test.describe("hero label", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const label = ".mk[data-brush]";

  test("the plate fills to the pointer and fills whole again on leave", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator(label);
    const b = await box(page, label);
    const cy = b.y + b.height / 2;
    const brush = () =>
      el.evaluate((e) => (e as HTMLElement).style.getPropertyValue("--brush"));

    await page.mouse.move(b.x + 2, cy);
    await expect(el).toHaveClass(/\bbrushing\b/);
    // A pointer at the left edge still leaves the minimum fill.
    expect(await brush()).toBe("24px");

    await page.mouse.move(b.x + b.width * 0.6, cy, { steps: 5 });
    const mid = parseFloat(await brush());
    expect(mid).toBeGreaterThan(24);
    expect(mid).toBeLessThan(b.width);

    await page.mouse.move(b.x + b.width + 200, cy + 200);
    await expect(el).not.toHaveClass(/\bbrushing\b/);
  });

  test("a click spins it upside down, and it turns back the right way up", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const el = page.locator(label);
    const style = (name: string) =>
      el.evaluate((e, n) => (e as HTMLElement).style.getPropertyValue(n), name);

    await el.click();
    await page.clock.runFor(1500);
    await expect(el).toHaveClass(/\bturned\b/);
    expect(await style("--flip")).toBe("rotateX(180deg)");
    expect(await style("--flip-m")).toBe("-1");

    // Upside down it waits, then turns slowly back.
    await page.clock.runFor(1400 + 1800 + 300);
    await expect(el).not.toHaveClass(/\bturned\b/);
    expect(await style("--flip")).toBe("none");
    expect(await style("--flip-m")).toBe("1");
  });

  test("a fast vertical swipe spins it; a slow move only fills the plate", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator(label);
    const b = await box(page, label);
    const cx = b.x + b.width / 2;

    // Slow: one pixel per event never passes the swipe speed.
    await page.mouse.move(cx, b.y + 4);
    await page.mouse.move(cx, b.y + b.height - 4, {
      steps: Math.round(b.height),
    });
    await expect(el).toHaveClass(/\bbrushing\b/);
    await expect(el).not.toHaveClass(/\bturned\b/);

    // Fast: the whole height between two events of one task, so a busy
    // machine cannot stretch the gap and slow the swipe down.
    await el.evaluate(
      (e, { x, top, bottom }) => {
        for (const y of [bottom, top])
          e.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles: true,
              clientX: x,
              clientY: y,
              pointerType: "mouse",
            }),
          );
      },
      { x: cx, top: b.y + 4, bottom: b.y + b.height - 4 },
    );
    await expect(el).toHaveClass(/\bturned\b/);
  });
});

test.describe("typing chip", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("it types its new line on hover and its own words on leave", async ({
    page,
  }) => {
    await page.goto("/#about");
    const chip = page.locator("[data-type]");
    const own = (await chip.textContent()) ?? "";
    const line = (await chip.getAttribute("data-type")) ?? "";
    expect(own).not.toBe(line);

    await chip.scrollIntoViewIfNeeded();
    await settle(page);
    await chip.hover();
    await expect(chip).toHaveClass(/\btyping\b/);
    await expect(chip).toHaveText(line);

    await page.mouse.move(1400, 880);
    await expect(chip).toHaveText(own);
    await expect(chip).not.toHaveClass(/\btyping\b/);
    expect(await chip.evaluate((e) => (e as HTMLElement).style.minWidth)).toBe(
      "",
    );
  });
});

test("the console greets developers once, with the colophon link", async ({
  page,
}) => {
  const lines: string[] = [];
  page.on("console", (m) => lines.push(m.text()));
  await page.goto("/");
  await expect
    .poll(() => lines.filter((l) => l.includes("LET'S BUILD.")).length)
    .toBe(1);
  const origin = new URL(page.url()).origin;
  expect(lines.some((l) => l.includes(`${origin}/colophon`))).toBe(true);
});

test.describe("pointer preview, more", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("keyboard focus on a row shows its preview; leaving the row hides it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const row = page.locator("#row-ohse");
    await row.focus();
    await expect(page.locator("#peek")).toHaveClass(/\bon\b/);
    await row.evaluate((el) => (el as HTMLElement).blur());
    await expect(page.locator("#peek")).not.toHaveClass(/\bon\b/);
  });

  test("the panel takes the picture's own shape within its width limit", async ({
    page,
  }) => {
    await page.goto("/");
    for (const id of ["rsvp", "ohse"]) {
      const row = page.locator(`#row-${id}`);
      await row.scrollIntoViewIfNeeded();
      await row.hover();
      const ratio = Number(await row.getAttribute("data-peek-ratio")) || 1.6;
      // The picture's name, without the hash that differs between SD and HD.
      const name = /\/_astro\/([^.]+)\./.exec(
        (await row.getAttribute("data-peek")) ?? "",
      )?.[1];
      expect(name).toBeTruthy();
      // The panel resizes once the row's own picture has decoded.
      await expect(page.locator("#peek img").last()).toHaveAttribute(
        "src",
        new RegExp(name ?? ""),
      );
      const [w, h] = await page.evaluate(() => {
        const peek = document.getElementById("peek")!;
        const pics = peek.querySelector<HTMLElement>(".peek-pics")!;
        return [parseFloat(peek.style.width), parseFloat(pics.style.height)];
      });
      // Borders (2 x 3px) wrap the picture; the picture keeps its ratio.
      expect((w - 6) / h).toBeCloseTo(ratio, 2);
      expect(w).toBeLessThanOrEqual(466);
    }
  });
});

test.describe("stories, more", () => {
  test("Forward after Back opens the story again, and closing it stays put", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#row-rsvp").click();
    const story = page.locator("#story-rsvp");
    await expect(story).toBeVisible();
    // The close event lands a few ms after the dialog closes. The page's own
    // handler runs before this listener, so once it fires the story is fully
    // closed; a Forward sooner than that is faster than any visitor.
    type Win = { storyClosed: Promise<void> };
    await story.evaluate((d) => {
      (window as unknown as Win).storyClosed = new Promise((r) =>
        d.addEventListener("close", () => r(), { once: true }),
      );
    });
    await page.goBack();
    await page.evaluate(() => (window as unknown as Win).storyClosed);
    await expect(page.locator("dialog.story[open]")).toHaveCount(0);
    await expect(page.locator("#row-rsvp")).toBeFocused();
    await page.goForward();
    await expect(page.locator("#story-rsvp")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog.story[open]")).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("a sideways swipe moves to the next and the previous story", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "touch drags go through CDP");
      await page.goto("/");
      await page.locator("#row-ohse").tap();
      const story = page.locator("#story-ohse");
      await expect(story).toBeVisible();
      await story.evaluate((d) =>
        Promise.all(d.getAnimations().map((a) => a.finished)),
      );
      const cdp = await page.context().newCDPSession(page);
      const swipe = async (from: number, to: number) => {
        const y = 600;
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: from, y }],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: to, y }],
        });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      };
      await swipe(320, 120);
      await expect(page.locator("#story-digest")).toBeVisible();
      await swipe(120, 320);
      await expect(page.locator("#story-ohse")).toBeVisible();
    });
  });
});
