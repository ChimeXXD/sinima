# Data format: `showtimes.json` v1

Written 6 Nov 2026. `data/showtimes.json` is what the pages build from. `data/cinemas.json` is the cinema registry and `data/sources.json` the source registry. Types live in `src/lib/data/types.ts` and must match this file. The validator (`src/lib/data/validate.ts`) enforces every rule below.

## Rules

| Field | Rule | If broken |
| --- | --- | --- |
| `schemaVersion` | Must be `1`. | Refuse the file; keep the last good one |
| `generatedAt`, `fetchedAt`, `startsAt`, `lastOkAt` | UTC ISO 8601 with `Z`, seconds precision. Never a local time. | Refuse the file |
| `timeZone` | Always `Africa/Lagos`. Display only; storage stays UTC (D-06). | Refuse |
| `sample` | `true` when any showing comes from a fixture. The UI then shows "Sample data" on every page. | Validator sets it if missing |
| `sources[].status` | `cleared`, `pending`, `refused` or `do-not-use`. Only `cleared` sources run on a schedule (D-08). | A non-cleared source in a scheduled run fails the run |
| `showings[].sourceId` | Must match a source. | Drop the showing, log it |
| `showings[].fetchedAt` | Required on every showing. | Drop the showing, log it |
| `showings[].via` | Optional. When data reaches us through another listing (Lagocine), `via` names the original site and when that site was read. | n/a |
| `showings[].bookingUrl` | `https` only, on the cinema's own domain or its booking engine's. No tracking parameters added. `null` when there is none. | Set to `null`, log it |
| Duplicates | (`cinemaId`, `filmId`, `startsAt`) is unique. | Keep the most recently fetched |
| `films[].credits.after` / `.during` = `no` | Needs at least one source in `credits.sources` that says so. | Set to `unknown` (D-10) |
| `price` | Only when the source lists it. `amountNgn` is an integer. | Drop the price |
| Size | Within the budget set on Day 0 (D-21, supersedes D-12's 60 KB). Showings that ended more than 1 hour before `generatedAt` are removed. | CI fails |

Unknown keys are ignored, so a newer writer can add fields without breaking an older reader. Any change that breaks a reader bumps `schemaVersion`.

How the validator reads the table (D-45):
- "Ended more than 1 hour before" means the showing started more than 90 minutes before `generatedAt`: 30 minutes to "ended" (D-05) plus the hour.
- A showing with no `fetchedAt` is dropped; one whose `fetchedAt` is there but is not UTC refuses the file.
- A showing is also dropped when its film or cinema is not in the file, or when its `id` repeats an earlier showing's.
- A booking link's host must be the cinema's `website` or `bookingHost`, or a subdomain of one ("www." is ignored). Tracking parameters are `utm_*` and the usual click ids (`fbclid`, `gclid` and the like).
- `sample: false` is corrected to `true` when any showing comes from a `fixture` source.
- `films[].credits` may be left out or `null`; when present it needs `during`, `after`, `confidence` and a `sources` list.

## Full example

An illustrative file: real cinemas and film titles, **made-up times and price**. It is not data and is not a test fixture. It also lives at `docs/examples/showtimes-v1.example.json`, and a unit test checks that it validates.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-11-06T16:05:00Z",
  "timeZone": "Africa/Lagos",
  "sample": true,
  "sources": [
    {
      "id": "filmhouse",
      "name": "Filmhouse's site",
      "url": "https://filmhouseng.com/",
      "method": "public-page",
      "status": "pending",
      "via": null,
      "fetchedAt": "2026-11-06T14:05:00Z",
      "lastOkAt": "2026-11-06T14:05:00Z",
      "health": "ok"
    },
    {
      "id": "lagocine",
      "name": "Lagocine",
      "url": "https://lagocine.com/",
      "method": "permission-feed",
      "status": "pending",
      "via": null,
      "fetchedAt": "2026-11-05T14:06:00Z",
      "lastOkAt": "2026-11-05T14:06:00Z",
      "health": "ok"
    }
  ],
  "cinemas": [
    {
      "id": "filmhouse-lekki-imax",
      "name": "Filmhouse Lekki IMAX",
      "chain": "Filmhouse",
      "area": "lekki",
      "address": "The Rock Drive, off Bisola Durosinmi Etti Drive, Lekki Phase 1, Lagos",
      "geo": null,
      "website": "https://filmhouseng.com/",
      "sourceIds": ["filmhouse"]
    },
    {
      "id": "ebonylife-vi",
      "name": "EbonyLife Cinemas",
      "chain": "EbonyLife",
      "area": "victoria-island",
      "address": "1637 Adetokunbo Ademola Street, Victoria Island, Lagos",
      "geo": null,
      "website": "https://ebonylifecinemas.com/",
      "sourceIds": ["lagocine"]
    }
  ],
  "films": [
    {
      "id": "spider-man-brand-new-day",
      "title": "Spider-Man: Brand New Day",
      "runtimeMin": null,
      "rating": null,
      "origin": "hollywood",
      "tmdbId": null,
      "credits": {
        "during": "unknown",
        "after": "unknown",
        "confidence": "unknown",
        "sources": [],
        "count": null
      }
    },
    {
      "id": "one-gidi-night",
      "title": "One Gidi Night",
      "runtimeMin": null,
      "rating": null,
      "origin": "nollywood",
      "tmdbId": null,
      "credits": {
        "during": "unknown",
        "after": "unknown",
        "confidence": "unknown",
        "sources": [],
        "count": null
      }
    }
  ],
  "showings": [
    {
      "id": "filmhouse-lekki-imax_spider-man-brand-new-day_2026-11-06T18:30:00Z",
      "filmId": "spider-man-brand-new-day",
      "cinemaId": "filmhouse-lekki-imax",
      "screenId": null,
      "startsAt": "2026-11-06T18:30:00Z",
      "format": "IMAX",
      "language": null,
      "price": null,
      "bookingUrl": "https://www.filmhouseng.com/",
      "sourceId": "filmhouse",
      "fetchedAt": "2026-11-06T14:05:00Z"
    },
    {
      "id": "ebonylife-vi_one-gidi-night_2026-11-06T19:15:00Z",
      "filmId": "one-gidi-night",
      "cinemaId": "ebonylife-vi",
      "screenId": null,
      "startsAt": "2026-11-06T19:15:00Z",
      "format": "2D",
      "language": "English",
      "price": { "amountNgn": 6000, "label": "Standard" },
      "bookingUrl": "https://ebonylifecinemas.com/",
      "sourceId": "lagocine",
      "via": { "name": "EbonyLife's site", "url": "https://ebonylifecinemas.com/", "fetchedAt": "2026-11-05T14:06:00Z" },
      "fetchedAt": "2026-11-05T14:06:00Z"
    }
  ]
}
```

## Cinema registry: `data/cinemas.json` and the two cities (D-120)

`areas[]` holds every area of both cities, each `{ slug, name, city, neighbours }`. `city` is `lagos` or `abuja`; an area's `neighbours` are other areas of the same city (D-46). `cinemas[]` places each cinema in an area by slug, so a cinema's city is its area's: the showtimes file's `cinemas[]` carry `area` only, and the build looks the city up here (`lib/data/load.ts`: `areasIn`, `cityOfArea`, `loadCity`). A city's pages are built from `all.json` cut to that city's cinemas, their showings, and the films and sources those use (`lib/data/cities.ts`, `inCity`); an area with no city fails the build. `tests/unit/registry.test.ts` checks that every area has a city, neighbours stay in their city, and every cinema's area exists. A field not confirmed on the cinema's own page is `null` (an address seen only in a directory stays out, rule 8).

## Source registry: `data/sources.json`

Filled on Day 0 by the data-source audit. One entry per source.

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "id": "filmhouse",
      "name": "Filmhouse's site",
      "owner": "Filmhouse Cinemas (FilmOne)",
      "homepage": "https://filmhouseng.com/",
      "listingUrlPattern": "https://www.filmhouseng.com/movies/<film>/showtimes/<date>/<site>/select-tickets?showtime=<id>",
      "method": "public-page",
      "status": "pending",
      "robots": { "checkedAt": null, "allowsListing": null, "quote": null },
      "terms": { "url": null, "checkedAt": null, "allowsAutomated": null, "quote": null },
      "permission": { "askedAt": null, "repliedAt": null, "summary": null },
      "rateLimit": { "minSecondsBetweenRequests": 5, "maxRunsPerDay": 3 },
      "daysAhead": null,
      "cinemaIds": ["filmhouse-lekki-imax", "filmhouse-surulere", "filmhouse-circle-mall", "filmhouse-ikota", "filmhouse-palms-lekki", "filmhouse-oniru", "filmhouse-landmark"],
      "notes": "Booking URL pattern seen on Lagocine's cinema page, 6 Nov 2026."
    }
  ]
}
```

