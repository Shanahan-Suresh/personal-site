/* Page behaviour for the poster design: headline reveal, scroll spy, scrolled
   nav, mobile menu, the pointer preview on project rows, the story dialogs,
   the hover finds (label wipe, hopping letters, typing chip), keyboard
   shortcuts and a note in the console. Every part works from server-rendered
   markup; script only adds motion, the modal and the shortcuts. `init` runs once per page and is safe to call again:
   it first undoes every listener a previous run added. */

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const teardowns: Array<() => void> = [];

function listen<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document | Window,
  type: K,
  fn: (e: HTMLElementEventMap[K]) => void,
  opts?: AddEventListenerOptions,
): void {
  el.addEventListener(type, fn as EventListener, opts);
  teardowns.push(() => el.removeEventListener(type, fn as EventListener));
}

function cleanup(): void {
  teardowns.forEach((fn) => {
    try {
      fn();
    } catch {
      // A teardown for a node that is gone has nothing left to undo.
    }
  });
  teardowns.length = 0;
}

/* Headline lines rise, and hero frames fade up, as their block scrolls in. */
export function initReveal(): void {
  const els = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  els.forEach((el) => io.observe(el));
  teardowns.push(() => io.disconnect());
}

/* Scroll spy: mark the nav link whose section crosses the middle band. */
export function initScrollSpy(): void {
  if (!("IntersectionObserver" in window)) return;
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".nav-link"),
  );
  const map: Record<string, HTMLAnchorElement> = {};
  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    const id = href.slice(href.indexOf("#") + 1);
    if (href.includes("#") && id) map[id] = a;
  });
  const sections = Object.keys(map)
    .map((id) => document.getElementById(id))
    .filter((s): s is HTMLElement => s !== null);
  if (!sections.length) return;

  /* Sections in the band right now. When none is (the hero, the numbers),
     no link is marked. */
  const inBand = new Set<string>();
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) inBand.add(e.target.id);
        else inBand.delete(e.target.id);
      });
      const active = sections.find((s) => inBand.has(s.id))?.id;
      links.forEach((a) => {
        const on = a === (active && map[active]);
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  sections.forEach((s) => spy.observe(s));
  teardowns.push(() => spy.disconnect());
}

/* Scrolled nav: a class once the page leaves the top. */
export function initScrolledNav(): void {
  const header = document.querySelector<HTMLElement>(".nav-header");
  if (!header || !("IntersectionObserver" in window)) return;
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText =
    "position:absolute;top:8px;left:0;width:1px;height:1px;pointer-events:none;";
  document.body.appendChild(sentinel);
  const obs = new IntersectionObserver(
    (entries) => {
      header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    },
    { threshold: 0 },
  );
  obs.observe(sentinel);
  teardowns.push(() => {
    obs.disconnect();
    sentinel.remove();
  });
}

/* Mobile menu: the burger opens the night sheet; a link, Escape or an
   outside tap closes it. */
export function initMobileNav(): void {
  const header = document.querySelector<HTMLElement>(".nav-header");
  const burger = document.querySelector<HTMLButtonElement>(".nav-burger");
  if (!header || !burger) return;

  const setOpen = (open: boolean) => {
    header.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };

  listen(burger, "click", () =>
    setOpen(!header.classList.contains("nav-open")),
  );
  header
    .querySelectorAll<HTMLAnchorElement>(".nav-link")
    .forEach((a) => listen(a, "click", () => setOpen(false)));
  listen(document, "keydown", (e) => {
    if (e.key !== "Escape" || !header.classList.contains("nav-open")) return;
    // The sheet hides, so focus inside it would fall to <body>.
    const inside = header.contains(document.activeElement);
    setOpen(false);
    if (inside) burger.focus();
  });
  listen(document, "pointerdown", (e) => {
    if (!header.contains(e.target as Node)) setOpen(false);
  });
  teardowns.push(() => setOpen(false));
}

/* Pointer preview: a screenshot follows the mouse across the project rows.
   It never covers the row being read: it sits below the row or above it, and
   keeps that side while it fits, so moving between rows glides a short way.
   When it no longer fits, it hops to the other side with a quick fade rather
   than sliding across the row. CSS hides it on touch screens and below 960px.
   Every row's picture decodes when the mouse first reaches the list, and a
   new picture wipes in over the last only once it is ready, with its caption. */
/* Preview placement, in CSS pixels. The panel is 400px wide (Work.astro). */
const PEEK_MARGIN = 12; // kept clear between the panel and the window edges
const PEEK_GAP_ABOVE = 16; // between a row's top and the panel above it
const PEEK_GAP_BELOW = 44; // between a row's bottom and the panel below it; clears the caption tab
const PEEK_TAB = 32; // the caption tab's height above the panel
const PEEK_FOCUS_AT = 0.42; // keyboard focus: the panel centres this far across the row
const PEEK_EASE = 0.16; // share of the remaining distance covered per 60 Hz frame
const PEEK_WIPE_MS = 320; // a new picture wiping down over the last
const PEEK_HOP_MS = 140; // the fade when the panel changes sides

type Side = "below" | "above";

export function initPreview(): void {
  const peek = document.getElementById("peek");
  const pics = peek?.querySelector<HTMLElement>(".peek-pics");
  const cap = peek?.querySelector<HTMLElement>(".peek-cap");
  const list = document.querySelector<HTMLElement>("#work .projects");
  if (!peek || !pics || !list) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const rows = Array.from(list.querySelectorAll<HTMLElement>(".pr"));
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
  const dense = window.devicePixelRatio > 1.25;
  const srcOf = (el: HTMLElement) =>
    (dense && el.dataset.peek2x) || el.dataset.peek || "";

  const ready = new Map<string, Promise<void>>();
  const load = (src: string) => {
    let done = ready.get(src);
    if (!done) {
      const im = new Image();
      im.src = src;
      done = im.decode().catch(() => {});
      ready.set(src, done);
    }
    return done;
  };
  const warm = () =>
    rows.forEach((el) => {
      const src = srcOf(el);
      if (src) void load(src);
    });

  const fits = (r: DOMRect, h: number, s: Side) =>
    s === "below"
      ? r.bottom + PEEK_GAP_BELOW + h <= window.innerHeight - PEEK_MARGIN
      : r.top - h - PEEK_GAP_ABOVE >= PEEK_MARGIN + PEEK_TAB;
  /* Returns true when the panel changes sides under a visible pointer. */
  const pickSide = (fresh: boolean): boolean => {
    if (!row) return false;
    const r = row.getBoundingClientRect();
    const h = peek.offsetHeight;
    const prefer: Side =
      r.top + r.height / 2 < window.innerHeight / 2 ? "below" : "above";
    const other: Side = side === "below" ? "above" : "below";
    const next = fresh
      ? prefer
      : fits(r, h, side)
        ? side
        : fits(r, h, other)
          ? other
          : prefer;
    const flipped = next !== side;
    side = next;
    return flipped && !fresh;
  };
  const target = (): [number, number] => {
    const w = peek.offsetWidth;
    const h = peek.offsetHeight;
    const px = Math.max(
      PEEK_MARGIN,
      Math.min(tx - w / 2, window.innerWidth - w - PEEK_MARGIN),
    );
    if (!row) return [px, y];
    const r = row.getBoundingClientRect();
    const py =
      side === "below" ? r.bottom + PEEK_GAP_BELOW : r.top - h - PEEK_GAP_ABOVE;
    return [
      px,
      Math.max(
        PEEK_MARGIN + PEEK_TAB,
        Math.min(py, window.innerHeight - h - PEEK_MARGIN),
      ),
    ];
  };
  const tick = (now: number) => {
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
      const drop = () => {
        while (pics.firstElementChild && pics.firstElementChild !== pic)
          pics.firstElementChild.remove();
      };
      if (reduce || instant || !peek.classList.contains("on")) drop();
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

/* Story dialogs. Rows, numbers, Previous, Next and close are plain links that
   work without script; here they open the stories as modals instead.
   - Any `[data-story]` link opens its story. Closing returns focus to that
     link, or, when a row opened it, to the row of the story the visitor ended on.
   - Previous and Next, the arrow keys and a sideways swipe move between stories.
   - Opening from the page pushes `#story-<id>`, so the address can be shared
     and Back closes the story. Moving between stories replaces that entry. */
const SWIPE_MIN = 60; // px of sideways travel that counts as a swipe
const STORY_HASH = /^#story-([\w-]+)$/;

export function initStories(): void {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLDialogElement>("dialog.story"),
  );
  if (!dialogs.length || typeof HTMLDialogElement !== "function") return;

  let current: string | null = null;
  let opener: HTMLElement | null = null;
  /* True while the history entry for the open story is one this script pushed. */
  let pushed = false;

  const byId = (id: string) =>
    document.getElementById(`story-${id}`) as HTMLDialogElement | null;
  const openDialog = () => dialogs.find((d) => d.open) ?? null;
  /* A story's picture loads lazily. Pointing at a story link, or opening the
     story beside it, starts the load, so the picture is there when it opens. */
  const warm = (id?: string) => {
    if (!id) return;
    byId(id)
      ?.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')
      .forEach((im) => (im.loading = "eager"));
  };

  const show = (id: string, enter?: "next" | "prev"): boolean => {
    const next = byId(id);
    if (!next) return false;
    const was = openDialog();
    if (was && was !== next) was.close();
    if (enter) next.dataset.enter = enter;
    else delete next.dataset.enter;
    current = id;
    if (!next.open) next.showModal();
    next.scrollTop = 0;
    warm(next.dataset.prev);
    warm(next.dataset.next);
    return true;
  };

  /* From the page: remember the opener and push the story onto history. */
  const openFrom = (el: HTMLElement, id: string) => {
    if (!show(id)) return;
    opener = el;
    history.pushState({ story: id }, "", `#story-${id}`);
    pushed = true;
  };

  /* Between stories: replace the entry, so one Back still leaves them all. */
  const go = (dir: "next" | "prev") => {
    const id = openDialog()?.dataset[dir];
    if (!id || !show(id, dir)) return;
    history.replaceState(history.state, "", `#story-${id}`);
  };

  const restoreFocus = (id: string) => {
    const target =
      opener && opener.isConnected && !opener.matches(".pr")
        ? opener
        : document.getElementById(`row-${id}`);
    target?.focus({ preventScroll: true });
  };

  document
    .querySelectorAll<HTMLAnchorElement>("a[data-story]")
    .forEach((el) => {
      listen(el, "pointerenter", () => warm(el.dataset.story));
      listen(el, "focus", () => warm(el.dataset.story));
      listen(el, "click", (e) => {
        const id = el.dataset.story;
        if (!id || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openFrom(el, id);
      });
    });

  dialogs.forEach((d) => {
    listen(d, "click", (e) => {
      const t = e.target as HTMLElement;
      if (t === d || t.closest("[data-close]")) {
        e.preventDefault();
        d.close();
        return;
      }
      const link = t.closest<HTMLElement>("[data-go]");
      if (link) {
        e.preventDefault();
        go(link.dataset.dir === "prev" ? "prev" : "next");
      }
    });

    /* `close` fires after the next story has opened when one hands over to
       another, so an open dialog means this was a switch, not a close. */
    listen(d, "close", () => {
      delete d.dataset.enter;
      if (openDialog() || !current) return;
      const id = current;
      current = null;
      /* Take the story out of the address: step back over the entry this
         script pushed, or rewrite the shared link the visitor arrived on. */
      if (STORY_HASH.test(window.location.hash)) {
        if (pushed) history.back();
        else
          history.replaceState(
            history.state,
            "",
            window.location.pathname + window.location.search,
          );
      }
      pushed = false;
      restoreFocus(id);
      opener = null;
    });

    /* A sideways swipe on a touch screen moves between stories. */
    let sx = 0;
    let sy = 0;
    listen(
      d,
      "touchstart",
      (e) => {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      },
      { passive: true },
    );
    listen(
      d,
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
          go(dx < 0 ? "next" : "prev");
        }
      },
      { passive: true },
    );
  });

  listen(document, "keydown", (e) => {
    if (!openDialog() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") go("next");
    else if (e.key === "ArrowLeft") go("prev");
  });

  /* Back and Forward open or close stories to match the address. */
  const onPop = () => {
    const m = window.location.hash.match(STORY_HASH);
    pushed = false;
    if (m && byId(m[1])) {
      if (current !== m[1]) show(m[1]);
      return;
    }
    openDialog()?.close();
  };
  window.addEventListener("popstate", onPop);
  teardowns.push(() => window.removeEventListener("popstate", onPop));

  /* A shared link such as /#story-rsvp opens that story. */
  const m = window.location.hash.match(STORY_HASH);
  if (m) show(m[1]);

  teardowns.push(() => dialogs.forEach((d) => d.open && d.close()));
}

/* Copy buttons: shown only where the clipboard can be written. The label
   reads "Copied" for a moment, and a live region says it aloud. */
const COPIED_MS = 2000;

export function initCopy(): void {
  if (!navigator.clipboard?.writeText) return;
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    const status =
      btn.parentElement?.querySelector<HTMLElement>("[data-copy-status]");
    const label = btn.textContent ?? "Copy";
    let timer = 0;
    btn.hidden = false;
    listen(btn, "click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? "");
      } catch {
        return; // permission refused: the mailto link is still there
      }
      btn.textContent = "Copied";
      btn.classList.add("done");
      if (status) status.textContent = "Email address copied";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove("done");
        if (status) status.textContent = "";
      }, COPIED_MS);
    });
    teardowns.push(() => window.clearTimeout(timer));
  });
}

