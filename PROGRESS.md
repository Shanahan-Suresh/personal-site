# Plan: Phase B / P0 — behavior-preserving elegance refactor

## Goal
Remove dead code/assets (mascot subsystem, writing commented block, unused CSS) and tighten the Accent type. No rendered change; regression suite (home.spec.ts) must stay green.

## Steps
- [ ] 1. Delete mascot subsystem (Mascot.astro, public/mascot/, mascot.spec.ts, index.astro comments, global.css tombstone)
- [ ] 2. Remove commented "Recent writing" block from index.astro and nav entry from navigation.ts
- [ ] 3. Purge unused CSS: .grid-3, .grid-4, .chip, .divider-strip, .fill-*, .tag-1, .tag-pop (all confirmed zero usage)
- [ ] 4. Add StickerAccent type to types.ts; type interests.ts accent field; verify Beyond.astro class composition unchanged
- [ ] 5. Run gates: astro check, npm run build, npx playwright test
- [ ] 6. Commit on refactor/elegance-pass

## Key files
- `src/pages/index.astro` — mascot comments lines 11-13, 60-61; writing block lines 14-57
- `src/styles/global.css` — line 1142 mascot tombstone; CSS utility rules
- `src/data/navigation.ts` — commented writing nav line 10
- `src/lib/types.ts` — add StickerAccent
- `src/data/interests.ts` — type accent field with StickerAccent
- `src/components/Beyond.astro` — class composition: `sticker ${accent} ${rot}` (must stay identical)

## Decisions made
- Beyond.astro uses full class strings from interests.ts (sticker-1, sticker-2 etc), NOT accent tokens from Accent type
- StickerAccent = Accent | "4" | "5" is additive (no breaking change)
- All CSS candidates (.grid-3, .grid-4, .chip, .divider-strip, .fill-*, .tag-1, .tag-pop) confirmed zero usage in src/

## Open questions / blockers
- None
