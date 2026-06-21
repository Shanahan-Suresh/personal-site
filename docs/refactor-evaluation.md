# Refactor Evaluation — personal-site

**Date:** 2026-06-21
**Evaluator:** Claude (refactor-evaluation skill)
**Scope:** internal code quality + performance only. **Behavior-preserving** — the rendered site must look and behave identically. Anything that would change observable UI/UX is parked under **Proposals (needs sign-off)**.

---

## Stack summary

| Field | Value |
|-------|-------|
| Language(s) | TypeScript (strict), vanilla JS, Astro components |
| Framework | Astro 5 (`output: 'static'`), MDX/RSS/Sitemap integrations |
| Styling | Tailwind 4 via `@tailwindcss/vite` + a single 1,142-line `global.css` (CSS custom-property design system) |
| Build tooling | Astro/Vite; `astro check` in build |
| Package manager | npm (`package-lock.json`) |
| Test runner | Playwright (Chromium / Firefox / WebKit, runs against the production build) |
| Rough size | ~147 source files / ~3,400 LOC; zero `client:` directives (fully static) |

---

## Scorecard

| Dimension | Health | Headline finding |
|-----------|--------|-----------------|
| 1. Code quality & elegance | 🟡 | ~430 lines of dead/parked code (Mascot + commented blocks); ~6 unused CSS utility groups |
| 2. Architecture & structure | 🟡 | Repeated render patterns not extracted; `interests.ts` embeds CSS class names; 1,142-line `global.css` |
| 3. Performance & bundle | 🟡 | 2.24 MB of parked mascot sprites ship in `public/`; monolithic CSS on every page |
| 4. Dependencies & security | 🟡 | `@astrojs/mdx` wired with zero `.mdx` files; `npm audit` not yet run |
| 5. Accessibility | 🟢 | Solid baseline (focus-visible, reduced-motion, semantics); only minor refinements |
| 6. Testing | 🔴 | A single smoke test — **not** a sufficient equivalence safety net for refactoring |
| 7. Config & tooling | 🟡 | No CI pipeline; otherwise clean (strict TS, correct ignore files) |

