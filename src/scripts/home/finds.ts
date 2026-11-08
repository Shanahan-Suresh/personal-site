/* Hover finds: the hero label's plate wipe and flip (Hero.astro), hopping
   letters (`data-hop`) and the typing code chip (About.astro). */
import { fineHover, listen, reduce, teardowns } from "./runtime";

/* `data-brush`: the hero label's butter plate (`.brushing` in Hero.astro)
   fills from the label's left edge to the pointer, like a loading bar that
   follows the mouse. Leaving fills the whole plate again. */
const BRUSH_MIN = 24; // px of fill that always stays at the left edge

export function initBrush(): void {
  if (!fineHover()) return;
  document.querySelectorAll<HTMLElement>("[data-brush]").forEach((el) => {
    // The plate is the label's face, or the label itself.
    const face = el.querySelector<HTMLElement>(".mk-face") ?? el;
    const paint = (e: PointerEvent) => {
      // The fill sits inside the border, so measure from the padding edge.
      // The label's own box stays still while its face turns.
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - face.clientLeft;
      const fill = Math.min(face.clientWidth, Math.max(BRUSH_MIN, x));
      el.style.setProperty("--brush", `${fill}px`);
    };
    listen(el, "pointerenter", (e) => {
      paint(e);
      el.classList.add("brushing");
    });
    listen(el, "pointermove", paint);
    listen(el, "pointerleave", () => el.classList.remove("brushing"));
  });
}

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

export function initFlip(): void {
  if (reduce) return;
  document.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
    let th = 0; // the card's turn, in degrees
    let w = 0; // its speed, in deg/s
    let caught = false;
    let running = false;
    let last = 0;
    let dir = 1;
    let spun = 1; // the way it last turned, for the slow turn back
    let prev: { x: number; y: number; t: number } | null = null;
    let rightTimer = 0;
    // The slow turn back: from and to angles, start time.
    let back: { from: number; to: number; at: number } | null = null;

    const paint = () => {
      const turn = running
        ? `perspective(900px) rotateX(${th.toFixed(2)}deg)`
        : null;
      el.style.setProperty(
        "--flip",
        turn ?? (th === 0 ? "none" : "rotateX(180deg)"),
      );
      el.style.setProperty("--flip-s", turn ?? `rotateX(${th}deg)`);
      el.classList.toggle("turned", running || th !== 0);
      const showsBack = Math.cos((th * Math.PI) / 180) < 0;
      el.style.setProperty("--flip-m", showsBack ? "-1" : "1");
    };
    const stop = () => {
      th = (((Math.round(th / 180) * 180) % 360) + 360) % 360; // 0 or 180
      w = 0;
      running = false;
      paint();
      if (th === 180) rightTimer = window.setTimeout(right, FLIP.rightAfter);
    };
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (back) {
        const p = Math.min(1, (now - back.at) / FLIP.rightFor);
        th = back.from + (back.to - back.from) * easeInOut(p);
        if (p >= 1) {
          back = null;
          stop();
          return;
        }
        paint();
        requestAnimationFrame(tick);
        return;
      }
      const near = Math.round(th / 180) * 180;
      if (!caught && Math.abs(w) < FLIP.catchAt) caught = true;
      const a = caught
        ? -FLIP.spring * (th - near) - FLIP.damp * w
        : -FLIP.drag * w - FLIP.friction * Math.sign(w);
      w += a * dt;
      th += w * dt;
      if (caught && Math.abs(w) < 2 && Math.abs(th - near) < 0.3) {
        stop();
        return;
      }
      paint();
      requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    };
    const right = () => {
      back = { from: 180, to: 180 + 180 * spun, at: performance.now() };
      start();
    };
    const push = (target: number) => {
      window.clearTimeout(rightTimer);
      back = null; // a push takes over from wherever the slow turn is
      const v = Math.max(-FLIP.max, Math.min(FLIP.max, target));
      // A swipe the same way only speeds the label up; the other way turns it.
      w =
        Math.sign(v) === Math.sign(w)
          ? Math.sign(w) * Math.max(Math.abs(w), Math.abs(v))
          : v;
      if (w !== 0) spun = Math.sign(w);
      caught = false;
      start();
    };

    if (fineHover()) {
      listen(el, "pointerenter", (e) => {
        prev = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      });
      listen(el, "pointerleave", () => {
        prev = null;
      });
      listen(el, "pointermove", (e) => {
        if (prev) {
          const dt = Math.max(8, e.timeStamp - prev.t);
          const vx = (e.clientX - prev.x) / dt;
          const vy = (e.clientY - prev.y) / dt;
          const steep = Math.abs(vy) > FLIP.steep * Math.abs(vx);
          if (Math.abs(vy) > FLIP.minSwipe && steep) push(-vy * FLIP.gain);
        }
        prev = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      });
    }
    listen(el, "click", () => {
      dir = -dir;
      push(dir * FLIP.kick);
    });
  });
}

