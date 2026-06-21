# Mascot animation plan — the rope-rappelling explorer

> Status: **entrance shipped (v2); scroll-ride + lively beats deferred.** Canonical art is locked;
> full pose kit + emote glyphs are generated and QA'd (§2, §2.5). The entrance choreography is built
> and described in detail in `mascot-entrance-implementation.md`; this doc remains the overall vision
> for the scroll-ride and everything after.
> Date: 2026-06-21

## 1. The moment we're building

A tiny "mini-me" explorer mascot enters **after the hero headline finishes slamming in**,
rope-rappels down from the top of the viewport to a resting spot beside the headline, then
**rides his rope down the page as you scroll** — a small, characterful companion in the margin.
He idles with a gentle sway when you stop, and waves at the bottom (Contact).

Design constraints inherited from the site:
- **Neobrutalist, flat, hard-edged**, cream light theme + near-black dark theme. The mascot is a
  die-cut sticker (bold outline + white keyline) so he reads on both themes without per-theme art.
- **No new heavy deps.** No Lottie, no sprite-sheet engine, no canvas/WebGL. Transparent PNGs +
  CSS transforms + a thin JS controller, matching the existing motion system.
- **Respect `prefers-reduced-motion` and mobile**, reusing the site's existing patterns.

Canonical art: `design-previews/mascot/m18-duolingo.png` (chosen finalist — full detail, glossy
dark eyes, blue bandana focal accent). The flatten experiment was tested and rejected: at sprite
size it's indistinguishable from the detailed version, so we keep the richer original.

## 2. Asset pipeline — DONE ✅

The production sprites have already been generated, background-removed, trimmed, QA'd on both
themes, and committed to `public/mascot/`. A dev following this plan can skip straight to §3.

We deliberately over-prepared the kit so future choreography (hopping off the headline, walking a
section, perching, cheering) can be built from PNG swaps alone — no new art generation needed.

**Core kit (the rope-rappel hero moment — §4):**

| Sprite (in `public/mascot/`) | Pose                                              | Used for |
|------------------------------|---------------------------------------------------|----------|
| `mascot-hang.png`            | Suspended from a single rope, both hands gripping, body sliding down. | Entrance descent + the whole scroll-ride rappel. **Primary.** Rope is the throughline — never retracts. |
| `mascot-brace.png`           | Leaned-back abseil brace — feet braced/coiled, both hands gripping the rope overhead, determined grin, cloak trailing. | Entrance brace on the headline + every kick-off beat on the scroll-ride. |
| `mascot-wave.png`            | One hand on the rope, other raised in a wave.     | **Entrance idle (v2 shipped)** — standing wave after the rope releases. Also used for the Contact-section greeting (deferred). |
| `mascot-static.png`          | Standing (the canonical pose).                    | Reduced-motion / mobile parked fallback (§6). |

**Lively-action kit (for richer, "hop off the words" choreography — see §4.5):**

| Sprite (in `public/mascot/`) | Pose                                              | Used for |
|------------------------------|---------------------------------------------------|----------|
| `mascot-jump.png`            | Airborne leap, one knee tucked, both arms flung up, cloak flaring. | Take-off — hopping off the headline / between sections. |
| `mascot-land.png`            | Deep braced landing crouch, one hand planted, body squashed low. | **Entrance (v2 shipped)** — touchdown crouch before standing. Also pairs with `jump` for squash-and-stretch. |
| `mascot-walk.png`            | Strict side profile facing **right**, mid-stride, arms in opposition, cloak trailing. | Walking along a ledge / across a section. Flip horizontally for leftward travel. |
| `mascot-sit.png`             | Sitting front-on, legs dangling, hands planted at sides (no ledge drawn). | Perching on a section edge / headline while idle. |
| `mascot-climb.png`           | Climbing a single centered rope hand-over-hand, looking up. | Climbing *up* the page (scroll-up), or an alt entrance. |
| `mascot-cheer.png`           | Both fists thrown up in triumph, open-mouthed grin. | Celebration beat (Contact, or after a milestone scroll). |

All ten are transparent PNGs, trimmed to content + 16px padding, 512px tall (retina-ample for a
48–96px display sprite), with the bold black outline + white keyline preserved. They were verified
composited on both `--paper` light (`#f5f2e9`) and dark (`#12110d`): the keyline separates cleanly
on both themes, the goggle lenses survived, and there are no gray halos/pockets.

