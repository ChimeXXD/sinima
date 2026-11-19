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

`featured` (optional) lists films a chain's page features without times; see §Featured films without times (D-131).
`coming` (optional) lists films a sinima lists as coming, with its first date; see §Coming films (D-151).

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

`areas[]` holds every area of both cities, each `{ slug, name, city, neighbours }`. `city` is `lagos` or `abuja`; an area's `neighbours` are other areas of the same city (D-46). `cinemas[]` places each cinema in an area by slug, so a cinema's city is its area's: the showtimes file's `cinemas[]` carry `area` only, and the build looks the city up here (`lib/data/load.ts`: `areasIn`, `cityOfArea`, `loadCity`). A city's pages are built from its own file, `public/data/<city>.json`: `all.json` cut to that city's cinemas, their showings, and the films and sources those use (`lib/data/cities.ts`, `inCity`; D-126); an area with no city fails the build. `tests/unit/registry.test.ts` checks that every area has a city, neighbours stay in their city, and every cinema's area exists. A field not confirmed on the cinema's own page is `null` (an address seen only in a directory stays out, rule 8).

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

`daysAhead` (optional): how many days a source is asked for, today first. `null` means the default, five (`DAYS_SHOWN` in `scripts/pipeline.ts`, D-142, D-146). A reader reads only the days its site has published: Lagocine stops at the first later day with no page yet (404) and keeps the days before it; a missing page for today still fails the source. The page files keep today and tomorrow; the days after are cut into their own files (D-147).

`cinemaPages` (D-122, optional): each cinema's own listing page on that source, by cinema id, for the readers in `scripts/live.ts`. Only cinemas in the source's `cinemaIds` may have one (`tests/unit/registry.test.ts`), and every cinema a reader-run source feeds must (`tests/unit/scripts/live.test.ts`). A Veezi page's address carries the cinema's own `siteToken` (`https://ticketing.eu.veezi.com/sessions/?siteToken=<token>`); the reader reads the token from there, so no token is written in code. Lagocine has none: it reads its day pages.

`bookingSites` (D-124, optional): the name the source's booking links give each cinema, by cinema id, where a reader needs it to tell which cinema a link is for. Genesis's film pages list a film at every location, each time linking to `/<site>/booknow/<id>`, and Lekki's page is `/freedom-way-lekki/` while its links say `lekki-purple`; so the map is data, not learned from the day's rows (a location with nothing on today would lose its tomorrow). Only cinemas in `cinemaIds` may have one, each name once (`tests/unit/registry.test.ts`). A location page whose links name another site fails the read.

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

`refresh` also writes one file per area, `public/data/area/<slug>.json`, one per city, `public/data/lagos.json` and `abuja.json` (D-126), and `public/data/all.json`, in the same v1 shape but holding only that area's (or city's) cinemas, their showings for today and tomorrow, and the films and sources those showings use. Pages load only their own file. The size budget (D-21) applies per file a page loads, each city's and each area's: at most 20 KB gzipped each (D-45, D-126, D-156). The city and area files leave out a showing's `id` when it is the usual `<cinemaId>_<filmId>_<startsAt>`, and `load.ts` puts it back (`withShowingIds` in `src/lib/data/showingId.ts`). `showtimes.json`, `all.json` and the later days' files keep every id: the browser fetches a later day's file, and a tab still running older code must be able to read it (`fetchDay` puts back any id missing all the same) (D-156). `all.json` holds both cities and is read only at build time (About's counts, the search index), so it is not held to the budget; the run's log says so. "Tomorrow" runs to 04:00 the morning after, so a 00:30 show stays with its evening.

## Live data (D-116)

`npm run refresh -- --live` reads every source in `data/sources.json` that is `cleared` and has a reader in `scripts/live.ts`, through `scripts/sources/polite.ts` (our bot name and contact link, robots.txt checked for each path, at most one request per 5 s per host, a refusal is final). Each source feeds only the cinemas in its `cinemaIds`. Rows carry the source's real booking links (the validator's host rule above), every source's `method` is `public-page`, `fetchedAt` is the time of the run, and `sample` is `false`. The files go to `data/live/` (`showtimes.json`, `all.json`, `lagos.json`, `abuja.json`, `area/<slug>.json`), which is committed by the scheduled job.

