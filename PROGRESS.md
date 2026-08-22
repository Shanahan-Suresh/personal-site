# personal-site — Refinement pass: Progress

Source plan: `C:\Users\User\.claude\plans\have-a-look-at-binary-treasure.md` (read for context; this file is the live state).

**Update protocol (for Claude):** tick items the moment they land. Checkpoint before stopping/compacting/usage running out. On resume: read this file first.

Legend: `[x]` done · `[~]` partial · `[ ]` not started · `[-]` deferred

Last updated: 2026-08-23

---

## M1 — Fix-ups

- [x] 1a Commit WIP (About em-pop), reset this file
- [x] 1b CSP allows Cloudflare Web Analytics beacon (`public/_headers`)
- [x] 1c Skip-to-content link (`BaseLayout.astro`, `components.css`)
- [x] 1d `/writing` pages get `noindex` (`BaseHead.astro`, `BaseLayout.astro`, writing pages)
- [x] 1e Footer: Source / Colophon / build hash (`Footer.astro`, `site-config.ts`)
- [x] 1f Tests for 1c–1e in `tests/home.spec.ts`

## M2 — Open-source + colophon

- [x] 3a Delete stale `docs/*`, add `LICENSE` (MIT code, content reserved), README polish
- [x] 3b CI workflow `.github/workflows/ci.yml`
- [x] 3c Colophon page `src/pages/colophon.astro` + `src/data/colophon.ts` + perf-budget test
- [x] Push, confirm Cloudflare deploy green and live (colophon 200, footer build 9f32ac6)
- [x] Prettier pass so CI format:check is green
- [x] 3d Repo public since 2026-08-23, description + homepage set

## M3 — Featured cards + placeholder guard (pushed LAST)

- [x] 2a `featured` on `Project` type; digest + RSVP featured in `projects.ts`; dev.to link on OpenAPI→MCP card
- [x] 2b `src/assets/work/_placeholder-digest.svg`, `_placeholder-rsvp.svg`
- [x] 2c Featured variant in `ProjectCard.astro` (wide card, framed `<Image>`)
- [x] 2d `scripts/guard-placeholders.mjs` wired into `npm run build`; Playwright placeholder test
- [x] 2e Swap procedure documented in CLAUDE.md + README
- [x] Pushed c56b5d8; CI fails on guard as designed, prod still serves build 17a20fc, zero placeholders live

## Decisions made

- Placeholder guard fails the build outright (no silent downgrade); M3 is last so M1/M2 go live first.
- SiteMedic not added (still in testing). `/writing` stays hidden; dev.to article linked from colophon + project card.
- Author email stays in git history unless user asks for a mailmap rewrite before 3d.

## Open questions / blockers

- While placeholders exist on `main`, CI is red and Cloudflare cannot deploy. By design. Swap images to unblock.
