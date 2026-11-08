/* What every part of the page behaviour shares: the reduced-motion flag, the
   listener bookkeeping that lets `init` run again, and the scroll-in reveal. */

export const reduce = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* Effects that need a mouse: the label wipe, hopping letters and the typing
   chip. Touch screens and reduced motion keep the page as it is. */
export const fineHover = () =>
  !reduce && window.matchMedia("(hover: hover)").matches;

/* Every listener and observer a run adds, so the next run can undo them. */
export const teardowns: Array<() => void> = [];

export function listen<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document | Window,
  type: K,
  fn: (e: HTMLElementEventMap[K]) => void,
  opts?: AddEventListenerOptions,
): void {
  el.addEventListener(type, fn as EventListener, opts);
  teardowns.push(() => el.removeEventListener(type, fn as EventListener));
}

export function cleanup(): void {
  teardowns.forEach((fn) => {
    try {
      fn();
    } catch {
      // A teardown for a node that is gone has nothing left to undo.
    }
  });
  teardowns.length = 0;
}

/* Adds `in` to each element the first time it scrolls in, then stops
   watching it. `each` runs first for every element of one batch, with its
   place in the batch. With reduced motion, or without IntersectionObserver,
   every element is in at once. */
export function revealOnce<T extends Element>(
  els: NodeListOf<T>,
  rootMargin: string,
  each?: (el: T, i: number) => void,
): void {
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          const el = e.target as T;
          each?.(el, i);
          el.classList.add("in");
          io.unobserve(el);
        });
    },
    { rootMargin, threshold: 0 },
  );
  els.forEach((el) => io.observe(el));
  teardowns.push(() => io.disconnect());
}