`mascot-walk.png` is the only directional sprite (faces right). For leftward walking, mirror it in
CSS with `transform: scaleX(-1)` rather than generating a second render.

**Rope is the throughline — baked into the sprites and kept the entire entrance + scroll-ride, never retracting.** The hang/brace/climb sprites contain a continuous tan rope exiting the top edge. The §3 CSS rope draws the segment from the top anchor down to the sprite's top edge, color-matched to the baked rope (tan), at that same x — the sprite's own rope covers the segment over the body. The baked rope in each pose should align to the CSS rope at the hands; exact x is a small CSS eyeball tweak. Note the hang rope is a touch more central than the wave rope, so a mid-ride swap to the wave shifts the rope slightly (fine for an optional greeting; regenerate the wave to match if you want a seamless swap).

**Regeneration (if poses ever need redoing):** each pose has a prompt file in
`design-previews/mascot/` (`hang.txt`, `wave.txt`, `pose-land.txt`, `pose-jump.txt`,
`pose-walk.txt`, `pose-sit.txt`, `pose-climb.txt`, `pose-cheer.txt`, `pose-brace.txt`) and a full-res gray-bg render
(`pose-*.png`) — both gitignored art source-of-truth. Every pose prompt starts with the same
identity preamble (full outfit list + "keep him the exact same person") and references
`m18-duolingo.png` via `--image`, which is how character consistency holds across poses. Re-render
via `gen.py`, then rerun `design-previews/mascot/process_sprites.py` (its `JOBS` list maps each
`pose-*.png` → `mascot-*.png`) to re-export the trimmed transparent sprites to `public/mascot/`.
`mascot-static.png` is just the canonical `m18-duolingo.png` run through the same pipeline.

### 2.5 Emote overlay glyphs — DONE ✅

A small set of **pose-independent** emote symbols lives in `public/mascot/emotes/` as SVG. They
layer *above* the mascot's head as an overlay, so emotion = **body pose × emote glyph** — a tiny
asset set yields a combinatorial range of expressions (e.g. `walk` + `note` = humming along;
`land` + `impact` = a hard landing; `cheer` + `sparkle` = triumph; `static` + `question` =
curiosity). SVG (not PNG) because they're crisp at any size, a few hundred bytes each, and can be
recolored per theme via `fill`/CSS if ever needed.

| Glyph (`public/mascot/emotes/`) | Symbol             | Accent color        | Reads as |
|---------------------------------|--------------------|---------------------|----------|
| `exclaim.svg`                   | bold `!`           | coral `#ef4322`     | surprise / alert |
| `question.svg`                  | `?`                | blue `#2b4cf0`      | curiosity / confusion |
| `sparkle.svg`                   | 3 four-point stars | yellow `#e8ff2a`    | delight / "ooh" |
| `heart.svg`                     | chunky heart       | coral `#ef4322`     | affection / like |
| `note.svg`                      | musical note       | blue `#2b4cf0`      | humming / happy idle |
| `sweat.svg`                     | sweat drop         | blue `#2b4cf0`      | effort / nervous (anime style) |
| `impact.svg`                    | 8-point starburst  | yellow `#e8ff2a`    | impact / landing / emphasis |

Each glyph uses the same die-cut treatment as the mascot (white keyline 18 + black outline 8 +
accent fill, in a `0 0 100 100` viewBox), so it reads on both themes. They were generated by a
dedicated pass; a dual-theme contact sheet lives at `design-previews/mascot/emotes-preview.html`
and usage notes at `public/mascot/emotes/README.md`. Adding a new emote = drop one more SVG in,
following the white-stroke-first / black-stroke-second / fill-on-top layering pattern.

## 3. Architecture

> **⚠️ Superseded for the build by `mascot-entrance-implementation.md`.** The actual rig is a
> **4-level nested structure** (`.mascot-stage > .mascot-rig > .mascot-swing > .mascot-rope + .mascot-body > img`)
> with **`<img src>` pose swaps**, NOT the single-rig + `background-image` class-swap sketch below.
> The scroll-ride (Phase 3) must build on the nested rig + `<img>` model in the entrance spec,
> not this simplified sketch. The sketch below is retained only as the original conceptual outline.

