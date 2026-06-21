# Mascot entrance — implementation spec (v2: descent · headline tap · card tap · drop · stand & wave)

> Status: **shipped (v2).** Detailed, code-level record of the mascot's **first** appearance — the
> hero moment. It refines and supersedes §3–§4 of `mascot-animation-plan.md` *for the entrance only*;
> that doc remains the overall vision and the source for everything after the entrance (scroll-ride,
> lively beats).
> Date: 2026-06-21 · Model: **serpentine swing** (drops → taps headline → taps card → releases rope,
> stands & waves) · Scope: desktop hero entrance, one self-contained choreography that ends standing
> in the right gutter.

---

## 1. The experience (storyboard)

The hero headline slams in. A beat later a **rope drops from behind the top nav** and our explorer
**rappels down** it, swings **LEFT** to plant feet on the headline in a leaned-back abseil **brace**,
fires a "made it" sparkle, then **pendulums RIGHT** to tap the top-left corner of the facts card,
fires an impact emote, and **drops into the right gutter**. The rope verticalises as the anchor
glides over the landing spot, he touches down in a crouch (`land`), the rope **flies up** and
disappears, and he straightens up into a gentle standing wave (`wave`), bobbing idly in the gutter.
~2.4s of character, once, on load.

```
   [nav bar ──────────────────────────────]
        ╎ rope (drops from behind the nav, anchor at column seam)
        ╎
        🧗  ← S1 DESCENT (pose: hang) rope pays out with overshoot-catch; swings LEFT toward headline
        │
   ┌────┴───────────────────────┐  ┌──────────────────┐
   │  I build full-stack  🦵    │  │  hero-facts card  │
   │  products & AI tooling.    │  │                   │
   └────────────────────────────┘  │                   │
       ② BRACE (pose: brace) ✦sparkle · bump headline  │
        ╲                           │                   │
         ╲   S2 SWING RIGHT ───────►🦵 ③ TAP CARD (★impact) · bump card
                                    │                   │
                           S3 DROP  │ ↓ anchor glides over W3, rope verticalises
                                    🧗  ④ LAND (pose: land) crouch
                                    │~~~ rope flies UP (is-releasing) ⑤
                                    🧍  ⑥ STAND & WAVE (pose: wave) idle bob loop
```

**Why this shape.** It reads as a serpentine sequence — *arrive → tap headline (left) → tap card
(right) → drop → release rope → stand* — physically coherent because the anchor glides over the
landing spot so the rope shortens naturally as he drops, and the rope detachment moment is a visible
"flies-up" beat rather than a silent vanish. It's deliberately a *second act* after the headline
(eye reads headline, then catches the movement) so they don't compete. He ends **standing beside the
card** in the gutter — a natural companion position, visible without obscuring content.

---

## 2. Design decisions & resolved issues

These are the non-obvious calls. Each is a real tension that would otherwise bite during the build.

### 2.1 Rope flies up at the end; idle is a standing wave
v2 **releases the rope** rather than keeping him hanging. After the drop, the rope element gets class
`.is-releasing` and its `--rope-h` animates to 0 (while the body is frozen at the landing point)
plus a CSS opacity fade, so the rope visibly *flies up* to the anchor rather than popping off. He
then stands in pose `wave` and loops a gentle `mascot-wave-bob` CSS keyframe (vertical bob + slight
lean, `--bob-dur ≈ 2800ms`). This replaces the old `mascot-rope-sway` idle entirely. The
**scroll-ride** (if/when built) will need to reattach the rope from this standing start rather than
picking up mid-hang — documented in §8.

### 2.2 Coordinate system — one fixed stage, a **rope rig** that translates + rotates
The mascot lives in a `position: fixed` full-viewport overlay (`.mascot-stage`, `inset: 0`,
`pointer-events: none`). Inside it is a **rig nested two deep** so translation and rotation never
fight each other:

