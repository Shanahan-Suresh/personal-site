/* Page behaviour for the poster design: headline reveal, scroll spy, scrolled
   nav, mobile menu, the pointer preview on project rows and the story
   dialogs. Every part works from server-rendered markup; script only adds
   motion and the modal. `init` runs once per page and is safe to call again:
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
   It never covers the row being read: it sits below a row in the top half
   of the screen and above a row in the bottom half. CSS hides it on touch
   screens and below 960px. */
/* Preview placement, in CSS pixels. The panel is 400px wide (Work.astro). */
const PEEK_MARGIN = 12; // kept clear between the panel and the window edges
const PEEK_GAP_ABOVE = 16; // between a row's top and the panel above it
const PEEK_GAP_BELOW = 44; // between a row's bottom and the panel below it; clears the caption tab
const PEEK_TAB = 32; // the caption tab's height above the panel
const PEEK_FALLBACK_H = 256; // panel height before its image has loaded
const PEEK_FOCUS_AT = 0.42; // keyboard focus: the panel centres this far across the row

export function initPreview(): void {
  const peek = document.getElementById("peek");
  const img = peek?.querySelector("img");
  const cap = peek?.querySelector<HTMLElement>(".peek-cap");
  if (!peek || !img) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let tx = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  let shown = false;
  let row: HTMLElement | null = null;
  const ease = reduce ? 1 : 0.16;
  const dense = window.devicePixelRatio > 1.25;

  const target = (): [number, number] => {
    const w = peek.offsetWidth;
    const h = peek.offsetHeight || PEEK_FALLBACK_H;
    const px = Math.max(
      PEEK_MARGIN,
      Math.min(tx - w / 2, window.innerWidth - w - PEEK_MARGIN),
    );
    if (!row) return [px, y];
    const r = row.getBoundingClientRect();
    const below = r.top + r.height / 2 < window.innerHeight / 2;
    const py = below ? r.bottom + PEEK_GAP_BELOW : r.top - h - PEEK_GAP_ABOVE;
    return [
      px,
      Math.max(
        PEEK_MARGIN + PEEK_TAB,
        Math.min(py, window.innerHeight - h - PEEK_MARGIN),
      ),
    ];
  };
  const tick = () => {
    const [px, py] = target();
    x += (px - x) * ease;
    y += (py - y) * ease;
    peek.style.transform = `translate3d(${x}px,${y}px,0)`;
    raf = shown ? requestAnimationFrame(tick) : 0;
  };

  /* Each new picture wipes in once it has loaded. */
  listen(img, "load", () => {
    peek.classList.remove("wipe");
    void peek.offsetWidth; // restart the animation
    peek.classList.add("wipe");
  });

  const show = (next: HTMLElement) => {
    const src = (dense && next.dataset.peek2x) || next.dataset.peek;
    if (!src) return;
    if (img.getAttribute("src") !== src) {
      img.style.objectPosition = next.dataset.peekPos || "top";
      img.src = src;
      if (cap) cap.textContent = next.dataset.peekCap || "";
    }
    row = next;
    if (!shown) [x, y] = target();
    shown = true;
    peek.classList.add("on");
    if (!raf) tick();
  };
  const hide = () => {
    shown = false;
    peek.classList.remove("on");
  };

  document.querySelectorAll<HTMLElement>(".pr").forEach((el) => {
    listen(el, "pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      show(el);
    });
    listen(el, "pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
    });
    listen(el, "pointerleave", hide);
    listen(el, "focus", () => {
      if (!el.matches(":focus-visible")) return;
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

export function init(): void {
  cleanup();
  initReveal();
  initScrollSpy();
  initScrolledNav();
  initMobileNav();
  initPreview();
  initStories();
  initCopy();
  initImageFade();
}
