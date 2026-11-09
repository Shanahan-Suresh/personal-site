/* The theme switch behind ThemeToggle.astro's button and the T shortcut.

   With a mouse, the switch is a pixel dissolve from the button. Going to
   dark, the dark page is cut in through a growing circle whose edge breaks
   into square pixels in an ordered dither, so the new theme arrives square
   by square over the page as it is. Going to light, it plays backwards: the
   dark page shrinks into the button and breaks up square by square. Every
   square shows one page or the other, never a painted colour; a lemon
   sparkle marks each square as it flips.
   On a touch screen the page cross-fades. Without view transitions, or when
   the visitor asks for less motion, it switches at once.
   A click during a switch finishes that one and starts the next from the
   current theme, so the button can be pressed again and again. */
import { BAYER_8 } from "@/lib/bayer";
import { listen } from "./runtime";

const WAVE_MS = 720;
const PIXEL = 10; // one dither square, in CSS px
const SPAN = 160; // how far the dither reaches ahead of the edge
// The dither thresholds, 0 to 1: the centre of each of the 64 steps.
const BAYER = BAYER_8.map((v) => (v + 0.5) / 64);
const SHOW = 1;
const SPARK = 2;

const root = document.documentElement;
let current: ViewTransition | null = null;
let lastClick = 0;

/* One dither square that sits d px ahead of the moving edge, with Bayer
   threshold `at`: SHOW when the page on top shows there, SPARK when it
   flips this frame. Growing shows the new page where flipped; shrinking
   keeps the old page where not flipped yet. */
function square(d: number, at: number, grow: boolean): number {
  if (d <= -PIXEL * 2 || d > SPAN + PIXEL) return 0;
  const density = 1 - (d - PIXEL) / (SPAN - PIXEL);
  const flipped = d <= PIXEL || at < density;
  const show = grow ? flipped : !flipped && d > PIXEL;
  const spark = d > PIXEL && at < density && density - at < 0.1;
  return (show ? SHOW : 0) | (spark ? SPARK : 0);
}

// Both arcs and every rectangle run clockwise, so they add up.
const disk = (x: number, y: number, rad: number) =>
  rad > 0
    ? `M${x - rad} ${y}A${rad} ${rad} 0 1 1 ${x + rad} ${y}A${rad} ${rad} 0 1 1 ${x - rad} ${y}Z`
    : "";

/** One frame of the dissolve around (x, y) with edge radius r, on a grid of
 *  w x h squares. `path` clips the page on top: a smooth disk for the
 *  settled middle plus one rectangle per run of visible squares. `sparks`
 *  holds the index (row * w + column) of each square that sparkles. */
function dissolveFrame(
  w: number,
  h: number,
  x: number,
  y: number,
  r: number,
  grow: boolean,
): { path: string; sparks: number[] } {
  const parts = [disk(x, y, grow ? r - PIXEL : r - SPAN)];
  const sparks: number[] = [];
  for (let j = 0; j < h; j++) {
    const dy = (j + 0.5) * PIXEL - y;
    let run = -1;
    for (let i = 0; i <= w; i++) {
      let s = 0;
      if (i < w) {
        const dist = Math.hypot((i + 0.5) * PIXEL - x, dy);
        const at = BAYER[(j & 7) * 8 + (i & 7)] ?? 1;
        s = square(grow ? dist - r : r - dist, at, grow);
        if (s & SPARK) sparks.push(j * w + i);
      }
      const show = (s & SHOW) !== 0;
      if (show && run < 0) run = i;
      if (!show && run >= 0) {
        const len = (i - run) * PIXEL;
        parts.push(`M${run * PIXEL} ${j * PIXEL}h${len}v${PIXEL}h${-len}z`);
        run = -1;
      }
    }
  }
  return { path: parts.join("") || "M0 0", sparks };
}

