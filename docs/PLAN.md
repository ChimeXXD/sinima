# Sinima: the plan to launch

Written 6 Nov 2026 as a one-week plan. **Restructured 15 Nov 2026 (D-62):** Sinima launches for **Lagos and Abuja**, on **X (Twitter)** with a **motion-graphics video**, **two or three days before Avengers: Doomsday** opens. Decisions are in `DECISIONS.md`; the PRD is `PRD.md`. The first week's checklist is kept at the end as a record.

## What changed on 15 Nov

| Before | Now |
| --- | --- |
| Lagos only; Abuja and Port Harcourt "Phase 3 or never" (O-7) | **Lagos and Abuja** at launch. Port Harcourt stays out |
| One week, ending with a public repo and a case study (D-01) | **About a month**, ending with a public launch on X. Still $0 |
| A 30-second screen recording for the portfolio | A **motion-graphics video** that explains the app, made for the X launch |
| No launch moment | **Timed to Avengers: Doomsday**: launch 2–3 days before it opens, ride the hype |

**The date.** Avengers: Doomsday opens worldwide on **Friday 18 Dec 2026**. Some countries open earlier (UK 16 Dec, India 17 Dec). Nigeria's date is not confirmed yet (O-14). Target: **Tuesday 15 Dec 2026, backup Wednesday 16 Dec**. If Nigeria opens before 18 Dec, launch moves to 2–3 days before the Nigerian date.

## What "done" means on launch day

1. **A live web app for Lagos and Abuja.** Someone in either city opens it on their phone, picks their city once, and sees films, cinemas and what starts in the next 2 hours near them, with where each time came from and how fresh it is. Booking goes to the cinema's own site.
2. **Doomsday-ready.** When cinemas publish Avengers: Doomsday times (often presales a week or more ahead), its film page lists every showing in both cities with formats (IMAX, 4D), and its Stay or Go chip says how sure it is (D-10).
3. **The X launch.** A pinned launch post with the motion-graphics video, a short thread with screenshots, and a share card that looks right when the link is posted.
4. **A public repo and a case study** that read like senior work (README, architecture, tests, honest numbers), as planned.

## The month at a glance

| Week | Dates | Focus | Gate (must pass before the next week) |
| --- | --- | --- | --- |
| 1 | Sat 15 – Sun 22 Nov | **Design** settled in Figma (Round 10: Ghost + Keepsy, D-63). **Abuja research**: cinemas, areas, sources | Chime approves the phone and desktop screens; Abuja cinema list, sources audit and outreach drafts done |
| 2 | Mon 23 – Sun 29 Nov | **Build the approved design**; add the **city layer** (Lagos, Abuja) to data, routes and screens | Both cities browse on sample data; tests and budget green; Chime checks on the phone |
| 3 | Mon 30 Nov – Sun 6 Dec | **Live data** for cleared sources in both cities; film and cinema pages, reminder, share. **Video**: script and storyboard | Refresh runs for every cleared source; storyboard approved by Chime |
| 4 | Mon 7 – Sun 13 Dec | **Harden** (budget, Lighthouse, accessibility, real phones). **Video produced.** Launch kit written. Quiet soft launch to friends in both cities | Video final; launch thread final; no open bugs that block finding a showing |
| Launch | **Tue 15 Dec** (backup Wed 16) | Post on X; watch and fix | Site up, video posted, link card correct |
| After | Fri 18 Dec onwards | Doomsday weekend: watch real use, fix fast, then write the case study | Case study draft; launch numbers logged |

Dates are a target. If a week slips, cut its Should items first; never cut the city layer, the video or the launch day.

## Scope to launch

| Must (the launch breaks without it) | Should (if the week has room) | Cut (not before launch) |
| --- | --- | --- |
| **Lagos and Abuja**: city picker, areas per city, the saved city on the phone | "Use my location" picks the city and nearest area | Port Harcourt and other cities |
| Films (home), Cinemas, Starting soon, Your cinemas (D-55, D-61) | Kids and Nollywood/Hollywood filters | Accounts, synced favourites |
| Film page: every showing in the city, by area, with formats (D-50) | Price when listed | Web Push (Phase 2, D-11) |
| Freshness line on every showing; stale and sample-data banners (D-04) | Travel buffer from the user's own estimate | Ticket sales, commission, ads |
| Started showings never bookable (D-05) | "Report a wrong time" link (D-22) | Posters from cinema sites |
| Stay or Go chip with confidence words (D-10) | Offline last data (PWA) | Native app |
| .ics reminder + live countdown | WhatsApp share text per showing | Group plans (Phase 3) |
| Booking link to the cinema's own site | | |
| Data from fixtures or cleared sources only (D-07, D-08) | | |
| `/about`: sources for both cities, TMDB notice, takedown | | |
| Page weight budget and Playwright e2e in CI | | |
| **Motion-graphics explainer video** for X | A second cut, 15 s, for reposts | |
| **X launch kit**: launch post, thread, screenshots, link card | | |

## Week 1: design and Abuja research (15–22 Nov)

