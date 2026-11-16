# DESIGN.md — Sinima taste rules

Rules learned from Chime's corrections. Each one is something Chime asked for; read them before
building or changing UI. Values come from `src/styles/tokens.css`. Decisions behind them are in
`docs/DECISIONS.md`. A rule marked *inferred* has a reason Chime approved but did not word.

## Color

- **Every grey hover fill uses the hover tokens: `--hover-fill` (surface + 2 % of the text colour),
  `--hover-fill-raised` (raised + 2 %) and `--hover-fill-page` (page + 1 %). No component mixes its
  own grey. Start faint: if in doubt, lighter.**
  Why: Chime judged the hovers too dark twice and landed at 2 %, a third of the first 6 %.
  Checked by `tests/unit/hover-fill.test.ts`.
  <!-- 2026-11-16: "The hover state is too dark… make it 50% lighter"; then "It's still dark. I still want it a bit lighter." (D-110, D-111) -->

- **Toasts and status messages are coloured by what they say. Info and saved: a light action blue
  (`--toast-info`, blue-600, white text at least 4.5:1). An error: a deep red mixed from Figma's
  red/500 (`--toast-error`), never pure red. Never navy. Figma's own toast colours replace these
  when Chime sends them.**
  Why: navy read as too heavy for a confirmation; the colour should say what kind of message it is.
  <!-- 2026-11-16: "The color is too dark. We can make the blue lighter and make it change the color depending on context. If it's an error, it should be red. I'm not talking about pure red." (D-109 d) -->

## Interaction

- **Menus, pickers and popovers that open from a trigger (Area, Day, Format, the city) open below it
  on a computer, 8 px under it. The trigger stays visible and clickable, with no scrim over it; its
  chevron turns up while open and back down when closed.** On a phone they stay sheets (the chevron
  still turns). An exception to D-83: Figma draws the Area popover over its picker.
  Why (*inferred*): you still see the thing you are changing while you change it.
  Checked by `tests/e2e/cinemas-screen.spec.ts` and `tests/e2e/round2.spec.ts`.
  <!-- 2026-11-16: "let's not make it block. Can we remove this down a bit? So at least when you click here, the area should still show and let the down change to up" (D-109 c) -->

- **When rebuilding a component from a reference Chime gave (Design Bookmark and the like), copy its
  visual layering and cut-outs (what overlaps what, what is partly hidden), not only its motion.
  Compare a still frame of ours with the reference, side by side, before showing it.**
  Why (*inferred*): those details are what make it read as the reference.
  <!-- 2026-11-16: "if you look at the reference, the light bulb over here is cut out, but on our reference, the light bulb is not cut out" (D-109 e) -->

## Motion

- **Moving between pages or tabs slides the new page 40 px in from the side it came from, over
  `--dur-page` (300 ms), `--ease-out`. Never smaller than that.** Not on a key press; none with
  reduced motion.
  Why: 12 px over 220 ms "looks kind of instant": the move has to be seen.
  Checked by `tests/e2e/motion-m5-m9.spec.ts`.
  <!-- 2026-11-16: "when you click Cinema, the page animation still looks kind of instant to me. So let's animate it a little bit." (D-109 b) -->

- **In any menu or list of options, the hover or active highlight is one shape that springs from
  row to row (leading edge 620/36, trailing edge 200/20, as `ui/SpringMenu.tsx`), never a fill that
  snaps on and off per row.**
  Why (*inferred*): a highlight that snaps feels dead next to the springy references Chime chose.
  <!-- 2026-11-16: "If you click here, the hover animation is instant as well. So I want to use this as reference." (D-109 c) -->

- **Every change of a selected or pressed state (fill, border, colour, shadow) fades over
  `--dur-fast` on `ease`. Every clickable surface answers a hover, only inside
  `@media (hover: hover) and (pointer: fine)`. No control changes state in one frame.**
  Why: Chime found states that snapped and a flat + button, and asked for both everywhere.
  <!-- 2026-11-16 (review round 1): state changes and hovers animated on every button and chip; "the + button is flat" (D-106 c, d) -->
