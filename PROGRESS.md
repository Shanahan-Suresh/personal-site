# Plan: Phase D2 — Extract BaseLayout interaction IIFE into src/scripts modules

## Goal
Extract the large inline behavior IIFE from `src/layouts/BaseLayout.astro` into typed
`src/scripts/` modules, with IDENTICAL runtime behavior. FOUC/theme script stays inline.

## Steps
- [x] A. Read BaseLayout.astro + tests — understand IIFE structure and existing test conventions.
- [x] B. Add 3 test groups to tests/home.spec.ts (scrolled-nav, scroll-spy, hero-entrance). Run npm run build + npx playwright test. Fix assertions to match reality if needed. Commit `477b963`.
- [x] C. Create src/scripts/home-interactions.ts (single file, all 5 init fns + cleanup exported). Replace IIFE block in BaseLayout.astro with bundled <script> import.
- [x] D. Gates: astro check 0 errors → npm run build → npx playwright test 33/33 all browsers green. FOUC script confirmed in dist/index.html.
- [x] E. Final extraction commit `0e0190c`.

## DONE — Phase D2 complete.