**Falsified seed findings (verified false during analysis):** redundant `@font-face` after preload (no `@font-face` in `global.css` at all — declarations live only in `BaseLayout.astro`); unoptimized `og-image.png` (it's a 56.8 KB `.jpg`); h1→h3 heading-skip (`SectionHeading` always emits `<h2>`, outline is valid).

---

## Prerequisite — build the equivalence safety net FIRST

> The behavior-preserving guarantee in this plan is only as good as the tests that prove it. **The current suite cannot prove equivalence.**

`tests/home.spec.ts` is a single test with three assertions (page serves, `.hero-headline` visible, contains `/full-stack/i`). The multi-browser harness and production-build target are correctly configured, but nothing below the hero is exercised. A refactor could silently break Nav, Work cards, Contact links, the theme toggle, mobile layout, or reduced-motion paths and every test would still pass.

**Before executing any P1/P2 item below, add active regression tests** (`tests/home.spec.ts` is the seed; reuse the existing Playwright config):
1. Nav renders expected links; theme-toggle `<button>` present.
2. Major sections visible: About, Work (≥1 project card), Contact headline + mailto, Footer.
3. Contact mailto `href` contains the correct address.
4. Theme toggle click toggles `.dark` on `<html>` and persists to `localStorage`.
5. Mobile viewport (~600px): nav links hidden, hero reflows single-column.
6. `reducedMotion: "reduce"`: `.reveal` elements visible without observer delay.

These six, on the existing 3-browser config, become the equivalence net every plan item cites.

---

## Findings

### 1. Code quality & elegance
- **Dead component `Mascot.astro` (389 lines)** — `src/components/Mascot.astro:1-389`. Never mounted; import + usage commented at `src/pages/index.astro:13,61`. No live reference. `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`
- **Commented-out "Recent writing" section** — `src/pages/index.astro:14-57` (3 imports + ~25-line block) plus the matching commented nav entry at `src/data/navigation.ts:10`. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **Unused CSS utilities** — `src/styles/global.css`: `.grid-3`/`.grid-4` (:294), `.chip` (:659), `.divider-strip` (:791), `.fill-*` (:446-465), `.tag-1`/`.tag-pop` (:642-653). Zero references across `src/**/*.astro` (only `.grid-2`, `.tag-2`, `.tag-ink` are used). `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **Stranded accent-4/5 palette** — `src/styles/global.css:102-131`. `--accent-4/5` + `--on-4/5` consumed only by `.sticker-4/5`; no `.fill-4`, `.card--4`, etc. siblings. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **`--d` stagger magic numbers scattered** — `Hero.astro:12,19,22,31,39,62`, `Work.astro:38`, `Beyond.astro:11`, `Contact.astro:7` (hardcoded 60/120/200/280/360ms etc.); JS default step 70ms in `BaseLayout.astro`. No shared constant. `Impact: Med · Effort: M · Risk: Low · Behavior: Preserving (if values kept identical)`
- **Magic `1400ms` is-alive timeout** — `src/layouts/BaseLayout.astro:163`; relates to stamp constants in `global.css:882-885` but the relationship is unexpressed. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **Inline-style sprawl in PostCard/PostLayout/Principles** — `PostCard.astro:16-32` (no `<style>` block at all), `PostLayout.astro:24,28,33,38,47`, `Principles.astro:38` (inlined `font-size`). Inconsistent with the scoped-`<style>` convention used elsewhere (e.g. `ProjectCard.astro`). `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`

### 2. Architecture & structure
- **`global.css` mixes 5+ concerns in 1,142 lines** — `src/styles/global.css:1-1142` (tokens, reset, layout, type, fills, cards, buttons, tags/stickers, marquee, reveal motion, hero choreography ~875-1001, prose, reduced-motion, mascot tombstone). Natural split: `tokens / components / motion / prose`. `Impact: Med · Effort: M · Risk: Low · Behavior: Preserving`
- **205-line inline IIFE with 5 independent modules** — `src/layouts/BaseLayout.astro:79-286` (`initReveal`, `initHero`, `initScrollSpy`, `initScrolledNav`, `initIdlePause`). Monolithic due to `is:inline` FOUC-prevention; each function is logically independent. `Impact: Med · Effort: M · Risk: Med (is:inline × bundler) · Behavior: Preserving`
- **`interests.ts` embeds raw CSS class names, bypassing the type system** — `src/data/interests.ts:1-15` (`accent: string` holding `"sticker-2"` etc.). A class rename in CSS breaks data silently; `projects.ts` does this correctly via the typed `Accent` union. `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`
- **`Accent` type omits `"4"`/`"5"`** — `src/lib/types.ts:1` (`"1"|"2"|"3"|"pop"|"ink"`). `sticker-4/5` exist and are used but can't flow through `Card`/`BentoTile`/`ProjectCard`. Extend the union (+ matching CSS) or add a `StickerAccent` type. `Impact: Med · Effort: S · Risk: Low · Behavior: Preserving`
- **Repeated render patterns not extracted** — `Work.astro:26` renders `section-label` inline instead of via `SectionHeading`; `Tag.astro` is bypassed by direct `<span class="tag">` in `ProjectCard`/`PostCard`/`writing/index.astro`; `BentoTile.astro:1-22` callers each re-wrap slots in `<div class="stack stack-N">`. Candidates: shared `TagList`, consistent `SectionHeading` use. `Impact: Med · Effort: M · Risk: Low · Behavior: Preserving`

### 3. Performance & bundle
- **2.24 MB parked mascot sprites ship in `public/`** — `public/mascot/` (10 PNGs; 5 orphaned even within the disabled component). Static assets are copied verbatim into `dist/`. `Impact: High · Effort: S · Risk: Low · Behavior: Preserving (asset is never referenced by live pages)`
- **Monolithic `global.css` on every page** — `src/styles/global.css` imported unconditionally in `BaseLayout`, including prose-only `/writing` pages that use a fraction of it. `Impact: Med · Effort: M · Risk: Med (visual regression) · Behavior: Preserving if verified by snapshots`
- **Positive: zero runtime JS framework** — no `client:` directives anywhere; fully static output. Record and preserve. `Impact: n/a · Behavior: Preserving`

### 4. Dependencies & security
- **`@astrojs/mdx` wired with zero `.mdx` files** — `astro.config.mjs` + `package.json`. Dead integration unless MDX is on the roadmap. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **Runtime vs build dependency classification** — `package.json`. For a fully static build, `astro`, `@astrojs/*`, `tailwindcss`, `@tailwindcss/vite`, `@fontsource/*` are build-time; classification is hygiene only (no shipped runtime). `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **`npm audit` not yet run** — static inspection only this pass. Run `npm audit --audit-level=high` as follow-up. `Impact: Unknown · Effort: S · Risk: Low · Behavior: Preserving`

### 5. Accessibility
- **Redundant `role="list"` on native `<ul>`** — `src/components/Nav.astro:13`, `src/components/Contact.astro:28`. Both `<ul>`s set `list-style:none`, which strips list semantics under Safari+VoiceOver — so `role="list"` is a *defensive* override, not pure cargo-cult. **Recommendation: keep** (harmless belt-and-suspenders) or remove knowingly. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **`ghost-spin` not explicitly pinned in reduced-motion block** — `Contact.astro:142` animation; caught only by the `*` `0.001ms` catch-all (`global.css:1095`). Functionally silent; an explicit `animation: none` would be cleaner. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **`aria-label` on a non-interactive `<p>`** — `Hero.astro:12-14` (`aria-label="Name: Shanahan Suresh"` over visible "SHANAHAN SURESH"). Non-standard on a `<p>`; diverges visible/AT text. `Impact: Low · Effort: S · Risk: Low · Behavior: Preserving`
- **Confirmed-good (no action):** `<a class="btn">` usage is semantically correct (all have real `href`); `Monogram.astro:28` decorative SVG correctly `aria-hidden` with link `aria-label`; global `:focus-visible` ring present with no `outline:none` suppression; reduced-motion CSS + JS layers both thorough.

### 6. Testing
- **`tests/mascot.spec.ts` fully skipped** — `tests/mascot.spec.ts:15` (`test.describe.skip`). Dead until the mascot ships. `Impact: Low · Effort: S · Risk: Low · Behavior: n/a (test-only)`
- **`home.spec.ts` is a smoke test, not a safety net** — `tests/home.spec.ts:1-10` (3 assertions, hero only). See Prerequisite section. `Impact: High · Effort: M · Risk: High for refactor reliance · Behavior: n/a`
- **No coverage for Nav / Contact / Work / theme toggle / mobile / reduced-motion** — meaningful page contracts a refactor could break silently. `Impact: High · Effort: M · Risk: High · Behavior: n/a`

### 7. Config & tooling
- **No CI pipeline** — no `.github/workflows`. `astro check`, `astro build`, and `playwright test` run only locally. `Impact: Med · Effort: S · Risk: Low · Behavior: n/a (process)`
- **Confirmed-good:** `tsconfig` strict + `@/*` alias correct; `.gitignore` covers `dist/`, `.astro/`, test artifacts; Prettier configured.

---

## Prioritized plan (behavior-preserving)

> Execute the **Prerequisite test net first**, then proceed. Every item is behavior-preserving and names its equivalence proof.

### P0 — quick wins (high value, low risk)
1. **Delete the parked mascot subsystem as one unit** — `src/components/Mascot.astro`, `public/mascot/` (2.24 MB), `tests/mascot.spec.ts`, and the mascot-tombstone comments in `global.css`. Also drop the commented Mascot import/usage in `index.astro:13,61`.
   *Rationale:* removes ~430 LOC + 2.24 MB of shipped-but-unused assets; zero live references.
   *Equivalence proof:* `grep -ri "mascot" src/ public/ astro.config.mjs` returns clean; `astro build` succeeds; new regression suite passes; `dist/` diff shows only the removed mascot assets.
2. **Remove the commented-out "Recent writing" block** — `index.astro:14-57` + commented nav entry `navigation.ts:10`.
   *Equivalence proof:* rendered `index.html` byte-identical except whitespace; regression suite green.
3. **Remove unused CSS utilities** — `.grid-3/4`, `.chip`, `.divider-strip`, `.fill-*`, `.tag-1`, `.tag-pop` in `global.css`.
   *Equivalence proof:* `grep` confirms zero usage in `src/`; built CSS diff shows only deletions; Playwright visual pass unchanged.
4. **Fix the `Accent` type gap** — extend the union in `src/lib/types.ts` to include `"4"`/`"5"` (or add a dedicated `StickerAccent`), and type `interests.ts`'s `accent` field instead of `string`.
   *Equivalence proof:* `astro check` passes; no rendered output changes (types only).

### P1 — consolidation (moderate effort, low/moderate risk)
5. **Centralize stagger/timing constants** — replace scattered `--d` literals and the `1400ms`/`70ms` JS values with named constants (kept numerically identical).
   *Equivalence proof:* values unchanged → identical animation timing; regression + reduced-motion tests green.
6. **Extract repeated render patterns** — route `Work.astro` section labels through `SectionHeading`; introduce a `TagList` and use `Tag.astro` consistently; tidy `BentoTile` slot-wrapping.
   *Equivalence proof:* visual regression snapshots identical pre/post.
7. **Normalize inline-style sprawl** — move `PostCard`/`PostLayout`/`Principles` inline styles into scoped `<style>` blocks matching `ProjectCard`'s convention.
   *Equivalence proof:* computed styles unchanged; visual snapshots identical.
8. **Dependency hygiene** — run `npm audit --audit-level=high` and address findings; remove `@astrojs/mdx` **only if** MDX is not on the roadmap (see Proposals).
   *Equivalence proof:* `astro build` + regression suite green.

### P2 — structural (larger / needs the safety net)
9. **Split `global.css`** into `tokens.css` / `components.css` / `motion.css` / `prose.css` composed via `@import`.
   *Equivalence proof:* full multi-browser visual regression snapshots across `/`, `/writing`, a post — all identical.
10. **Extract `BaseLayout` inline IIFE** into `src/scripts/*` modules behind a thin inline dispatcher, preserving the `is:inline` theme/FOUC behavior.
    *Equivalence proof:* theme-flash, scroll-reveal, scroll-spy, nav-shadow, and idle-pause behaviors verified by regression + reduced-motion tests across all 3 browsers.

---

## Proposals (needs sign-off — behavior-changing)

- **Content bug: `(TODO SPLIT IN PARAGRAPHS)` is live on the site** — `src/data/projects.ts:28` renders verbatim to visitors via `ProjectCard.astro:44`. Fixing it rewrites visible copy → needs the intended paragraph text. *Recommend addressing promptly* — it's user-visible.
- **Make the hero quick-facts card accessible to AT** — `Hero.astro:46` wraps both decorative stickers *and* the substantive facts card (Degree / Main Stack / Focus) in `aria-hidden="true"`. Scoping `aria-hidden` to just the sticker cluster exposes real content to screen readers (no visual change, but AT output changes).
- **Reconsider sitemap `/writing` exclusion** — `astro.config.mjs:12` filters all `/writing` URLs from the sitemap. If posts should be indexed, remove the filter.
- **Add GitHub Actions CI** — `astro check` + `astro build` + `playwright test` on push/PR.
- **Remove the `aria-label` on the hero eyebrow `<p>`** (`Hero.astro:12-14`) for spec conformance — changes AT announcement.
- **Preload DM Mono weights** to reduce FOUT — a rendering/UX change.

---

## Out of scope / deferred
- Re-enabling or rebuilding the mascot feature (explicitly parked by the author).
- New content/blog posts and i18n.
- Visual redesign of any kind — this evaluation is strictly internal/behavior-preserving.
