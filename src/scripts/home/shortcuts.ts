/* Keyboard shortcuts: "?" opens a card that lists them. T switches the
   theme; W, A and C go to Work, About and Contact. The card can turn the
   letter keys off (remembered in localStorage), and they never fire while
   a story is open, with a modifier key, or in a text field. */
import { navLinks } from "@/data/navigation";
import { listen, reduce } from "./runtime";

const SHORTCUTS_KEY = "shortcuts";
/* Letter to section id, from the nav: each section's first letter jumps to
   it ("Work" is W to #work). The card names each jump by its section. */
const JUMPS: Record<string, string> = Object.fromEntries(
  navLinks.map(({ label, href }) => [
    label.charAt(0).toLowerCase(),
    href.slice(href.indexOf("#") + 1),
  ]),
);

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
    ...Object.entries(JUMPS).map(([k, id]) => [k.toUpperCase(), id]),
    ["?", "open or close this card"],
  ]) {
    const li = document.createElement("li");
    const kbd = document.createElement("kbd");
    kbd.textContent = key ?? "";
    li.append(kbd, what ?? "");
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

/* Keys that belong to someone else: with a modifier, held down, typed into
   a field, or pressed while a story is open. */
function ignored(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
    return true;
  const t = e.target as HTMLElement | null;
  if (t?.closest("input, textarea, select, [contenteditable]")) return true;
  return document.querySelector("dialog[open]") !== null;
}

function jump(id: string): void {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  } else {
    location.href = `/#${id}`;
  }
}

/* What each letter key does while the letter keys are on. */
const letters = new Map<string, () => void>([
  ["t", () => document.getElementById("theme-toggle")?.click()],
  ...Object.entries(JUMPS).map(([key, id]): [string, () => void] => [
    key,
    () => jump(id),
  ]),
]);

export function initShortcuts(): void {
  // A second run of `init` finds the card the first run built.
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
    if (ignored(e)) return;
    if (e.key === "?") card.hidden = !card.hidden;
    else if (e.key === "Escape" && !card.hidden) card.hidden = true;
    else if (shortcutsOn()) letters.get(e.key.toLowerCase())?.();
  });
}
