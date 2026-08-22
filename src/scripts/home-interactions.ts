// Shared timing constants
const STAGGER_STEP_DEFAULT = 70; // ms
const HERO_ALIVE_DELAY = 1400; // ms

// prefers-reduced-motion — evaluated once at module load
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
  // when the coral marker finishes filling, give "AI tooling." one snappy
  // clockwise pop. Triggered off the marker's own transitionend so timing
  // stays synced to the CSS; reduced-motion already returned above.
  const marker = hero.querySelector(
    ".hero-headline .marker",
  ) as HTMLElement | null;
  if (marker) {
    const onFilled = (e: TransitionEvent) => {
      if (e.propertyName !== "background-size") return;
      marker.closest(".slam-line")?.classList.add("is-settled");
      marker.removeEventListener("transitionend", onFilled);
    };
    marker.addEventListener("transitionend", onFilled);
    teardowns.push(() => marker.removeEventListener("transitionend", onFilled));
  }
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

/* Mobile nav: hamburger toggle + sheet open/close */
export function initMobileNav(): void {
  const header = document.querySelector(".nav-header") as HTMLElement | null;
  const burger = document.querySelector(
    ".nav-burger",
  ) as HTMLButtonElement | null;
  if (!header || !burger) return;

  function openMenu() {
    header!.classList.add("nav-open");
    burger!.setAttribute("aria-expanded", "true");
    burger!.setAttribute("aria-label", "Close menu");
  }

  function closeMenu() {
    header!.classList.remove("nav-open");
    burger!.setAttribute("aria-expanded", "false");
    burger!.setAttribute("aria-label", "Open menu");
  }

  function onBurgerClick() {
    const isOpen = header!.classList.contains("nav-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function onLinkClick() {
    closeMenu();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") closeMenu();
  }

  function onPointerDown(e: PointerEvent) {
    if (!header!.contains(e.target as Node)) {
      closeMenu();
    }
  }

  const navLinks = Array.prototype.slice.call(
    header.querySelectorAll(".nav-link"),
  ) as HTMLAnchorElement[];

  burger.addEventListener("click", onBurgerClick);
  navLinks.forEach((a) => a.addEventListener("click", onLinkClick));
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", onPointerDown);

  teardowns.push(() => {
    burger!.removeEventListener("click", onBurgerClick);
    navLinks.forEach((a) => a.removeEventListener("click", onLinkClick));
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("pointerdown", onPointerDown);
    closeMenu();
  });
}

export function initStickers(): void {
  if (reduce || !fine) return;

  const RADIUS = 160,
    STRENGTH = 0.28,
    MAXLEAN = 4,
    LIFT = 8,
    CARRY = 0.12;
  const ROT: Record<string, number> = {
    "rot-l": -2.5,
    "rot-r": 2.5,
    "rot-l2": -4,
    "rot-r2": 3.5,
  };
  function baseRot(el: HTMLElement): number {
    for (const k in ROT) if (el.classList.contains(k)) return ROT[k];
    return 0;
  }

  const clusters = Array.prototype.slice.call(
    document.querySelectorAll(".sticker-cluster, .beyond-stickers"),
  ) as HTMLElement[];

  function resetSticker(s: HTMLElement): void {
    const br = baseRot(s);
    s.style.transform = `rotate(${br}deg)`;
    s.classList.remove("is-peeled", "is-pulled");
    // release the animation + opacity back to CSS control (stamp/sway holds opacity:1)
    s.style.animation = "";
    s.style.opacity = "";
  }

  const handlers: Array<{
    el: HTMLElement;
    enter: () => void;
    move: (e: PointerEvent) => void;
    leave: () => void;
    invalidate: () => void;
  }> = [];

  clusters.forEach((cluster) => {
    const stickers = Array.prototype.slice.call(
      cluster.querySelectorAll(".sticker"),
    ) as HTMLElement[];
    if (!stickers.length) return;

    // Hero stamps (.sticker-cluster) sit too close together for the magnetic
    // lean to feel good, so they peel-only on direct hover. The Beyond row
    // keeps the full lean→peel blend.
    const allowLean = !cluster.classList.contains("sticker-cluster");

    // Rest-state hit geometry. Captured while NO sticker is transformed, then
    // reused for every hit-test in the session. This is what kills the jitter:
    // hit-testing against the live (peeled/scaled) rect makes the transform feed
    // back into the test — the cursor falls outside the lifted rect, the sticker
    // resets, the rect returns, and it flip-flops every frame. A fixed rest
    // footprint can never feed back into itself.
    let rects: DOMRect[] = [];
    function capture(): void {
      rects = stickers.map((s) => s.getBoundingClientRect());
    }
    function invalidate(): void {
      // re-sync footprints after layout shifts — only safe from a clean state
      stickers.forEach(resetSticker);
      rects = [];
    }

    function onMove(e: PointerEvent): void {
      if (rects.length !== stickers.length) capture();
      stickers.forEach((s, i) => {
        const rect = rects[i];
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const over =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (over) {
          const carry = allowLean ? dx * CARRY : 0;
          s.style.transform = `translate(${carry}px, ${-LIFT}px) rotate(0deg) scale(1.06)`;
          s.classList.add("is-peeled");
          s.classList.remove("is-pulled");
          // override the idle/stamp animation, but keep the sticker visible
          // (base .sticker is opacity:0; only the animation's final frame shows it)
          s.style.animation = "none";
          s.style.opacity = "1";
        } else if (allowLean && dist < RADIUS) {
          const br = baseRot(s);
          const f = (1 - dist / RADIUS) * STRENGTH;
          s.style.transform = `translate(${dx * f}px, ${dy * f}px) rotate(${br + (dx / RADIUS) * MAXLEAN}deg) scale(1.03)`;
          s.classList.add("is-pulled");
          s.classList.remove("is-peeled");
          s.style.animation = "none";
          s.style.opacity = "1";
        } else {
          resetSticker(s);
        }
      });
    }

    function onEnter(): void {
      capture();
    }

    function onLeave(): void {
      stickers.forEach(resetSticker);
      rects = [];
    }

    cluster.addEventListener("pointerenter", onEnter);
    cluster.addEventListener("pointermove", onMove);
    cluster.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    handlers.push({
      el: cluster,
      enter: onEnter,
      move: onMove,
      leave: onLeave,
      invalidate,
    });
  });

  teardowns.push(() => {
    handlers.forEach(({ el, enter, move, leave, invalidate }) => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
    });
  });
}

