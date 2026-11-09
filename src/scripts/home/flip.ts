/* `data-flip`: the hero label is a double-sided sign on a rod through its
   middle. A fast, steep swipe up or down across it, or a click or tap, spins
   it. It slows with friction, then a catch settles it on whichever side is
   nearest: every half turn shows the other side, which reads upside down,
   as a real sign's would. Left upside down, it waits a moment, then turns
   slowly the right way up, on in the way it last spun; a push during that
   slow turn takes over from where it is. A slow or sideways move only fills
   the plate (`data-brush`). The loop runs only while the label moves, and
   the card is drawn flat again when it stops, so the type stays sharp.
   Hero.astro reads --flip (the card's turn), --flip-s (the same turn for
   the shadow, never `none`), --flip-m (-1 once the card shows its back, so
   the shadow can mirror back and keep its cut-out under the card) and
   `.turned` (the label is moving or upside down: its shadow shows). */
import { fineHover, listen, reduce } from "./runtime";

const FLIP = {
  drag: 2.2, // slowing while it spins fast, per second
  friction: 260, // steady slowing, in deg/s²
  catchAt: 220, // below this speed (deg/s) the catch takes over
  spring: 160, // how hard the catch pulls to the nearest side
  damp: 14, // how fast the catch's wobble dies out
  gain: 900, // spin speed (deg/s) per px/ms of swipe
  max: 1800, // top spin speed, in deg/s
  kick: 720, // a click's spin speed: one half turn
  minSwipe: 0.45, // px/ms: slower moves only fill
  steep: 1.2, // a swipe counts when it is this much more vertical than sideways
  rightAfter: 1400, // ms upside down before it turns back
  rightFor: 1800, // ms the slow turn back takes
};
const easeInOut = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;

/** The label's motion, free of the DOM. */
interface FlipState {
  th: number; // the card's turn, in degrees
  w: number; // its speed, in deg/s
  caught: boolean; // the catch has taken over from the free spin
  spun: number; // the way it last turned (1 or -1), for the slow turn back
  // The slow turn back: from and to angles, start time.
  back: { from: number; to: number; at: number } | null;
}

const restingFlip = (): FlipState => ({
  th: 0,
  w: 0,
  caught: false,
  spun: 1,
  back: null,
});

/** Moves the label on by dt seconds at time `now` (ms). Returns true once
 *  it has come to rest on a side, after `settleFlip`. */
function stepFlip(s: FlipState, dt: number, now: number): boolean {
  if (s.back) {
    const p = Math.min(1, (now - s.back.at) / FLIP.rightFor);
    s.th = s.back.from + (s.back.to - s.back.from) * easeInOut(p);
    if (p < 1) return false;
    s.back = null;
    settleFlip(s);
    return true;
  }
  const near = Math.round(s.th / 180) * 180;
  if (!s.caught && Math.abs(s.w) < FLIP.catchAt) s.caught = true;
  const a = s.caught
    ? -FLIP.spring * (s.th - near) - FLIP.damp * s.w
    : -FLIP.drag * s.w - FLIP.friction * Math.sign(s.w);
  s.w += a * dt;
  s.th += s.w * dt;
  if (!s.caught || Math.abs(s.w) >= 2 || Math.abs(s.th - near) >= 0.3)
    return false;
  settleFlip(s);
  return true;
}

/** Snaps the label to the side it settled on: 0 or 180. */
function settleFlip(s: FlipState): void {
  s.th = (((Math.round(s.th / 180) * 180) % 360) + 360) % 360;
  s.w = 0;
}

/** A push at speed `target` (deg/s). A push the same way only speeds the
 *  label up; the other way turns it. It takes over from a slow turn back. */
function pushFlip(s: FlipState, target: number): void {
  s.back = null;
  const v = Math.max(-FLIP.max, Math.min(FLIP.max, target));
  s.w =
    Math.sign(v) === Math.sign(s.w)
      ? Math.sign(s.w) * Math.max(Math.abs(s.w), Math.abs(v))
      : v;
  if (s.w !== 0) s.spun = Math.sign(s.w);
  s.caught = false;
}

/** What Hero.astro reads, for the label at turn th, moving or at rest. */
function flipStyle(
  th: number,
  running: boolean,
): { flip: string; flipS: string; flipM: string; turned: boolean } {
  const turn = running
    ? `perspective(900px) rotateX(${th.toFixed(2)}deg)`
    : null;
  return {
    flip: turn ?? (th === 0 ? "none" : "rotateX(180deg)"),
    flipS: turn ?? `rotateX(${th}deg)`,
    flipM: Math.cos((th * Math.PI) / 180) < 0 ? "-1" : "1",
    turned: running || th !== 0,
  };
}

/* A fast, steep swipe gives the speed to push with, or null. */
function swipeSpeed(
  prev: { x: number; y: number; t: number },
  e: PointerEvent,
): number | null {
  const dt = Math.max(8, e.timeStamp - prev.t);
  const vx = (e.clientX - prev.x) / dt;
  const vy = (e.clientY - prev.y) / dt;
  const steep = Math.abs(vy) > FLIP.steep * Math.abs(vx);
  return Math.abs(vy) > FLIP.minSwipe && steep ? -vy * FLIP.gain : null;
}

export function initFlip(): void {
  if (reduce) return;
  document.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
    const s = restingFlip();
    let running = false;
    let last = 0;
    let dir = 1;
    let prev: { x: number; y: number; t: number } | null = null;
    let rightTimer = 0;

    const paint = () => {
      const st = flipStyle(s.th, running);
      el.style.setProperty("--flip", st.flip);
      el.style.setProperty("--flip-s", st.flipS);
      el.classList.toggle("turned", st.turned);
      el.style.setProperty("--flip-m", st.flipM);
    };
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!stepFlip(s, dt, now)) {
        paint();
        requestAnimationFrame(tick);
        return;
      }
      running = false;
      paint();
      if (s.th === 180) rightTimer = window.setTimeout(right, FLIP.rightAfter);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    };
    const right = () => {
      s.back = { from: 180, to: 180 + 180 * s.spun, at: performance.now() };
      start();
    };
    const push = (target: number) => {
      window.clearTimeout(rightTimer);
      pushFlip(s, target);
      start();
    };

    if (fineHover()) {
      listen(el, "pointerenter", (e) => {
        prev = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      });
      listen(el, "pointerleave", () => (prev = null));
      listen(el, "pointermove", (e) => {
        const v = prev && swipeSpeed(prev, e);
        if (v != null) push(v);
        prev = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      });
    }
    listen(el, "click", () => {
      dir = -dir;
      push(dir * FLIP.kick);
    });
  });
}
