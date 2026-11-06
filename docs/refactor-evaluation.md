# Refactor Evaluation: personal-site

**Date:** 2026-11-06
**Evaluator:** Claude (refactor-identification skill, lightweight mode)
**Commit / ref:** `2111211` on `redesign/poster`

Lightweight mode: about 4,700 lines, and the poster redesign rewrote most of them in the last week,
so churn data says nothing. Three read-only reviewers covered the seven dimensions. Every finding
below was checked at its `file:line` before it was kept.

---

## Stack summary

| Field           | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Language(s)     | TypeScript, Astro components, CSS, two Node scripts, one Python script |
| Framework(s)    | Astro 7.2.4 (static output), Tailwind CSS 4, MDX                       |
| Build tooling   | Vite (through Astro), `astro check`, Prettier                          |
| Package manager | npm (`package-lock.json`)                                              |
| Test runner     | Playwright 1.61 (Chromium, Firefox, WebKit), 87 tests                  |
| Rough size      | 48 source files / about 4,700 LOC                                      |

---

## Scorecard

| Dimension                   | Health            | Headline finding                                                                  |
| --------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| 1. Code Quality & Elegance  | ⚠ needs attention | The same row-hover, label and shadow CSS is written by hand in several components |
| 2. Architecture & Structure | ✓ healthy         | Clear data/component split; a few dead fields and one needless re-export          |
| 3. Performance & Bundle     | ✓ healthy         | Pages are small; 2 MB of unused PNG originals ship in `dist/`                     |
| 4. Dependencies & Security  | ✕ critical        | Installed Astro 7.2.4 has a critical advisory; the fix is inside `^7.2.4`         |
| 5. Accessibility            | ⚠ needs attention | Mobile-menu Escape drops focus; theme button hides its state                      |
| 6. Testing                  | ⚠ needs attention | Mobile menu, close button and keyboard theme toggle have no test                  |
| 7. Config & Tooling         | ✓ healthy         | CI runs Chromium only and builds twice                                            |

---

## Findings

### 1. Code Quality & Elegance

- **Row hover and focus block copied in two components**
  `src/components/ProjectRow.astro:70-85`, `src/components/PostCard.astro:47-62`
  Both write `background: var(--butter); color: var(--ink)` on hover and focus, the inset 4px ink
  ring, and the same `transition` pair.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`

- **Mono label recipe written out instead of using `.label`**
  `src/components/ProjectRow.astro:92-97` (`.grp`), `ProjectRow.astro` `.go`, `src/components/PostCard.astro:92-97`, `src/layouts/PostLayout.astro:58-67`
  `.grp` repeats `.label` exactly (`components.css:108-112`: 500 13px/1.3 mono, 0.08em, uppercase).
  The others differ only in line-height.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **Hard shadows hard-coded; the two shadow tokens serve only prose**
  `src/styles/tokens.css:21-22`, used only at `src/styles/prose.css:56,83`
  Components write `4px 4px 0 var(--ink)`, `5px`, `6px`, `8px` and `10px` variants by hand. The
  tokens use `--edge`, which differs from `--ink` in dark mode, so they cannot replace the ink
  literals as they stand.
  `Impact: Med · Effort: M · Risk: Med · Behavior: Preserving (if values stay identical)`

- **Tag chips drift between posts and stories**
  `src/components/PostCard.astro:79-91` (`4px 9px`, 12px, `currentColor`), `src/components/ProjectStory.astro:168-186` (`5px 10px`, 13px, `--edge`)
  Two versions of one idea. One shared class means choosing one set of values.
  `Impact: Low · Effort: S · Risk: Med · Behavior: Changing` (see Proposals)

- **`.display` has no user**
  `src/styles/components.css:95` (`.display, h1, h2, h3`). No markup uses `class="display"`.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **Empty catch blocks with an unused binding**
  `src/scripts/home-interactions.ts:23-25`, `src/components/ThemeToggle.astro:91`: `catch (e) {}`.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **Magic numbers in the pointer preview**
  `src/scripts/home-interactions.ts:158-164,200-202`: offsets 36, 420, 460, 260 and 12 sit inline.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

### 2. Architecture & Structure

- **Dead fields in the project types**
  `src/lib/types.ts:12` (`ProjectMedia.fit`) and `:34` (`Project.meta`). No data sets them and no
  component reads them. `CLAUDE.md` still lists `fit` as part of `Project.media`.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **`socialLinks` only re-exports `site.social`**
  `src/data/navigation.ts:14`. Its one consumer is `src/components/Contact.astro:2`.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **View-transition listeners with no router**
  `src/layouts/BaseLayout.astro:90-91`, `src/components/ThemeToggle.astro:95`. No `ClientRouter`
  exists in `src/`, so `astro:before-swap` never fires and `astro:page-load` re-runs `init` once
  on load.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **`skills.ts` holds one array named `learning`**
  `src/data/skills.ts:1`, read only by `src/components/Now.astro`. The file name no longer says
  what it holds.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

### 3. Performance & Bundle

- **Five PNG originals ship but nothing references them**
  `dist/_astro/censorit-venus-v4…png` (707 KB), `ohse-unbranded-v3…png` (396 KB), `heatgen…png`
  (364 KB), `mcp…png` (301 KB), `digest…png` (294 KB). A grep of `dist/` finds no reference to any
  of them. Visitors never download them, so this costs deploy size only (about 2 MB of a 4.5 MB
  `dist/`). Astro 7.2.4 emits them; 7.4.7 does not, so the P0 update removes them.
  `Impact: Low · Effort: M · Risk: Med · Behavior: Preserving`

Fonts were checked: both DM Mono weights in use, latin subsets only. No other performance finding.

### 4. Dependencies & Security

`npm audit`: 11 advisories (1 critical, 9 high, 1 moderate). Every one has a fix inside the
declared ranges.

- **Critical advisory in installed Astro 7.2.4**
  `package-lock.json` pins `astro` 7.2.4. `npm audit` reports a critical remote-code-execution
  advisory in image optimisation (fixed in 7.2.8) and a moderate XSS (fixed in 7.3.2).
  `npm outdated` shows 7.4.7 as both "wanted" and "latest", so the fix needs no range change. The
  site is static, so the exposure is the build machines (local, CI, Cloudflare).
  `Impact: High · Effort: S · Risk: Low · Behavior: Preserving`

- **Ten transitive advisories**
  vite, zod, sharp, svgo, undici, js-yaml, devalue, fast-uri, source-map-js (high) and smol-toml
  (moderate). All are build-time. `npm audit fix` resolves them without a major bump.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`

