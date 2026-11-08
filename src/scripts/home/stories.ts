/* Story dialogs (ProjectStory.astro). Rows, numbers, Previous, Next and
   close are plain links that work without script; here they open the stories
   as modals instead.
   - Any `[data-story]` link opens its story. Closing returns focus to that
     link, or, when a row opened it, to the row of the story the visitor ended on.
   - Previous and Next, the arrow keys and a sideways swipe move between stories.
   - Opening from the page pushes `#story-<id>`, so the address can be shared
     and Back closes the story. Moving between stories replaces that entry. */
import { listen, reduce, teardowns } from "./runtime";

const SWIPE_MIN = 60; // px of sideways travel that counts as a swipe
const PULL_CLOSE = 90; // px a phone sheet is pulled down by its head to close
const STORY_HASH = /^#story-([\w-]+)$/;

type Dir = "next" | "prev";

/* On a phone a story is a sheet: it slides back down before it closes, from
   wherever a pull has left it. Elsewhere it closes at once. */
function dismiss(d: HTMLDialogElement, sheet: MediaQueryList): void {
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
}

/* On a phone, pulling the sheet down by its head follows the finger; past
   PULL_CLOSE it closes, short of it the sheet springs back. Only from the
   top of the story, so a pull never fights the scroll. */
function bindPull(
  d: HTMLDialogElement,
  sheet: MediaQueryList,
  close: () => void,
): void {
  const head = d.querySelector<HTMLElement>(".st-head");
  if (!head) return;
  let pullFrom: number | null = null;
  let pulled = 0;
  const endPull = () => {
    if (pullFrom === null) return;
    pullFrom = null;
    if (pulled > PULL_CLOSE) close();
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
  listen(
    head,
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      pullFrom =
        touch && sheet.matches && d.scrollTop <= 0 ? touch.clientY : null;
      pulled = 0;
    },
    { passive: true },
  );
  listen(
    head,
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (pullFrom === null || !touch) return;
      pulled = Math.max(0, touch.clientY - pullFrom);
      d.style.transform = pulled ? `translateY(${pulled}px)` : "";
    },
    { passive: true },
  );
  listen(head, "touchend", endPull, { passive: true });
  listen(head, "touchcancel", endPull, { passive: true });
}

/* A sideways swipe on a touch screen moves between stories. */
function bindSwipe(d: HTMLDialogElement, go: (dir: Dir) => void): void {
  let sx = 0;
  let sy = 0;
  listen(
    d,
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      sx = touch.clientX;
      sy = touch.clientY;
    },
    { passive: true },
  );
  listen(
    d,
    "touchend",
    (e) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - sx;
      const dy = touch.clientY - sy;
      if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(dx < 0 ? "next" : "prev");
      }
    },
    { passive: true },
  );
}

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

  const show = (id: string, enter?: Dir): boolean => {
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
  const go = (dir: Dir) => {
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

  const sheet = window.matchMedia("(max-width: 560px)");

  dialogs.forEach((d) => {
    listen(d, "click", (e) => {
      const t = e.target as HTMLElement;
      if (t === d || t.closest("[data-close]")) {
        e.preventDefault();
        dismiss(d, sheet);
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

    bindPull(d, sheet, () => dismiss(d, sheet));
    bindSwipe(d, go);
  });

  listen(document, "keydown", (e) => {
    if (!openDialog() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") go("next");
    else if (e.key === "ArrowLeft") go("prev");
  });

  /* Back and Forward open or close stories to match the address. */
  const onPop = () => {
    const id = window.location.hash.match(STORY_HASH)?.[1];
    pushed = false;
    if (id && byId(id)) {
      if (current !== id) show(id);
      return;
    }
    openDialog()?.close();
  };
  window.addEventListener("popstate", onPop);
  teardowns.push(() => window.removeEventListener("popstate", onPop));

  /* A shared link such as /#story-rsvp opens that story. */
  const shared = window.location.hash.match(STORY_HASH)?.[1];
  if (shared) show(shared);

  teardowns.push(() => dialogs.forEach((d) => d.open && d.close()));
}