A listing built by script is read with `scripts/sources/browser.ts` (`politeBrowser`, D-119): a headless Chromium under the same rules and the same shared pieces as `polite.ts` (our bot name as the browser's user agent, robots.txt checked before the page is opened, 5 s between page loads to a host, 30 s to answer and 30 s to render, a non-2xx page is final, each redirect hop checked and one to another site refused). Images, fonts and media are not downloaded, and a script that moves the page elsewhere is stopped. One browser per run, started by the first reader that needs it and closed at the end.

**One source failing (D-119).** A source whose read throws keeps its showings from the previous `data/live/showtimes.json`: only the cinemas it still feeds, only from today on in Lagos, with their original `fetchedAt` (and `via`), so the freshness words say how old they are. Its source entry gets `health: "failing"` and keeps its `fetchedAt` and `lastOkAt`. The log says "`<id>`: could not be read (`<message>`); kept its last good showings from `<fetchedAt>`", or "no earlier showings to keep", and then its cinemas have no rows. The run fails, and nothing is written, only when every source fails.

**One film across sources (D-119).** Before film ids are made, `matchFilms` in `scripts/pipeline.ts` matches titles across all sources: titles that make the same id are one film, and a short title joins the longer one that is it plus a subtitle (after ":", " - ", " – " or " — "), never on a bare prefix ("Ikenga" stays apart from "Ikenga 2"), and only when exactly one longer film starts that way. The film takes the longer title's id, so `data/credits.json` keeps lining up, and that title is shown (in mixed case if any source writes it so). Matches it can't make, or a film whose id must stay put, go in `data/film-aliases.json`: `{ "aliases": { "<source title or id>": "<film id>" } }`. It holds one alias today, `"ramayana-rise-of-a-legend": "ramayana"`: Lagocine writes the film both ways (TMDB 656908), and the alias keeps it at `/film/ramayana`, shown as "Ramayana", whichever spellings a run sees (without it, the id would change on the day a second spelling appears, and shared links would stop working). A merged film's credits, poster and trailer are looked up under its own id first, then under each merged spelling's id (`credits.json`, `credits-manual.json`); `tmdb.ts` does the same for `tmdb-overrides.json` and its saved answers, using the spelling before a subtitle separator only when no other film showing starts with it.

**A film's proper title (D-152c, D-159).** A title a sinima writes in capitals (Filmhouse's "AVENGERS: DOOMSDAY") is shown in its proper spelling: Chime's hand-kept one in `data/film-titles.json` (`{ "titles": { "<film id>": "<title>" } }`) first, for a film TMDB can't match yet, then TMDB's once matched (`titleLookup` in `scripts/titles.ts`). A title in mixed case is the sinima's own and stays. The film's id and page address never change. Today it holds `"the-four": "The Four"` (Funke Akindele's film, opens 11 Dec 2026).

**Each cinema's own reader (D-76, D-122).** One reader per platform, each in `scripts/sources/<source>.ts`, tested on saved pages:

| Source | Pages one run reads | Days | Booking links |
| --- | --- | --- | --- |
| `silverbird` (Veezi) | one sessions page per cinema (4) | today and tomorrow | Veezi `/purchase/` links, which must carry the cinema's own `siteToken` or the read fails (Veezi is shared, so the host proves nothing); `/purchase/` pages are linked to, never fetched |
| `genesis` | each location page (4: today there), then one film page per film on at any of them (that film at every Genesis location for three days), at most 30 (`MAX_FILM_PAGES`) | today and tomorrow | `genesiscinemas.com/<site>/booknow/<id>` |
| `grand` | the home page (weekday tabs, no dates) | today's and tomorrow's tabs | none (tickets at the cinema) |
| `bluepictures` | the home page ("Movies Now Showing", times with no date) | today only: tomorrow's are not on the page (rule 8) | none (online sale unconfirmed) |
| `reachcinema`, `viva`, `nova` (Reach Cinema, rendered, D-125) | two per cinema: Ozone, Viva and Nova by each day's own address (`cinemaPages` + `&date=Wed+Nov+18+2026`), Sky by clicking each day's tab; Reach 4, Viva 2, Nova 4 | today and tomorrow | each film's Book Now page on the cinema's site (`/movies/<uuid>`) |
| `ebonylife` (rendered) | `/movies` twice, each day's date clicked | today and tomorrow | each time's own booking page (`showtimeDate` must be the day read) |
| `thc` (rendered) | the home page twice, each day's tab clicked | today and tomorrow | none ("Online booking not available") |
| `magnificent` (rendered) | `review.html` twice, each day's tab clicked | today and tomorrow | none (its Book buttons are not links) |

`pageNames` (D-125, optional): the name a source's page shows for each cinema it feeds ("Nova Abuja"). A Reach Cinema page must show that name, so an address that falls back to another cinema is refused. Only cinemas in `cinemaIds` may have one, each name once (`tests/unit/registry.test.ts`).