- **Three majors behind** (not urgent): `@astrojs/mdx` 7 → 8, `prettier-plugin-astro` 0.14 → 1,
  `typescript` 5.9 → 7. Each needs its own upgrade pass.

### 5. Accessibility

Contrast passes everywhere text sits: the weakest pair is white on green at 5.38:1. Heading order
has no skipped level on any page. Alt text and reduced-motion handling are sound. The `role="list"`
attributes are a deliberate Safari workaround and stay.

- **Escape closes the mobile menu but leaves focus on a hidden link**
  `src/scripts/home-interactions.ts:133-135`. The sheet goes `display: none`, focus falls to
  `<body>`, and keyboard users lose their place.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Changing` (see Proposals)

- **The theme button does not expose its state**
  `src/components/ThemeToggle.astro`: a fixed `aria-label="Toggle dark mode"` and no
  `aria-pressed`, so a screen reader cannot tell whether dark mode is on.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Changing` (see Proposals)

- **Row and post focus rings vanish in Windows high-contrast mode**
  `src/components/ProjectRow.astro:82-85`, `src/components/PostCard.astro:59-62`: `outline: 0` plus
  a `box-shadow` ring. Forced-colors mode drops box shadows.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Changing` (see Proposals)

- **The burger flips both its label and `aria-expanded`**
  `src/scripts/home-interactions.ts:123-124`. A screen reader hears "Close menu, expanded".
  `Impact: Low · Effort: S · Risk: Low · Behavior: Changing` (see Proposals)

### 6. Testing

The 87 Playwright tests cover the main paths in three browsers. Gaps:

- **Mobile menu: no test opens it**
  `tests/home.spec.ts:107` checks only that the links hide at 600px. Burger click, Escape, outside
  tap and link click are untested (`src/scripts/home-interactions.ts:127-138`).
  `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`

- **Story close button, backdrop click and keyboard theme toggle: untested**
  `tests/home.spec.ts:150-167` covers Next and Escape only. `tests/home.spec.ts:71` toggles the
  theme by mouse only.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`

- **The placeholder checks have no positive control**
  `tests/home.spec.ts:363-371` asserts zero `img[src*="placeholder"]`. Astro keeps the source name in
  front of its hash, so the selector does work, but nothing proves that. Nothing proves
  `scripts/guard-placeholders.mjs`, the real gate, catches a placeholder either.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`

- **Fixed waits in the scroll tests**
  `tests/home.spec.ts:242,245,255` (`waitForTimeout`). The `expect` calls after them already retry.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **No pixel or computed-style baseline**
  Nothing compares pages before and after a CSS change. The CSS clean-ups in this plan need one.
  `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`

### 7. Config & Tooling

- **CI runs one browser and builds twice**
  `.github/workflows/ci.yml:41-44` installs and runs Chromium only. The Playwright `webServer`
  (`playwright.config.ts:30`) runs `npm run build` again after the CI build step.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

- **`brand-images.py` dependencies are listed only in its docstring**
  `scripts/brand-images.py:3`. `CLAUDE.md` gives the run command but not the Python packages.
  `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

