/* A note for developers who open the browser console. Once per page load. */
let greeted = false;

export function greetConsole(): void {
  if (greeted) return;
  greeted = true;
  console.log(
    "%cLET'S BUILD.",
    "padding:4px 12px;background:#ffd84a;color:#111;border:3px solid #111;font:900 26px/1.2 Impact,'Arial Narrow',sans-serif;",
  );
  console.log(
    [
      "Hi. This site is plain Astro and Tailwind, with no framework runtime.",
      `How it is built: ${location.origin}/colophon`,
      "The source: https://github.com/Shanahan-Suresh/personal-site",
      "Press ? on the page for keyboard shortcuts.",
      "Hiring, or want to build something? hello@shanahansuresh.com",
    ].join("\n"),
  );
}