/* `data-hop`: when the pointer or keyboard focus arrives, the letters jump
   one after another. The letters are those of the element itself, or of a
   `data-hop-letters` element inside it. The text is split into spans only
   for the hop and joined again after it, so the type keeps its kerning at
   rest. */
const HOP_MS = 420;
const HOP_STAGGER_MS = 45;

function splitLetters(root: HTMLElement): HTMLElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  const letters: HTMLElement[] = [];
  for (const t of texts) {
    const frag = document.createDocumentFragment();
    for (const ch of t.data) {
      if (/\s/.test(ch)) {
        frag.append(ch);
        continue;
      }
      const s = document.createElement("span");
      s.className = "hop-ch";
      s.textContent = ch;
      frag.append(s);
      letters.push(s);
    }
    t.replaceWith(frag);
  }
  return letters;
}

export function initHop(): void {
  if (!fineHover()) return;
  document.querySelectorAll<HTMLElement>("[data-hop]").forEach((host) => {
    const target =
      host.querySelector<HTMLElement>("[data-hop-letters]") ?? host;
    let busy = false;
    let inside = false;
    let before: Node[] | null = null;
    let letters: HTMLElement[] = [];
    // Joining removes the letter under the pointer, which Chromium reads as
    // a fresh pointerenter. So the letters join only once the pointer is out.
    const join = () => {
      if (!before) return;
      target.replaceChildren(...before);
      before = null;
    };
    const hop = () => {
      if (busy) return;
      busy = true;
      if (!before) {
        before = [...target.childNodes].map((n) => n.cloneNode(true));
        letters = splitLetters(target);
      }
      const lift = target === host ? "-0.12em" : "-0.14em";
      const runs = letters.map((ch, i) =>
        ch.animate(
          [
            { transform: "translateY(0)" },
            { transform: `translateY(${lift})`, offset: 0.4 },
            { transform: "translateY(0)" },
          ],
          {
            duration: HOP_MS,
            delay: i * HOP_STAGGER_MS,
            easing: "cubic-bezier(.3,.7,.4,1)",
          },
        ),
      );
      Promise.all(runs.map((a) => a.finished.catch(() => undefined))).then(
        () => {
          busy = false;
          if (!inside) join();
        },
      );
    };
    listen(host, "pointerenter", () => {
      inside = true;
      hop();
    });
    listen(host, "pointerleave", () => {
      inside = false;
      if (!busy) join();
    });
    listen(host, "focus", hop);
  });
}

/* `data-type`: the code chip in About types a new line while the pointer is
   on it. When the pointer leaves, it deletes back and types its own words
   again. Either way it first deletes to the part both texts share, so a
   pointer that comes back mid-way carries on from where the chip is. The
   chip keeps at least its own width, so the pointer never falls off it. */
const TYPE_MS = 45;
const DELETE_MS = 22;

export function initTypeChip(): void {
  if (!fineHover()) return;
  document.querySelectorAll<HTMLElement>("[data-type]").forEach((chip) => {
    const own = chip.textContent ?? "";
    const line = chip.dataset.type ?? "";
    let timer = 0;
    chip.style.display = "inline-block";
    const goTo = (goal: string) => {
      window.clearTimeout(timer);
      if (!chip.style.minWidth) chip.style.minWidth = `${chip.offsetWidth}px`;
      chip.classList.add("typing");
      const step = () => {
        const now = chip.textContent ?? "";
        if (now === goal) {
          if (goal === own) {
            chip.style.minWidth = "";
            chip.classList.remove("typing");
          }
          return;
        }
        const typing = goal.startsWith(now);
        chip.textContent = typing
          ? goal.slice(0, now.length + 1)
          : now.slice(0, -1);
        timer = window.setTimeout(step, typing ? TYPE_MS : DELETE_MS);
      };
      step();
    };
    listen(chip, "pointerenter", () => goTo(line));
    listen(chip, "pointerleave", () => goTo(own));
    teardowns.push(() => window.clearTimeout(timer));
  });
}