---

## Prioritized plan (behavior-preserving)

### P0

- **Update Astro and audit-fix the lockfile**
  Run `npm update astro` and `npm audit fix`. No range in `package.json` changes.
  Rationale: removes the critical advisory and the ten others from every build machine.
  **Equivalence proof:** `npm audit` reports 0; `npm run build`; diff the `dist/` file list and the
  CSP hashes in `dist/_headers` against the current build; run `npm test` (the release gate).

- **Build the equivalence net before any CSS clean-up**
  Save today's shots of all four pages (1440 and 390, light and dark) with
  `design-previews/neo-2026/tools/shot.py`, plus a copy of `dist/`. Add a small script that diffs two
  shot sets pixel by pixel.
  Rationale: the P1 CSS items are safe only if the pages render the same.
  **Equivalence proof:** the script reports 0 changed pixels when run on two builds of the same commit.

### P1

- **Add the missing tests**
  Mobile menu (open, Escape, outside tap, link click), the story close button and backdrop,
  keyboard theme toggle, and a positive control for the placeholder gate (feed
  `guard-placeholders.mjs` a fixture with a placeholder and expect a non-zero exit). Delete the three
  `waitForTimeout` calls.
  **Equivalence proof:** tests only; the new tests pass on the current code.

- **Share the row hover and focus block**
  Move the rule from `ProjectRow.astro:70-85` and `PostCard.astro:47-62` into one class in
  `components.css`, and put that class on both links.
  **Equivalence proof:** the P0 shot diff shows 0 changed pixels, including hover and focus shots
  of one row and one post.

- **Use `.label` where the recipe matches exactly**
  Replace `.grp` with `class="label"`. Keep only the line-height override where one differs.
  **Equivalence proof:** shot diff 0, and computed `font` and `letter-spacing` match.

- **Remove the dead code**
  Delete `.display` from the selector list, `ProjectMedia.fit` and `Project.meta` (and fix the
  `CLAUDE.md` line), the `socialLinks` re-export, the empty `catch (e)` bindings, and the
  `astro:page-load`/`astro:before-swap` listeners with the `cleanup` export if nothing else uses it.
  **Equivalence proof:** `npm run check` 0 errors; `dist/` HTML identical apart from hashed asset
  names; `npm test`.

### P2

- **Name the shadow sizes**
  Add `--ink`-based shadow tokens for the sizes in use (4, 5, 6, 8, 10px) and swap the literals.
  Keep every value as it is.
  **Equivalence proof:** shot diff 0 in both themes.

- **Name the preview constants and rename `skills.ts`**
  Hoist the five numbers in `initPreview` to named constants. Rename `skills.ts` to match `learning`.
  **Equivalence proof:** the pointer-preview tests and `npm run check`.

- **CI and tooling tidy-up**
  Let CI reuse its first build (or drop the separate build step), say in `CLAUDE.md` that CI runs
  Chromium only, and list the Python packages for `brand-images.py`.
  **Equivalence proof:** CI passes; no site file changes.

---

## Proposals (needs sign-off)

These change what users see or hear, so they wait for the owner.

- **Return focus to the burger when Escape closes the mobile menu**
  `src/scripts/home-interactions.ts:133-135`. Keyboard users land back on the burger, not `<body>`.

- **Expose the theme state**
  Set `aria-pressed` from the `dark` class on load and on each click
  (`src/components/ThemeToggle.astro`). Screen readers would hear "pressed" or "not pressed".

- **Keep the burger label fixed**
  Use one label ("Menu") and let `aria-expanded` carry the state
  (`src/scripts/home-interactions.ts:124`). Screen readers would stop hearing the state twice.

- **Show focus rings in high-contrast mode**
  Add `outline: 4px solid transparent; outline-offset: -4px` beside the box-shadow ring in
  `ProjectRow.astro:82` and `PostCard.astro:59`. Nothing changes in normal colours; high-contrast
  users get a visible ring.

- **One tag-chip style**
  Merge `PostCard` and `ProjectStory` tags into one class. One of them changes padding, size and
  border colour slightly.

---

## Out of scope / deferred

- Major upgrades (`@astrojs/mdx` 8, `prettier-plugin-astro` 1, TypeScript 7): each needs its own pass.
- Breakpoint consolidation: CSS cannot use custom properties in media queries, and the 768px and
  720px values are deliberate per component.
- Falsified on checking: the sitemap leaving out `/writing` is intended (the section is parked and
  `noindex`); `role="list"` is a deliberate Safari fix; no colour pair fails contrast; no unused
  font weight loads; the CSP matches what the pages load.