/* Paints each frame's sparkle squares lemon, one canvas pixel per square. */
function sparkler(canvas: HTMLCanvasElement): (sparks: number[]) => void {
  const ctx = canvas.getContext("2d");
  const img = ctx?.createImageData(canvas.width, canvas.height);
  if (!ctx || !img) return () => {};
  const px = new Uint32Array(img.data.buffer);
  // The lemon token as one pixel: ImageData is RGBA bytes, which a
  // little-endian Uint32Array reads as ABGR.
  const n = parseInt(
    getComputedStyle(root).getPropertyValue("--lemon").trim().slice(1),
    16,
  );
  const lemon =
    (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0;
  return (sparks) => {
    px.fill(0);
    for (const k of sparks) px[k] = lemon;
    ctx.putImageData(img, 0, 0);
  };
}

/* The dissolve's layers: the sparkle canvas over the page, and the style
   sheet that clips the page on top. `draw(r)` moves the edge to radius r
   and returns false once a newer switch has removed the layers. */
interface Ring {
  el: HTMLElement;
  draw: (r: number) => boolean;
}

function createRing(x: number, y: number, grow: boolean, from: number): Ring {
  const el = document.createElement("div");
  el.id = "theme-ring";
  el.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(window.innerWidth / PIXEL);
  canvas.height = Math.ceil(window.innerHeight / PIXEL);
  canvas.style.width = `${canvas.width * PIXEL}px`;
  canvas.style.height = `${canvas.height * PIXEL}px`;
  el.append(canvas);
  document.body.append(el);
  const paint = sparkler(canvas);
  const pseudo = grow
    ? "::view-transition-new(root)"
    : "::view-transition-old(root)";
  const clip = document.createElement("style");
  clip.id = "theme-clip";
  const draw = (r: number) => {
    if (!el.isConnected || !clip.isConnected) return false;
    const frame = dissolveFrame(canvas.width, canvas.height, x, y, r, grow);
    paint(frame.sparks);
    clip.textContent = `${pseudo}{clip-path:path("${frame.path}")}`;
    return true;
  };
  // The first frame is in place before the pages are drawn.
  document.head.append(clip);
  draw(from);
  return { el, draw };
}

const removeRing = () => {
  document.getElementById("theme-ring")?.remove();
  document.getElementById("theme-clip")?.remove();
};

/* Runs the edge from `from` to `to`. The radius is an animated custom
   property, and each frame draws the clip and the sparkle from its value. */
function runDissolve(ring: Ring, from: number, to: number): void {
  const timing = {
    duration: WAVE_MS,
    easing: "cubic-bezier(0.45, 0, 0.2, 1)",
    fill: "forwards" as const,
  };
  // The switch lasts as long as an animation on its pages does.
  root.animate(
    { opacity: [1, 1] },
    { ...timing, pseudoElement: "::view-transition-group(root)" },
  );
  const radius = ring.el.animate(
    { "--ring-r": [`${from}px`, `${to}px`] },
    timing,
  );
  const frame = () => {
    const r = parseFloat(
      getComputedStyle(ring.el).getPropertyValue("--ring-r"),
    );
    if (ring.draw(r) && radius.playState !== "finished")
      requestAnimationFrame(frame);
  };
  frame();
}

/* Switches the class, the button state and the stored choice. */
function apply(btn: HTMLElement): void {
  const isDark = root.classList.toggle("dark");
  btn.setAttribute("aria-pressed", String(isDark));
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch {
    // Storage can be blocked; the theme still applies for this visit.
  }
}

/* Starts a view transition that owns the page until a newer one starts. */
function startSwitch(mode: string, update: () => void): ViewTransition {
  const t = document.startViewTransition(update);
  current = t;
  t.finished.finally(() => {
    if (current !== t) return; // a newer switch owns the page now
    current = null;
    root.classList.remove(mode, "theme-shrink");
    removeRing();
  });
  return t;
}

/** Switches the theme from the button. `detail` is the click's: a pointer
 *  double-tap inside 120ms counts once, and a key press (detail 0) always
 *  counts. */
export function toggleTheme(detail = 0): void {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!document.startViewTransition || still.matches) {
    apply(btn);
    return;
  }
  const now = performance.now();
  if (detail > 0 && now - lastClick < 120) return;
  lastClick = now;
  current?.skipTransition();
  removeRing();

  const touch = window.matchMedia("(hover: none) and (pointer: coarse)");
  const mode = touch.matches ? "theme-fade" : "theme-circle";
  const grow = !root.classList.contains("dark");
  root.classList.remove("theme-fade", "theme-circle", "theme-shrink");
  root.classList.add(mode);
  if (mode === "theme-fade") {
    startSwitch(mode, () => apply(btn));
    return;
  }
  if (!grow) root.classList.add("theme-shrink");

  const b = btn.getBoundingClientRect();
  const x = b.left + b.width / 2;
  const y = b.top + b.height / 2;
  const far = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  // Each way starts and ends with the dither just off-screen.
  const [from, to] = grow ? [0, far + PIXEL * 2] : [far + SPAN, 0];
  const made: { ring?: Ring } = {};
  const t = startSwitch(mode, () => {
    apply(btn);
    made.ring = createRing(x, y, grow, from);
  });
  t.ready
    .then(() => {
      if (made.ring) runDissolve(made.ring, from, to);
    })
    .catch(() => {
      // Skipped by a newer click before it started; nothing to animate.
    });
}

export function initThemeToggle(): void {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(root.classList.contains("dark")));
  listen(btn, "click", (e) => toggleTheme(e.detail));
  /* While a switch runs, the browser sends every click to <html>, not to
     the button. A click there that lands on the button still counts. */
  listen(document, "click", (e) => {
    if (!current || e.target !== root) return;
    const b = btn.getBoundingClientRect();
    if (
      e.clientX >= b.left &&
      e.clientX <= b.right &&
      e.clientY >= b.top &&
      e.clientY <= b.bottom
    )
      toggleTheme(e.detail);
  });
}
