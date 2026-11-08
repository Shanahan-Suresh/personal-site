/* The nav bar (Nav.astro): scroll spy, the scrolled state, the phone bar
   that slides away, and the mobile menu. */
import { listen, teardowns } from "./runtime";

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
    ([entry]) => {
      // One target, so every callback carries its entry.
      if (entry) header.classList.toggle("is-scrolled", !entry.isIntersecting);
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
