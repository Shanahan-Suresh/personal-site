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

  /* On a phone the bar slides away while the page scrolls down and comes
     back on any scroll up (CSS gives `.nav-away` effect only below 769px).
     Small moves are summed until they pass NAV_STEP, so a shaky thumb does
     not flicker the bar. */
  const NAV_STEP = 10;
  const SHOW_ABOVE = 160; // px from the top where the bar always shows
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    if (Math.abs(dy) < NAV_STEP && y > SHOW_ABOVE) return;
    lastY = y;
    const away =
      dy > 0 && y > SHOW_ABOVE && !header.classList.contains("nav-open");
    header.classList.toggle("nav-away", away);
  };
  listen(window, "scroll", onScroll, { passive: true });
  teardowns.push(() => header.classList.remove("nav-away"));
}

/* Mobile menu: the burger opens the night sheet; a link, Escape or an
   outside tap closes it. The dim layer under the sheet is the header's own
   ::after, so a tap on it targets the header itself. */
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
    const t = e.target as Node;
    if (t === header || !header.contains(t)) setOpen(false);
  });
  teardowns.push(() => setOpen(false));
}

/* Pointer preview: a screenshot follows the mouse across the project rows.
   It never covers the row being read: it sits below the row or above it, and
   keeps that side while it fits, so moving between rows glides a short way.
   When it no longer fits, it hops to the other side with a quick fade rather
   than sliding across the row. CSS hides it on touch screens and below 960px.
   Every row's picture decodes when the mouse first reaches the list, and a
   new picture wipes in over the last only once it is ready, with its caption.
   The panel takes each picture's own shape, so nothing is cropped: it is
   30% of the window wide (380 to 460px), narrower when that would make the
   picture taller than 42% of the window, and it eases between sizes. */
