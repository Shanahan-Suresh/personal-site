/* Pointer preview (Work.astro #peek): a screenshot follows the mouse across
   the project rows. It never covers the row being read: it sits below the
   row or above it, and keeps that side while it fits, so moving between rows
   glides a short way. When it no longer fits, it hops to the other side with
   a quick fade rather than sliding across the row. CSS hides it on touch
   screens and below 960px. Every row's picture decodes when the mouse first
   reaches the list, and a new picture wipes in over the last only once it is
   ready, with its caption. The panel takes each picture's own shape, so
   nothing is cropped: it is 30% of the window wide (380 to 460px), narrower
   when that would make the picture taller than 42% of the window, and it
   eases between sizes. */
import { listen, reduce, teardowns } from "./runtime";

/* Preview placement, in CSS pixels. */
const PEEK_MARGIN = 12; // kept clear between the panel and the window edges
const PEEK_GAP_ABOVE = 16; // between a row's top and the panel above it
const PEEK_GAP_BELOW = 16; // between a row's bottom and the caption tab of the panel below it
const PEEK_W = [380, 0.3, 460] as const; // min px, share of the window width, max px (Work.astro holds a starting width)
const PEEK_MAX_H = 0.42; // the picture's height, as a share of the window height
const PEEK_SEAM = 3; // the panel's border (--seam in tokens.css)
const PEEK_FOCUS_AT = 0.42; // keyboard focus: the panel centres this far across the row
const PEEK_EASE = 0.16; // share of the remaining distance covered per 60 Hz frame
const PEEK_WIPE_MS = 320; // a new picture wiping down over the last
const PEEK_HOP_MS = 140; // the fade when the panel changes sides

type Side = "below" | "above";

/* What placement reads from the page at one moment. */
interface Bounds {
  /** The caption tab's height; it rides above the panel. */
  tab: number;
  /** The highest the panel may sit: clear of the sticky nav bar and its tab. */
  top: number;
}

/* The panel's size for a picture of shape `r`, borders included. It is no
   taller than `roomH`, the free height on the roomier side of the row, so it
   never covers the row or tucks under the nav bar. */
function sizeFor(r: number, roomH: number): [number, number] {
  const [lo, share, hi] = PEEK_W;
  const wide = Math.min(hi, Math.max(lo, window.innerWidth * share));
  const w = Math.min(
    wide,
    window.innerHeight * PEEK_MAX_H * r,
    (roomH - 2 * PEEK_SEAM) * r,
  );
  return [w + 2 * PEEK_SEAM, w / r + 2 * PEEK_SEAM];
}

/* The free height beside a row: below it or above it, whichever is larger. */
function roomBeside(row: DOMRect, at: Bounds): number {
  const below =
    window.innerHeight - PEEK_MARGIN - row.bottom - PEEK_GAP_BELOW - at.tab;
  return Math.max(below, row.top - PEEK_GAP_ABOVE - at.top);
}

function fits(row: DOMRect, h: number, s: Side, at: Bounds): boolean {
  return s === "below"
    ? row.bottom + PEEK_GAP_BELOW + at.tab + h <=
        window.innerHeight - PEEK_MARGIN
    : row.top - h - PEEK_GAP_ABOVE >= at.top;
}

/* The side for a panel of height `h`: a fresh show takes the roomier half of
   the window; after that the panel keeps its side while it fits. */
function chooseSide(
  row: DOMRect,
  h: number,
  current: Side,
  fresh: boolean,
  at: Bounds,
): Side {
  const prefer: Side =
    row.top + row.height / 2 < window.innerHeight / 2 ? "below" : "above";
  const keep = fresh ? prefer : current;
  const other: Side = keep === "below" ? "above" : "below";
  return fits(row, h, keep, at)
    ? keep
    : fits(row, h, other, at)
      ? other
      : prefer;
}

/* Where the panel's corner goes for a pointer at `tx`, beside `row` on
   `side`. Without a row it keeps its height `y`. */
function placeFor(
  tx: number,
  y: number,
  row: DOMRect | null,
  [w, h]: [number, number],
  side: Side,
  at: () => Bounds,
): [number, number] {
  const px = Math.max(
    PEEK_MARGIN,
    Math.min(tx - w / 2, window.innerWidth - w - PEEK_MARGIN),
  );
  if (!row) return [px, y];
  const { tab, top } = at();
  const py =
    side === "below"
      ? row.bottom + PEEK_GAP_BELOW + tab
      : row.top - h - PEEK_GAP_ABOVE;
  return [
    px,
    Math.max(top, Math.min(py, window.innerHeight - h - PEEK_MARGIN)),
  ];
}

/* Decodes each picture once; later asks share the same wait. */
function pictureLoader(): (src: string) => Promise<void> {
  const ready = new Map<string, Promise<void>>();
  return (src) => {
    let done = ready.get(src);
    if (!done) {
      const im = new Image();
      im.src = src;
      done = im.decode().catch(() => {});
      ready.set(src, done);
    }
    return done;
  };
}

