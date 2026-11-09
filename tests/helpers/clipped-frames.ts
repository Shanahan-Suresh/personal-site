import type { Page } from "@playwright/test";

/**
 * Framed elements (a border or hard shadow) that a clipping ancestor cuts off.
 * Returns one "tag.class" entry per element; an empty list means none.
 */
export function findClippedFrames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
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
            parseFloat(s.getPropertyValue(`border-${k.toLowerCase()}-width`)) >
            0,
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
}
