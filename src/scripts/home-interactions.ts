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
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  listen(burger, "click", () =>
    setOpen(!header.classList.contains("nav-open")),
  );
  header
    .querySelectorAll<HTMLAnchorElement>(".nav-link")
    .forEach((a) => listen(a, "click", () => setOpen(false)));
  listen(document, "keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  listen(document, "pointerdown", (e) => {
    if (!header.contains(e.target as Node)) setOpen(false);
  });
  teardowns.push(() => setOpen(false));
}

/* Pointer preview: a screenshot follows the mouse over the project rows.
   CSS hides it on touch screens and below 960px. */
/* Preview placement, in CSS pixels. The panel is 400px wide (Work.astro). */
const PEEK_GAP = 36; // from the pointer to the panel's left edge
const PEEK_ROOM = 420; // panel width plus margin kept clear at the right edge
const PEEK_MARGIN = 12; // kept clear above and below the panel
const PEEK_FALLBACK_H = 260; // panel height before its image has loaded
const PEEK_FOCUS_INSET = 460; // keyboard focus: the panel sits this far in from the row's right edge

export function initPreview(): void {
  const peek = document.getElementById("peek");
  const img = peek?.querySelector("img");
  if (!peek || !img) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  let shown = false;
  const ease = reduce ? 1 : 0.16;

  const target = (): [number, number] => {
    const h = peek.offsetHeight || PEEK_FALLBACK_H;
    return [
      Math.min(tx + PEEK_GAP, window.innerWidth - PEEK_ROOM),
      Math.max(
        PEEK_MARGIN,
        Math.min(ty - h / 2, window.innerHeight - h - PEEK_MARGIN),
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
  const show = (row: HTMLElement) => {
    const src = row.dataset.peek;
    if (!src) return;
    if (img.getAttribute("src") !== src) img.src = src;
    if (!shown) [x, y] = target();
    shown = true;
    peek.classList.add("on");
    if (!raf) tick();
  };
  const hide = () => {
    shown = false;
    peek.classList.remove("on");
  };

  document.querySelectorAll<HTMLElement>(".pr").forEach((row) => {
    listen(row, "pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      show(row);
    });
    listen(row, "pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
    });
    listen(row, "pointerleave", hide);
    listen(row, "focus", () => {
      if (!row.matches(":focus-visible")) return;
      const r = row.getBoundingClientRect();
      tx = r.right - PEEK_FOCUS_INSET;
      ty = r.top + r.height / 2;
      show(row);
    });
    listen(row, "blur", hide);
    listen(row, "click", hide);
  });
  teardowns.push(() => {
    hide();
    cancelAnimationFrame(raf);
  });
}

/* Story dialogs: rows, Next and close are plain links that work without
   script; here they open and close the dialogs as modals instead. */
export function initStories(): void {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLDialogElement>("dialog.story"),
  );
  if (!dialogs.length || typeof HTMLDialogElement !== "function") return;
  let current: string | null = null;

  const byId = (id: string) =>
    document.getElementById(`story-${id}`) as HTMLDialogElement | null;

  const open = (id: string) => {
    const next = byId(id);
    if (!next) return;
    dialogs.forEach((d) => {
      if (d !== next && d.open) d.close();
    });
    current = id;
    if (!next.open) next.showModal();
    next.scrollTop = 0;
  };

  document.querySelectorAll<HTMLAnchorElement>(".pr").forEach((row) => {
    listen(row, "click", (e) => {
      const id = row.dataset.story;
      if (!id || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      open(id);
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
      const nextLink = t.closest<HTMLElement>("[data-next]");
      if (nextLink?.dataset.next) {
        e.preventDefault();
        open(nextLink.dataset.next);
      }
    });
    listen(d, "close", () => {
      if (dialogs.some((o) => o.open) || !current) return;
      document.getElementById(`row-${current}`)?.focus({ preventScroll: true });
      current = null;
    });
  });

  /* A shared link such as /#story-rsvp opens that story. */
  const m = window.location.hash.match(/^#story-([\w-]+)$/);
  if (m) open(m[1]);

  teardowns.push(() => dialogs.forEach((d) => d.open && d.close()));
}

export function init(): void {
  cleanup();
  initReveal();
  initScrollSpy();
  initScrolledNav();
  initMobileNav();
  initPreview();
  initStories();
}
