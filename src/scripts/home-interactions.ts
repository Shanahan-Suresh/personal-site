// Shared timing constants
const STAGGER_STEP_DEFAULT = 70; // ms
const HERO_ALIVE_DELAY = 1400; // ms

// prefers-reduced-motion — evaluated once at module load
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Shared teardowns
const teardowns: Array<() => void> = [];

export function cleanup(): void {
  teardowns.forEach((fn) => {
    try {
      fn();
    } catch (e) {}
  });
  teardowns.length = 0;
}

/* Scroll-reveal: variants via data-reveal; --d per element or auto per child */
export function initReveal(): void {
  /* auto-stagger: tag direct children + assign --d by index */
  document
    .querySelectorAll('.reveal[data-reveal="stagger-children"]')
    .forEach((container) => {
      const step = parseInt(
        container.getAttribute("data-stagger") || String(STAGGER_STEP_DEFAULT),
        10,
      );
      Array.prototype.forEach.call(
        container.children,
        (child: HTMLElement, i: number) => {
          child.classList.add("reveal-child");
          if (!child.style.getPropertyValue("--d")) {
            child.style.setProperty("--d", i * step + "ms");
          }
        },
      );
    });

  const els = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    // threshold: 0 (not 0.08) is intentional — clip-wipe reveals start at
    // clip-path: inset(0 100% 0 0), which zeroes the element's intersection
    // area so its ratio is permanently 0. A non-zero threshold could never
    // fire for them, so they'd stay clipped forever. threshold 0 fires on
    // isIntersecting (entry), and the -8% rootMargin still gates timing.
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  els.forEach((el) => {
    io.observe(el);
  });
  teardowns.push(() => {
    io.disconnect();
  });
}

/* Hero entrance plays on load (not scroll); idle motion starts after */
export function initHero(): void {
  const hero = document.querySelector(".hero-section") as HTMLElement | null;
  if (!hero) return;
  if (reduce) {
    hero.classList.add("hero-loaded");
    document.dispatchEvent(new CustomEvent("hero:headline-done"));
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add("hero-loaded");
    });
  });
  const t = setTimeout(() => {
    hero.classList.add("is-alive");
  }, HERO_ALIVE_DELAY);
  teardowns.push(() => {
    clearTimeout(t);
  });
}

/* Scrollspy: highlight the nav link whose section is in view */
export function initScrollSpy(): void {
  if (!("IntersectionObserver" in window)) return;
  const links = Array.prototype.slice.call(
    document.querySelectorAll(".nav-link"),
  ) as HTMLAnchorElement[];
  const map: Record<string, HTMLAnchorElement> = {};
  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    const i = href.indexOf("#");
    if (i !== -1) {
      const id = href.slice(i + 1);
      if (id) map[id] = a;
    }
  });
  const ids = Object.keys(map);
  if (!ids.length) return;
  const sections = ids
    .map((id) => document.getElementById(id))
    .filter(Boolean) as HTMLElement[];
  if (!sections.length) return;

  function clearActive() {
    links.forEach((a) => {
      a.classList.remove("is-active");
      a.removeAttribute("aria-current");
    });
  }
  const spy = new IntersectionObserver(
    (entries) => {
      let best: IntersectionObserverEntry | null = null;
      entries.forEach((e) => {
        if (
          e.isIntersecting &&
          (!best || e.intersectionRatio > best.intersectionRatio)
        ) {
          best = e;
        }
      });
      if (best) {
        clearActive();
        const a = map[(best as IntersectionObserverEntry).target.id];
        if (a) {
          a.classList.add("is-active");
          a.setAttribute("aria-current", "true");
        }
      }
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
  );
  sections.forEach((s) => {
    spy.observe(s);
  });
  teardowns.push(() => {
    spy.disconnect();
  });
}

/* Scrolled-nav: deepen the header shadow once the page scrolls */
export function initScrolledNav(): void {
  const header = document.querySelector(".nav-header") as HTMLElement | null;
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
    if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
  });
}

/* Pause idle loops while offscreen */
export function initIdlePause(): void {
  if (!("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(".sticker-cluster, .marquee");
  if (!targets.length) return;
  const pauseObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle("is-paused", !e.isIntersecting);
      });
    },
    { threshold: 0 },
  );
  targets.forEach((t) => {
    pauseObs.observe(t);
  });
  teardowns.push(() => {
    pauseObs.disconnect();
  });
}

export function init(): void {
  cleanup();
  initReveal();
  initHero();
  initScrollSpy();
  initScrolledNav();
  initIdlePause();
}
