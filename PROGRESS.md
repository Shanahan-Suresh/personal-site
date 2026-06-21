# Plan: Phase D2 — Extract BaseLayout interaction IIFE into src/scripts modules

## Goal
Extract the large inline behavior IIFE from `src/layouts/BaseLayout.astro` into typed
`src/scripts/` modules, with IDENTICAL runtime behavior. FOUC/theme script stays inline.
Approach: test-first (add regression tests, baseline green, then extract, confirm still green).

## Steps
- [x] A. Read BaseLayout.astro + tests — understand IIFE structure and existing test conventions.
- [ ] B. Add 3 test groups to tests/home.spec.ts (scrolled-nav, scroll-spy, hero-entrance). Run npm run build + npx playwright test. Fix assertions to match reality if needed. Commit.
- [ ] C. Create src/scripts/home-interactions.ts (single file, all 5 init fns + cleanup exported). Replace IIFE block in BaseLayout.astro with bundled <script> import.
- [ ] D. Gates: astro check 0 errors → npm run build → npx playwright test all browsers green. Confirm FOUC script in dist/index.html.
- [ ] E. Final extraction commit.

## Key files
- `src/layouts/BaseLayout.astro` — contains both the FOUC script (lines 48-62, MUST stay) and the big IIFE (lines 79-287, to be extracted)
- `src/scripts/` — new directory: reveal.ts, hero.ts, scroll-spy.ts, scrolled-nav.ts, idle-pause.ts
- `tests/home.spec.ts` — existing 7 test groups (24 cases across 3 browsers); add 3 new behavior tests

## Decisions made
- IIFE guard: `init()` called IMMEDIATELY (not in DOMContentLoaded — it's `is:inline` at end of body), then `document.addEventListener("astro:page-load", init)` and `document.addEventListener("astro:before-swap", cleanup)` wired up. Extraction MUST reproduce this: use `<script>` (bundled), which Astro defers; need to verify timing equivalence.
- Constants: STAGGER_STEP_DEFAULT=70, HERO_ALIVE_DELAY=1400 (from Phase C1 — move into shared constants or inline per module)
- Teardown: `teardowns` array + `cleanup()` must be module-level state shared across all init functions
- FOUC script (lines 48-62): DO NOT TOUCH — `is:inline`, runs synchronously in <head>

## Open questions / blockers
- Timing: original IIFE runs synchronously at end of body (no DOMContentLoaded guard). Astro bundled `<script>` is deferred. In practice this is fine (DOM fully parsed by then), but must verify via tests.
