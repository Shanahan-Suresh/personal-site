# Refactoring Backlog: personal-site

Generated: 2026-11-09 | Git: aca0ac8 | Branch: redesign/poster | Stack: Astro 7 static site (TypeScript, .astro components, CSS, Playwright e2e)

Scope: behaviour-preserving refactors only. Anything that could change behaviour sits under "Proposals (needs sign-off)". Nothing was edited, installed or committed during the audit. Paths are relative to the project root.

## Executive Summary

| Metric                   | Value                        |
| ------------------------ | ---------------------------- |
| Total findings           | 40 (39 in tiers, 1 proposal) |
| Tier 1 (deploy blockers) | 0                            |
| Tier 2 (high value)      | 7                            |
| Tier 3                   | 22                           |
| Tier 4                   | 10                           |
| Quick wins               | 5                            |
| Strategic                | 1                            |
| Clusters                 | 2                            |

Health snapshot: astro check clean (0 errors, 0 warnings, 0 hints on 45 files), build passes in 6 s, npm audit 0 vulnerabilities, semgrep 0 results, jscpd 0.17% duplication (2 clones, 17 lines). The site is deployable as it stands, so Tier 1 is empty. The debt is concentrated in one file: src/scripts/home-interactions.ts (1152 LOC, 145 functions, 14 behaviours, 12 of the 40 findings have it as primary file). The next concentration is the two spec files (tests/home.spec.ts 822 LOC) and ThemeToggle.astro (440 LOC, complexity 22).

Coverage is a partial, behavioural proxy (see Methodology), so every TEST finding carries confidence "medium". The coverage map flagged six hotspot files. Five are static markup or data with no script, so their TEST items are suppressed: a dist/ HTML diff proves those refactors. The one gate with real logic is home-interactions.ts (TEST-06), and it gates every refactor on that file.

Suggested order for home-interactions.ts: TEST-06 first, then the quick wins (DEAD-01, DEAD-02, GOD-07, DUP-03), then the split (GOD-08) together with the shared selectors module (ARCH-03), then the long methods (GOD-02, GOD-04) and the type narrowing (TYPE-01).

## Status