**Design (D-63)**
- [x] Round 10 in Figma: Ghost's plainness, buttons and pop-up; Keepsy's sticker structure; the parts Chime commented on in PamPam, Posh, Phantom and Sweatpals
- [x] Round 10 fixes from Chime (15 Nov): city-neutral title in place of "Films in Lagos"; a cleaner ticket sticker cut, as good as Keepsy's; countdown pills centred on the poster (phone and desktop); every Starting soon card the same height; the Starting soon countdown badge centred; one extra screen with a Phantom-style tab bar, in the Ghost and Keepsy style (keep the current tab bar)
- [x] Phantom-style tab bar on every screen and desktop, count sticker made smaller (D-64)
- [x] Home title: "What's on in Lagos", city tappable; first visit picks the city from location, Lagos as fallback (D-65)
- [x] City picker designed (Lagos ↔ Abuja): first visit, switch from the search bar, search across both cities, one address per city (proposals A to D, D-64)
- [ ] Chime decides the two-city proposals and O-16
- [x] Design System page: tokens as variables, text and effect styles, components with states and build notes (D-66)
- [x] Your cinemas folders show each chain's logo sticker (D-67)
- [x] Figma pages organised with dividers; Round 10 renamed Design screens (D-66); then reorganised like Odin, with a cover thumbnail (D-68)
- [x] Every screen at iPhone, iPad and desktop size: all ten flows of sitemap draft 3, one row per state (D-70, D-71)
- [x] Screen review round 1 (15 Nov): no Lagocine source lines, no clipped shadows, day toggle fixed, chip rows fade at the edge, iPad Cinemas logos off the title (D-72)
- [ ] Chime picks: Cinemas title left (now) or centred (review section `219:8741`)
- [ ] Chime approves the phone, iPad and desktop screens

**Abuja research**
- [ ] List Abuja's cinemas from primary sources (each chain's own site): name, address, area, booking site
- [ ] Sources audit for each (robots.txt, terms, listing URL), as for Lagos (D-07, D-08); fill `data/sources.json`
- [ ] Outreach drafts for Abuja cinemas in `docs/OUTREACH.md`; Chime sends them
- [ ] Abuja areas and their neighbours, drafted for Chime to confirm (as O-10 was for Lagos)
- [ ] Confirm Avengers: Doomsday's Nigerian opening date with Filmhouse, Silverbird, Genesis or the distributor (O-14)

## Week 2: build the design and the city layer (23–29 Nov)

- [ ] Data: a `city` above areas in `cinemas.json` and the schema; Abuja fixtures; validator and tests updated
- [ ] Routes for two cities (O-16); the saved city on the phone, like the saved area (D-18)
- [ ] Build the approved Round 10 screens; check them against the Figma frames at 390 and 360 px and on desktop
- [ ] Drop the per-showing source line from the built components (D-72); keep the stale-time warnings and the About credit; update `freshness.ts` tests to match
- [ ] Time: Abuja is on the same clock as Lagos (UTC+1, `Africa/Lagos`); tests cover a showing in each city
- [ ] Budget and e2e green; Chime checks both cities on the phone

## Week 3: live data, remaining pages, video script (30 Nov – 6 Dec)

- [ ] Refresh workflow runs for every cleared source in both cities (D-33); uncleared cinemas say "Times not available yet"
- [ ] Film page complete; cinema page; Stay or Go; started showings not bookable (e2e at `now − 1 min`)
- [ ] Reminder (.ics with a 30-min alert, checked on iPhone and Android) and share
- [ ] **Video script** (30–45 s): the evening problem, then the app answering it in both cities, then the Doomsday hook and the link
- [ ] **Storyboard** in Figma from the approved screens; Chime approves

## Week 4: harden, make the video, prepare the launch (7–13 Dec)

- [ ] Budget, Lighthouse ≥ 90 (mobile), accessibility pass, real phones on mobile data in both cities
- [ ] **Motion-graphics video** produced (tool chosen at $0, O-15), exported for X (16:9 and 4:5); captions burned in for silent autoplay
- [ ] Launch kit: launch post, a 4–5 post thread, screenshots, the link card (OG image) checked in X's composer
- [ ] Doomsday check: if presales are listed, the film page shows them in both cities
- [ ] Soft launch to a few friends in Lagos and Abuja; fix what they hit
- [ ] Repo public-ready: README, permission status, launch tier (D-23)

## Launch: Tue 15 Dec (backup Wed 16 Dec)

- [ ] Morning check: data fresh in both cities, banners right, booking links work
- [ ] Post on X: video, thread, link; pin it
- [ ] Watch for broken links or wrong times; fix the same day

**Care with the Doomsday hook.** Use the film's title in text and its TMDB poster as the app shows it. Do not use Marvel's logo, trailer footage or key art in the video or posts; the hook is the timing, not their brand.

## After launch (from 18 Dec)

- [ ] Doomsday weekend: watch real use, fix fast
- [ ] Case study draft in `docs/CASE-STUDY.md` with launch numbers (visits, shares, permission replies, data freshness)

---

## Record: the first week (6–15 Nov)

Kept as it was planned; unchecked items moved into the weeks above.

| Day | Focus | Status |
| --- | --- | --- |
| 0 | Setup, data-source audit, permission emails | Done |
| 1 | Design direction and core lane | Done (design since reworked: D-49 onward) |
| 2 | Data: schema, validator, fixtures, parsers | Done except `cinemas.json` coordinates and addresses |
| 3 | Home | Built, then redesigned (D-49 to D-61); Chime's phone approval still open |
| 4 | Film, cinema, area, Stay or Go | Moved to week 3 |
| 5 | Reminder, share, install | Moved to week 3 |
| 6 | Harden | Moved to week 4 |
| 7 | Portfolio and public | Repo already public (D-30); README and case study moved to week 4 and after launch |

Done in the first week: Next.js scaffold with the pinned versions, CI green, budget set (D-21, D-26), Vercel deploy, data-source audit and outreach emails (Lagos), TMDB terms and key, core lane tests (time, wording, `.ics`), schema and validator, Lagocine and Veezi parsers, `refresh --fixtures`, TMDB matching, neighbouring areas (D-46), the redesigned app (D-54 to D-61), and the logo work (Logo Options page in Figma).