One new component, one stylesheet block, one controller function — all following existing idioms.

```
src/components/Mascot.astro     # markup: the rig (rope + sprite), aria-hidden, decorative
src/styles/global.css           # add a "MASCOT" section: positioning, poses, idle, reduced-motion
src/layouts/BaseLayout.astro    # mount <Mascot/> once; add initMascot() into the existing IIFE
public/mascot/mascot-hang.png   # (+ optional mascot-wave.png) production sprites
```

### Markup (`Mascot.astro`)

```html
<div class="mascot-rig" aria-hidden="true" data-mascot>
  <span class="mascot-rope"></span>                  <!-- the rope line above him -->
  <span class="mascot-emote"></span>                 <!-- overlay glyph above head (empty until cued) -->
  <span class="mascot-sprite mascot-hang"></span>    <!-- bg-image set per pose class -->
</div>
```

- `aria-hidden="true"` + no text: purely decorative, invisible to screen readers and tab order.
- The rope is a CSS element (a thin vertical line via `background`/`border`, or a 1–2px wide
  `<span>` with a tan color and a subtle braid via repeating-linear-gradient). No SVG needed for a
  straight rope; revisit only if we want a curved/swinging rope.
- Pose is a class on `.mascot-sprite` (`mascot-hang`, `mascot-jump`, `mascot-walk`, …) that swaps
  the `background-image`. The full pose set is listed in §2.
- `.mascot-emote` is the overlay layer (§2.5): positioned just above the head, normally empty, its
  `background-image` set to an emote SVG by the controller for a brief beat then cleared. A tiny
  pop-in keyframe (scale 0→1 + a 1–2px rise) sells it. Kept as a sibling so the emote can pop while
  the body holds any pose.

### Positioning

- `.mascot-rig` is `position: fixed`, pinned to a **vertical lane in the right gutter** (recommended)
  or left gutter. Right gutter avoids colliding with the headline copy on the left and echoes the
  sticker-cluster column. On narrow viewports the lane collapses (see §6).
- The rope hangs from `top: 0` (above the fold, off-screen) down to the sprite. The sprite's vertical
  offset is driven by a single CSS custom property `--mascot-y` (px or %). The rope's height tracks
  the sprite so it always connects to the top.
- Horizontal position: a fixed inset from the right edge, clamped so he never overlaps the centered
  content column at wide widths (sits in the gutter beside the `.container` max-width).

> **Building the entrance first?** The exact, code-level build spec for Act 1 (rope drop →
> rappel descent → brace on the headline → kick-off swing → settle hanging in the gutter) lives in
> [`mascot-entrance-implementation.md`](./mascot-entrance-implementation.md). It refines §3–§4 below
> for the entrance specifically (fixed full-viewport stage, `<img>` pose swaps, drift-proof
> headline-done cue, JS rAF timeline) and ends with the mascot **hanging on the rope in the gutter** —
> the handoff point for everything else here.

## 4. Choreography (the four phases)

The controller has exactly one job: move `--mascot-y` and swap pose classes at the right times. All
visual motion is CSS off those state changes.

**Phase 0 — Hidden (pre-hero).**
Mascot starts fully above the viewport (`--mascot-y` negative), `opacity` ok but off-screen. Nothing
runs until the hero is done.

**Phase 1 — Entrance (the hero beat). SHIPPED (v2)**
The controller waits for the hero headline to finish, then triggers the entrance. **Cue:**
`transitionend` on the last `.slam-line > span` + `hero:headline-done` CustomEvent + 1s fallback,
all three raced so it can't drift. The rope drops from behind the nav (anchor at the column seam,
`anchorBiasX = −28px` left of the card); he swings **LEFT** to plant feet on the headline (`brace`
+ `sparkle` emote + `headline-bump`), pendulums **RIGHT** to tap the facts card (`hang` + `impact`
emote + `card-bump`), drops into the gutter (rope verticalises as the anchor glides over the landing
spot), touches down in a crouch (`land`), and the rope **flies up** (`is-releasing` — height + opacity
animate to 0). He then stands in pose `wave` and loops `mascot-wave-bob` (gentle vertical bob,
`--bob-dur ≈ 2800ms`). ≈2.5s total. Paused offscreen via IntersectionObserver (`.is-paused`).
The full code-level spec lives in `mascot-entrance-implementation.md`.