A rendered page's days: a page with an address per day is opened at that address and must highlight that day; a page whose days are tabs is opened once per day and that day's tab clicked (`politeBrowser`'s `click`), and the page must show that tab as the current one (or, for EbonyLife, every booking link must carry that date). A day with no tab is no showings; a cinema with no times on any day read fails its source (its last good showings are kept), because these pages say nothing when empty.

A page whose times can't be found throws ("Has the page layout changed?"), so the source keeps its last good showings (D-119) instead of emptying silently. A Veezi page that says "No shows currently scheduled" is read as no showings. A Genesis film page that shows no times, answers 404 or 410, or does not answer in time is skipped with a line in the log (that film keeps today's times from its location page); a refusal (401, 403, 429) stops the whole Genesis read (D-77, D-124); if no film page shows any times, the read fails. Which Genesis location a link is for comes from `bookingSites`. Dates without a year take the year nearest the day of the read, and a weekday the page gives must agree, or else the year after when the nearest date is behind the day read (a booking date more than six months ahead, D-124); a time before 04:00 is a late show of the evening it is listed under (SPEC §3). All times reach UTC through `lagosLocalToUtc` (`scripts/sources/dates.ts`). A cinema leaves Lagocine's `cinemaIds` the day its own reader has worked live; no cinema is fed by both (a test). Filmworld's Veezi page is read by the same code but not run yet (D-122; still empty at 02:52 on 17 Nov, D-125).

Before a build, `npm run build` runs `refresh --build`: it copies `data/live/showtimes.json` to `data/showtimes.json` and splits it again into `public/data/` against the current `data/cinemas.json` (so an area added since the last live run still gets its file), or makes sample data when `data/live/` is missing. Tests and CI call `refresh --fixtures` themselves, so they always run on sample data.

## Featured films without times (D-131)

`featured` (optional, left out when empty): the films a chain's own public page features for one day, with no times. Today only Filmhouse's home page (`filmhouse-home`), because Filmhouse's times sit behind CINEsync, which refuses our bot (D-77).

```json
"featured": [
  { "sourceId": "filmhouse-home", "cinemaIds": ["filmhouse-lekki-imax", "…"], "day": "2026-11-17", "fetchedAt": "2026-11-17T15:59:08Z",
    "films": [{ "id": "ghost-soldier", "title": "Ghost Soldier" }, { "id": "dear-ajayi", "title": "Dear Ajayi" }] }
]
```

| Field | Rule | If broken |
| --- | --- | --- |
| `featured` | A list, when present. Never showings: it adds no times and no rows. | Refuse the file |
| `day` | The Lagos date the page features them for, `yyyy-mm-dd`. | Refuse the file |
| `fetchedAt` | UTC with `Z`, as everywhere. | Refuse the file |
| `films` | `{ id, title }` each, in the page's order; ids matched with the showings' films (D-119): a film a showing has takes that film's id and title, otherwise the page's own title. | Refuse the file |
| `cinemaIds` | Cinemas in the file. | Drop the unknown ones, log it; drop the entry when none is left |
| `sourceId` | A source in the file. | Drop the entry, log it |

