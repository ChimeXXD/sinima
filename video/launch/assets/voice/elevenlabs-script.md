# Launch film voice-over for ElevenLabs (D-177)

Chime, 22 Nov 2026: the current read "sounds so AI … there's no human touch"; use ElevenLabs so the voice
can "laugh, breathe". Same 12 beats and start times as `lines.json`, so the new read drops into the cut.

## What makes it sound human

- She is a friend telling you about her Friday, not an announcer. Contractions, "like", "oh, and", a
  sentence that trails off.
- One phrase repeats and turns: "then another … then another" (the problem) becomes "every showing,
  every time" (the answer).
- Four sounds, no more: a breath to open, a sigh at the tab pile, a chuckle at popcorn, a laugh at
  Dunesday. Each one reacts to something on screen. More than that and it sounds performed.
- "Seenima" is spelt the way it is said, so the voice doesn't say "SIN-ima". The captions keep "Sinima".

## Paste this into ElevenLabs (one block)

```
[exhales] Friday. Six-forty. And Tolu goes… "film tonight?"

So you check one cinema's site. Then another. [sighs] Then another…

[relieved] Or — you just open Seenima. Every cinema. One place.

See what's starting near you… like, right now.

Every showing. Every time. Every area.

[playful] Oh, and it tells you if there's a scene after the credits.

Found one? Book it straight on the cinema's own site.

[chuckles] Popcorn's on you, though.

Lagos… and yes, Abuja too.

[excited, hushed] And December eighteenth? Dune AND Doomsday. Same day.

[laughs] Happy Dunesday!

[warm, slower] Seenima dot com dot N-G. It's free… no sign-up.
```

## Line by line (where each lands in the film)

| Line | Starts at | Beat on screen | Was |
|---|---|---|---|
| v01 | 0.4 s | 6:40 PM, Tolu's text | Friday. Six-forty. And your friend wants to see a film. |
| v02 | 3.5 s | too many cinema tabs | So you open one cinema's site... then another... then another... |
| v03 | 7.9 s | the tabs fly into the logo | Sinima. Every cinema in Lagos, in one place. |
| v04 | 11.2 s | Starting soon near you | See what's starting near you, right now. |
| v05 | 15.5 s | a film's times by area | Every showing. Every time. Every area. |
| v06 | 20.9 s | the Stay chip lands | It even tells you if there's a scene after the credits. |
| v07 | 24.9 s | Book on Filmhouse's site | Found one? Book it on the cinema's own site. |
| v07b | 31.7 s | after booking | Popcorn's on you. |
| v08 | 32.95 s | Lagos peels to Abuja | Lagos. Abooja. |
| v09 | 36.6 s | Dune and Doomsday lift out | And December eighteenth? Dune and Doomsday, same day. |
| v09b | 39.6 s | 18 DEC stamped | Happy Dunesday! |
| v10 | 41.6 s | end card | Sinima dot com dot N G. Free. No sign-up. |

## Settings

- **Model:** Eleven v4 (ElevenLabs recommends it; v3 takes the same tags).
- **Voice:** an American woman from the Voice Library whose sample already sounds relaxed and
  conversational. ElevenLabs warns that a stiff voice may read the tags aloud instead of acting them.
- **Stability:** start at the default (the middle). If it sounds flat, lower it a notch; if the laughs
  go over the top, raise it.
- Generate the whole block at once, three times, and keep the best take: one take carries the mood
  from line to line, where separate lines each start cold. Re-generating the same text is free twice
  within two hours on the website.

## Then

Send the take (WAV from History, or MP3). It gets cut at the pauses into the 12 lines, each placed on its
beat with `scripts/voice.mjs`, and any line that runs long is nudged.

**Before launch:** check that ElevenLabs' plan allows a public post (O-23).
