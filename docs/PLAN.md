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
- [x] Chime decides the two-city proposals (O-16 decided 16 Nov: city first in the address, D-98)
- [x] Design System page: tokens as variables, text and effect styles, components with states and build notes (D-66)
- [x] Your cinemas folders show each chain's logo sticker (D-67)
- [x] Figma pages organised with dividers; Round 10 renamed Design screens (D-66); then reorganised like Odin, with a cover thumbnail (D-68)
- [x] Every screen at iPhone, iPad and desktop size: all ten flows of sitemap draft 3, one row per state (D-70, D-71)
- [x] Screen review round 1 (15 Nov): no Lagocine source lines, no clipped shadows, day toggle fixed, chip rows fade at the edge, iPad Cinemas logos off the title (D-72)
- [x] Cinemas title centred with logo stickers left and right, "21 of them!" below, three sizes (D-73)
- [x] Drink sticker replaces Admit one in every Films title and on Where are you watching? (D-74)
- [x] 404 picture: the torn ticket, at three sizes; Admit one deleted (D-75)
- [ ] Figma: "21 of them!" and "21 cinemas" become 22 now that Nova Cinemas Sangotedo is listed (D-81)
- [ ] Chime approves the phone, iPad and desktop screens

**Abuja research**
- [x] List Abuja's cinemas (15 Nov, D-79): Silverbird SEC, Silverbird Jabi Lake Mall, Genesis Ceddi Plaza, Nova (Lugbe), The Jays (Kuje, no times); Banex unconfirmed. Two addresses still to confirm on the cinemas' own pages
- [x] Abuja sources audit (15 Nov, D-79): 4 readable directly (Veezi, Genesis, Nova by headless browser); recorded in docs/RESEARCH.md, goes into `data/sources.json` with the city layer (week 2)
- [x] Lagos sources re-audited (15 Nov): every cinema has a public page; Genesis and Silverbird (Veezi) cleared; Filmhouse blocked, so Lagocine is its fallback (D-76, D-77)
- [x] Terms read and the headless-browser route tested (15 Nov): all 14 non-Filmhouse Lagos cinemas cleared (D-77, D-78); Filmhouse stays on Lagocine
- [ ] Messages to Filmhouse marketing, FilmOne and CINEsync asking to read Filmhouse's times directly (Chime sends). 17 Nov: Filmhouse (§4a) and CINEsync (§4c) emailed, LinkedIn message to Filmhouse Group's CEO sent; FilmOne (§4b) sent 17 Nov 20:52 UTC; Filmhouse's cc to info@ bounced (internal only). No replies by Tue 24 Nov: draft the §4 follow-ups and show Chime the text first
- [x] Outreach: none needed for Abuja (all readable, D-79); Filmhouse, FilmOne and CINEsync drafts are in `docs/OUTREACH.md` §4 for Chime to send
- [x] Abuja areas and their neighbours: drafted (Central Business District, Jabi, Lugbe, Kuje; docs/RESEARCH.md); adopted 17 Nov with the city layer (D-120), Chime can still change them
- [x] Avengers: Doomsday opens in Nigeria Fri 18 Dec 2026, per Filmhouse's own page; launch stays Tue 15 Dec (D-80, closes O-14)

## Week 2: build the design and the city layer (23–29 Nov)