export function initPreview(): void {
  const peek = document.getElementById("peek");
  const pics = peek?.querySelector<HTMLElement>(".peek-pics");
  const cap = peek?.querySelector<HTMLElement>(".peek-cap");
  const list = document.querySelector<HTMLElement>("#work .projects");
  if (!peek || !pics || !list) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const rows = Array.from(list.querySelectorAll<HTMLElement>(".pr"));
  let ratio = 16 / 10; // the shown picture's width over its height
  let tx = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  let then = 0;
  let shown = false;
  let row: HTMLElement | null = null;
  let side: Side = "below";
  let want = ""; // the picture asked for last
  let showing = ""; // the picture on top of the stack
  let roomH = Infinity; // the free height beside the row, read at each resize
  const dense = window.devicePixelRatio > 1;
  const srcOf = (el: HTMLElement) =>
    (dense && el.dataset.peekHd) || el.dataset.peek || "";

  const load = pictureLoader();
  const warm = () =>
    rows.forEach((el) => {
      const src = srcOf(el);
      if (src) void load(src);
    });

  const navBar = document.querySelector<HTMLElement>(".nav-header");
  const bounds = (): Bounds => {
    // The caption tab may wrap to two lines.
    const tab = cap?.textContent ? cap.offsetHeight : 0;
    const navBottom = Math.max(0, navBar?.getBoundingClientRect().bottom ?? 0);
    return { tab, top: navBottom + PEEK_MARGIN + tab };
  };
  const room = () =>
    row ? roomBeside(row.getBoundingClientRect(), bounds()) : Infinity;
  const resize = (instant: boolean) => {
    roomH = room();
    const [w, h] = sizeFor(ratio, roomH);
    peek.classList.toggle("snap", instant);
    peek.style.width = `${w}px`;
    pics.style.height = `${h - 2 * PEEK_SEAM}px`;
  };
  /* Returns true when the panel changes sides under a visible pointer. */
  const pickSide = (fresh: boolean): boolean => {
    if (!row) return false;
    const r = row.getBoundingClientRect();
    const next = chooseSide(r, sizeFor(ratio, roomH)[1], side, fresh, bounds());
    const flipped = next !== side;
    side = next;
    return flipped && !fresh;
  };
  const target = (): [number, number] =>
    placeFor(
      tx,
      y,
      row?.getBoundingClientRect() ?? null,
      sizeFor(ratio, roomH),
      side,
      bounds,
    );
  const tick = (now: number) => {
    /* A scroll changes the room beside the row: refit the panel. */
    if (showing && Math.abs(room() - roomH) > 8) resize(false);
    if (pickSide(false)) {
      [x, y] = target();
      if (!reduce)
        peek.animate(
          { opacity: [0, 1] },
          { duration: PEEK_HOP_MS, easing: "ease-out" },
        );
    }
    const [px, py] = target();
    const frames = then ? Math.min(4, (now - then) / (1000 / 60)) : 1;
    const k = reduce ? 1 : 1 - Math.pow(1 - PEEK_EASE, frames);
    then = now;
    x += (px - x) * k;
    y += (py - y) * k;
    peek.style.transform = `translate3d(${x}px,${y}px,0)`;
    raf = shown ? requestAnimationFrame(tick) : 0;
    if (!raf) then = 0;
  };

  /* Puts the row's picture on top once it has decoded. A newer row wins. */
  const swap = async (el: HTMLElement, instant: boolean) => {
    const src = srcOf(el);
    if (!src) return;
    if (src !== want) {
      want = src;
      await load(src);
      if (want !== src) return;
      const pic = document.createElement("img");
      pic.alt = "";
      pic.src = src;
      pic.style.objectPosition = el.dataset.peekPos || "top";
      pics.append(pic);
      showing = src;
      if (cap) cap.textContent = el.dataset.peekCap || "";
      ratio = Number(el.dataset.peekRatio) || 16 / 10;
      // The first picture of a hover, or a reduced-motion one, lands at once.
      const atOnce = reduce || instant || !peek.classList.contains("on");
      resize(atOnce);
      const drop = () => {
        while (pics.firstElementChild && pics.firstElementChild !== pic)
          pics.firstElementChild.remove();
      };
      if (atOnce) drop();
      else
        pic
          .animate(
            { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"] },
            {
              duration: PEEK_WIPE_MS,
              easing: "cubic-bezier(0.2, 0.85, 0.2, 1)",
            },
          )
          .finished.then(drop, drop);
    }
    if (shown && showing === src) peek.classList.add("on");
  };

  const show = (el: HTMLElement) => {
    const fresh = !shown;
    row = el;
    shown = true;
    if (fresh) {
      pickSide(true);
      [x, y] = target();
    }
    void swap(el, fresh);
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const hide = () => {
    shown = false;
    peek.classList.remove("on");
  };

  /* The list, not each row, decides when the panel goes: crossing the seam
     between two rows never starts a fade. */
  listen(list, "pointerenter", (e) => {
    if (e.pointerType === "mouse") warm();
  });
  listen(list, "pointerleave", (e) => {
    if (e.pointerType === "mouse") hide();
  });
  rows.forEach((el) => {
    listen(el, "pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      show(el);
    });
    listen(el, "pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
    });
    listen(el, "focus", () => {
      if (!el.matches(":focus-visible")) return;
      warm();
      const r = el.getBoundingClientRect();
      tx = r.left + r.width * PEEK_FOCUS_AT;
      show(el);
    });
    listen(el, "blur", hide);
    listen(el, "click", hide);
  });
  teardowns.push(() => {
    hide();
    cancelAnimationFrame(raf);
  });
}