/* Preview placement, in CSS pixels. */
const PEEK_MARGIN = 12; // kept clear between the panel and the window edges
const PEEK_GAP_ABOVE = 16; // between a row's top and the panel above it
const PEEK_GAP_BELOW = 16; // between a row's bottom and the caption tab of the panel below it
const PEEK_W = [380, 0.3, 460]; // min px, share of the window width, max px
const PEEK_MAX_H = 0.42; // the picture's height, as a share of the window height
const PEEK_SEAM = 3; // the panel's border (--seam)
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
  const dense = window.devicePixelRatio > 1;
  const srcOf = (el: HTMLElement) =>
    (dense && el.dataset.peekHd) || el.dataset.peek || "";

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

  let roomH = Infinity; // the free height beside the row, read at each resize
  /* The panel's size for a picture of shape `r`, borders included. It is no
     taller than the free space on the roomier side of the row, so it never
     covers the row or tucks under the nav bar. */
  const sizeFor = (r: number): [number, number] => {
    const [lo, share, hi] = PEEK_W;
    const wide = Math.min(hi, Math.max(lo, window.innerWidth * share));
    const w = Math.min(
      wide,
      window.innerHeight * PEEK_MAX_H * r,
      (roomH - 2 * PEEK_SEAM) * r,
    );
    return [w + 2 * PEEK_SEAM, w / r + 2 * PEEK_SEAM];
  };
  const resize = (instant: boolean) => {
    roomH = room();
    const [w, h] = sizeFor(ratio);
    peek.classList.toggle("snap", instant);
    peek.style.width = `${w}px`;
    pics.style.height = `${h - 2 * PEEK_SEAM}px`;
  };
  /* The caption tab rides above the panel; it may wrap to two lines. */
  const tab = () => (cap?.textContent ? cap.offsetHeight : 0);
  /* The panel and its tab stay clear of the sticky nav bar. */
  const navBar = document.querySelector<HTMLElement>(".nav-header");
  const top = () =>
    Math.max(0, navBar?.getBoundingClientRect().bottom ?? 0) +
    PEEK_MARGIN +
    tab();
  const room = () => {
    if (!row) return Infinity;
    const r = row.getBoundingClientRect();
    const below =
      window.innerHeight - PEEK_MARGIN - r.bottom - PEEK_GAP_BELOW - tab();
    return Math.max(below, r.top - PEEK_GAP_ABOVE - top());
  };
  const fits = (r: DOMRect, h: number, s: Side) =>
    s === "below"
      ? r.bottom + PEEK_GAP_BELOW + tab() + h <=
        window.innerHeight - PEEK_MARGIN
      : r.top - h - PEEK_GAP_ABOVE >= top();
  /* Returns true when the panel changes sides under a visible pointer. */
  const pickSide = (fresh: boolean): boolean => {
    if (!row) return false;
    const r = row.getBoundingClientRect();
    const h = sizeFor(ratio)[1];
    const prefer: Side =
      r.top + r.height / 2 < window.innerHeight / 2 ? "below" : "above";
    const keep = fresh ? prefer : side;
    const other: Side = keep === "below" ? "above" : "below";
    const next = fits(r, h, keep) ? keep : fits(r, h, other) ? other : prefer;
    const flipped = next !== side;
    side = next;
    return flipped && !fresh;
  };
  const target = (): [number, number] => {
    const [w, h] = sizeFor(ratio);
    const px = Math.max(
      PEEK_MARGIN,
      Math.min(tx - w / 2, window.innerWidth - w - PEEK_MARGIN),
    );
    if (!row) return [px, y];
    const r = row.getBoundingClientRect();
    const py =
      side === "below"
        ? r.bottom + PEEK_GAP_BELOW + tab()
        : r.top - h - PEEK_GAP_ABOVE;
    return [
      px,
      Math.max(top(), Math.min(py, window.innerHeight - h - PEEK_MARGIN)),
    ];
  };
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
      resize(reduce || instant || !peek.classList.contains("on"));
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
const PULL_CLOSE = 90; // px a phone sheet is pulled down by its head to close
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

  /* On a phone a story is a sheet (ProjectStory.astro): it slides back down
     before it closes, from wherever a pull has left it. */
  const sheet = window.matchMedia("(max-width: 560px)");
  const dismiss = (d: HTMLDialogElement) => {
    if (reduce || !sheet.matches || typeof d.animate !== "function") {
      d.style.transform = "";
      d.close();
      return;
    }
    if (d.dataset.closing !== undefined) return;
    d.dataset.closing = "";
    const from = d.style.transform || "none";
    const timing = { duration: 220, easing: "cubic-bezier(0.4, 0, 1, 1)" };
    try {
      d.animate([{ opacity: 1 }, { opacity: 0 }], {
        ...timing,
        pseudoElement: "::backdrop",
      });
    } catch {
      /* a browser without pseudo-element animation still slides the sheet */
    }
    d.animate(
      [{ transform: from }, { transform: "translateY(100%)" }],
      timing,
    ).onfinish = () => {
      delete d.dataset.closing;
      d.style.transform = "";
      d.close();
    };
  };

  dialogs.forEach((d) => {
    listen(d, "click", (e) => {
      const t = e.target as HTMLElement;
      if (t === d || t.closest("[data-close]")) {
        e.preventDefault();
        dismiss(d);
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

    /* On a phone, pulling the sheet down by its head follows the finger;
       past PULL_CLOSE it closes, short of it the sheet springs back. Only
       from the top of the story, so a pull never fights the scroll. */
    const head = d.querySelector<HTMLElement>(".st-head");
    let pullFrom: number | null = null;
    let pulled = 0;
    const endPull = () => {
      if (pullFrom === null) return;
      pullFrom = null;
      if (pulled > PULL_CLOSE) dismiss(d);
      else if (pulled > 0) {
        if (!reduce)
          d.animate(
            [{ transform: `translateY(${pulled}px)` }, { transform: "none" }],
            { duration: 180, easing: "cubic-bezier(0.2, 0.85, 0.2, 1)" },
          );
        d.style.transform = "";
      }
      pulled = 0;
    };
    if (head) {
      listen(
        head,
        "touchstart",
        (e) => {
          pullFrom =
            sheet.matches && d.scrollTop <= 0 ? e.touches[0].clientY : null;
          pulled = 0;
        },
        { passive: true },
      );
      listen(
        head,
        "touchmove",
        (e) => {
          if (pullFrom === null) return;
          pulled = Math.max(0, e.touches[0].clientY - pullFrom);
          d.style.transform = pulled ? `translateY(${pulled}px)` : "";
        },
        { passive: true },
      );
      listen(head, "touchend", endPull, { passive: true });
      listen(head, "touchcancel", endPull, { passive: true });
    }

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
  initFlip();
  initHop();
  initTypeChip();
  initShortcuts();
  initReveal();
  initScrollSpy();
  initScrolledNav();
  initMobileNav();
  initPreview();
  initStories();
  initImageFade();
}