`status` becomes `cleared` only when **either** `permission.summary` records a yes, **or** `robots.allowsListing` is `true` **and** `terms.allowsAutomated` is not `false` with the clause quoted. Chime confirms each change to `cleared` (log it in DECISIONS).

## Freshness: rules and wording (D-04)

`age = now − fetchedAt`, computed in the browser. `lib/wording/freshness.ts` is the only place these sentences are written. `<Source>` is `sources[].name`; when `via` is set, the sentence names both: "From Lagocine, which read EbonyLife's site 2 hours ago" (age from `via.fetchedAt`).

| Band | Age | Wording | Booking |
| --- | --- | --- | --- |
| Fresh | < 1 min | "Read from Filmhouse's site just now" | Book |
| Fresh | 1–59 min | "Read from Filmhouse's site 25 min ago" | Book |
| Fresh | 1 h to under 6 h (D-25) | "Read from Filmhouse's site 2 hours ago" | Book |
| Today | ≥ 6 h, same Lagos day | "Read from Filmhouse's site today at 09:10" | Book |
| Stale | Lagos yesterday | "Read from Filmhouse's site yesterday at 15:06 · check with the cinema" | Book, plus the stale banner |
| Old | Earlier | "Last read from Filmhouse's site Tue 3 Nov · may have changed" | No Book button; "Check on Filmhouse's site" link instead |
| Sample | `method` is `fixture` | "Sample data saved from Filmhouse's site on 6 Nov" | "Sample only" (no booking) |