export function initMagnetic(): void {
  if (reduce || !fine) return;

  const STRENGTH = 0.25;
  const MAX_PX = 6;

  const els = Array.prototype.slice.call(
    document.querySelectorAll("[data-magnetic]"),
  ) as HTMLElement[];
  if (!els.length) return;

  const handlers: Array<{
    el: HTMLElement;
    move: (e: PointerEvent) => void;
    leave: () => void;
  }> = [];

  els.forEach((el) => {
    function onMove(e: PointerEvent): void {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const tx = Math.max(-MAX_PX, Math.min(MAX_PX, dx * STRENGTH));
      const ty = Math.max(-MAX_PX, Math.min(MAX_PX, dy * STRENGTH));
      el.style.transform = `translate(${tx}px, ${ty}px)`;
    }
    function onLeave(): void {
      el.style.transform = "";
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    handlers.push({ el, move: onMove, leave: onLeave });
  });

  teardowns.push(() => {
    handlers.forEach(({ el, move, leave }) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    });
  });
}

export function initTilt(): void {
  if (reduce || !fine) return;

  const MAX_DEG = 3;

  const els = Array.prototype.slice.call(
    document.querySelectorAll("[data-tilt]"),
  ) as HTMLElement[];
  if (!els.length) return;

  const handlers: Array<{
    el: HTMLElement;
    move: (e: PointerEvent) => void;
    leave: () => void;
  }> = [];

  els.forEach((el) => {
    function onMove(e: PointerEvent): void {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const rx = -dy * MAX_DEG;
      const ry = dx * MAX_DEG;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
    function onLeave(): void {
      el.style.transform = "";
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    handlers.push({ el, move: onMove, leave: onLeave });
  });

  teardowns.push(() => {
    handlers.forEach(({ el, move, leave }) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    });
  });
}

export function initScrollVelocity(): void {
  if (reduce) return; // fine-pointer NOT required — touch scroll also applies

  const track = document.querySelector(".marquee") as HTMLElement | null;
  if (!track) return;

  const MAX_SKEW = 4;
  const DECAY = 0.88;
  let lastY = window.scrollY;
  let velocity = 0;
  let rafId = 0;

  function loop(): void {
    velocity *= DECAY;
    const skew = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, velocity));
    track!.style.setProperty("--mq-skew", `${skew}deg`);
    rafId = requestAnimationFrame(loop);
  }

  function onScroll(): void {
    const y = window.scrollY;
    velocity = (y - lastY) * 0.12;
    lastY = y;
  }

  rafId = requestAnimationFrame(loop);
  window.addEventListener("scroll", onScroll, { passive: true });

  teardowns.push(() => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("scroll", onScroll);
    if (track) track.style.removeProperty("--mq-skew");
  });
}

export function init(): void {
  cleanup();
  initReveal();
  initHero();
  initScrollSpy();
  initScrolledNav();
  initIdlePause();
  initMobileNav();
  initStickers();
  initMagnetic();
  initTilt();
  initScrollVelocity();
}