- `.mascot-rig` — **translated** to the rope's top anchor `(anchorX, anchorY)`. This is the pivot.
- `.mascot-swing` — **rotated** about its top (the anchor). Carries the rope + body. JS drives its
  rotation during the swing; a CSS keyframe (`mascot-wave-bob`) drives the gentle standing idle after
  settle.
- `.mascot-rope` (drawn downward from the anchor, height = rope length `L`) and `.mascot-body`
  (the sprite + emote, offset down the rope to the hands) live **inside** `.mascot-swing`, so they
  swing together as one rigid pendulum.

All motion is `transform` (translate on the rig, rotate on the swing) plus the rope's `height` — no
`top`/`left`, everything stays on the compositor.

### 2.3 Inverse kinematics on the polar rig — every waypoint solved, not eyeballed
The rig is polar: it hangs the body at (`--rope-h` length, `--rot` angle) from a fixed anchor
(`--ax`/`--ay`). For any measured feet target `(tx, ty)`:

```
dist   = hypot(tx − ax, ty − ay)
rope-h = dist − bodyLen           (bodyLen = spriteHeight × 0.80)
rot    = atan2(tx − ax, ty − ay) × (180/π)   // matches rotate(--rot * -1deg) sign convention
```

where positive `--rot` swings the body toward the gutter (right). **Animating (`rope-h`, `rot`)
between waypoints IS the pendulum** — no new transform channels are needed. The `measure()` function
calls `solve(tx, ty)` for each waypoint at runtime; the timeline just interpolates between them.

**The anchor is fixed throughout the swing at `ax = card.left + anchorBiasX` (−28 px), `ay = −24`.** During S3 (drop into the gutter) the anchor *does* glide from `G.ax` toward `G.W3.x` so the rope verticalises as he lands — this is the one phase where `place()` moves continuously.

### 2.4 All waypoints measured at runtime, never hardcoded in pixels
W1 (headline tap), W2 (card tap), and W3 (stand spot) are all derived from live
`getBoundingClientRect()` of `.hero-headline` and `.hero-facts` at kickoff and rebuilt on resize,
because the headline scales (`clamp(3rem,9vw,8rem)`) and the card rides a `clamp(260px,30vw,380px)`
grid column. The stand spot is `card.right + gap`, where
`gap = min(gutterRoom × 0.42, 104px, gutterRoom − size×0.6)` — capped so he stays "beside" the
card even on ultrawide.

### 2.5 No new art
v2 reuses existing poses `hang` / `brace` / `land` / `wave` / `static` and emotes `sparkle` /
`impact` from `public/mascot/`. The `land` and `wave` poses were always in the kit (§2 of the plan
doc); they're simply promoted from "deferred" to "used".

### 2.7 Variable pose aspect ratios → `<img src>` swaps, with a per-pose attach offset
The poses are not the same width (`brace` 363×512 ≈ 0.71, `hang` 293×512 ≈ 0.57). A fixed-size
`background-image` box would rescale each pose, so his body would visibly grow/shrink. **Resolution:**
the sprite is an `<img>` sized by **height only** (`height: var(--mascot-size); width: auto`), so
every pose keeps a consistent body height; pose swap = change `img.src`. The img hangs from the rope
end inside `.mascot-body`; because the painted **hand-grip point** differs slightly between `hang`
and `brace`, each pose carries a small **attach offset** (`ATTACH[pose]`, px nudges in x/y) so the
drawn hands always meet the rope end. These are one-time in-browser eyeball constants.