This table defines bookable (D-25): Stale rows can be booked, Old rows cannot. Sample rows keep their saved wall-clock times but sit on today's and tomorrow's dates (D-20); the sentence still names the day the page was saved.

Banners (one per page, the worst case wins):
- Stale: "Some times are from yesterday. Cinemas change programmes; check before you travel."
- Old: "Some times are more than a day old and may have changed."
- Source failing: "We couldn't read Silverbird's page today. Its times below are from yesterday."
- Sample: "Sample data. These times are for the demo, not for booking."
- Offline (service worker): "You're offline. Showing times saved 3 hours ago."

## Showing wording (D-05)

| State | When | Wording | Book |
| --- | --- | --- | --- |
| upcoming | > 10 min ahead | "19:30 · Starts in 1 h 20 min" | Yes |
| starting | 0–10 min ahead | "19:30 · Starts in 6 min" | Yes |
| started | 0–30 min after | "19:30 · Started 5 min ago" | **No** |
| ended | > 30 min after | Hidden | No |

## Credits wording (D-10)

| Data | Chip | Detail line |
| --- | --- | --- |
| `after: yes`, confidence `confirmed` (one or more named sources say so, D-19) | "Stay: scene after the credits · TMDB" | "TMDB lists an after-credits scene." (names every source) |
| `after: yes`, confidence `likely` (inferred, no source states it) | "Probably stay: scene after the credits" | Says what the guess rests on. |
| `during: yes` only | "Stay a little: scene during the credits" | Source line as above |
| both `yes` | "Stay: scenes during and after the credits" | Source line |
| `after: no` and `during: no` with a source | "Go: nothing after the credits" | "Per <source>, checked 5 Nov." |
| anything else | "Credits scene: not known yet" | "No source has told us yet." |

The chip never says "Go" without a source that says so.

### Manual credits and TMDB matches (D-19, D-25)

- `data/credits-manual.json`: Chime's own entries, keyed by film id: `{ "during": "yes|no", "after": "yes|no", "source": { "name", "url", "checkedAt" } }`. Every entry needs a link. A manual entry wins over a TMDB tag and is the only way "Go" appears.
- `data/tmdb-overrides.json`: hand-kept `filmId → tmdbId` (or `null` for "no match"). A title the matcher cannot place with confidence gets no `tmdbId` and reads "Credits scene: not known yet".

## Per-area files (D-18)

