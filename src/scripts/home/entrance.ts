/* How content arrives: headline lines and frames rise, list items follow one
   after another, and late pictures fade in. */
import { listen, revealOnce } from "./runtime";

/* Headline lines rise, and hero frames fade up, as their block scrolls in. */
export function initReveal(): void {
  revealOnce(document.querySelectorAll(".reveal"), "0px 0px -8% 0px");
}

/* `data-stagger`: the items of a list fade up one after another as they
   scroll in. Items that arrive in the same batch take 70ms steps (--i), so
   a screenful rises in order and a later item never waits for the ones
   above it. */
export function initStagger(): void {
  revealOnce(
    document.querySelectorAll<HTMLElement>("[data-stagger] > *"),
    "0px 0px -40px 0px",
    (el, i) => el.style.setProperty("--i", String(i)),
  );
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
