# Mascot Emote Glyphs

Small emotion symbols that pop above the chibi explorer mascot's head, following the Japanese game/anime emote convention.

## Glyphs

| File | Color | Meaning |
|------|-------|---------|
| `exclaim.svg` | Coral `#ef4322` | Alert / surprise — sudden reaction |
| `question.svg` | Blue `#2b4cf0` | Confusion / curiosity |
| `sparkle.svg` | Yellow `#e8ff2a` | Excitement / delight — one big star + two small |
| `heart.svg` | Coral `#ef4322` | Love / like |
| `note.svg` | Blue `#2b4cf0` | Happy / humming — eighth note quaver |
| `sweat.svg` | Blue `#2b4cf0` | Nervous / oops — anime teardrop with white highlight |
| `impact.svg` | Yellow `#e8ff2a` | Landing / hop impact — spiky 8-point burst |

## Visual System

Every glyph uses the **die-cut sticker** layering:

1. **White keyline** — same path drawn with a fat white stroke (~18 units wide), placed first so it sits behind everything. This creates a white halo that lifts the glyph off both light and dark backgrounds.
2. **Black outline** — same path drawn with a medium black stroke (~8 units wide), on top of the white layer.
3. **Accent fill** — the shape filled with one of the three brand accents (coral, blue, yellow), painted last so it sits cleanly inside the outline.

The palette is restricted to three accent colors (`#ef4322`, `#2b4cf0`, `#e8ff2a`), ink black (`#0d0d0d`), and white (`#ffffff`).

## Intended Use

Place each emote as an absolutely-positioned overlay above the mascot's head, sized to roughly **24–40 px** via CSS (e.g. `width: 32px; height: 32px;`).

Suggested **pop-in animation** (CSS, not pre-built into the SVGs):

```css
@keyframes emote-pop {
  0%   { transform: scale(0);    opacity: 0; }
  60%  { transform: scale(1.2);  opacity: 1; }
  80%  { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1);    opacity: 0; }
}

.mascot-emote {
  animation: emote-pop 0.8s ease forwards;
  transform-origin: bottom center;
}
```

The `transform-origin: bottom center` anchors the pop to the base of the glyph (closest to the mascot's head). Adjust timing and the final `opacity: 0` fade to taste.

## Adding a New Emote

1. Copy any existing SVG (e.g. `exclaim.svg`) and rename it.
2. Replace the inner shape paths/elements with your new glyph geometry.
3. Keep the three-layer order: **white keyline → black outline → accent fill**. Use stroke-widths of roughly 18 (white) and 8 (black) relative to the 100-unit viewBox.
4. Pick a fill from the three brand accents. Only add a new color if there is a strong reason — the restricted palette is intentional.
5. Add a row to this README table.
