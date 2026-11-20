# Sinima launch video: first draft spec

Script A, "The evening question", 40 s, 1920 × 1080, 30 fps (D-164). Playful, not cartoon (D-166). Built from Chime's storyboard review and Claude's 30 reference picks (D-167, `docs/design/reference-board/round10-picks.html`).

## One continuous shot

Chime, 20 Nov: "each frame seamlessly transforms to the next … don't use cross-dissolve". So the film is one scene around one iPhone that never leaves the frame except where something carries the eye out and back:

| Time | Beat | What carries it on |
|---|---|---|
| 0–3 | 01 6:40 PM. Lekki. | The phone spins in (#9); a WhatsApp notification is flung onto the lock screen and settles (#4); 6:40 → 6:41, only the changing digit redraws (#14) |
| 3–7 | 02 Which sinima? What time? Still on? | The lock screen slides up into Safari's tab view; a tab per cinema pops in, too many (#16); the caption rolls like a slot reel (#41) |
| 7–10 | 03 Every sinima's times, in one place. | The tabs squash into a pile that flies out of the phone and pops into the ticket mark (#94); the mark flies a loop, lands with a squash, the letters of Sinima hop up (#85), the eyes blink (#86); the mark flies back into the app's header |
| 10–15 | 04 What's starting soon near you | Starting soon in Lekki, light. A touch dot (#57) taps Lekki, pulls to refresh (#62), scrolls; then pulls the lamp cord and the app turns dark through an iris from the lamp while the ground floods navy |
| 15–20 | 05 Every showing, by time and area | A tap on The Hunger Games pushes its page in; it scrolls to Times in Lagos; Sat is tapped (#49) and the times swap, then Today again |
| 20–24 | 06 Stay after the credits? It says. | A whip inside the screen to Street Fighter; its chip lifts out at 1.8× and lands like a sticker (#54), then keeps a small wiggle (#66) |
| 24–28 | 07 Book on the sinima's own site. | Whip back to The Hunger Games at Filmhouse Circle Mall; 7:20 PM is tapped, the sheet rises, Book is pressed down (#61) and the screen whips to Filmhouse's own booking page (#12) |
| 28–32 | 08 Lagos and Abuja. | Films in Lagos; the city pill is tapped and the page peels to Abuja (#75), then back |
| 32–37 | 09 Dunesday. Fri 18 Dec. | Films scrolls to Coming soon; Dune and Doomsday lift out side by side (#65); "18 DEC" is stamped on with a jolt (#67, #77) |
| 37–40 | 10 sinima.com.ng · Free. No sign-up. | Everything drops out, the ground floods back to light, the mark lands, blinks, no flying (#86); "Free. No sign-up." writes itself on (#112) |

## Numbers

- Ground: `#eef3ff` (blue/50) light, `#0b1b3f` (ticket navy) dark. Ink: `#0b1b3f` on light, `#ffffff` on dark. Accent `#5b8def`.
- Type: Urbanist (the app's), captions 300 at 76 px, the hero word 600; handwriting in Story Script.
- Phone: screen 390 × 844 at 1:1 (the app's own CSS pixels; captures at 3×), body 418 × 872, radius 64; resting centre (1290, 540).
- Springs: playful, damping about 0.5 (`back.out(2)`, `elastic.out(1, 0.55)`) on positions and sizes only; opacity never bounces.
- Moves 0.3–0.6 s; exits 40–50 % shorter than entrances; words 80 ms apart.
- No crossfades between beats; transitions are the push, the iris from the lamp, the colour flood, whips and objects carried across.

## Banned

Crossfades between beats, a title over a dimmed screenshot, click rings, floating or breathing loops on captions, product UI tilted in 3D while it is being used.

## Not real yet (placeholders in the draft)

- Filmhouse's booking page: their site refused the automated visit (403) and we never work around a block, so the draft shows a labelled placeholder. Needs Chime's screen recording of booking on Filmhouse's site.
- The WhatsApp notification is drawn in iOS style with a plain green icon, not WhatsApp's logo file.
- No music or sound yet; voice-over is O-23.
