# Plan: personal-site interactivity pass ("Masterclass")

## Goal
Add a JS signature layer (stickers lean→peel, magnetic CTAs, tilt cards, custom cursor,
scroll-velocity marquee) plus CSS hover polish across tags, prose links, principles
ghost nums, marquee items, and nav monogram to the Astro 5 + Tailwind 4 neobrutalist site.

## Steps
- [x] A — initStickers (merged lean→peel) + CSS state/fallback in components.css + motion.css line-200 change
- [x] C — CSS breadth polish (C1 tags lift, C2 prose link, C3 principles ghost-num, C4 marquee+nav, C5 cursor styles)
- [x] B1 + B4 — initMagnetic (Hero + Contact data-magnetic) + initScrollVelocity (--mq-skew on .marquee)
- [x] B2 + B3 — initTilt (data-tilt on ProjectCard/BentoTile) + initCustomCursor
- [x] Build — npm run build passes 0 errors 0 warnings

## Key files
- src/scripts/home-interactions.ts — all new JS modules go here; wire into init() at line 254
- src/styles/components.css — sticker states, tag lift, [data-tilt] guard, marquee-item, cursor styles
- src/styles/motion.css — line 200: remove cluster hover pause, keep is-paused
- src/styles/prose.css — prose link hover (line 30 area)
- src/components/Hero.astro — add data-magnetic to "See what I build" btn
- src/components/Contact.astro — add data-magnetic to "Email me" btn
- src/components/ProjectCard.astro — add data-tilt to Card
- src/components/BentoTile.astro — add data-tilt to Card
- src/components/Nav.astro — monogram hover in scoped styles
- src/components/Principles.astro — ghost-num inside .card via BentoTile

## Decisions made
- Principles ghost-num: BentoTile renders .card via Card.astro; use .card:hover .ghost-num in components.css
- Nav monogram: Nav.astro already has (hover:hover) block; add rotate + color shift to nav-wordmark:hover
- Beyond stickers: .beyond-stickers row covered by initStickers()
- Marquee skew: set skewX(var(--mq-skew, 0deg)) via transform on .marquee-track CSS var alongside keyframe

## Open questions / blockers
- (none)

## Backlog — work-section imagery (deferred 2026-06-27)
Decision: whether to introduce visuals into the (currently text-only) work section.
The section's strength is its uniform `grid-2` of text cards, so a lone image on one
card reads as unfinished. Treat as "imagery as a pattern or not", not "one image".

- [ ] Preferred direction: **hybrid featured-card** — promote 1–2 projects to a wider
      card with a framed visual; rest stay compact text cards. Unified neobrutalist
      framing (hard border + offset shadow, fixed aspect ratio, `object-fit: cover`).
- [ ] **Lead visual: AI-curated digest** — the generated "Tech Scout Digest" email.
      Best artifact (shows real output, zero confidentiality risk, paper palette matches).
      Must crop tight to the email column and remove Gmail chrome before use.
- [ ] **RSVP "Seamless Enrolment" landing** — strongest-looking UI, but shows Sunway
      branding/event names/live counts. Only after anonymizing (blur logo, generic event
      names, scrub numbers) or getting sign-off. Lower risk than the dashboard.
- [ ] Skip OHSE (not impressive + sensitive). Censorit only if sample art is safe/censored
      in-frame (NSFW risk). Pixiv queue optional/low-stakes.
- [ ] On green-light: build the featured-card layout + image framing to match the system.
