# personal-site — Refinement pass: Progress

Source plan: `C:\Users\User\.claude\plans\have-a-look-at-binary-treasure.md` (read for context; this file is the live state).

**Update protocol (for Claude):** tick items the moment they land. Checkpoint before stopping/compacting/usage running out. On resume: read this file first.

Legend: `[x]` done · `[~]` partial · `[ ]` not started · `[-]` deferred

Last updated: 2026-08-22

---

## M1 — Fix-ups
- [x] 1a Commit WIP (About em-pop), reset this file
- [ ] 1b CSP allows Cloudflare Web Analytics beacon (`public/_headers`)
- [ ] 1c Skip-to-content link (`BaseLayout.astro`, `components.css`)
- [ ] 1d `/writing` pages get `noindex` (`BaseHead.astro`, `BaseLayout.astro`, writing pages)
- [ ] 1e Footer: Source / Colophon / build hash (`Footer.astro`, `site-config.ts`)
- [ ] 1f Tests for 1c–1e in `tests/home.spec.ts`

## M2 — Open-source + colophon
- [ ] 3a Delete stale `docs/*`, add `LICENSE` (MIT code, content reserved), README polish
- [ ] 3b CI workflow `.github/workflows/ci.yml`
- [ ] 3c Colophon page `src/pages/colophon.astro` + `src/data/colophon.ts` + perf-budget test
- [ ] Push, confirm Cloudflare deploy green and live
- [ ] 3d Flip repo public (confirm with user first)

## M3 — Featured cards + placeholder guard (pushed LAST)
- [ ] 2a `featured` on `Project` type; digest + RSVP featured in `projects.ts`; dev.to link on OpenAPI→MCP card
- [ ] 2b `src/assets/work/_placeholder-digest.svg`, `_placeholder-rsvp.svg`
- [ ] 2c Featured variant in `ProjectCard.astro` (wide card, framed `<Image>`)
- [ ] 2d `scripts/guard-placeholders.mjs` wired into `npm run build`; Playwright placeholder test
- [ ] 2e Swap procedure documented in CLAUDE.md + README
- [ ] Push; confirm Cloudflare build FAILS on guard, prod still serves previous deploy

## Decisions made
- Placeholder guard fails the build outright (no silent downgrade); M3 is last so M1/M2 go live first.
- SiteMedic not added (still in testing). `/writing` stays hidden; dev.to article linked from colophon + project card.
- Author email stays in git history unless user asks for a mailmap rewrite before 3d.

## Open questions / blockers
- While placeholders exist on `main`, CI is red and Cloudflare cannot deploy. By design. Swap images to unblock.