**Source entry.** `filmhouse-home` in `data/sources.json` is `cleared` (a public page, D-77), has `cinemaIds: []` (it feeds no showings, so the "no cinema fed twice" test still holds) and `featuredFor` (Filmhouse's 7). `refresh --live` reads a cleared source that has a reader and either `cinemaIds` or `featuredFor`. The `filmhouse` entry stays `pending`, and Lagocine stays the source of Filmhouse's times.

**What is read.** One request a run to `https://www.filmhouseng.com/` (`scripts/sources/filmhouse.ts`). Its "Now Showing" list is empty in the HTML (the browser fills it from CINEsync, never called), so the parser reads the banner's data in the page's `self.__next_f` scripts: each film's title, runtime, rating and `nearest_show_times_date`. A film whose date is today in Lagos is featured; one whose date is after today is coming (§Coming films). The page's `is_coming_soon` flag was false for all 9 on 17 Nov (Avengers: Doomsday included), so the date decides; the flag counts only for a film with no date. The banner must be for every location ("All"), or the read fails. No banner, no films in it, a film with no title or a date that is not `yyyy-mm-dd` fails the read ("Has the page layout changed?"); a failed read keeps the last good list while its day lasts (D-119).

**What a page shows.** `toListData` sends the list only for cinemas with no showing in the city's file at all, so real times always win; `featuredAt` gives it only on its own Lagos day (before the page knows the time, the line gives the date, rule 3). Words through `lib/wording/featured.ts`: "Filmhouse's home page features Ghost Soldier, How to Rob a Bank, Five Figurines and Dear Ajayi today." on the Cinemas row (today only) and the area card, plus "All times are on Filmhouse's site." on the cinema's page, beside its Book button. Never "Filmhouse is showing", never "and N more", never per cinema: the banner is a chain-wide promotion, not the programme.

**Sample data.** `tests/fixtures/filmhouse/2026-11-17-home.html` (the banner's data only) is sample data: its films for the day it was saved go on today. The 11 Nov Lagocine day page's rows for Filmhouse Palms Lekki are left out of the sample (`leaveOut` on its entry in `tests/fixtures/index.json`), so the sample holds a Filmhouse cinema with no times, as all 7 were live on 17 Nov.

## Coming films (D-144, D-151)

`coming` (optional, left out when empty): the films a sinima's own page lists as coming, each once per source, by first date with undated ones last. Today only Filmhouse's home page (`filmhouse-home`): a banner film whose `nearest_show_times_date` is after today in Lagos is coming from that date; a banner film with no date that the page flags `is_coming_soon` is coming with no date ("Date not announced", D-144). Each coming film is also in `films` (its id matched with the showings' films, D-119), so its poster, credits and trailer are looked up like any other film's; a coming film no showing has gets the page's rating, `runtimeMin` from TMDB only, and the page's title without a space before a colon ("DUNE : PART THREE" is shown "DUNE: PART THREE"; the id is `dune-part-three` either way).

```json
"coming": [
  { "sourceId": "filmhouse-home", "filmId": "avengers-doomsday", "firstDay": "2026-12-18", "cinemaIds": ["filmhouse-lekki-imax", "…"], "fetchedAt": "2026-11-17T15:59:08Z" }
]
```

| Field | Rule | If broken |
| --- | --- | --- |
| `coming` | A list, when present. Never showings: it adds no times and no rows. | Refuse the file |
| `firstDay` | The sinima's first date, a Lagos date `yyyy-mm-dd`, never TMDB's; or `null` when the sinima gives none. | Refuse the file |
| `firstDay` on or before the Lagos day of `generatedAt` | The film is on now, not coming. | Drop the entry, log it |
| `filmId` | A film in the file. | Drop the entry, log it |
| `sourceId` | A source in the file. | Drop the entry, log it |
| `cinemaIds` | Cinemas in the file (the ones the page speaks for: `featuredFor` in `data/sources.json`). | Drop the unknown ones, log it; drop the entry when none is left |
| `fetchedAt` | UTC with `Z`. | Refuse the file |

**Page files.** Each city's and area's file keeps the entries for its own cinemas, and the films and sources they use (Abuja has none while only Filmhouse's page gives coming films). An entry whose first date is not after the build's today (Lagos) leaves the page files. The later day files (D-147) carry none. A failed read keeps the last good list (D-119), each film while its date is still ahead.

**What a page shows (D-151, D-154).** `comingIn` (`src/lib/data/filmPages.ts`) lists a city's coming films from its file with `comingList` (`src/lib/data/coming.ts`): one card per film, by first date, undated last; a film two sinimas list takes the earliest date, with the sinimas that give it. A film with any showing in the city's shown days (today, tomorrow and the later day files) is left out, and its page is the normal film page (D-154). Films shows them under Now showing as "Coming soon", each card one link to the film's page, drawn once the page runs from the card data the page carries (none in a city with no coming film, and none while a search or a format is picked); each coming-only film gets a film page (`/<city>/film/<id>`) and a share card, with "Opens Fri 18 Dec at Filmhouse", why its times aren't up, and an all-day calendar file for its first date. Words through `lib/wording/coming.ts`, made at build time (`lib/data/comingPage.ts`): they are dates the sinima gave, never relative to now.

**TMDB (D-151).** A film that is only coming (no showing in the live or sample data) is matched by `pickComingMatch`: the same title, a TMDB release year within one year of `firstDay`'s (TMDB's dates differ from Nigeria's: Doomsday 16 Dec there, 18 Dec at Filmhouse), and exactly one such film; otherwise no poster, and the UI shows the NoPoster face. Checked against TMDB on 18 Nov 2026: Doomsday, Dune: Part Three and Jumanji: Open World match; "THE FOUR" finds "The Fantastic 4: First Steps" and stays unmatched. An undated coming film is matched like a showing film (`pickMatch`, from today).

**Sample data.** The saved home page's coming films keep their distance from the day it was saved (17 Nov): a film first on 18 Dec opens 31 days after the sample's today (`sampleDay`).

## Sample data (D-20, D-45)

`npm run refresh -- --fixtures` builds these files from the saved pages listed in `tests/fixtures/index.json` (the entries marked `sample`). Lagos's come from Lagocine's pages saved on 11 Nov; Abuja's from Silverbird SEC's and Jabi Lake Mall's Veezi pages saved on 17 Nov (D-120), each batch moved from its own saved day. Rows from the day the pages were saved move onto today and rows from the day after onto tomorrow, both in Lagos, keeping their wall-clock times; later days are dropped. A cinema with no saved tomorrow gets its saved day again. Sample rows have no booking link, every source's `method` is `fixture`, and `sample` is `true`. The files are dated today, so they are made by the command and not committed.
