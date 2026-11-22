# Launch film voice-over for ElevenLabs (D-177, D-178)

Chime, 22 Nov 2026: the current read "sounds so AI … there's no human touch"; use ElevenLabs so the voice
can "laugh, breathe". Same 12 beats and start times as `lines.json`, so the new read drops into the cut.

Take 1 (Jessica, Eleven v4, stability 50, similarity 75) was "kind of better than the last one", but
"too many emotions or tags … it's like we're forcing it": the opening exhale was off, and it said Tolu
where Chime had said "your friend" (D-178). So take 2 keeps two sounds and lets the words do the rest.

## What makes it sound human

- She is a friend telling you about her Friday, not an announcer. Contractions, "like", "oh, and", a
  sentence that trails off. The words and punctuation carry the feeling; tags don't.
- One phrase repeats and turns: "then another … then another" (the problem) becomes "every showing,
  every time" (the answer).
- Two sounds only: a sigh at the pile of tabs and a laugh at "Happy Dunesday".
- "Seenima" is spelt the way it is said, so the voice doesn't say "SIN-ima". The captions keep "Sinima".

## Paste this into ElevenLabs (one block)

```
Friday. Six-forty. And your friend wants to see a film.

So you check one cinema's site. Then another. [sighs] Then another…

Or — you just open Seenima. Every cinema. One place.

See what's starting near you… like, right now.

Every showing. Every time. Every area.

Oh, and it tells you if there's a scene after the credits.

Found one? Book it straight on the cinema's own site.

Popcorn's on you, though.

Lagos… and yes, Abuja too.

And December eighteenth? Dune AND Doomsday. Same day.

[laughs] Happy Dunesday!

Seenima dot com dot N-G. It's free… no sign-up.
```

## Line by line (where each lands in the film)

| Line | Starts at | Beat on screen | Take 1 | Take 2 |
|---|---|---|---|---|
| v01 | 0.4 s | 6:40 PM, the friend's text | [exhales] … And Tolu goes… "film tonight?" | And your friend wants to see a film. |
| v02 | 3.5 s | too many cinema tabs | [sighs] kept | [sighs] kept |
| v03 | 7.9 s | the tabs fly into the logo | [relieved] Or — | Or — (no tag) |
| v04 | 11.2 s | Starting soon near you | same | same |
| v05 | 15.5 s | a film's times by area | same | same |
| v06 | 20.9 s | the Stay chip lands | [playful] Oh, and | Oh, and (no tag) |
| v07 | 24.9 s | Book on Filmhouse's site | same | same |
| v07b | 31.7 s | after booking | [chuckles] Popcorn's on you, though. | no tag |
| v08 | 32.95 s | Lagos peels to Abuja | same | same |
| v09 | 36.6 s | Dune and Doomsday lift out | [excited, hushed] | no tag; "AND" still stressed |
| v09b | 39.6 s | 18 DEC stamped | [laughs] kept | [laughs] kept |
| v10 | 41.6 s | end card | [warm, slower] | no tag |

## Settings

- **Model and voice:** keep take 1's: Eleven v4, Jessica (Playful, Bright, Warm), stability 50,
  similarity 75. Only the text changed, so any difference is the script.
- If she still sounds pushed, raise stability a notch (60): steadier, fewer flourishes.
- Generate the whole block at once, three times, and keep the best take: one take carries the mood
  from line to line, where separate lines each start cold.

## Then

Send the take (WAV from History, or MP3). It gets cut at the pauses into the 12 lines, each placed on its
beat with `scripts/voice.mjs`, and any line that runs long is nudged.

**Before launch:** check that ElevenLabs' plan allows a public post (O-23).
