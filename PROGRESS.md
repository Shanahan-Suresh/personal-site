# Progress: poster site

The poster redesign is live on `main`. Dev server: `npx astro dev --port 4322`; `npm test` uses
port 4321. The owner approved every change up to here.

## Owed

- Censorit's BOOTH store link, when the owner sends the URL, as the project's `link` in
  `src/data/projects.ts`.
- A WebKit flake in `tests/phone.spec.ts` ("the bar slides away on a scroll down and comes back
  on a scroll up"). Under the full parallel run, `scrollY` sometimes drops about 17px by itself
  after the jump to 1200, the nav reads that as a scroll up, and the bar comes back. It passes
  alone (15 of 15) and fails in about 1 of 2 full WebKit runs, on `main` too. Waiting for the
  load event and fonts before the jump does not stop it. CI runs only Chromium, so it never
  blocks a merge.