The findings below are worked in `main` (PR #30). Line numbers in the findings further down cite the audit commit aca0ac8, before the split. Measured 2026-11-09: build 0 errors; Playwright 186 passed and 4 skipped on chromium, firefox and webkit; chromium with `--repeat-each=3` 198 passed; `dist/` diff shows only the theme toggle's inline script and one merged style block on /writing; computed styles of every body element identical on 5 pages, 2 widths and 2 themes; gzipped home script 6285 B to 6426 B.

| ID      | State           | Result                                                                                                                                                                                        |
| ------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-06 | Done            | tests/interactions.spec.ts: 12 tests for stagger, image fade, brush, flip, swipe, typing chip, console note, preview keyboard path and shape, story Forward and phone swipe.                  |
| DUP-01  | Done            | src/lib/bayer.ts holds the Bayer matrix; ThemeToggle.astro reads it in markup and script.                                                                                                     |
| TEST-07 | Done            | Two fixed waits replaced by state waits. The two left (click spacing in the theme test, the quiet period after a hop) are the test input.                                                     |
| DUP-02  | Done, in part   | tests/fixtures.ts holds the story ids, row count and both budgets. The shared open-story helper is not made: each flow checks a different detail.                                             |
| ARCH-01 | Comment only    | The 406px holds the panel width until the first picture is measured, so it stays. Work.astro's comment says so.                                                                               |
| ARCH-02 | Done            | src/data/budgets.ts and src/lib/test-count.ts; colophon.astro reads both.                                                                                                                     |
| DEAD-01 | Does not hold   | A second `init` run finds the card the first run built. The lookup stays, with a comment.                                                                                                     |
| DEAD-02 | Done            | The init functions are exports of src/scripts/home/ modules, each imported by the entry. knip: 0 unused exports in src/scripts.                                                               |
| GOD-07  | Done            | The keydown handler is three lines over `ignored`, `jump` and a letters map. Its CCN is under 7 (was 16).                                                                                     |
| DUP-03  | Done            | `revealOnce` in runtime.ts serves reveal and stagger. JUMPS builds the card rows and the letter keys.                                                                                         |
| GOD-08  | Done            | home-interactions.ts is a 33-line entry. Largest modules: finds.ts 303, preview.ts 299, stories.ts 272 lines. Call order unchanged.                                                           |
| ARCH-03 | Different route | No global selectors module. Each module owns the selectors of the markup it drives. Where one component owns that markup, the header comment names it (Nav, Work, ProjectStory, Hero, About). |
| GOD-02  | Done, in part   | Placement maths are module-level pure functions. initPreview is 175 lines (target 120) and `swap` has CCN 13 (target 8).                                                                      |
| GOD-04  | Done            | `dismiss`, `bindPull` and `bindSwipe` are module-level. initStories is 143 lines (was 239).                                                                                                   |
| TYPE-01 | Done            | `tsc --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes`: 0 errors in src/scripts.                                                                                              |
| DEPS-01 | Done, in part   | Every package is at its newest in-range version except `tailwindcss` and `@tailwindcss/vite` (4.3.3, newest 4.3.5), which the monthly grouped Dependabot PR brings.                           |

The story tests found one race in the site: a Forward within about 10 ms of Back closes the story again, because the dialog's close event lands after the Forward. No person can press that fast, so it stays as it is.

## Coordinated Fixes (Clusters)

**CLUSTER-01** (hard-coded-colour): Coordinated fix: hard-coded-colour in 3 files, size S (one pass over three components, one screenshot compare) combined. Findings: ARCH-10, ARCH-12, ARCH-13. Files: src/components/Footer.astro, src/components/Nav.astro, src/components/ProjectStory.astro.

**CLUSTER-02** (type-declared-outside-types-ts): Coordinated fix: type-declared-outside-types-ts in 5 files, size S (move five declarations, astro check proves it) combined. The same edit also covers ARCH-17 and ARCH-08. Findings: ARCH-06, ARCH-14, ARCH-15, ARCH-16, ARCH-07. Files: src/data/colophon.ts, src/data/interests.ts, src/data/navigation.ts, src/data/learning.ts, src/data/projects.ts.

Two literal colours stay out of the cluster and are suppressed: the theme-color meta in BaseHead.astro and the console banner style in home-interactions.ts, because neither can use a CSS variable.

## Top 5 Quick Wins

| ID      | Title                                                                         | Effort | Impact | File                             | Success Metric                                                                                                 |
| ------- | ----------------------------------------------------------------------------- | ------ | ------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| DUP-01  | 8x8 Bayer matrix written twice (64 elements in markup and an array in script) | S      | M      | src/components/ThemeToggle.astro | One definition of the Bayer table; template has no hand-listed i elements; dist .dither markup byte-identical. |
| TEST-07 | Brittle waits and fixed-pixel input in the Playwright specs                   | S      | M      | tests/home.spec.ts               | waitForTimeout remains only where the delay is the test input; suite green with --repeat-each=3.               |
| DUP-02  | Story ids, row count and byte budgets repeated across the specs               | S      | M      | tests/home.spec.ts               | Each id list, row count and budget defined once.                                                               |
| ARCH-01 | Peek width set in Work.astro CSS and in PEEK_W in script                      | S      | M      | src/components/Work.astro        | Peek width defined once; preview Playwright tests pass.                                                        |
| ARCH-02 | colophon.astro spawns Playwright during the static build                      | S      | M      | src/pages/colophon.astro         | colophon.astro frontmatter under 15 LOC; budgets defined once; dist/colophon/index.html identical.             |

## Top 5 Strategic

| ID      | Title                                                                               | Effort | Impact | Risk | Success Metric                                                                                                                      |
| ------- | ----------------------------------------------------------------------------------- | ------ | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ARCH-03 | One script queries markup owned by ten components with no shared selector constants | L      | H      | H    | home-interactions.ts has 0 literal selectors outside the shared module; file under 400 LOC; Playwright specs unchanged and passing. |

## Tier 1 Findings

None. The build is green, astro check is clean, npm audit reports 0 vulnerabilities, and no finding carries a concrete deploy-risk argument. The formula itself proposes no Tier 1 finding.

## Tier 2 Findings

TEST-06 is Tier 2 by rule (the one coverage blocker with real logic). TEST-01 to TEST-05 are suppressed as proxy artefacts (see Suppressed).

### TEST-06: Add specs for src/scripts/home-interactions.ts (proxy coverage 59.8%)

- Tier 2 | score 8.5 | effort M | impact H | risk L | confidence medium | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 1152 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: A3
- Evidence: line_coverage_pct: 59.8% (threshold 60); file is in hotspots top-14 (churn 9). Functions at 0% proxy: initStagger 59-82, initImageFade 694-708, initBrush 709-764, initFlip 765-888, initTypeChip 977-1017, greetConsole 1118-1135. Also partial: initHop 60%, initPreview 75% (edge placement and keyboard path untested), initShortcuts 80% (Escape on the keys card). Behavioural proxy from Playwright spec selectors; the suite was not run and there is no line instrumentation, so the percentage is an estimate.
- Approach: Add Playwright specs for the six 0% functions, asserting observable effects: the --i stagger step on [data-stagger] items, the loaded class after image decode, the brush wipe on the hero label, the settled --flip value after a click, the type chip text, and the console greeting through page.on('console'). Then cover initPreview edge placement and the Escape path.
- Equivalence proof: Tests only, no src change. Run the touched spec on chromium and confirm it fails when the feature is broken.
- Success metric: Behavioural-proxy coverage on src/scripts/home-interactions.ts reaches >=60% (real line coverage if instrumentation is added).

### ARCH-01: Peek width set in Work.astro CSS and in PEEK_W in script

- Tier 2 | score 6.5 | effort S | impact M | risk L | confidence medium | behaviour preserving
- Primary file: src/components/Work.astro | files: src/components/Work.astro | LOC affected: 15 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B2
- Evidence: Work.astro:51 width:406px with comment "home-interactions.ts sizes it" vs PEEK_W=[380,0.3,460] at home-interactions.ts:210; peek geometry split across CSS and TS Confirmed at file:line by grep.
- Approach: Expose peek width as a CSS custom property set from PEEK_W and read it in Work.astro, or derive both from one constant.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Peek width defined once; preview Playwright tests pass.

### DUP-01: 8x8 Bayer matrix written twice (64 elements in markup and an array in script)

- Tier 2 | score 6.5 | effort S | impact M | risk L | confidence high | behaviour preserving
- Primary file: src/components/ThemeToggle.astro | files: src/components/ThemeToggle.astro | LOC affected: 70 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: The 8x8 Bayer order is hand-written twice: 64 i elements with style --o:N at lines 10-73 and the BAYER array at 242-247 (same values; the script maps (v+0.5)/64). A change to the dither means editing both.
- Approach: Define the order once (src/lib/bayer.ts), render the i elements with .map in the template and use the same array in the client script.
- Equivalence proof: Prove with npm run build and a diff of the .dither HTML in dist/index.html (must be identical).
- Success metric: One definition of the Bayer table; template has no hand-listed i elements; dist .dither markup byte-identical.

### DUP-02: Story ids, row count and byte budgets repeated across the specs

- Tier 2 | score 6.5 | effort S | impact M | risk L | confidence high | behaviour preserving
- Primary file: tests/home.spec.ts | files: tests/home.spec.ts, tests/media.spec.ts | LOC affected: 60 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: Repeated literals: story ids rsvp/ohse/hr/digest/mcp/censorit/heatgen are typed here and at media.spec.ts:16-24; the row count 7 at home.spec.ts:42-43 and media.spec.ts:9; the 350 KiB budget at home.spec.ts:686 and media.spec.ts:69 (colophon prose and src/data/colophon.ts quote the same figure). The open-story, close, check-focus-returns flow repeats at 224-263 and 289-300.
- Approach: Create tests/fixtures.ts with STORY_IDS (derived from src/data/projects.ts order), BUDGET_ARRIVAL_BYTES, BUDGET_FULL_BYTES and an openStory(page, id) helper; import in both specs.
- Equivalence proof: Prove with playwright --list equality and a full suite run.
- Success metric: Each id list, row count and budget defined once.

### TEST-07: Brittle waits and fixed-pixel input in the Playwright specs

- Tier 2 | score 6.5 | effort S | impact M | risk L | confidence high | behaviour preserving
- Primary file: tests/home.spec.ts | files: tests/home.spec.ts, tests/media.spec.ts | LOC affected: 30 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B1, B2
- Evidence: Fixed sleeps: waitForTimeout(200) at tests/home.spec.ts:141, (1000) at :577 ('let the headline lines finish rising'), (300) at :765 (proves a key does nothing), (1500) at :806 (proves nothing loops). Fixed-pixel input: mouse.click(300, 800) at :194, mouse.click(5, 5) at :260, mouse.move(1400, 880) at :818. Size-sensitive waits and budgets: waitUntil networkidle at tests/home.spec.ts:683 (350 KiB transfer budget) and tests/media.spec.ts:66, :91. Each is time-based or layout-coupled, slows every run and can flake on a loaded runner. (B1 magic-waits and B2 brittle-tests reported the same file; merged.)
- Approach: 141: keep (the spacing is the test input). 577: wait on the headline animations finishing via document.getAnimations(). 765: assert the stored 'shortcuts' value instead of sleeping. 806: poll getAnimations() empty over a bounded window. Replace fixed-pixel clicks with locator clicks; keep the size budgets and the networkidle waits where the byte count is the assertion.
- Equivalence proof: Prove by running the suite on 3 engines with --repeat-each=3.
- Success metric: waitForTimeout remains only where the delay is the test input; suite green with --repeat-each=3.

### GOD-01: tests/home.spec.ts is an 822-line spec covering 14 concerns

- Tier 2 | score 5.5 | effort M | impact M | risk L | confidence high | behaviour preserving
- Primary file: tests/home.spec.ts | files: tests/home.spec.ts | LOC affected: 822 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: home.spec.ts is 822 LOC with 42 tests and 35 page.goto('/') calls, mixing hero, nav, theme toggle, mobile menu, stories, pointer preview, no-JS, 404, reduced motion, scroll spy, CSP (reads dist/\_headers with fs, 725-740), perf budget, colophon, placeholder guard and shortcuts. Section banners are out of order (7 after 404, then 8b, then unnumbered).
- Approach: Split by concern: nav.spec.ts, theme.spec.ts, stories.spec.ts, preview.spec.ts, shortcuts.spec.ts, build-output.spec.ts (CSP, placeholder, budget, colophon). Share goto and locators through a fixture or tests/helpers.ts.
- Equivalence proof: Prove equal with npx playwright test --list before and after (same test count and titles; the colophon renders this count).
- Success metric: No spec file over 250 LOC; playwright --list count identical before and after.

### ARCH-02: colophon.astro spawns Playwright during the static build

- Tier 2 | score 5.0 | effort S | impact M | risk M | confidence high | behaviour preserving
- Primary file: src/pages/colophon.astro | files: src/pages/colophon.astro | LOC affected: 30 | blast radius: 0
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: Frontmatter (15-40) spawns node playwright/cli.js test --list --reporter=json during the static build and walks the JSON with a recursive countTests (32-39) to print the test count. It couples the page build to the Playwright install and spec files, and starts a second Playwright process in every npm run build. Prose in the same file (146-148) hard-codes the 350 KiB and 1.5 MiB budgets the specs enforce.
- Approach: Move the listing into src/lib/test-count.ts (one exported function, typed JSON shape) so the page imports a number; take budget figures from one constant in src/data/colophon.ts shared by prose and stats.
- Equivalence proof: Prove with npm run build and a byte diff of dist/colophon/index.html.
- Success metric: colophon.astro frontmatter under 15 LOC; budgets defined once; dist/colophon/index.html identical.

## Tier 3 Findings

### ARCH-03: One script queries markup owned by ten components with no shared selector constants

- Tier 3 | score 4.5 | effort L | impact H | risk H | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 1152 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B2
- Evidence: one 1152-line script drives ~14 behaviours and queries markup owned by Nav, Work, ProjectRow, ProjectStory, Hero, About, Contact, Numbers, MediaFrame, ThemeToggle by class/id/data-attr (see home_interactions_coupling, 25 selectors from lines 35-1101); renaming a class in a component silently breaks the script (no shared constant or type) Confirmed at file:line by grep.
- Approach: One shared selectors module (class, id and data-attr names) imported by home-interactions.ts and referenced from components, so renames fail at type level; then split init\* into per-behaviour modules under src/scripts/.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: home-interactions.ts has 0 literal selectors outside the shared module; file under 400 LOC; Playwright specs unchanged and passing.

### ARCH-04: initFlip physics and Hero.astro CSS share an undocumented contract with no test

- Tier 3 | score 4.0 | effort M | impact M | risk M | confidence medium | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 112 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1
- Evidence: initFlip (768-879) is a physics state machine (FLIP table, tick, push, stop, right, back) with 11 closure lets (th, w, caught, running, last, dir, spun, prev, rightTimer, back). Its contract with Hero.astro (--flip, --flip-s, --flip-m, .turned, .brushing) lives only in the comment at 738-750, so a Hero CSS edit and the TS change together. Neither tests/home.spec.ts nor tests/media.spec.ts mentions data-flip, data-brush or data-type (grep found none), so this code has no safety net.
- Approach: Add a Playwright spec first (click the hero label, expect settled --flip of none or rotateX(180deg)), then pull the integrator into a pure step(state, dt, FLIP) function and return {flip, flipS, flipM, turned} for one apply() that writes the DOM.
- Equivalence proof: Prove with the new spec plus a screenshot compare of the hero label at rest.
- Success metric: initFlip under 60 LOC; step() has no DOM access; a spec asserts the settled --flip value after a click.

### GOD-02: initPreview is a 220-line closure with 12 shared mutable variables

- Tier 3 | score 4.0 | effort M | impact M | risk M | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 220 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1
- Evidence: initPreview spans 220-439 (220 LOC) and holds 12 mutable closure variables (ratio, tx, x, y, raf, then, shown, row, side, want, showing, roomH) shared by sizeFor, resize, room, tab, top, fits, pickSide, target, tick, swap (complexity 15, 34 lines), show, hide. Placement maths (sizeFor/fits/pickSide/target) reads DOM rects inline so it cannot be unit tested.
- Approach: Extract the pure placement maths (sizeFor, fits, pickSide, target) into peek-layout.ts taking explicit {rect, viewport, navBottom, tabH, roomH} inputs; keep the pointer/raf/swap shell in preview.ts and group the mutable lets into one state object. Keep PEEK\_\* constants next to the layout module.
- Equivalence proof: Prove with the three 'pointer preview' specs in home.spec.ts (327-378) plus npm run build.
- Success metric: initPreview under 120 LOC; placement functions take no closed-over mutable state; swap complexity under 8.

### GOD-03: ThemeToggle press() is 103 lines with five jobs

- Tier 3 | score 4.0 | effort M | impact M | risk M | confidence high | behaviour preserving
- Primary file: src/components/ThemeToggle.astro | files: src/components/ThemeToggle.astro | LOC affected: 103 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: press (322-424) is 103 LOC, complexity 11, mixing five jobs: reduced-motion and double-tap gating, class mode switching, geometry, DOM creation of ring/canvas/clip style, and the rAF clip loop; the enclosing initThemeToggle script is 230 LOC. ring, clip and frameAt are nullable temporaries assigned inside the startViewTransition callback and re-cast at 396-398 (as HTMLElement | null). The dissolve frame builder (284, complexity 22) nests three loops.
- Approach: Extract createRing(x, y, grow) returning {ring, clip, frameAt}, runDissolve(t, parts, from, to) for the ready.then body, and a pure squareRuns(w, h, r, grow) that returns rect parts; move the script to src/scripts/theme-toggle.ts imported by the component. No casts needed once createRing returns a typed object.
- Equivalence proof: Prove with the four theme specs (home.spec.ts 71-149) and screenshot compare of mid-dissolve frames.
- Success metric: press under 40 LOC; no 'as ... | null' casts in the file; frame builder complexity under 12.

### GOD-04: initStories is a 239-line function mixing six concerns

- Tier 3 | score 4.0 | effort M | impact M | risk M | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 239 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1
- Evidence: initStories spans lines 452-690 (239 LOC) and mixes six concerns: history push/pop state, opener focus return, pull-to-close, swipe between stories, dismiss animation, popstate handling; module-level mutable current/opener at 458-459.
- Approach: Split into a stories module with showStory/closeStory plus separate gesture (pull-to-close, swipe) and history helpers sharing one small state object.
- Equivalence proof: Prove equivalence with the story tests in tests/home.spec.ts and tests/media.spec.ts plus a dist/ diff (markup must not change).
- Success metric: No function in the stories code exceeds 60 LOC; story specs in home.spec.ts and media.spec.ts pass unchanged.

### TYPE-01: 15 unchecked indexed or optional reads in home-interactions.ts

- Tier 3 | score 4.0 | effort M | impact M | risk M | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 15 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B2
- Evidence: tsc-strict.txt: 15 errors under --noUncheckedIndexedAccess/--exactOptionalPropertyTypes (lines 133, 267 x3, 621, 631, 647, 648, 656, 657, 676, 677, 687, 1046, 1047): indexed or optional values used as defined (TS2532, TS2345, TS18048). The project tsconfig does not enable these flags, so the real build is clean; these are potential undefined derefs.
- Approach: Narrow each indexed read (guard, `?.`, or a small helper) at the 15 sites; optionally enable noUncheckedIndexedAccess in tsconfig afterward.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: tsc --noEmit --strict --noUncheckedIndexedAccess reports 0 errors in home-interactions.ts.

### ARCH-05: Section ids in JUMPS repeat src/data/navigation.ts

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence medium | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 5 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B2
- Evidence: JUMPS (:1016) hard-codes section ids work/about/contact also defined in src/data/navigation.ts:7-9 hrefs; nav active-link logic (:86-97) derives them from DOM instead Confirmed at file:line by grep.
- Approach: Export the section ids from src/data/navigation.ts and derive JUMPS from them.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Section ids defined in one place; shortcut spec (w/a/c) passes.

### ARCH-06: Type declared in colophon.ts instead of src/lib/types.ts

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence medium | behaviour preserving
- Primary file: src/data/colophon.ts | files: src/data/colophon.ts | LOC affected: 8 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-02
- Evidence: Stat (:6) and StackItem (:47) interfaces declared in data file, not src/lib/types.ts Confirmed at file:line by grep. CLAUDE.md: shared types live in src/lib/types.ts.
- Approach: Move the declaration into src/lib/types.ts and import it (types only).
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Declaration lives in types.ts; astro check 0 errors.

### ARCH-07: Type declared in projects.ts instead of src/lib/types.ts

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence low | behaviour preserving
- Primary file: src/data/projects.ts | files: src/data/projects.ts | LOC affected: 8 | blast radius: 5
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-02
- Evidence: ListedProject (:150) declared in data file; Project family is in types.ts Confirmed at file:line by grep. CLAUDE.md: shared types live in src/lib/types.ts.
- Approach: Move the declaration into src/lib/types.ts and import it (types only).
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Declaration lives in types.ts; astro check 0 errors.

### ARCH-08: TestSuite interface declared in colophon.astro

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence low | behaviour preserving
- Primary file: src/pages/colophon.astro | files: src/pages/colophon.astro | LOC affected: 6 | blast radius: 0
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: TestSuite interface at :16 declared in page Confirmed at file:line by grep.
- Approach: Move TestSuite to types.ts.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: TestSuite not declared in the page.

### DEAD-01: Dead #keys lookup branch in initShortcuts

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 3 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1, B2
- Evidence: initShortcuts line 1065 does document.querySelector('#keys') ?? buildKeysCard(), but no markup under src/ contains id=keys (only .keys rules in components.css), so the lookup branch never hits and buildKeysCard (1026-1062, 37 LOC of createElement) is the only path. B2 also notes buildKeysCard (src/scripts/home-interactions.ts:1026) builds the #keys card in script instead of a component; the alternative fix (move the card into a component or <template>) is the larger option. (B2 markup-built-in-script merged here.)
- Approach: Drop the querySelector branch and call buildKeysCard() directly (or move the card into an Astro component and delete buildKeysCard; the first is the smaller diff).
- Equivalence proof: Prove with the '? opens the keyboard card' spec (home.spec.ts:746).
- Success metric: Single code path for the keys card; the ?? fallback removed.

### DEAD-02: 14 init\* functions in home-interactions.ts carry an unused export keyword

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 14 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B2
- Evidence: knip.json: 14 unused exports (initReveal :34, initStagger :59, initScrollSpy :83, initScrolledNav :123, initMobileNav :166, initPreview :220, initStories :452, initImageFade :694, initBrush :716, initFlip :768, initHop :912, initTypeChip :977, initShortcuts :1064, greetConsole :1118). Grepped src/ tests/ scripts/ incl .astro: none imported elsewhere (only BaseLayout.astro:88 imports `init`). The functions are live (called by init() at :1136), so only the `export` keyword is dead, not the code.
- Approach: Drop the `export` keyword from the 14 functions; keep `export function init`. Do not delete the functions.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: knip reports 0 unused exports in home-interactions.ts; file exports only `init`.

### DEAD-03: Unused export on categories and three types (projects.ts, types.ts)

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/data/projects.ts | files: src/data/projects.ts, src/lib/types.ts | LOC affected: 4 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: knip.json: `categories` (projects.ts:141) and types ProjectLink/ProjectMedia/ProjectFact (lib/types.ts:3,8,18) flagged. Grep: `categories` used at projects.ts:155 only; the three types are used inside types.ts (:31,:34,:35) and nowhere else. Live symbols with unneeded `export`.
- Approach: Remove `export` from `categories` and the three interfaces (or keep the types exported deliberately and add a knip ignore); no deletion.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: knip reports 0 unused exports and 0 unused types.

### DUP-03: Duplicated observer setup and a hand-listed shortcut card

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 60 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1
- Evidence: initReveal (34-53) and initStagger (59-80) repeat the same shape: query, reduce/IntersectionObserver guard adding class in, observe, unobserve on intersect, disconnect teardown; they differ only in selector, rootMargin and the --i step. Separately the keys card list at 1037-1043 hand-lists T/W/A/C while JUMPS (1016) and the handler (1100) hold the same keys, so a new shortcut needs three edits.
- Approach: Add observeOnce(els, {rootMargin, onHit}) used by both; derive the W/A/C card rows from JUMPS (label from a small map) and keep T and ? as fixed rows.
- Equivalence proof: Prove with the reveal and shortcuts specs (home.spec.ts 416-434, 742-778) and a dist/ diff.
- Success metric: One observe-once helper; adding a jump key touches one table.

### GOD-05: Clipped-border test holds a 36-line in-page loop (complexity 14)

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: tests/home.spec.ts | files: tests/home.spec.ts | LOC affected: 36 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: The clipped-border test (568-616) holds a 36-line in-page loop (complexity 14, nested for/some/for with break), inline in the test body and generated for two widths; it is the highest-complexity function in the repo.
- Approach: Move the evaluate body to tests/helpers/clipped-frames.ts exporting findClippedFrames(page); the test becomes setViewport, goto, wait for in, expect(await findClippedFrames(page)).toEqual([]).
- Equivalence proof: Prove with a seeded regression (temporary overflow:hidden on a parent of a framed element) failing identically before and after.
- Success metric: Test body under 12 LOC; helper holds the loop.

### GOD-06: media.spec.ts viewport test is 74 lines nested 6 deep

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: tests/media.spec.ts | files: tests/media.spec.ts | LOC affected: 74 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: The 'media stays within the viewport' test (102-177) is 74 LOC, complexity 7, nested to depth 6 (width, reducedMotion, theme, if reduce, if chromium, image) and mixes assertions with artifact capture (testInfo.attach of layout JSON and a full-page JPEG, 149-172). The same image-decoded poll appears twice (77-84, 139-146).
- Approach: Extract waitForImagesLoaded(page) and attachLayoutEvidence(page, testInfo, width, theme); keep the loops but call the helpers.
- Equivalence proof: Prove with playwright --list equality and the attachments still produced on chromium.
- Success metric: No nesting deeper than 3; the image-loaded poll defined once.

### GOD-07: Shortcut keydown handler has cyclomatic complexity 16

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 29 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1
- Evidence: The document keydown listener in initShortcuts (1084-1112) has cyclomatic complexity 16 (lizard worst function in the repo): modifier/repeat guard, editable-target guard, open-dialog guard, ?, Escape, shortcutsOn, t, JUMPS lookup with scroll-or-navigate branch.
- Approach: Extract an isIgnorableKey(e) guard and a key-to-action table ({'?': toggleCard, t: clickTheme, ...JUMPS}) so the listener is a guard plus one lookup.
- Equivalence proof: Prove equivalence with the keyboard-shortcut tests in tests/home.spec.ts.
- Success metric: Listener complexity drops to 5 or less in lizard; keyboard shortcut specs pass unchanged.

### TEST-08: media.spec.ts first test is 51 lines of unrelated assertions

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence medium | behaviour preserving
- Primary file: tests/media.spec.ts | files: tests/media.spec.ts | LOC affected: 55 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: The first test (4-55) is 51 lines of unrelated assertions (peek attribute, 7 story ids, alt regexes, copy strings, mascot absence, banned-phrase regex), so the first failure hides the rest; budgets 350*1024 and 1.5*1024\*1024 are inline (69, 93).
- Approach: Split into per-concern tests (peek data, alt text, copy and forbidden phrases) sharing a beforeEach goto; name the budgets in the shared fixtures module.
- Equivalence proof: Prove with a full suite run.
- Success metric: First test split into 3 tests under 20 LOC each; budgets are named constants.

### TYPE-02: 4 strict-mode errors in tests/home.spec.ts and playwright.config.ts

- Tier 3 | score 3.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: tests/home.spec.ts | files: tests/home.spec.ts, playwright.config.ts | LOC affected: 4 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: tsc-strict.txt: tests/home.spec.ts 3 errors (736 x2, 737: string|undefined passed to string/BinaryLike) and playwright.config.ts:13 1 error (workers: number|undefined under exactOptionalPropertyTypes). Below the 5-per-file threshold, grouped.
- Approach: Add narrowing at tests/home.spec.ts:736-737; build the playwright config so `workers` is omitted rather than undefined.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: tsc strict reports 0 errors in tests/ and playwright.config.ts.

### ARCH-09: Build identity (git lookups) resolved in Footer and colophon frontmatter

- Tier 3 | score 3.08 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/components/Footer.astro | files: src/components/Footer.astro, src/pages/colophon.astro | LOC affected: 45 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B1, B2
- Evidence: resolveCommit (10-22) and describeCommit (28-48) run git via execSync in the Footer frontmatter, so every page rendering Footer (via BaseLayout) re-executes git rev-parse and git log; describeCommit interpolates the sha into a shell string (git log -1 ... ${sha}) rather than passing args. Build identity logic lives in a presentation component. Same pattern: src/components/Footer.astro:3 and src/pages/colophon.astro:2 both import node:child_process, so git state couples rendering in two places. (B2 build-time-shell-in-frontmatter merged here.)
- Approach: Move to src/lib/build-info.ts exporting a memoised getBuildInfo() using execFileSync with an args array; Footer destructures it.
- Equivalence proof: Prove with npm run build and a diff of the footer HTML in dist/ (same commit when run in the same checkout).
- Success metric: Footer frontmatter under 10 LOC; git invoked once per build.

### ARCH-10: Literal colours in Footer.astro instead of tokens

- Tier 3 | score 3.08 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/components/Footer.astro | files: src/components/Footer.astro | LOC affected: 5 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-01
- Evidence: literal hex #c9c5bb (:98), #3a362f (:108), #8f8a80 (:148); not tokens (CLAUDE.md: tokens only) Confirmed at file:line by grep.
- Approach: Replace each literal with an existing token only where the resolved value is identical, or color-mix on a token that resolves to the same value. A literal with no identical token is a visual change and belongs under sign-off.
- Equivalence proof: Prove with npm run build and light and dark screenshots of the component before and after.
- Success metric: No UI colour literals outside tokens.css in this file.

### GOD-08: home-interactions.ts is a 1152-line god file with 14 unrelated behaviours

- Tier 3 | score 3.0 | effort L | impact M | risk M | confidence high | behaviour preserving
- Primary file: src/scripts/home-interactions.ts | files: src/scripts/home-interactions.ts | LOC affected: 1152 | blast radius: 1
- Prerequisites: TEST-06 | test blocker: true | sources: B1
- Evidence: 1152 LOC, 145 functions, 14 unrelated behaviours in one module (reveal 34, stagger 59, scroll spy 83, scrolled nav 123, mobile nav 166, pointer preview 220-439, story dialogs 452-690, image fade 694, brush 716, flip 768, hop 912, type chip 977, shortcuts 1064, console greeting 1118). Shared state is the module-level teardowns, reduce, greeted. BaseLayout.astro:88 imports only init().
- Approach: Split into src/scripts/home/ with dom.ts (listen, teardowns, cleanup, reduce, fineHover), reveal.ts (reveal, stagger, imageFade), nav.ts (scrollSpy, scrolledNav, mobileNav), preview.ts, stories.ts, hover-finds.ts (brush, flip, hop, typeChip), shortcuts.ts; keep home-interactions.ts as the thin init() that calls each in the current order. Move code verbatim, no logic edits.
- Equivalence proof: Prove equivalence with npm run build, then npm test (home.spec.ts stories, preview, nav, shortcuts specs), and diff dist/ HTML (script bundle hash will change, markup must not).
- Success metric: home-interactions.ts under 80 LOC (init only); no extracted module over 300 LOC; init() call order unchanged.

## Tier 4 Findings

### ARCH-11: ThemeToggle holds module state and a never-removed listener, coupled to the T shortcut by a synthetic click

- Tier 4 | score 1.0 | effort M | impact L | risk M | confidence medium | behaviour preserving
- Primary file: src/components/ThemeToggle.astro | files: src/components/ThemeToggle.astro, src/scripts/home-interactions.ts | LOC affected: 12 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B1
- Evidence: current and lastClick (248-249) are mutable state shared by press and a document-level click listener (428-437) that is never removed, while home-interactions.ts has a listen/teardowns discipline so init() is re-runnable. The T shortcut drives the toggle by a synthetic click (home-interactions.ts:1101 getElementById('theme-toggle')?.click()), coupling two scripts through the DOM.
- Approach: Move the logic into the shared scripts module, register via the same listen() so init() can clean it, and have the T shortcut call an exported toggleTheme(originEl).
- Equivalence proof: Prove with 'T switches the theme' and the keyboard/mid-switch theme specs (home.spec.ts 106-149, 746).
- Success metric: All listeners registered through listen(); the T shortcut calls a function, not element.click().

### ARCH-12: Literal colours in Nav.astro instead of tokens

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: src/components/Nav.astro | files: src/components/Nav.astro | LOC affected: 5 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-01
- Evidence: #2a2620 (:267), #3a362f (:270), rgb(10 9 7 / 0.55) (:243); rgb(10 9 7) duplicates --night dark value #0a0907 Confirmed at file:line by grep.
- Approach: Replace each literal with an existing token only where the resolved value is identical, or color-mix on a token that resolves to the same value. A literal with no identical token is a visual change and belongs under sign-off.
- Equivalence proof: Prove with npm run build and light and dark screenshots of the component before and after.
- Success metric: No UI colour literals outside tokens.css in this file.

### ARCH-13: Literal colours in ProjectStory.astro instead of tokens

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence medium | behaviour preserving
- Primary file: src/components/ProjectStory.astro | files: src/components/ProjectStory.astro | LOC affected: 5 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-01
- Evidence: rgb(10 9 7 / 0.72) at :141 duplicates dark --night #0a0907 instead of color-mix on token Confirmed at file:line by grep.
- Approach: Replace each literal with an existing token only where the resolved value is identical, or color-mix on a token that resolves to the same value. A literal with no identical token is a visual change and belongs under sign-off.
- Equivalence proof: Prove with npm run build and light and dark screenshots of the component before and after.
- Success metric: No UI colour literals outside tokens.css in this file.

### ARCH-14: Type declared in interests.ts instead of src/lib/types.ts

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence medium | behaviour preserving
- Primary file: src/data/interests.ts | files: src/data/interests.ts | LOC affected: 8 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-02
- Evidence: Interest interface (:7) with inline id union at :8, not in types.ts Confirmed at file:line by grep. CLAUDE.md: shared types live in src/lib/types.ts.
- Approach: Move the declaration into src/lib/types.ts and import it (types only).
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Declaration lives in types.ts; astro check 0 errors.

### ARCH-15: Type declared in navigation.ts instead of src/lib/types.ts

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence low | behaviour preserving
- Primary file: src/data/navigation.ts | files: src/data/navigation.ts | LOC affected: 8 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-02
- Evidence: NavLink interface (:1) outside types.ts Confirmed at file:line by grep. CLAUDE.md: shared types live in src/lib/types.ts.
- Approach: Move the declaration into src/lib/types.ts and import it (types only).
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Declaration lives in types.ts; astro check 0 errors.

### ARCH-16: Type declared in learning.ts instead of src/lib/types.ts

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence low | behaviour preserving
- Primary file: src/data/learning.ts | files: src/data/learning.ts | LOC affected: 8 | blast radius: 1
- Prerequisites: none | test blocker: false | sources: B2 | cluster: CLUSTER-02
- Evidence: LearningGlyph union (:3) outside types.ts Confirmed at file:line by grep. CLAUDE.md: shared types live in src/lib/types.ts.
- Approach: Move the declaration into src/lib/types.ts and import it (types only).
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: Declaration lives in types.ts; astro check 0 errors.

### ARCH-17: Slab tone union declared inline in PageHead.astro

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence low | behaviour preserving
- Primary file: src/components/PageHead.astro | files: src/components/PageHead.astro | LOC affected: 3 | blast radius: 3
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: tone?: "cobalt"|"tomato"|"green" at :7 is a slab-class union; types.ts has no shared SlabTone type Confirmed at file:line by grep.
- Approach: Add `export type SlabTone` to types.ts and use it in PageHead.astro.
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: One SlabTone union; astro check clean.

### DEPS-01: Bring 9 packages up to date within their ranges

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence high | behaviour preserving
- Primary file: package.json | files: package.json | LOC affected: None | blast radius: None
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: npm outdated: 9 packages behind within range (@astrojs/check 0.9.10->0.9.12, @astrojs/mdx 7.0.7->7.0.8, @astrojs/sitemap 3.7.3->3.7.4, @fontsource-variable/archivo 5.2.8->5.3.0, @fontsource/dm-mono 5.2.7->5.3.0, @playwright/test 1.61.0->1.65.0, @tailwindcss/vite 4.3.1->4.3.5, prettier 3.8.4->3.9.10, tailwindcss 4.3.1->4.3.5). npm audit: 0 vulnerabilities. Dependabot already opens weekly PRs. The 3 major bumps are listed under Proposals.
- Approach: Run npm update once, then npm run build and the full Playwright suite before release.
- Equivalence proof: Prove equivalence with a dist/ diff (markup unchanged) and a green suite.
- Success metric: npm outdated lists only the 3 deferred majors (@astrojs/mdx, prettier-plugin-astro, typescript).

### DUP-04: Two small clones (17 lines) in scripts and Hero/404

- Tier 4 | score 0.5 | effort S | impact L | risk L | confidence medium | behaviour preserving
- Primary file: scripts/csp-hashes.mjs | files: scripts/csp-hashes.mjs, scripts/guard-placeholders.mjs, src/components/Hero.astro, src/pages/404.astro | LOC affected: 17 | blast radius: None
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: jscpd-report.json: 2 clones, 17 lines total (0.17%), both below 30: scripts/csp-hashes.mjs:7 vs guard-placeholders.mjs:36 (7 lines); components/Hero.astro:207 vs pages/404.astro:51 (10 lines).
- Approach: Optional: share a small walk helper between the two scripts; leave Hero/404 markup (page-specific copy).
- Equivalence proof: npm run build then diff dist/ (HTML identical, JS only differs by moved code); astro check 0 errors; Playwright home.spec.ts covering it.
- Success metric: jscpd reports <=1 clone.

### TEST-09: Untested non-hotspot units

- Tier 4 | score -0.5 | effort M | impact L | risk L | confidence medium | behaviour preserving
- Primary file: src/lib/posts.ts | files: scripts/brand-images.py, src/pages/rss.xml.ts, src/components/PostCard.astro, src/lib/posts.ts, src/styles/prose.css, src/components/PageHead.astro, src/layouts/PostLayout.astro, src/components/ArrowText.astro (+13 more) | LOC affected: None | blast radius: None
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: Non-hotspot units below the 60% proxy threshold (21 files): scripts/brand-images.py 0%; src/pages/rss.xml.ts 0%; src/components/PostCard.astro 5%; src/lib/posts.ts 5%; src/styles/prose.css 5%; src/components/PageHead.astro 10%; src/layouts/PostLayout.astro 10%; src/components/ArrowText.astro 20%; src/content.config.ts 20%; src/components/About.astro 30%; src/components/Beyond.astro 30%; src/components/Now.astro 30%; src/components/Principles.astro 30%; src/data/interests.ts 30%; src/data/learning.ts 30%; src/pages/writing/[...slug].astro 30%; src/pages/writing/index.astro 30%; src/components/BaseHead.astro 40%; src/styles/motion.css 40%; src/lib/site-config.ts 50%; src/styles/components.css 55%. Pure markup or data with no behaviour is not a test gap (the proxy undercounts it): About, Beyond, Now, Principles, PostCard, ArrowText, PageHead, PostLayout, interests, learning, prose.css, motion.css, components.css. Units with logic: src/lib/posts.ts (5%), src/pages/rss.xml.ts (0%), src/content.config.ts (20%), src/lib/site-config.ts (50%), scripts/brand-images.py (0%), src/components/BaseHead.astro (inline script, 40%). The /writing files (posts.ts, PostCard, PostLayout, prose.css, content.config.ts, writing/index, writing/[...slug], rss.xml.ts) are the parked, noindex surface. Behavioural proxy from Playwright spec selectors; the suite was not run and there is no line instrumentation, so the percentage is an estimate.
- Approach: Only the units with logic merit a test. If /writing ships, add one spec that loads /writing, one post page and rss.xml and checks the rendered output. For site-config.ts and scripts/brand-images.py add a small unit test of the pure logic. Leave pure markup and data to the render check.
- Equivalence proof: Tests only, no src change. Run the new spec on chromium.
- Success metric: Every unit with logic in the list has a spec or a recorded reason; the markup-only files are marked static in the spec header.

## Proposals (needs sign-off)

These change behaviour or can. They are not in any tier and need an explicit decision.

### DEPS-02: Major-version bumps: @astrojs/mdx 8, prettier-plugin-astro 1, typescript 7

- Tier proposal | score -2.0 | effort M | impact L | risk M | confidence high | behaviour changing
- Primary file: package.json | files: package.json | LOC affected: None | blast radius: None
- Prerequisites: none | test blocker: false | sources: B2
- Evidence: npm outdated majors: @astrojs/mdx 7.0.7->8.1.3, prettier-plugin-astro 0.14.1->1.1.2, typescript 5.9.3->7.0.2. Project CLAUDE.md lists these under 'Settled, do not reopen': each gets its own pass, never a routine update. A major bump can change build output, formatting or compiler diagnostics, so it is not behaviour-preserving by default.
- Approach: One pass per package, only when the owner asks. For each: bump, npm run build, astro check, dist/ diff, full suite. typescript 7 also needs a tsc strict re-run to see how the 19 known strict errors change.
- Equivalence proof: npm run build and astro check unchanged; the relevant spec passes unchanged.
- Success metric: Each package at latest major with build and tests green.

## File Rollups

| File                              | Finding IDs                                                                                           | Total Score |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------- |
| src/scripts/home-interactions.ts  | GOD-08, GOD-02, ARCH-04, DUP-03, DEAD-01, GOD-04, GOD-07, DEAD-02, TYPE-01, ARCH-03, ARCH-05, TEST-06 | 49.5        |
| tests/home.spec.ts                | GOD-01, TEST-07, GOD-05, DUP-02, TYPE-02                                                              | 25.5        |
| src/components/ThemeToggle.astro  | GOD-03, DUP-01, ARCH-11                                                                               | 11.5        |
| src/components/Work.astro         | ARCH-01                                                                                               | 6.5         |
| src/pages/colophon.astro          | ARCH-02, ARCH-08                                                                                      | 8.5         |
| tests/media.spec.ts               | GOD-06, TEST-08                                                                                       | 7.0         |
| src/data/projects.ts              | DEAD-03, ARCH-07                                                                                      | 7.0         |
| src/data/colophon.ts              | ARCH-06                                                                                               | 3.5         |
| src/components/Footer.astro       | ARCH-09, ARCH-10                                                                                      | 6.16        |
| src/components/Contact.astro      |                                                                                                       | 0           |
| src/components/Hero.astro         |                                                                                                       | 0           |
| src/components/Numbers.astro      |                                                                                                       | 0           |
| scripts/csp-hashes.mjs            | DUP-04                                                                                                | 0.5         |
| src/components/Nav.astro          | ARCH-12                                                                                               | 0.5         |
| src/components/ProjectStory.astro | ARCH-13                                                                                               | 0.5         |
| src/data/interests.ts             | ARCH-14                                                                                               | 0.5         |
| src/data/navigation.ts            | ARCH-15                                                                                               | 0.5         |
| src/data/learning.ts              | ARCH-16                                                                                               | 0.5         |
| src/components/PageHead.astro     | ARCH-17                                                                                               | 0.5         |
| src/lib/posts.ts                  | TEST-09                                                                                               | -0.5        |
| package.json                      | DEPS-01, DEPS-02                                                                                      | -1.5        |

## Suppressed

| ID                                                                              | Reason                                                                                                                                                                                | Original Score |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 21 B2 candidates "missing-test-coverage" (non-hotspot files, listed in TEST-09) | rolled up                                                                                                                                                                             | -0.5 to 2.5    |
| B2:hard-coded-colour:src/components/BaseHead.astro                              | Exempt: <meta name="theme-color"> is an HTML attribute and cannot use CSS variables. B2 shows no real fix beyond an optional shared constant (src/components/BaseHead.astro:42, :47). | 0.5            |
| B2:hard-coded-colour:src/scripts/home-interactions.ts                           | Exempt: the console banner (home-interactions.ts:1123) uses %c styles, which cannot use CSS variables; low confidence and no real fix shown.                                          | 3.5            |
| B2:markup-built-in-script:src/scripts/home-interactions.ts                      | Merged into the Dead #keys lookup finding (same buildKeysCard code).                                                                                                                  | 3.5            |
| B2:build-time-shell-in-frontmatter:src/components/Footer.astro                  | Merged into the Footer build-info finding (same fix).                                                                                                                                 | 3.08           |
| B2:brittle-tests:tests/home.spec.ts                                             | Merged with B1 magic-waits (same file).                                                                                                                                               | 5.5            |
| KNIP:unused-file:design-previews/neo-2026/data.js                               | Knip false positive: git ls-files shows it tracked; .gitignore and CLAUDE.md make neo-2026 the tracked redesign spec, not site code. The fix is a knip ignore, not deletion.          | n/a            |
| TEST-01                                                                         | Orchestrator ruling: proxy-coverage artefact. The file is static markup or data with no script, so a spec adds nothing a dist/ HTML diff does not already prove.                      | 3.5            |
| TEST-02                                                                         | Orchestrator ruling: proxy-coverage artefact. The file is static markup or data with no script, so a spec adds nothing a dist/ HTML diff does not already prove.                      | 3.5            |
| TEST-03                                                                         | Orchestrator ruling: proxy-coverage artefact. The file is static markup or data with no script, so a spec adds nothing a dist/ HTML diff does not already prove.                      | 3.31           |
| TEST-04                                                                         | Orchestrator ruling: proxy-coverage artefact. The file is static markup or data with no script, so a spec adds nothing a dist/ HTML diff does not already prove.                      | 3.5            |
| TEST-05                                                                         | Orchestrator ruling: proxy-coverage artefact. The file is static markup or data with no script, so a spec adds nothing a dist/ HTML diff does not already prove.                      | 3.5            |

## Methodology

- Stack detected: Astro 7 static site, TypeScript, .astro components (3968 LOC), CSS, Playwright e2e specs. Total 6698 LOC (src and scripts code files); 13 dependencies.
- Tools run: astro check, tsc --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes, knip, ts-prune (empty output), jscpd, lizard (.ts and .mjs only), semgrep (--config=auto, 0 results), npm audit (0 vulnerabilities), npm outdated (11 packages), astro build with CSP-hash and placeholder guard (split steps, 6 s), git churn, custom import-graph resolver (no cycles, no boundary violations, no barrels).
- Tools skipped (gaps): eslint: UNAVAILABLE - project has no eslint.config.\*; ESLint 10 refuses to run without config; none added per constraints (eslint.json is empty, see eslint.stderr.txt); tokei: UNAVAILABLE - not installed; wc -l LOC table used instead; lizard: PARTIAL - cannot parse .astro files (3968 LOC of components/pages unanalysed); ran on .ts/.mjs only. Also the Playwright suite was not run and no line instrumentation exists, so test pass rate and coverage are null in the baseline.
- npm run build as-is failed only because astro check picked up scratch files in audit-raw/astro-extract written by another audit step. That is not a project defect; the split build steps pass.
- Churn window: 90 days (commit count per path, renames not followed). Hotspot score is churn x max per-function complexity; strict top 14 reported by the mapper (14 entries; the skill asks for 12, the extra two tie at the tail).
- Coverage threshold: 60%
- Coverage report completeness: **partial**. There is no coverage tooling (no vitest or jest, no line instrumentation) and the Playwright suite was not executed. Coverage is a behavioural proxy: spec selectors and routes were grepped back to the rendering source, home-interactions.ts is scored by the line-weighted share of functions that a spec exercises, and components by the share of distinct features asserted. Percentages are estimates, so all TEST findings are confidence "medium" and the 60% gate is indicative only. 27 of 44 files fall below it (6 of them hotspot blockers).
- Knip false positives and falsified signals (not in the backlog): knip unused file design-previews/neo-2026/data.js (false positive); knip 14 init* exports, categories, 3 types (live code, unneeded export keyword only); npm audit (0 vulns, no finding); semgrep (0 results, no SEC finding); eslint (unavailable (no config); ERR swallowed-exception scan not possible); circular deps / suspect barrels / boundary violations (none in arch-findings.json). The 14 init* exports and the categories export are real findings (DEAD-01, DEAD-03), but only the export keyword is dead, never the code.
- Rollups and merges: 21 B2 non-hotspot TEST candidates rolled into one finding (the task brief said 22; the data holds 21). B1 magic-waits and B2 brittle-tests on tests/home.spec.ts merged. B2 build-time-shell merged into the Footer build-info finding, B2 markup-built-in-script merged into the dead keys-lookup finding. The two cap-hit GOD smells in home-interactions.ts (initStories, keydown handler) came from a verified follow-up pass and are merged like B1 findings, so that file carries four GOD findings (the per-file cap of 2 per category was lifted for it after verification at file:line).
- Tier rule reading: "TEST-NN is Tier 2 unconditionally" applies to the coverage-blocker TEST findings. Of the six blockers, five (Contact, Hero, Numbers, Work, data/colophon.ts) have no script, so the orchestrator suppressed their TEST items; a dist/ HTML diff proves any refactor there. ARCH-01 (the peek width shared with PEEK_W) is gated on TEST-06. The other TEST findings (test debt, the rollup) take their tier from the score.
- Moving target: when the audit finished, another session had uncommitted edits in src/components/Nav.astro and CLAUDE.md. Line numbers for ARCH-12 (Nav colours, part of CLUSTER-01) refer to commit aca0ac8; re-check them before a fix.
- Calibration: effort, impact and risk use the definitions in SKILL.md (S <=1 day, M 2-5 days, L >5 days; impact L/M/H; risk L/M/H). Score = impact*3 + churn_factor (hotspot files only) - risk*1.5 - effort, effort S/M/L = 1/2/3.

## Coverage Delta Verification

### Coverage sanity (hotspots and largest files)

| File                              | Hotspot top-14 | Top-10 LOC | Status                                                                                                                 |
| --------------------------------- | -------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| tests/home.spec.ts                | yes            | yes        | in file_rollups: GOD-01, TEST-07, GOD-05, DUP-02, TYPE-02                                                              |
| src/components/ThemeToggle.astro  | yes            | yes        | in file_rollups: GOD-03, DUP-01, ARCH-11                                                                               |
| src/scripts/home-interactions.ts  | yes            | yes        | in file_rollups: GOD-08, GOD-02, ARCH-04, DUP-03, DEAD-01, GOD-04, GOD-07, DEAD-02, TYPE-01, ARCH-03, ARCH-05, TEST-06 |
| tests/media.spec.ts               | yes            | no         | in file_rollups: GOD-06, TEST-08                                                                                       |
| src/pages/colophon.astro          | yes            | yes        | in file_rollups: ARCH-02, ARCH-08                                                                                      |
| src/components/Footer.astro       | yes            | no         | in file_rollups: ARCH-09, ARCH-10                                                                                      |
| src/layouts/BaseLayout.astro      | yes            | no         | reviewed, no findings of its own                                                                                       |
| src/data/projects.ts              | yes            | no         | in file_rollups: DEAD-03, ARCH-07                                                                                      |
| src/components/Numbers.astro      | yes            | no         | reviewed, no findings (TEST-03 suppressed as proxy artefact)                                                           |
| src/components/ProjectRow.astro   | yes            | yes        | reviewed, no findings of its own                                                                                       |
| src/data/colophon.ts              | yes            | no         | in file_rollups: ARCH-06                                                                                               |
| src/components/Contact.astro      | yes            | yes        | reviewed, no findings (TEST-01 suppressed as proxy artefact)                                                           |
| src/components/Hero.astro         | yes            | yes        | reviewed, no findings (TEST-02 suppressed as proxy artefact)                                                           |
| src/components/Work.astro         | yes            | no         | in file_rollups: ARCH-01                                                                                               |
| src/styles/components.css         | no             | yes        | reviewed, no findings of its own (named in TEST-09)                                                                    |
| src/components/ProjectStory.astro | no             | yes        | in file_rollups: ARCH-13                                                                                               |
| src/components/Nav.astro          | no             | yes        | in file_rollups: ARCH-12                                                                                               |

Reviewed with no findings: src/layouts/BaseLayout.astro and src/components/ProjectRow.astro (B1 read both), src/styles/components.css (471 LOC, only appears in the untested rollup). No file in either set is missing from the audit.

### Tool-vs-judgment delta

| Signal                                                              | Tool count                                      | Backlog findings                                                          | Delta                                                                        |
| ------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| knip (unused exports, types, files)                                 | 15 exports + 3 types + 1 file                   | DEAD-02 (14 init\* exports), DEAD-03 (categories + 3 types)               | the 1 unused file is a false positive (suppressed); DEAD-01 is judgment-only |
| tsc strict (+ noUncheckedIndexedAccess, exactOptionalPropertyTypes) | 19 errors in 3 files                            | TYPE-01 (15 errors), TYPE-02 (4 errors, grouped under the 5-per-file cap) | 0 lost; project tsconfig stays clean                                         |
| npm audit                                                           | 0 vulnerabilities                               | 0 vulnerability findings                                                  | 0                                                                            |
| jscpd                                                               | 2 clone pairs, 17 lines                         | DUP-04 (long-tail, both under 30 lines)                                   | 0 lost; 3 more DUP findings are judgment-only                                |
| npm outdated                                                        | 11 packages                                     | DEPS-01 (9 in range), DEPS-02 (3 majors, Proposals)                       | @astrojs/mdx appears in both lists; 0 lost                                   |
| lizard (CCN > 15)                                                   | 1 function (keydown, CCN 16), .ts and .mjs only | GOD-07                                                                    | .astro not parsed; ThemeToggle CCN 22 comes from the hotspot mapper (GOD-03) |
| semgrep                                                             | 0 results                                       | 0 SEC findings                                                            | 0                                                                            |
| eslint                                                              | unavailable (no config)                         | 0                                                                         | not measurable; swallowed-error scan not done                                |

### Evidence spot-read

Tier 1 is empty, so the sample is three Tier 2 and three Tier 4 findings, each re-read at its cited lines.

| ID      | Tier | Result                                                                                                          |
| ------- | ---- | --------------------------------------------------------------------------------------------------------------- |
| ARCH-01 | 2    | Holds: Work.astro:51 `width: 406px`, home-interactions.ts:210 `PEEK_W = [380, 0.3, 460]`.                       |
| GOD-01  | 2    | Holds: tests/home.spec.ts is 822 lines with 35 `page.goto('/')` calls.                                          |
| DUP-01  | 2    | Holds: ThemeToggle.astro:10-73 hand-lists the `--o:N` elements, and the script holds the same table as `BAYER`. |
| ARCH-12 | 4    | Holds at aca0ac8: Nav.astro:243 `rgb(10 9 7 / 0.55)`, :267 `#2a2620`, :270 `#3a362f`.                           |
| ARCH-14 | 4    | Holds: data/interests.ts:7 declares `interface Interest` outside lib/types.ts.                                  |
| ARCH-11 | 4    | Holds, line numbers off by one: `lastClick` is at ThemeToggle.astro:249, the click listener at :425.            |