**Phase 2 — Idle stand & wave. SHIPPED (v2)**
Once he settles in the gutter (standing in pose `wave`, rope gone, end of Phase 1), the CSS
`mascot-wave-bob` keyframe (gentle vertical bob + slight lean from the feet) loops as the idle.
This runs on `.mascot-body` and never fights a scroll-driven transform on the parent. Paused offscreen
via the existing `.is-paused` IntersectionObserver (same as v1 rope-sway).

**Phase 3 — Scroll ride.**
As the user scrolls, `--mascot-y` is mapped from scroll progress so he rappels down the page on his
rope, the rope paying out. Implementation: a `scroll` listener throttled with `requestAnimationFrame`
(write `--mascot-y` once per frame, never per scroll event). Map `window.scrollY` (or page progress
0→1) to a Y range so he travels from near the top to near the footer over the page's length. The
rope grows with him. He kicks off each section edge (a repeatable rope-bounce signature move — `brace`
→ kick-off → `hang`). Scrolling back up reuses `climb` so reversing direction feels intentional.
Optional easing/lag so he trails the scroll slightly for a "swinging weight" feel (lerp
current→target each frame).

**Phase 4 — Arrival wave (deferred, v2+).**
When the Contact section enters view (IntersectionObserver), swap to `mascot-wave` for a beat, then
back. The `wave` sprite is already shipped (it's the entrance idle); this phase wires up the Contact
observer to trigger it again at the bottom. Deferred — see milestone 7.

### 4.5 Lively beats (v2+, optional — the "hop off the words" layer)

The core moment (Phases 0–4) only needs `hang`/`brace`/`static` (and `climb` for scroll-up). The lively-action kit (§2) exists so
we can layer in playful, section-triggered beats *later* without new art. Each is a short
self-contained micro-choreography fired by an IntersectionObserver as a section scrolls in, then the
mascot returns to the rope. Keep them sparse — one or two across the page, not constant motion.

- **Kick off a section edge.** The rope-bounce signature move (already part of the scroll-ride):
  `hang → brace` (feet plant on the edge, leaned back, `sparkle` emote), hold a beat, then kick off
  and swing back to `hang`. The coil-and-release reads instantly with just these two poses.
- **Walk a section.** On a content section, `static → walk` and translate him a short distance
  along an edge (mirror with `scaleX(-1)` for leftward), optionally a `note` emote for "strolling
  along," then `walk → static`.
- **Perch.** Over a section heading or card, `static → sit` so he dangles his legs on the edge while
  that section is in view; `sit → static` (or `→ jump`) on the way out.
- **Climb up.** On scroll-*up*, swap the rope ride to `climb` (hand-over-hand, looking up)
  so reversing direction feels intentional rather than just rewinding the descent. This is now part
  of the core scroll-ride (Phase 3), not optional.
- **Celebrate.** At Contact / the end, `cheer` with a `sparkle` or `heart` emote instead of (or
  after) the wave — a bigger payoff for reaching the bottom.

All of these are pure `transform` translations + pose-class swaps + an optional emote overlay,
firing off the same observer/rAF infrastructure as Phases 1–4. They inherit the reduced-motion and
mobile gates (§6) automatically — when motion is off, none of them run.

## 5. Technical approach & rationale

- **CSS custom property + rAF-throttled scroll** beats CSS `animation-timeline: scroll()` here because
  browser support for scroll-driven CSS animations is still uneven, and we already need JS for the
  entrance cue and pose swaps. One small controller keeps it predictable and lets us add the trailing
  lerp. (If we later want zero-JS scroll linkage, `animation-timeline` is a drop-in evolution.)
- **Transform, not `top`:** drive position with `transform: translate3d()` (or `translateY` via the
  custom prop) to stay on the compositor. Set `will-change: transform` only while active; drop it when
  idle/offscreen (mirrors the reveal system's promote-then-release note in `global.css`).
- **One pose, class-swapped:** `background-image` swap on `.mascot-sprite` is the whole "animation
  system." No sprite sheets. Two PNGs max.
- **Hook into the existing IIFE** in `BaseLayout.astro`: add `initMascot()` alongside `initHero()`,
  register its scroll listener + observers in the `teardowns[]` array, and let the existing
  `astro:page-load` / `astro:before-swap` wiring handle view-transition re-init/cleanup for free.

## 6. Reduced motion & mobile

- **`prefers-reduced-motion`:** reuse the IIFE's `reduce` flag. When set: **no entrance drop, no idle
  sway, no scroll ride.** Either (a) render the mascot statically parked at a fixed corner spot, or
  (b) don't mount him at all. **Recommendation: (a)** — a still, friendly sticker in the corner keeps
  the personality without motion. Decide in review.
- **Mobile / narrow (`max-width: 820px`, the hero's existing breakpoint):** the gutter lane disappears
  and a fixed sprite competes with content and thumbs. **Recommendation:** hide the rope-ride on small
  screens; optionally keep a tiny static parked mascot, or drop him entirely. A scroll-following fixed
  element on mobile is usually more annoyance than delight — lean toward hiding. Decide in review.
- **Touch:** freeze idle on touch like the sticker cluster (`:hover`/`.is-paused`).
- **Performance:** single rAF-throttled listener; pause all loops offscreen; respect the compositor
  (transform-only). Preload `mascot-hang.png` (small) so the entrance isn't a pop-in.

## 7. Accessibility

- `aria-hidden="true"`, not focusable, no semantic content — he's decoration.
- Never traps pointer events over content: `pointer-events: none` on `.mascot-rig` (re-enable only on
  the sprite if we ever add a click easter-egg).
- Honors reduced-motion (§6). No flashing, no rapid motion.

## 8. Build milestones

1. ~~**Assets** — generate the pose sprites + emote glyphs, bg-remove keeping the keyline, trim,
   export to `public/mascot/`, verify on both themes.~~ **DONE** (see §2 & §2.5: the full 10-pose kit
   `mascot-{hang,wave,static,jump,land,walk,sit,climb,cheer,brace}.png` and 7 emote SVGs in
   `public/mascot/emotes/` are all in place and QA'd on both themes).
2. ~~**Static mount** — `Mascot.astro` + `global.css` MASCOT block; park him statically in the gutter,
   correct size/position, both themes, no motion yet. Confirm he never overlaps content at any width.~~ **DONE**
3. ~~**Entrance** — `initMascot()` in the IIFE; v2 serpentine (descent → headline tap → card tap → drop → rope-fly → stand & wave).~~ **DONE (v2)**
4. ~~**Idle** — `mascot-wave-bob` on `.mascot-body`; pause offscreen via IntersectionObserver.~~ **DONE (v2)**
5. **Scroll ride** — rAF-throttled `--mascot-y` mapping + rope growth; optional trailing lerp. *(deferred — next pass)*
6. ~~**Reduced-motion + mobile** — static/hidden fallbacks per §6.~~ **DONE**
7. **(v2+) Wave greeting** — Contact-section IntersectionObserver pose swap (separate from the entrance idle). *(deferred)*
8. **(v2+) Lively beats** — §4.5 micro-choreographies (hop off the headline, walk, perch, climb-up,
   celebrate) + emote-overlay pop-ins, each section-triggered and sparse. New wave-frame art
   (rope-aligned version for mid-scroll use). *(deferred)*
9. **Polish** — easing, timing against the hero, overshoot feel; cross-browser (Chrome/Safari/FF),
   theme-toggle mid-ride, and Astro view-transition re-init.

## 9. Open decisions (confirm before/at implementation)

1. ~~**Gutter side** — right (recommended, mirrors sticker column) vs left.~~ **Decided: right.**
2. **Scroll travel** — full-page rappel top→footer (recommended) vs only within the hero/first screen
   then he "sits" somewhere fixed. *(deferred — scroll-ride not yet built)*
3. **Trailing lerp** — add the slight swing-lag (more characterful, a touch more code) or rigid 1:1
   to scroll (simpler). *(still open — belongs to the deferred scroll-ride)*
4. ~~**Mobile** — hide entirely (recommended) vs tiny static parked mascot.~~ **Decided: `< 820px` = not mounted (hidden).**
5. ~~**Reduced-motion** — static parked (recommended) vs not mounted.~~ **Decided: static parked in the gutter.**
6. ~~**Wave pose** — ship the second sprite in v1 or defer to v2.~~ **Decided: shipped in v2 — used as the entrance idle pose.**

Items 1, 4, 5, and 6 are resolved. Items 2 and 3 remain open for the deferred scroll-ride pass.