- [x] Data: a `city` above areas in `cinemas.json` and the schema; Abuja fixtures; validator and tests updated (17 Nov, D-120: `city` on every area, Silverbird SEC and Jabi Veezi fixtures, `tests/unit/registry.test.ts`, `tests/unit/lib/data/cities.test.ts`)
- [x] Routes for two cities, `/lagos/…` and `/abuja/…` (D-98, D-100); today's addresses forward to Lagos; the saved city on the phone, like the saved area (D-18)
- [x] Abuja's cinemas (D-79) in data/cinemas.json and saved sample pages, so Abuja's tabs show times (D-100 a) (17 Nov, D-120; `tests/e2e/abuja.spec.ts`)
- [x] Build the Figma design with motion (D-82), unit by unit: 1 foundation (tokens, fonts, motion tokens) ✅ · 2 shared components ✅ (D-84) · 3 Films ✅ · 4 Film + showing sheet ✅ (D-88) · 5 Search and city ✅ (D-89) · 6 Cinemas ✅ (D-91) · 7 Area ✅ (D-92) · 8 Cinema ✅ (D-93) · 9 Starting soon ✅ (D-96) · 10 Your cinemas ✅ (D-97) · 11 About, 404, Offline ✅ (D-99) · 12 Where are you watching? ✅ (D-101) · 13 city layer ✅ (D-100). Each checked at 390, 834 and 1440 against the Figma frames
- [x] Motion pass with the design-engineering skills (D-102, D-103), unit by unit, CSS-only first: M1 Today/Tomorrow list ✅ · M2 Show N more ✅ · M3 keep / let go ✅ · M4 a showing starts ✅ · M5 Where first visit ✅ · M6 countdown ring and digits ✅ · M7 cards lift on hover ✅ · M8 search results ✅ · M9 tabs ✅ · M10 sheet swipe ✅ · M11 poster travel ✅ (React ViewTransition, no config in Next 16.4). Each: the skill that fits (animate, choreograph, gestures), animation-performance, break-ui, verifier, code review; PROGRESS names the skills that ran
- [ ] Review round 1 (D-106, D-107), built and green, waiting for Chime's phone check: R1 favicon ✅ · R2 dark ticket sticker outline ✅ · R3 state changes fade ✅ · R4 hover states ✅ · R5 Cinemas tab icon from Figma ✅ · R6 posterless films in several colours ✅ · R7 quick save (heart on rows, + picks cinemas) ✅ · R8 page-to-page motion ✅ · R9 nav springs (Bottom bar) ✅ · R10 pull-cord theme toggle ✅
- [ ] Review round 2 (D-109), built and green, waiting for Chime's phone check: page slide stronger (40 px, 300 ms) ✅ · pickers and "Lagos ⌄" as Design Bookmark's Spring dropdown on a computer, under the trigger, chevrons turning ✅ · toast lighter blue, red for errors ✅ · bulb half hidden in its shade ✅
- [ ] Motion audit (D-112, mockup/motion-audit), all 22 picks built and green, waiting for Chime's phone check: F1 heart pop ✅ · F2 nav springs read then write ✅ (the pill itself still moves on the page's thread: see PROGRESS) · F3 heart and Today/Tomorrow answer first ✅ (a poster's press needs no script) · F4/F5/C7 no motion on keys ✅ · F6/C8 entrances once per visit ✅ · F7 poster by transform ✅ · F8 toast exit ✅ · F9 catch a sheet ✅ · F10–F12 small fixes ✅ · F13 cheaper repaints ✅ · C4–C6, C9 cuts ✅ · N1 count pop ✅ · N2 share ✓ swap ✅ · N3 tick pop ✅
- [x] Stickers: ship `docs/design/stickers/drink.png` as `public/stickers/drink.png`; credit Fluent Emoji (MIT) on `/about` (D-74, D-99)
- [x] Drop the per-showing source line from the built components (D-72); keep the stale-time warnings and the About credit; update `freshness.ts` tests to match (checked 17 Nov: no built page says "Read from"; the sentence goes only into the calendar file's description, `src/lib/ics/ics.ts`; `rowWarning` keeps the stale words)
- [x] Time: Abuja is on the same clock as Lagos (UTC+1, `Africa/Lagos`); tests cover a showing in each city (`tests/unit/scripts/sources/veezi.test.ts`: Silverbird SEC's 10:00 AM is `09:00Z`; `tests/e2e/abuja.spec.ts`)
- [ ] Budget and e2e green; Chime checks both cities on the phone. Green 17 Nov (276 e2e pass, budget passes); waiting for Chime's phone check

## Week 3: live data, remaining pages, video script (30 Nov – 6 Dec)

- [x] Readers for the sites with times in their HTML, tested on saved pages and run live (D-122): Veezi (Silverbird's four; each booking link's siteToken checked, since the host is shared), Genesis (four locations), Grand, Blue Pictures; each left Lagocine. Filmworld's Veezi page is read by the same code but held back: it showed no shows while Lagocine listed 22 times (D-122)
- [x] Readers for the script-built sites (headless browser): Reach (Ozone, Sky), Viva, Nova, EbonyLife, THC, Magnificent; Lagocine stays for Filmhouse and anything not yet read (D-76). Done 17 Nov (D-125): tested on rendered pages and run live; each left Lagocine; Nova's two have times for the first time. The data budget is now per city file (D-126)
- [x] Refresh workflow runs for every cleared source in both cities (D-76); a cinema with no cleared source says "Times not available yet"; Lagocine credited on /about (17 Nov: cron-job.org starts it three times a day, D-128, and the 16:17 run succeeded on its own; only `cleared` sources are read, `scripts/live.ts`. Lagocine is credited on /about only, not on each cinema page: D-130, D-132)
- [x] Film page complete; cinema page; Stay or Go; started showings not bookable (e2e at `now − 1 min`: `tests/e2e/film-screen.spec.ts`, "once the showing starts the sheet can't book it"; cinema and Stay or Go in `cinema-screen.spec.ts`, `film-screen.spec.ts`)
- [ ] **Five days** (D-142, D-146, D-147, D-148): ~~1 every source read for five days~~ (18 Nov) · ~~2 a file per later day per city~~ (18 Nov) · ~~3 the day row (date tiles, in Figma 18 Nov) on Films, a film's page and a sinima's page, later days fetched when picked, the "7 of 21 sinimas…" sentence, Sinimas' Day menu with five days~~ (19 Nov; budget raised to 167/228, D-153) · 4 Chime checks on the phone
- [ ] **Share card** (D-145, D-149): ~~reference board (57 Mobbin refs; picks Fixtured, Letterboxd, Pangea)~~ → ~~three directions, A picked~~ → ~~Figma (Design screens › "Share card": film, no poster, site)~~ → ~~build: one card per film per city plus the site's own, generated at build time~~ (19 Nov: `/og/<city>/<film>.png`, `/og/site.png`, og and twitter tags on every page) → checked by pasting a link in WhatsApp and X's composer after the deploy
- [ ] **Coming soon** (D-144): films a sinima lists as coming soon (Filmhouse's home page, Grand, Blue Pictures; others to check), a date only when a source gives one; ~~designed first~~ (D-150, D-151) · ~~1 the data: Filmhouse's coming list, dates, TMDB posters on a sure match~~ (19 Nov, D-152) · ~~2 the screens: Films section, a coming film's page, date sticker, add to calendar~~ (19 Nov) · 3 Chime checks on the phone
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
- [ ] **Before it expires (Nov 2027):** renew sinima.com.ng at Whogohost (₦7,200 a year, D-140), or the address stops working
- [ ] **By 1 Nov 2027:** renew the GitHub token `sinima-refresh-timer` (it expires 17 Nov 2027) and paste the new one into the cron-job.org job's Authorization header. Without it the refresh stops and the site's times go stale (D-128)

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