### 2.8 Timing cue — drift-proof, off the real headline animation (no magic numbers)
The headline's slam timing lives in CSS (`--d` per line) and could be re-tuned, so we don't
hard-code a delay. The entrance starts on the **`transitionend` (propertyName `transform`) of the
last `.slam-line > span`** — the instant the headline actually finishes — with a **fallback
`setTimeout(1000ms)`**, plus a `hero:headline-done` CustomEvent dispatched from `initHero()` to cover
the reduced-motion path (where there's no transition). The controller listens for `hero:headline-done`
on **`document`** (not on `stage`) — `initHero()` dispatches it on `document` from its reduce branch.
This tracks the real animation and can't drift.

### 2.9 Z-stacking — emerge from behind the nav, float above content
Nav header is `z-index: 50` (hardcoded in `Nav.astro`). The stage is **`z-index: 40`** (literal
value; there is no `--z-*` token system in the codebase) — *below* the nav so the rope visibly
**drops from behind the header bar** (reads as "from above"), but *above* page content so he braces
**on top of** the headline. Never above the nav (must not cover navigation), never clickable
(`pointer-events: none`).

### 2.10 Reduced motion & mobile — gate hard, keep personality where cheap
- **`prefers-reduced-motion`:** no rappel, no swing. Mount him **standing in the gutter** in pose
  `static`, rope hidden, stage gets class `.is-static`. Uses the new `standNow("static")` helper.
  Reuses the IIFE's `reduce` flag.
- **`< 820px`** (the hero's existing breakpoint, where it reflows to one column and the gutter
  disappears): **don't mount at all.** Evaluated at init; crossing the breakpoint on resize is a
  documented limitation (no live re-mount) except the post-settle hide below.

---

## 3. Files touched

| File | Change |
|------|--------|
| `src/components/Mascot.astro` | markup — the rig + `MASCOT` CSS block + sprite preload hint. |
| `src/layouts/BaseLayout.astro` | `initMascot()` lives in the shared IIFE; `initHero()` dispatches `hero:headline-done`. |
| `src/styles/global.css` | `MASCOT` section: adds `mascot-wave-bob` idle, `headline-bump` + `card-bump` contact keyframes (toggled via `.is-bumped`, auto-cleared on `animationend`; disabled under reduced motion), and `.mascot-rope.is-releasing` opacity fade. Removes `mascot-rope-sway`. |
| `public/mascot/*` | already in place (10 sprites incl. `mascot-brace.png`, `mascot-land.png`, `mascot-wave.png`, + `emotes/`). No change. |
| `tests/mascot.spec.ts` | Playwright tests covering: settled standing-wave render (rope gone, beside the card); aspect-ratio regression guard; `<820px` mobile-hidden fallback; reduced-motion static park. |

---

## 4. Implementation

### 4.1 Markup — `Mascot.astro`

```astro
---
// Decorative hero-entrance mascot (rappel model). All behaviour is in BaseLayout's IIFE (initMascot).
// Sprites: /mascot/*.png (height-sized <img>, swapped by src). Emotes: /mascot/emotes/*.svg
---
<div class="mascot-stage" data-mascot aria-hidden="true">
  <div class="mascot-rig" data-mascot-rig>
    <div class="mascot-swing" data-mascot-swing>
      <span class="mascot-rope" data-mascot-rope></span>
      <div class="mascot-body" data-mascot-body>
        <img class="mascot-sprite" data-mascot-sprite
             src="/mascot/mascot-static.png" alt="" decoding="async" draggable="false" />
        <span class="mascot-emote" data-mascot-emote></span>
      </div>
    </div>
  </div>
</div>
```

- `aria-hidden` + empty `alt` + no focusable content → invisible to AT and tab order.
- Initial `src` is `static` so the no-JS / pre-JS state is a sensible still sticker; JS hides the
  stage until it measures + starts (`.is-ready`), then runs the entrance or parks for reduced-motion.

### 4.2 CSS — the `MASCOT` block (uses existing tokens)

```css
.mascot-stage {
  position: fixed; inset: 0;
  z-index: 40;                       /* literal — below nav (50), above content; no --z-* token system */
  pointer-events: none;
  contain: layout paint;
}
.mascot-stage:not(.is-ready) { visibility: hidden; }   /* no flash before measure */

/* rig: pivot at the rope's top anchor. JS writes --ax/--ay (px). */
.mascot-rig {
  position: absolute; top: 0; left: 0;
  transform: translate3d(var(--ax, -300px), var(--ay, -300px), 0);
}
.mascot-stage.is-active .mascot-swing { will-change: transform; }

/* swing: rotates about the anchor (top). JS writes --rot (deg) during the swing;
   CSS sway takes over after settle. Negative --rot swings the body toward the gutter (right). */
.mascot-swing {
  position: absolute; top: 0; left: 0;
  transform-origin: top center;
  transform: rotate(calc(var(--rot, 0) * -1deg));
}

/* rope: tan strand from the anchor straight down; JS writes --rope-h. */
.mascot-rope {
  position: absolute; top: 0; left: 0;
  width: 3px; height: var(--rope-h, 0px);
  transform: translateX(-50%);
  transform-origin: top center;
  background: repeating-linear-gradient(45deg, #b98a4e 0 4px, #caa169 4px 8px);  /* subtle braid */
  border-radius: 2px;
}

/* body: hangs from the rope end (hands). JS writes --body-y (≈ rope-h) + per-pose --ax-nudge/--ay-nudge. */
.mascot-body {
  position: absolute; top: 0; left: 0;
  transform: translate3d(calc(var(--bx-nudge, 0px) - 0px), var(--body-y, 0px), 0);
}
.mascot-sprite {
  position: absolute; left: 0; top: var(--by-nudge, 0px);
  height: var(--mascot-size, clamp(64px, 6.5vw, 90px)); width: auto;
  transform: translateX(-50%);
  user-select: none;
}

/* idle wave-bob — standing after settle; replaces the v1 rope-sway. --bob-dur set by JS. */
@keyframes mascot-wave-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  40%      { transform: translateY(-3px) rotate(0.6deg); }
  70%      { transform: translateY(-1px) rotate(-0.4deg); }
}
.mascot-stage.is-settled .mascot-body {
  animation: mascot-wave-bob var(--bob-dur, 2800ms) ease-in-out infinite;
}
.mascot-stage.is-paused .mascot-body { animation-play-state: paused; }

/* rope release: flies up to the anchor; JS adds .is-releasing, removes after SETTLE */
.mascot-rope.is-releasing {
  transition: height var(--rope-fly-dur, 420ms) var(--ease-out),
              opacity var(--rope-fly-dur, 420ms) ease-in;
  opacity: 0;
}

/* contact bumps: JS toggles .is-bumped; auto-cleared on animationend */
@keyframes headline-bump { 0%,100%{transform:none} 40%{transform:translateY(2px) scaleY(0.97)} }
@keyframes card-bump     { 0%,100%{transform:none} 40%{transform:scale(1.015)}                }
.hero-headline.is-bumped { animation: headline-bump 200ms var(--ease-out) forwards; }
.hero-facts.is-bumped    { animation: card-bump     180ms var(--ease-out) forwards; }

/* emote overlay — pops above the head, JS sets background-image then clears */
.mascot-emote {
  position: absolute; left: 0; bottom: calc(var(--mascot-size, 84px) * 0.95);
  width: 34px; height: 34px; transform: translateX(-50%) scale(0);
  background: center/contain no-repeat; opacity: 0;
}
@keyframes emote-pop {
  0%   { transform: translateX(-50%) translateY(6px) scale(0); opacity: 0; }
  35%  { transform: translateX(-50%) translateY(-2px) scale(1.15); opacity: 1; }
  100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
}
.mascot-emote.is-shown { animation: emote-pop .2s var(--ease-slam) forwards; }

@media (prefers-reduced-motion: reduce) {
  .mascot-rope { display: none; }
  .mascot-stage.is-settled .mascot-body { animation: none; }
  .hero-headline.is-bumped, .hero-facts.is-bumped { animation: none; }
}
@media (max-width: 820px) { .mascot-stage { display: none; } }   /* belt-and-suspenders; JS also skips */
```

> Note on reduced-motion parking: `standNow("static")` sets the rig to the standing position with
> `--rope-h: 0` and `--body-y: 0`, so he reads as standing in the gutter with no rope visible.
> Stage gets `.is-static` alongside `.is-settled`; `onResize` checks for `.is-static` to re-park in
> the correct pose.

### 4.3 Controller — `initMascot()` in the IIFE

Lives in the `is:inline` IIFE in `BaseLayout.astro`, called from `init()`. One supporting line in
`initHero()` (both branches) dispatches the drift-proof done cue:

```js
//   reduce branch: hero.dispatchEvent(new CustomEvent("hero:headline-done"));
//   rAF branch:    the last slam-line span's transitionend fires it (see kickoff below)
```

Key structures (abbreviated — full source in `BaseLayout.astro` lines 272–510):

**CHOREO tunables (single source of truth):**
```js
var CHOREO = {
  // pacing (ms)
  descent: 760,          // S1: drop + swing to the headline (W1)
  braceHold: 200,        // plant feet on the headline
  toBox: 700,            // S2: W1 → W2 (swing across to the card)
  boxHold: 150,          // tap the card
  toStand: 580,          // S3: W2 → W3 (drop into the gutter)
  landHold: 220,         // hold the crouch
  ropeFly: 420,          // rope flies up to the anchor
  // geometry
  anchorY: -24,          // behind the nav (z-40 < nav z-50)
  anchorBiasX: -28,      // anchor x = card.left + this (column seam, just left of the card)
  handsFrac: 0.80,       // rope-end (hands) → feet body length fraction
  // waypoint placement
  w1xFrac: 0.52, w1yFrac: 0.34,   // W1 feet target within the headline rect
  w2xOff: 10,    w2yOff: 14,       // W2 feet target, px in from the card's top-left
  standGapFrac: 0.42,              // W3 x: fraction across the gutter right of the card
  standMaxGap: 104,                // ...but never further than this (ultrawide cap)
  standYFrac: 0.42,                // W3 y: feet height as a fraction of the card height
  // idle
  bobDur: 2800           // ms wave-bob loop (also sets --bob-dur)
};
```

**Waypoint solver (inverse kinematics):**
```js
function solve(tx, ty) {
  var dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy);
  return { x:tx, y:ty, L:Math.max(0, d - bodyLen), rot:Math.atan2(dx,dy)*180/Math.PI };
}
// called for W1, W2, W3; anchor is fixed at (ax, ay) = (card.left + anchorBiasX, anchorY)
```

**Timeline phases** (boundaries b1…b7 = cumulative ms from the headline-done cue):

```
S1 DESCENT  (0 – b1=760)    pose: hang; rope pays out with easeOutBack catch; rig rotates to W1.rot
BRACE       (b1 – b2=960)   pose: brace; bumpHeadlineAt(W1.y); showEmote("sparkle", 720)
S2 SWING    (b2 – b3=1660)  pose: hang; easeInOutCubic W1→W2 (rope-h + rot)
TAP         (b3 – b4=1810)  bump(.hero-facts); showEmote("impact", 520)
S3 DROP     (b4 – b5=2390)  pose: hang→land (at p>0.72); anchor glides ax→W3.x; rope verticalises
LAND        (b5 – b6=2610)  pose: land; anchor at W3.x; rope at ropeAtStand; rot=0
RELEASE     (b6 – b7=3030)  rope.classList.add("is-releasing"); ropeOnly() animates --rope-h → 0
SETTLE      (b7+)           standNow("wave"); rope.classList.remove("is-releasing");
                             stage: .is-active removed, .is-settled added → CSS wave-bob starts
```

**`standNow(pose)`** — the helper used by reduced-motion, scroll guard, settle, and resize:
```js
function standNow(pose) {
  setPose(pose || "static");
  place(G.W3.x, G.W3.y - G.bodyLen); rotate(0);
  rope.style.setProperty("--rope-h", "0px");
  body.style.setProperty("--body-y", "0px");
}
```

**Scroll guard** — if `scrollY > 40` at kickoff (user already scrolled), the act skips straight to
`standNow("wave")` + `.is-settled` rather than floating mid-entrance detached from the headline.

**Preload** — `preloadThenStart()` decodes all five sprites (`hang/brace/land/wave/static`) and races
`document.fonts.ready` against a 1500ms timeout before starting, so the headline is fully rendered
and there are no pose-swap flashes.

**Post-settle resize** — debounced `onResize` calls `measure()` then
`standNow(is-static ? "static" : "wave")`, re-standing beside the re-measured card.

The rest (kickoff gating, IntersectionObserver idle-pause, teardown) is unchanged from v1.

---

## 5. Timeline reference

| # | Phase | Window (ms) | Pose | Anchor x | Rope / rot | Emote | Easing |
|---|-------|-------------|------|----------|-----------|-------|--------|
| S1 | Descent | 0–760 | `hang` | fixed at ax | 0 → W1.L / 0 → W1.rot | — | `easeOutBack` (catch) + `easeOutCubic` (rot) |
| — | Brace | 760–960 | `brace` | ax | W1.L / W1.rot | `sparkle` | — |
| S2 | Swing | 960–1660 | `hang` | ax | W1 → W2 | — | `easeInOutCubic` |
| — | Tap | 1660–1810 | `hang` | ax | W2.L / W2.rot | `impact` | — |
| S3 | Drop | 1810–2390 | `hang` → `land` (p>0.72) | ax → W3.x (glide) | solves live | — | `easeOutCubic` |
| — | Land | 2390–2610 | `land` | W3.x | ropeAtStand / 0 | — | — |
| — | Release | 2610–3030 | `land` | W3.x | ropeOnly 0 (`is-releasing`) | — | `easeOutCubic` + opacity |
| — | Settle | 3030+ | `wave` | W3.x | 0 / 0 | — | CSS `mascot-wave-bob` |

Times are **after** the headline-done cue (≈0.5s post-load). Total entrance ≈2.5s. Every number is
a field in `CHOREO` — see §7.

---

## 6. Edge cases & how each is handled

| Case | Handling |
|------|----------|
| **Reduced motion** | No entrance/swing. `standNow("static")` parks him in the gutter; rope hidden; stage gets `.is-static` + `.is-settled`. Contact bumps (`headline-bump`/`card-bump`) disabled by `@media (prefers-reduced-motion)`. |
| **< 820px** | Not mounted (JS early-return + CSS `display:none`). Resize below bp post-settle hides the stage. |
| **No / slow JS** | SSR markup shows a still `static` sprite; stage is `visibility:hidden` until `.is-ready`, so nothing flashes at 0,0. With JS it animates. |
| **Sprite not yet decoded** | `preloadThenStart()` `decode()`s all five sprites (`hang/brace/land/wave/static`) before the timeline, so no pose-swap flash. |
| **Fonts not yet loaded** | `document.fonts.ready` is raced against a 1500ms timeout before the act starts, so the headline is fully rendered when waypoints are measured. |
| **User scrolls during the ~2.5s act** | If `scrollY > 40` at kickoff, the act skips straight to `standNow("wave")` + `.is-settled` to avoid floating mid-entrance detached from a scrolled-away headline. |
| **Resize during the act** | Geometry locked at start (re-measuring mid-flight would jump). Post-settle, `onResize` re-measures and calls `standNow()` to re-stand beside the moved card. |
| **Astro view transitions** | `astro:before-swap` → `cleanup()` runs the teardown (cancels rAF, removes `.is-bumped` classes, removes listeners/observer). `astro:page-load` → `init()` re-runs `initMascot()`; the entrance replays. |
| **Theme toggle mid-act** | Theme-agnostic die-cut PNGs (white keyline). No relayout, no issue. |
| **Headline or card missing** (other pages) | `initMascot()` early-returns when `[data-mascot]` is absent; `measure()` falls back to safe defaults if `.hero-headline` or `.hero-facts` is missing. |

---

## 7. Tuning guide (maintainability)

Everything visual is a knob in **`CHOREO`** or a CSS token — no magic numbers buried in logic:

- **Pacing** → `descent / braceHold / toBox / boxHold / toStand / landHold / ropeFly` (ms).
- **Waypoints** → `w1xFrac / w1yFrac` (where on the headline he taps), `w2xOff / w2yOff` (where
  on the card he taps), `standGapFrac / standMaxGap / standYFrac` (where he stands beside the card).
- **Anchor** → `anchorY` (rope top behind the nav), `anchorBiasX` (column seam offset from card left).
- **Body length** → `handsFrac` (rope-end → feet fraction; feeds the IK solver for every waypoint).
- **Rope** → `anchorY`, colour/braid in `.mascot-rope`.
- **Pose attach** → `ATTACH[pose]` (align painted hands to the rope end).
- **Size** → `--mascot-size`. **Stacking** → `z-index: 40` (literal on `.mascot-stage`). **Breakpoint** → `MOUNT_MIN` + the media query (keep them equal). **Idle bob** → `bobDur` + the `mascot-wave-bob` keyframe amplitude.
- **Poses/emotes used** → `SRC` / `EMO` maps. Swapping a pose is a one-line change.

To reproduce or re-tune without touching logic: edit `CHOREO`, reload. To add a beat: add a phase
boundary + an `else if` block following the same `once()` + `place()/ropeTo()/rotate()` pattern.

---

## 8. Handoff to the scroll-ride

The entrance ends **standing**, not hanging. The scroll-ride (master plan §4) will need to re-attach
the rope from this standing start:

- **State at handoff:** pose `wave`, standing at `(W3.x, W3.y)`, `--rope-h: 0`, `--rot: 0`, stage
  `.is-settled` (idle `mascot-wave-bob` running, paused offscreen via IntersectionObserver).
- **Scroll-ride (deferred — master plan §4):** will need to re-introduce the rope (animate
  `--rope-h` from 0 to the required length as the user first scrolls), then drive `place / ropeTo /
  rotate` from scroll position as before. The `place / ropeTo / rotate` primitives and the IK
  `solve()` function are all available; the scroll-ride just drives them from a scroll listener
  instead of a rAF timeline.
- New wave-frame art, a scroll-ride phase, and additional lively beats remain deferred (see §4.5 of
  `mascot-animation-plan.md`).

---

## 9. QA checklist

- [ ] Desktop, light + dark: rope drops from **behind** the nav, never over it; keyline reads on both.
- [ ] He plants on the headline in `brace`, fires `sparkle` emote and a `headline-bump` on the tapped line.
- [ ] Pendulums RIGHT to tap the card's top-left corner; `impact` emote and `card-bump` fire.
- [ ] Drops into the gutter; rope verticalises (anchor glides over the landing spot) before touchdown.
- [ ] `land` pose visible briefly just before touchdown; rope then flies up visibly (opacity fade, `is-releasing`).
- [ ] Ends standing in pose `wave` beside the card, gently bobbing; bob pauses when the hero scrolls offscreen.
- [ ] No pose-swap flash (preload works); hands meet the rope end in `hang` and `brace` (ATTACH).
- [ ] No layout shift (fixed overlay, `contain`); transform-only (no jank).
- [ ] `prefers-reduced-motion`: `static` sprite standing in the gutter, no rope, no bumps, no bob.
- [ ] < 820px: absent. Resize across 820 post-settle: appears/disappears sanely.
- [ ] Already-scrolled load (`scrollY > 40`): skips straight to standing wave, no mid-air detachment.
- [ ] Never intercepts clicks (pointer-events none); not in tab order; AT ignores it.
- [ ] Client nav away and back (view transitions): teardown runs, re-entrance is clean, no double rAF.
- [ ] Chrome / Firefox / Safari: swing + overshoot + `decode()` behave; rope angle/length track.
- [ ] Playwright: settled standing-wave render (rope gone, beside the card) passes; aspect-ratio guard passes.

---

## 10. Acceptance

The character makes a single, characterful entrance on the home page: **drops on the rope from the
nav seam, taps the headline (left), taps the facts card (right), drops into the gutter, releases
the rope with a visible fly-up, and settles standing and waving** — in ≈2.5s, transform-only,
drift-proof to the headline timing, gracefully degrading on reduced-motion and mobile. All
pacing/geometry lives in one `CHOREO` config for easy iteration. Tested by Playwright.
