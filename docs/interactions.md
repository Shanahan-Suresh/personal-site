# Interactions

Every motion, hover find and touch behaviour on the homepage. Read this before changing one of
them. The rules that bind all of them (reduced motion, `(hover: hover)`, the banned list) are in
`CLAUDE.md`. Most of the code is in `src/scripts/home/` (one module per behaviour, started in order
by `init` in `src/scripts/home-interactions.ts`), `src/styles/motion.css` and the components'
scoped styles.

## Page motion

All of it waits for `prefers-reduced-motion: no-preference`. The boot script in `BaseLayout.astro`
sets `.js` before paint, so a page without script shows everything in place.

- Headline lines rise (`.reveal` with `.ln` lines).
- The hero frames fade up (`.rise`).
- The project rows, number cells, principles and Beyond photos fade up 32px one after another as
  they scroll in, 70ms apart within each batch (`data-stagger`, `initStagger`).
- The pointer preview follows the pointer over the project rows. It takes each picture's own
  shape, so nothing is cropped: 30% of the window wide (380 to 460px), narrower when the picture
  would pass 42% of the window height, easing between sizes. Its caption tab wraps to a second
  line when it needs one.
- The story dialog opens and slides between stories.
- Lazy pictures fade in (`.fading`).
- On a phone, the story sheet rises, the nav bar slides away and the menu sheet drops.

## Theme switch

A view transition.

- **With a mouse**, a pixel dissolve from the button. The dark page is cut in through a growing
  circle whose edge is an ordered dither of squares. On the way to light, the dark page shrinks
  back into it. The squares only clip the pages and never paint over them. Pieces: `.theme-circle`,
  `.theme-shrink`, the `#theme-clip` style and the `#theme-ring` sparkle canvas.
- A press during a switch finishes it and starts the next.
- **On touch screens**, a 0.28s cross-fade (`.theme-fade`).

## Hero label flip

`data-flip`, `initFlip`. Owner-approved exception to the tilt ban.

- The label is a double-sided sign on a rod through its middle. A fast, steep swipe across it, a
  click or a tap spins it. Friction slows it and a catch settles it on the nearest side.
- Each half turn shows the other side, printed like a real sign's, so it lands upside down. That
  is deliberate, a find, not a bug.
- After a moment upside down it turns slowly the right way up. A push during that slow turn takes
  over.
- Its hard shadow shows only while it turns or rests upside down. When it lands the right way
  up, the shadow slides back under the plate in 0.5s (`.turned`, `--shadow-off`).
- The back face takes its text from CSS (`data-text`), so the headline holds the words once.
- It moves only when pushed and acts like a real sign, which is why it is not tilt hover.

## Hover finds

Mouse only, under `(hover: hover)`.

- A white name plate over the portrait.
- The hero label's butter plate fills from its left edge to the pointer like a loading bar
  (`data-brush`).
- Letters hop once (`data-hop`). The letters join back only after the pointer leaves, because
  removing the span under the pointer makes Chromium fire `pointerenter` again.
- Printer's crop marks on the slab under the pointer (`.slab::after`, `--mark`).
- Underlines draw in under the footer and contact links.
- Each Contact ask ("Write to me about") is a link that starts an email with the ask as its
  subject. A butter bar wipes in behind it like a marker pen, and the text turns ink.
- The round theme button fades in with butter square by square, in an 8 x 8 ordered dither, a
  small preview of the page dissolve it starts. Leaving plays it backwards. Its icon always shows
  the theme in use: a click changes it once, and the hover never previews the other theme.
- An ink icon springs up from behind the middle of each Learning next chip: a cloud for AWS
  that drifts from side to side, a ship's wheel for Kubernetes that spins in place. Both move only
  while the pointer stays on the chip; leaving pauses them where they are, so a quick off and on
  never snaps them back.
- The About code chip (green terminal type on a rounded ink chip, after a `$` prompt) types a line
  and types back (`data-type`). Its cursor blinks while the line rests, like a terminal's. This is
  the second owner-approved exception.
- Selected text is butter.

## Keyboard and console

`?` opens a keyboard card: T theme; W, A, C jump. The card turns the letter keys off. The console
greets developers.

## Hover grammar

Hover lifts into the hard shadow, press sinks and drops it. A butter or night fill means "this is
one link". Every hover state also shows on `:focus-visible`. A tile that is not a link takes no
fill. An arrow in a link (`.arrow`, `.arrow.out` for ↗, `.arrow.back` for ←) nudges the way it
points.

The name in the bar (`Nav.astro`) is one tall butter S, Anton's outline as on main's monogram,
beside HANAHAN over URESH. The S carries a hard cobalt shadow, the one shadow on a letter rather
than a frame: on the night bar an ink shadow does not show. Two copies of the S sit on top of
each other. Hover and focus split them into two small S letters, one in front of each line, and
slide the lines left, so the bar reads SHANAHAN over SURESH; leaving joins them again. The name
takes no underline. The link is 44px tall at every width.

The nav links (Work, About, Contact) take a butter underline that sweeps through: it wipes in from
the left on hover or focus and leaves to the right. The link for the section in view keeps it.

## Stories

Any `a[data-story]` opens its dialog: the project rows, the numbers strip and the hero's RSVP
frame.

- Opening pushes `#story-<id>`, so Back closes it.
- Previous, Next, the arrow keys and a sideways swipe move between stories and replace that entry.
- Focus returns to the link that opened the story.

## On a phone

Touch; 560px and below for stories, 768px and below for the nav.

- A story is a sheet that rises from the bottom edge, with a grab bar on its head (pull it down to
  close) and Previous and Next pinned in a bar under the thumb. Next names the next story in full,
  on two lines when it needs them; wider screens cut a long title to one line.
- The nav bar slides away on a scroll down and returns on any scroll up (`.nav-away`).
- The menu sheet drops over a dimmed, still page. A tap on the dim closes it.
- Hover lifts on `.btn` and the story buttons wait for `(hover: hover)`, because a touch
  screen keeps `:hover` on the last thing tapped.
- Small links (footer, LinkedIn, GitHub, the email, the Contact asks) grow a 44px hit area under `(pointer: coarse)`
  without moving the layout.
- Tests that scroll use `behavior: "instant"`. The page scrolls smoothly, so a second jump
  otherwise starts before the first one lands.
