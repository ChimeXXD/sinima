# CLAUDE.md — Sinima

**Sinima** is the name (D-36; "Lagos Showtimes" was the working title, so older notes and log entries still say it). You are building this project. Read this file first. **Design source of truth: the Figma *Design System* page (tokens, styles, components) and the *Design screens* page (D-66); build from them.** Before building or changing UI, read `DESIGN.md` (Chime's taste rules). Then `docs/HANDOFF.md` (the latest session summary), `docs/PLAN.md` for the current day and `PROGRESS.md` for where the last session stopped.
Every product and architecture decision so far is in `docs/DECISIONS.md`. Don't reopen one unless it blocks you. If it does, write the problem under "Open" in `docs/DECISIONS.md` and ask Chime. Chime is they/them.

## What we are building

A **web app** that shows every cinema's showtimes in **Lagos and Abuja** (D-62) in one place, fast on a phone. One line: **"What's starting soon near me, and should I stay after the credits?"**

- Tabs: **Films** (home), **Cinemas**, **Starting soon**, **Your cinemas** (D-55, D-61). Each area has its own static page (`/area/[slug]`); two cities need a city layer above areas (O-16, week 2 of the plan).
- Film page: every showing in the city by start time and area. Cinema and area pages.
- **Stay or Go** chip: whether a film has a mid- or post-credits scene, with its source and how sure (D-10).
- **Every showing says where it came from and how fresh it is**, in words: "Read from Filmhouse's site 2 hours ago" (D-04).
- Reminder: add to calendar (.ics) and a live countdown. Booking always goes to the cinema's own site.
- Primary users: Chime in Lagos and people in Abuja (both UTC+1, no DST), on an iPhone; also a mid-range Android on mobile data.
- Research and the full idea: `docs/PRD.md`, `docs/RESEARCH.md`. Spec: `docs/SPEC.md`. Data format: `docs/DATA.md`.

## Project frame (D-01)

- **Portfolio project** built with Claude Code, **launched publicly on X with a motion-graphics video on Tue 15 Dec 2026** (backup Wed 16), 2–3 days before Avengers: Doomsday opens (D-62). Case study on chimexd.work next to Meridian.
- **The repo is public from Day 0** (D-30, supersedes "private until launch day"), open source (MIT). Everything committed is public at once: no personal addresses, no keys, no full saved cinema pages (D-24).
- **Budget is $0.** Free host (Vercel Hobby or Cloudflare Pages, O-4), free GitHub Actions, free TMDB API (non-commercial). No paid services, no domains unless Chime says so.
- **Scope** is the Must / Should / Cut table in `docs/PLAN.md`. If a week overruns, cut its Should items. Never cut the city layer, the video or launch day.
- **Design comes first** (D-13). Day 1 runs the design phase: references, three directions, Chime picks one, then `docs/design/UI-BRIEF.md` is completed. After that the site is the source of truth.
- **Read each cinema directly** (D-76, D-77). Nothing fetches a real site on a schedule until that source is cleared in `data/sources.json`. Until then, build from saved fixtures.
- **Chime builds Tactics Board (Agmen) at the same time.** The Mac is tight on memory: one dev server at a time, stop it when you finish, and never leave Playwright browsers or watchers running.

## Stack (fixed, D-02)

- **Next.js 16.4.6** (D-115) App Router, **static export** (`output: "export"`), **React 19.3.1**, **TypeScript 5.9.3** (strict), **Tailwind CSS 4.3.3** (`@tailwindcss/postcss`). Same versions as Chime's portfolio, except Next.js (16.4.6 here for a security patch, D-115).
- **ESLint 9** with `eslint-config-next` 16.4.6. **Vitest** for unit tests (D-03). **@playwright/test 1.64.1** for e2e.
- Node 22. npm (not pnpm or yarn).
- Fetch scripts are TypeScript in `scripts/`, run with Node's built-in type stripping (`node scripts/x.ts`); HTML parsing with `cheerio` (dev dependency, scripts only, D-03).
- **No other runtime dependencies** without Chime's OK. No UI kit, no date library: use `Intl.DateTimeFormat` with `timeZone: "Africa/Lagos"`.
- Colours, type and spacing come from tokens in `src/styles/tokens.css`. No hard-coded colours.

## Layout (create as you go)

```
src/
  app/                      routes: / (starting soon), /film/[slug], /cinema/[id], /area/[slug], /about
  components/               ShowingRow, FreshnessLine, StayOrGoChip, AreaPicker, Countdown, CalendarButton
  lib/
    time/                   lagos.ts (UTC <-> Africa/Lagos), showingState.ts, countdown.ts
    wording/                freshness.ts, credits.ts, showing.ts (all user-facing sentences)
    data/                   types.ts (schema v1), load.ts, validate.ts, select.ts (filters, sorting)
    ics/                    ics.ts
  styles/                   tokens.css, globals.css
public/                     manifest.webmanifest, icons, sw.js
scripts/
  sources/                  one fetcher + parser per cleared source
  refresh.ts                run sources -> normalise -> validate -> write data/showtimes.json
  tmdb.ts                   match films, read credits keywords (build time only)
  check-budget.mjs          page-weight budget on the built `out/`
data/                       cinemas.json, sources.json, showtimes.json, credits.json
tests/
  unit/                     Vitest
  e2e/                      Playwright
  fixtures/                 saved HTML/JSON from each source, plus showtimes fixtures
docs/                       PRD, PLAN, SPEC, DATA, DECISIONS, RESEARCH, HANDOFF, OUTREACH, features.json, design/
PROGRESS.md                 build log
```

## Commands

```bash
npm run dev          # next dev (stop it when done)
npm run build        # next build -> out/
npm run lint         # eslint . && node scripts/check-tokens.mjs
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:e2e     # playwright test (builds and serves out/)
npm run budget       # node scripts/check-budget.mjs (after build)
npm run refresh      # node scripts/refresh.ts  (cleared sources only; --fixtures for offline)
```

Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` before saying a task is done.

## Rules that protect correctness

1. **Times are stored as UTC ISO 8601 strings** (Abuja shares Lagos's clock, so `Africa/Lagos` serves both cities) (`2026-11-06T18:30:00Z`) and shown in **Africa/Lagos** with `Intl.DateTimeFormat(..., { timeZone: "Africa/Lagos" })`, whatever the device's zone. 12-hour clock ("7:30 PM", D-114, through `formatTime`). Never build a `Date` from a local-time string without a zone. Parsers convert the cinema's local time to UTC once, in one tested function.
2. **Every showing carries its source and `fetchedAt` in the data**, but screens do **not** show a per-showing source line (D-72 supersedes D-04's "Read from Filmhouse's site 2 hours ago"). Data older than the stale limit still says so **in words**, through `lib/wording/freshness.ts` only, and is never hidden silently (`docs/DATA.md` §Freshness). Never a coloured dot alone. Sources are credited on `/about`.
3. **Time-relative text is computed in the browser from `now`**, never baked into static HTML ("Starts in 45 min", "Read 2 hours ago"). The static HTML shows absolute times; the client fills the relative words.
4. **A showing that has started is never bookable.** At start time the row says "Started 5 min ago", loses its booking link and drops out of "Starting soon" (D-05). Tests cover the boundary second.
5. **Booking links go to the cinema's own site** (or the booking engine it uses). We never sell, never add tracking parameters, never deep-link to seat maps or checkout pages we were not given.
6. **Read what a visitor can see, nothing more** (D-77, D-76): each cinema's own public listing pages first (a headless browser is fine for pages built by script), Lagocine only for cinemas we can't read (Filmhouse today). Obey robots.txt for the paths we fetch (one exception: Lagocine, whose owner's written yes stands for a whole-site block on every bot, never a path rule or one naming SinimaBot, D-198), at most one request per 5 s per host, a named user agent with a contact URL, stop the same day if asked. Never call a private back end with a site's key, never disguise the bot, never work around a block. A source runs on a schedule only when `data/sources.json` marks it `cleared`. Never copy posters or synopses from cinema sites.
7. **Credits info says how sure it is, in words, with its source** (D-10), through `lib/wording/credits.ts`: "Stay: scene after the credits · TMDB" for one named source (D-19), "Probably stay" only for an inferred answer, "Not known yet". A missing keyword is **"Not known yet", never "Go"**; "Go" needs a linked entry in `data/credits-manual.json`.
8. **Never invent data.** Unknown price is "Price not listed". Unknown address is left out. Fixtures are real saved pages, labelled as fixtures, and the UI shows a "Sample data" banner while fixtures power it.
9. **Page weight budget** (D-21, supersedes D-12's numbers): set from the Day 0 measurement of the empty app and held in `scripts/check-budget.mjs`. No blocking web fonts. CI fails over budget.
10. **TMDB is build-time only.** The key lives in `.env.local` and GitHub Secrets, never in client code. Attribution and the TMDB notice are on `/about` (D-09).
11. **Location never leaves the device.** On a first visit the site asks for location as it opens, only to pick the city: Lagos or Abuja, and Lagos for anywhere else or no answer (D-65). "Use my location" for the nearest area runs only on tap. Only the city and area slugs are stored.

## Working style

- Work day by day from `docs/PLAN.md`. Pass a day's gate before starting the next.
- **Tests first** for `lib/time/`, `lib/wording/`, `lib/data/validate.ts`, `lib/ics/` and every parser in `scripts/sources/`. Fixtures are **saved HTML/JSON samples** in `tests/fixtures/<source>/` with the date saved in the file name. Use a fixed clock in tests (`vi.setSystemTime`), always with UTC instants.
- **Playwright e2e** for the core flows (SPEC §Acceptance) against the built static site, at a phone viewport, with the clock frozen. Specs import `test` and `expect` from `tests/e2e/test.ts`, which freezes every page at noon on the sample day; a test that needs another time sets its own clock (D-118).
- Commit after each green step with a conventional message (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). **Push to GitHub after every commit** (the repo is public, D-30).
- After UI work: build, screenshot at 390×844 and 360×800, and compare with the approved direction before calling the step done. Check on Chime's phone before a gate passes.
- For UI units, run the motion skills (find-animation-opportunities, then animate / choreograph / gestures) and list the skills that ran in the unit's PROGRESS entry (D-102).
- Update the checkbox in `docs/PLAN.md` and the matching item in `docs/features.json` (with evidence) when a task is complete. Log each session in `PROGRESS.md` (newest first) and rewrite `docs/HANDOFF.md` at the end of each session.
- New product or architecture choices get a numbered entry in `docs/DECISIONS.md` (supersede, never edit, old entries).
- Never send emails or contact cinemas yourself. Chime sends `docs/OUTREACH.md` drafts and tells you the replies.
- Keep files under about 300 lines. Accessibility: semantic HTML, visible focus, 44 px targets, `prefers-reduced-motion`, every time readable by screen readers as a full sentence.