/* Pictures in frames and thumbnails fade in as they load, over their white
   canvas. Pictures already loaded (cached, or above the fold) show at once. */
export function initImageFade(): void {
  document
    .querySelectorAll<HTMLImageElement>(".media-canvas img, .thumb")
    .forEach((img) => {
      // The hero frames have their own entrance (`.rise`).
      if ((img.complete && img.naturalWidth) || img.closest(".hero")) return;
      img.classList.add("fading");
      const done = () => img.classList.add("loaded");
      listen(img, "load", done, { once: true });
      listen(img, "error", done, { once: true });
    });
}

/* Effects that need a mouse: the label wipe, hopping letters and the typing
   chip. Touch screens and reduced motion keep the page as it is. */
const fineHover = () => !reduce && window.matchMedia("(hover: hover)").matches;

/* `data-brush`: the hero label's butter plate (`.brushing` in Hero.astro)
   becomes a band under the pointer and widens to cover every part the
   pointer passes over. Leaving fills the whole plate again. */
const BRUSH_SHARE = 0.12; // half the band's starting width, as a share of the label

export function initBrush(): void {
  if (!fineHover()) return;
  document.querySelectorAll<HTMLElement>("[data-brush]").forEach((el) => {
    let a = 0;
    let b = 0;
    const paint = (e: PointerEvent, fresh: boolean) => {
      const r = el.getBoundingClientRect();
      const half = Math.max(24, r.width * BRUSH_SHARE);
      const x = e.clientX - r.left;
      const lo = Math.max(0, x - half);
      const hi = Math.min(r.width, x + half);
      a = fresh ? lo : Math.min(a, lo);
      b = fresh ? hi : Math.max(b, hi);
      el.style.setProperty("--brush-a", `${a}px`);
      el.style.setProperty("--brush-b", `${b}px`);
    };
    listen(el, "pointerenter", (e) => {
      paint(e, true);
      el.classList.add("brushing");
    });
    listen(el, "pointermove", (e) => paint(e, false));
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

/* Keyboard shortcuts: "?" opens a card that lists them. T switches the
   theme; W, A and C go to Work, About and Contact. The card can turn the
   letter keys off (remembered in localStorage), and they never fire while
   a story is open, with a modifier key, or in a text field. */
const SHORTCUTS_KEY = "shortcuts";
const JUMPS: Record<string, string> = { w: "work", a: "about", c: "contact" };

function shortcutsOn(): boolean {
  try {
    return localStorage.getItem(SHORTCUTS_KEY) !== "off";
  } catch {
    return true;
  }
}

function buildKeysCard(): HTMLElement {
  const card = document.createElement("aside");
  card.className = "keys";
  card.id = "keys";
  card.hidden = true;
  card.setAttribute("aria-labelledby", "keys-title");
  const title = document.createElement("h2");
  title.id = "keys-title";
  title.textContent = "Keyboard";
  const list = document.createElement("ul");
  list.setAttribute("role", "list");
  for (const [key, what] of [
    ["T", "switch theme"],
    ["W", "work"],
    ["A", "about"],
    ["C", "contact"],
    ["?", "open or close this card"],
  ]) {
    const li = document.createElement("li");
    const kbd = document.createElement("kbd");
    kbd.textContent = key;
    li.append(kbd, what);
    list.append(li);
  }
  const actions = document.createElement("div");
  actions.className = "keys-actions";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.dataset.keysToggle = "";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.dataset.keysClose = "";
  actions.append(toggle, close);
  card.append(title, list, actions);
  return card;
}

export function initShortcuts(): void {
  const card = document.querySelector<HTMLElement>("#keys") ?? buildKeysCard();
  if (!card.isConnected) document.body.append(card);
  const toggle = card.querySelector<HTMLButtonElement>("[data-keys-toggle]")!;
  const close = card.querySelector<HTMLButtonElement>("[data-keys-close]")!;
  const paint = () => {
    const on = shortcutsOn();
    card.classList.toggle("off", !on);
    toggle.textContent = on ? "Turn letter keys off" : "Turn letter keys on";
  };
  paint();
  listen(toggle, "click", () => {
    try {
      localStorage.setItem(SHORTCUTS_KEY, shortcutsOn() ? "off" : "on");
    } catch {
      // Storage can be blocked; the keys stay as they are.
    }
    paint();
  });
  listen(close, "click", () => (card.hidden = true));
  listen(document, "keydown", (e) => {
    if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
      return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("input, textarea, select, [contenteditable]")) return;
    if (document.querySelector("dialog[open]")) return;
    if (e.key === "?") {
      card.hidden = !card.hidden;
      return;
    }
    if (e.key === "Escape" && !card.hidden) {
      card.hidden = true;
      return;
    }
    if (!shortcutsOn()) return;
    const key = e.key.toLowerCase();
    if (key === "t") {
      document.getElementById("theme-toggle")?.click();
    } else if (JUMPS[key]) {
      const id = JUMPS[key];
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        history.replaceState(null, "", `#${id}`);
      } else {
        location.href = `/#${id}`;
      }
    }
  });
}

/* A note for developers who open the browser console. Once per page load. */
let greeted = false;

export function greetConsole(): void {
  if (greeted) return;
  greeted = true;
  console.log(
    "%cLET'S BUILD.",
    "padding:4px 12px;background:#ffd84a;color:#111;border:3px solid #111;font:900 26px/1.2 Impact,'Arial Narrow',sans-serif;",
  );
  console.log(
    [
      "Hi. This site is plain Astro and Tailwind, with no framework runtime.",
      `How it is built: ${location.origin}/colophon`,
      "The source: https://github.com/Shanahan-Suresh/personal-site",
      "Press ? on the page for keyboard shortcuts.",
      "Hiring, or want to build something? hello@shanahansuresh.com",
    ].join("\n"),
  );
}

export function init(): void {
  cleanup();
  greetConsole();
  initBrush();
  initHop();
  initTypeChip();
  initShortcuts();
  initReveal();
  initScrollSpy();
  initScrolledNav();
  initMobileNav();
  initPreview();
  initStories();
  initCopy();
  initImageFade();
}
