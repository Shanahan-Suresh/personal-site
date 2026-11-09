/* Hover finds: the hero label's plate wipe (Hero.astro), hopping letters
   (`data-hop`) and the typing code chip (About.astro). The label's flip is
   in flip.ts. */
import { fineHover, listen, teardowns } from "./runtime";

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
          // The cursor blinks again while the line rests.
          chip.classList.remove("typing");
          if (goal === own) chip.style.minWidth = "";
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
