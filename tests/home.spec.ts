import { test, expect } from "@playwright/test";
import { trackTransfers } from "./transfer";

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

  // Work section — all seven project rows, each with its story dialog
  const workSection = page.locator("#work");
  await expect(workSection).toBeAttached();
  await expect(workSection.locator(".projects .pr")).toHaveCount(7);
  await expect(workSection.locator("dialog.story")).toHaveCount(7);

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

test("mobile menu: the burger opens it; Escape, an outside tap or a link closes it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/");
  const burger = page.locator(".nav-burger");
  const links = page.locator(".nav-links");
  await expect(burger).toHaveAttribute("aria-label", "Menu");

  await burger.click();
  await expect(burger).toHaveAttribute("aria-expanded", "true");
  await expect(links).toBeVisible();
  await links.locator("a.nav-link").first().focus();
  await page.keyboard.press("Escape");
  await expect(burger).toHaveAttribute("aria-expanded", "false");
  await expect(links).toBeHidden();
  await expect(burger).toBeFocused();

  await burger.click();
  await expect(links).toBeVisible();
  await page.mouse.click(300, 800);
  await expect(burger).toHaveAttribute("aria-expanded", "false");

  await burger.click();
  await links.locator('a[href="/#about"]').click();
  await expect(burger).toHaveAttribute("aria-expanded", "false");
  await expect(links).toBeHidden();
});

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
  const number = page.locator(".nums a[data-story='heatgen']");
  await number.click();
  await expect(page.locator("#story-heatgen")).toBeVisible();
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

test.describe("pointer preview", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a mouse over a row shows its preview", async ({ page }) => {
    await page.goto("/");
    await page.locator("#row-ohse").hover();
    await expect(page.locator("#peek")).toHaveClass(/\bon\b/);
    await expect(page.locator("#peek img")).toHaveAttribute("src", /\.webp/);
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
      expect(
        await page.locator("#peek img").getAttribute("src"),
        "The preview image should never load on touch",
      ).toBeNull();
    });
  });
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

  test("the copy button stays hidden; the mailto link is the control", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#contact .copy")).toBeHidden();
    await expect(page.locator("#contact a.mail")).toBeVisible();
  });
});

// ── Copy email ──────────────────────────────────────────────────────────────
test("the copy button puts the email on the clipboard and says so", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Only Chromium grants clipboard permissions to a test",
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const copy = page.locator("#contact .copy");
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(copy).toHaveText("Copied");
  await expect(page.locator("[data-copy-status]")).toHaveText(
    "Email address copied",
  );
  const href = await page.locator("#contact a.mail").getAttribute("href");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    href?.replace("mailto:", ""),
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

// ── 8. Scrolled-nav ───────────────────────────────────────────────────────────
test("scrolled-nav: scrolling down adds is-scrolled to .nav-header; scrolling to top removes it", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator(".nav-header");
  await expect(header).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(header).toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveClass(/is-scrolled/);
});

// ── 9. Scroll-spy ─────────────────────────────────────────────────────────────
test("scroll-spy: scrolling to #work section activates the Work nav link", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#work").scrollIntoViewIfNeeded();
  const workLink = page.locator('a.nav-link[href="/#work"]');
  await expect(workLink).toHaveClass(/is-active/);
  await expect(workLink).toHaveAttribute("aria-current", "true");
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
    await page.waitForTimeout(1000); // let the headline lines finish rising
    const cut = await page.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("body *")) {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (s.display === "none" || r.width === 0 || el.closest("dialog"))
          continue;
        const framed =
          s.boxShadow !== "none" ||
          ["Top", "Right", "Bottom", "Left"].some(
            (k) =>
              parseFloat(
                s.getPropertyValue(`border-${k.toLowerCase()}-width`),
              ) > 0,
          );
        if (!framed) continue;
        for (
          let a = el.parentElement;
          a && a !== document.body;
          a = a.parentElement
        ) {
          const as = getComputedStyle(a);
          if (!/hidden|clip/.test(as.overflowX + as.overflowY)) continue;
          const ar = a.getBoundingClientRect();
          if (
            r.top < ar.top - 1 ||
            r.left < ar.left - 1 ||
            r.bottom > ar.bottom + 1 ||
            r.right > ar.right + 1
          )
            found.push(`${el.tagName.toLowerCase()}.${el.className}`);
          break;
        }
      }
      return found;
    });
    expect(cut).toEqual([]);
  });
}

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
test("home page stays under the 350 KiB initial transfer budget", async ({
  page,
}) => {
  const transferredBytes = trackTransfers(page);
  await page.goto("/", { waitUntil: "networkidle" });
  const total = await transferredBytes();
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThan(350 * 1024);
});

// ── Colophon ────────────────────────────────────────────────────────────────
test("colophon renders with a live test count and repo deep links", async ({
  page,
}) => {
  const response = await page.goto("/colophon/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("h1")).toContainText(/how this site is built/i);
  const repoLinks = page.locator(
    'a[href^="https://github.com/Shanahan-Suresh/personal-site/blob/main/"]',
  );
  expect(await repoLinks.count()).toBeGreaterThan(3);
  // The test count is computed from the suite at build time; must be numeric
  await expect(page.locator(".stat-value").last()).toHaveText(/^\d+$/);
});

// ── Placeholder guard (belt and braces to scripts/guard-placeholders.mjs) ───
// Without ALLOW_PLACEHOLDERS the build itself refuses to run, so this test
// only ever sees a site with no placeholders in it. With the flag set (local
// builds) it is skipped with a note, so the suite stays usable while images
// are being sourced.
test("no placeholder image is rendered", async ({ page }) => {
  test.skip(
    process.env.ALLOW_PLACEHOLDERS === "1",
    "ALLOW_PLACEHOLDERS=1: local build, placeholder images permitted",
  );
  await page.goto("/");
  // Astro keeps the source file name in front of its hash, so a placeholder
  // would show up here. The sentinel proves the names survive.
  await expect(
    page.locator('img[src*="rsvp-redesign"]').first(),
  ).toBeAttached();
  const placeholders = page.locator('img[src*="placeholder"]');
  await expect(placeholders).toHaveCount(0);
});

// ── CSP: hashed inline scripts, no unsafe-inline ────────────────────────────
// Cloudflare applies dist/_headers; astro preview does not, so assert on the
// file the build produced rather than on a response header.
test("built _headers carries a hash for every inline script and no unsafe-inline in script-src", async () => {
  const { readFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  const headers = readFileSync("dist/_headers", "utf8");
  const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1] ?? "";
  const scriptSrc = /script-src\s+([^;]+)/.exec(csp)?.[1] ?? "";
  expect(scriptSrc).not.toContain("unsafe-inline");
  expect(scriptSrc).not.toContain("__CSP_SCRIPT_HASHES__");

  const html = readFileSync("dist/index.html", "utf8");
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/\bsrc=/.test(attrs) && !/ld\+json/.test(attrs))
    .map(([, , body]) => createHash("sha256").update(body).digest("base64"));
  expect(inline.length).toBeGreaterThan(0);
  for (const h of inline) expect(scriptSrc).toContain(`'sha256-${h}'`);
});
