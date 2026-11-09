/* Page behaviour for the poster design: the theme switch, headline reveal,
   scroll spy, scrolled nav, mobile menu, the pointer preview on project
   rows, the story dialogs, the hover finds (label wipe, hopping letters,
   typing chip), keyboard shortcuts and a note in the console. Every part
   works from server-rendered markup; script only adds motion, the modal and
   the shortcuts. Each part lives in its own module under ./home/. `init`
   runs once per page and is safe to call again: it first undoes every
   listener a previous run added. */
import { cleanup } from "./home/runtime";
import { initImageFade, initReveal, initStagger } from "./home/entrance";
import { initMobileNav, initScrolledNav, initScrollSpy } from "./home/nav";
import { initPreview } from "./home/preview";
import { initStories } from "./home/stories";
import { initBrush, initHop, initTypeChip } from "./home/finds";
import { initFlip } from "./home/flip";
import { initShortcuts } from "./home/shortcuts";
import { greetConsole } from "./home/greeting";
import { initThemeToggle } from "./home/theme";

export function init(): void {
  cleanup();
  greetConsole();
  initThemeToggle();
  initBrush();
  initFlip();
  initHop();
  initTypeChip();
  initShortcuts();
  initReveal();
  initStagger();
  initScrollSpy();
  initScrolledNav();
  initMobileNav();
  initPreview();
  initStories();
  initImageFade();
}