`refresh` also writes one file per area, `public/data/area/<slug>.json`, and `public/data/all.json`, in the same v1 shape but holding only that area's cinemas, their showings for today and tomorrow, and the films and sources those showings use. Pages load only their own file. The size budget (D-21) applies per file: at most 20 KB gzipped each (D-45). "Tomorrow" runs to 04:00 the morning after, so a 00:30 show stays with its evening.

## Live data (D-116)

`npm run refresh -- --live` reads every source in `data/sources.json` that is `cleared` and has a reader in `scripts/live.ts`, through `scripts/sources/polite.ts` (our bot name and contact link, robots.txt checked for each path, at most one request per 5 s per host, a refusal is final). Each source feeds only the cinemas in its `cinemaIds`. Rows carry the source's real booking links (the validator's host rule above), every source's `method` is `public-page`, `fetchedAt` is the time of the run, and `sample` is `false`. The files go to `data/live/` (`showtimes.json`, `all.json`, `area/<slug>.json`), which is committed by the scheduled job.

A listing built by script is read with `scripts/sources/browser.ts` (`politeBrowser`, D-119): a headless Chromium under the same rules and the same shared pieces as `polite.ts` (our bot name as the browser's user agent, robots.txt checked before the page is opened, 5 s between page loads to a host, 30 s to answer and 30 s to render, a non-2xx page is final, each redirect hop checked and one to another site refused). Images, fonts and media are not downloaded, and a script that moves the page elsewhere is stopped. One browser per run, started by the first reader that needs it and closed at the end.

**One source failing (D-119).** A source whose read throws keeps its showings from the previous `data/live/showtimes.json`: only the cinemas it still feeds, only from today on in Lagos, with their original `fetchedAt` (and `via`), so the freshness words say how old they are. Its source entry gets `health: "failing"` and keeps its `fetchedAt` and `lastOkAt`. The log says "`<id>`: could not be read (`<message>`); kept its last good showings from `<fetchedAt>`", or "no earlier showings to keep", and then its cinemas have no rows. The run fails, and nothing is written, only when every source fails.

**One film across sources (D-119).** Before film ids are made, `matchFilms` in `scripts/pipeline.ts` matches titles across all sources: titles that make the same id are one film, and a short title joins the longer one that is it plus a subtitle (after ":", " - ", " – " or " — "), never on a bare prefix ("Ikenga" stays apart from "Ikenga 2"), and only when exactly one longer film starts that way. The film takes the longer title's id, so `data/credits.json` keeps lining up, and that title is shown (in mixed case if any source writes it so). Matches it can't make, or a film whose id must stay put, go in `data/film-aliases.json`: `{ "aliases": { "<source title or id>": "<film id>" } }`. It holds one alias today, `"ramayana-rise-of-a-legend": "ramayana"`: Lagocine writes the film both ways (TMDB 656908), and the alias keeps it at `/film/ramayana`, shown as "Ramayana", whichever spellings a run sees (without it, the id would change on the day a second spelling appears, and shared links would stop working). A merged film's credits, poster and trailer are looked up under its own id first, then under each merged spelling's id (`credits.json`, `credits-manual.json`); `tmdb.ts` does the same for `tmdb-overrides.json` and its saved answers, using the spelling before a subtitle separator only when no other film showing starts with it.

Before a build, `npm run build` runs `refresh --build`: it copies `data/live/showtimes.json` to `data/showtimes.json` and splits it again into `public/data/` against the current `data/cinemas.json` (so an area added since the last live run still gets its file), or makes sample data when `data/live/` is missing. Tests and CI call `refresh --fixtures` themselves, so they always run on sample data.

## Sample data (D-20, D-45)

`npm run refresh -- --fixtures` builds these files from the saved pages listed in `tests/fixtures/index.json` (the entries marked `sample`). Lagos's come from Lagocine's pages saved on 11 Nov; Abuja's from Silverbird SEC's and Jabi Lake Mall's Veezi pages saved on 17 Nov (D-120), each batch moved from its own saved day. Rows from the day the pages were saved move onto today and rows from the day after onto tomorrow, both in Lagos, keeping their wall-clock times; later days are dropped. A cinema with no saved tomorrow gets its saved day again. Sample rows have no booking link, every source's `method` is `fixture`, and `sample` is `true`. The files are dated today, so they are made by the command and not committed.
