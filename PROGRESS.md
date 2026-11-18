# Progress

Build log for the one-week plan (`docs/PLAN.md`). Newest entry first. Each entry: **Changed**, **Checked** (with real numbers), **Not verified**, **Next**.

## 18 Nov 2026 (12:55 Lagos) — sinima.com.ng is live (D-140)

Chime: "Check the domain, please."

- **Changed:** nothing in Whogohost or Vercel; the DNS zone exists after all (one of the night's "Create DNS Zone" tries took: SOA serial 2026111801). Docs only (HANDOFF, this entry).
- **Checked:** the .ng registry delegates to nsc.go54.com and nsd.go54.com; the zone holds A @ 216.198.79.1 and www CNAME → sinima.com.ng (Whogohost's default, not the Vercel CNAME planned; it reaches the same Vercel address, so it was left). 1.1.1.1, 8.8.8.8 and 9.9.9.9 all answer 216.198.79.1. `https://sinima.com.ng` 200 (title "Where are you watching? · Sinima"); `https://www.sinima.com.ng` 308 → `https://sinima.com.ng/`; sinima-app.vercel.app 200. Let's Encrypt certificates for both names, valid to 16 Feb 2027 (Vercel renews them).
- **Found:** nsc.go54.com answers REFUSED for sinima.com.ng (nsd and Whogohost's nsa/nsb answer correctly). Resolvers fall back to nsd, so the site loads; a first lookup can be a little slower until Whogohost's nsc carries the zone.
- **Also found:** Whogohost added its default mail records (MX → sinima.com.ng, an SPF TXT). Harmless (no mail is sent or received on this name); left, as removing records needs Chime's OK.
- **Code:** nothing names the site's address yet (no link card, no canonical URL; the bot's contact URL is the repo). The address goes into the code with the launch kit's link card (PLAN §Launch kit).
- **Not verified:** the Vercel dashboard's Domains page (not opened; the issued certificates mean Vercel saw both names point at it). The registry's RDAP answers 500 for this name (200 for others); delegation itself is checked above.

## 18 Nov 2026 — The Jays fills Abuja's fourth sticker (D-141)

- **Changed:** `CinemasHero.tsx` Abuja's stickers: Nova, Genesis, Silverbird, The Jays (Lagos's fourth position); `data-testid="cinemas.hero.art"`.
- **Red:** `abuja.spec.ts` "Abuja's Cinemas lists its five cinemas…": `Expected: 4, Received: 3`. **Green:** abuja and cinemas-screen specs 22 pass; screenshots at 390 and 1440 (scratchpad `sinima/abuja-*.png`).
- **Also this session (D-139, D-140):** sinima.com.ng bought (₦3,225 with VAT, invoice #2428227); added to the Vercel project `lagos-showtimes` (bare name to Production, www 308 to it). Whogohost's DNS zone would not create (twice, no error) while the .ng registry still had no record of the name (RDAP 404). Records to add once it does: A @ 216.198.79.1; CNAME www a8592d53f44e5350.vercel-dns-017.com.

## 18 Nov 2026 — "Sinima" in place of "cinema" (D-138)

Chime: "anywhere we write cinema, can we change it to SINIMA? … So we can be on brand."

- **Changed:** 70 user-facing strings in 25 files under `src/` (tabs "Sinimas" and "Your sinimas", "Sinimas in Lagos", "All sinimas", counts "22 sinimas", sheets, toasts, About, the calendar file, page titles, meta description) and the manifest's description (which also gains Abuja). Done by a TypeScript-AST script (scratchpad `rebrand.cjs`) that rewrites only string and JSX text, never ids, paths, test ids, `validate.ts` messages or chain names; dry-run read line by line first; `film.ts`'s one-word plural and two owner lines fixed by hand.
- **Tests:** the expected wording in 108 test strings and 4 test patterns follows the new copy (Chime's change of the words, not a weakened check); test titles, ids, URLs and the readers' message tests untouched.
- **Checked:** unit 832 pass; e2e 282 pass then the 3 failing specs (patterns) 23 pass; screenshots at 390 of Sinimas, a sinima's page and Films (scratchpad `sinima/`).
- **Flagged to Chime:** a sinima's page top bar says "Sinima", the app's own name; search engines; Figma still says Cinemas.
- **Not verified:** how VoiceOver and TalkBack pronounce "sinima".

## 18 Nov 2026 — Chime's answers (D-136), The Jays' logo, the tab count per city, dark-mode fixes (D-137)

Chime answered the numbered list of open calls (D-121, D-123, D-127): keep everything, with two changes.

- **The Jays' logo (D-136):** it was never missing, only not saved. Its own site's logo (thejayscinemas.com, the 270 px icon of the marquee sign), cut to its dark panel and set on a 176 × 132 fill tile (`public/logos/jays.png`, 13.5 KB; `data/logos.json`; `withoutLogo` now empty). `tests/unit/logos.test.ts` 16 pass.
- **The tab count per city (D-136, D-121 e):** the root layout hands each cinema's city down (`CinemaCities`, from `cinemaCityMap()` in `load.ts`); `AppFrame` counts only the page city's saved cinemas. **Red:** `abuja.spec.ts` "…counts the page city's saved cinemas only" on the old code: `Expected: "2", Received: "3"`. Green after.
- **Dark mode (D-137):** the Today | Tomorrow pill was the track's own #18181b; a dropdown's highlight was 2 % off the menu. New tokens `--segment-thumb` (dark `--p-neutral-700`), `--hover-fill-menu` and `--hover-fill-option` (dark `--p-neutral-800`, #27272a, new primitive); light values unchanged. **Red:** new `dark.spec.ts`: "dark: Today | Tomorrow…" `Expected: > 1.5, Received: 1`; "dark: …dropdown's highlighted row…" `Expected: > 1.15, Received: 1.048`. Green after; light screenshots byte-identical before and after (scratchpad).
- **Checked:** dark, abuja, film-screen, kit, cinemas-screen specs pass (21 + 36); one full gate run failed on film-screen while the review agent built `out/` beside it (an overlap, passed alone).
- **Code review (medium, --fix):** fixed: `cinemaCityMap` uses `cityOfCinema` (throws like `inCity`), the greys are palette primitives, a stale comment. Left: the ~1 KB city map on every page; the test's colour parser doesn't read exponents.
- **Not verified:** Chime's phone and computer; Safari's `light-dark()` inside `color-mix` by eye.
- **Not merged:** "Maybe Or Maybe Not" (Silverbird Ikeja, Magnificent) and "Maybe… Maybe Not" (Genesis, Filmworld, Sky): neither is on TMDB and no article names either, so they stay apart (rule 8).

## 17 Nov 2026 — No lone "Any format" (D-135)

Chime: "what is the point of the Any Format button right now? The button is not performing any action."

- **Why it did nothing:** the chips came from every format in the city's data; live data held only "2D" and "VIP", neither a filter format, so "Any format" stood alone. It also stayed when nothing was left to start today.
- **Changed:** `formatChoices` in `src/lib/data/programme.ts` (the day's showings still to start, plus the picked one); `FilmsScreen` renders the chip row only when it offers one; `CinemasScreen` passes it to `Pickers`, which drops the Format picker when it is empty.
- **Red:** `programme.test.ts` "formatChoices…" (`formatChoices is not a function`); e2e "…no format row…" (`films-screen.spec.ts`) and "…no Format picker…" (`cinemas-screen.spec.ts`) on the old build: `Expected: 0, Received: 1`.
- **Checked:** unit 30 pass; films-screen, cinemas-screen, round2, films, states specs: 49 pass; screenshots after the last showing at 390 and 1440 (scratchpad).
- **Code review (medium, --fix):** fixed: a Format sheet or menu open when the day runs out of formats now closes with its picker; `afterLastShowing` shared in `tests/e2e/helpers.ts`; the day's showings filtered once for the counts. Left: the row can appear or go just after load (the static page can't know the time, rule 3); the helper finds 'today' by calendar day, not by evening.
- **Not verified:** the live site after deploy.

## 17 Nov 2026 — Sinima's own scrollbars on a computer (D-134)

Chime's recording of the side panel and page: the system's grey bar "doesn't follow our design principle"; remove it or make our own.

- **Changed:** `tokens.css` `--scrollbar-thumb`, `--scrollbar-thumb-hover`; `globals.css` under `(hover: hover) and (pointer: fine)`: `html { scrollbar-gutter: stable }` (no sideways jump between short and long pages); `::-webkit-scrollbar` 12 px, thumb a 6 px pill (3 px transparent border, padding-box), no track, buttons or corner; darker on hover; `dialog` tracks start and end 32 px in (`--radius-sheet`); Firefox `scrollbar-width: thin` with the same colour via `@supports not selector(::-webkit-scrollbar)`.
- **Red:** new `tests/e2e/scrollbar.spec.ts` (a desktop context, `--hide-scrollbars` off): without the CSS `Expected: 12, Received: 15` (the system bar).
- **Checked:** the spec 3 × pass; crops of the page edge and the side panel at 1440, light and dark, at rest and under the pointer (scratchpad).
- **Gotchas:** headless Chromium hides scrollbars (`--hide-scrollbars`), and a `browser.newContext()` in a test takes the phone project's touch settings unless `isMobile: false, hasTouch: false`.
- **Code review (medium, --fix):** fixed: stable page gutter, the thumb stays dark while dragged (`:active`), hover gating, the spec's clock frozen at noon. Left: fixed elements sized from `100vw` (nav, toast) sit up to 6 px off the content's centre beside the gutter; the spec measures the gutter only, not the colour.
- **Not verified:** Safari and Firefox by eye; Chime's computer.

## 17 Nov 2026 — "Add your cinemas" is a side panel on a computer (D-133)

Chime sent a recording of the desktop list as a centred pop-up and drew a panel down the window's right edge: "Make it a sidebar over here instead of it popping up."

- **Changed:** `Sheet` takes `side`; `sheet.module.css` from 1200 px: `.sheet.side` is fixed 8 px from the top, right and bottom, 440 wide, full height; enters from `translateX(calc(100% + 8px))` on `--dur-sheet` `--ease-drawer`, leaves on `--dur-base` `--ease-out`; reduced motion fades; keys: no motion (the existing `html[data-input="keys"]` rule). `PickCinemas` passes `side`. Phones and iPads unchanged.
- **Skills:** animate (gate: occasional, purpose spatial consistency; CSS transition + `@starting-style`, transform only, the project's own tokens).
- **Red:** new `yours-screen.spec.ts` "on a computer the list is a panel down the right edge…" on the old build: `Expected {"x":992,"y":8,"width":440,"height":884}, Received {"x":500,…}` (the centred dialog).
- **Checked:** the new test 3 × 3 pass, its first frame read from the paused transition is `matrix(1, 0, 0, 1, 448, 0)`; `yours-screen`, `audit`, `kit` specs pass (48); screenshots at 1440 light, dark and mid-slide, 390 and 834 (bottom sheet as before), in the scratchpad.
- **Not verified:** Chime's own look at it on the computer; the phone (Chime will check and say).

## 17 Nov 2026 — GitHub CI: the tests that failed on Linux every run

CI had failed every listed run (none green in the last 40), on the same tests; all passed on the Mac. Chime: "let's do it".

- **Causes, from CI's trace (run 44158392999) and reproduced here:**
  - `kit.spec.ts:155` (last tab ends 349 > 342): Figma's bar has about 1 px to spare at 360 with "Starting soon" open (Mac: 340.6 of 341.6); Linux draws the name about 8 px wider (the font had loaded, 9 ms), and `.tab { flex: none }` can't give. A real weakness: a phone's larger text does the same.
  - `motion-nav.spec.ts:18` (pill at 167, tab at 159): the springs overshoot, and the slower runner first looked mid-overshoot.
  - `audit.spec.ts:78`, `:238`, `motion-poster.spec.ts:21`, `states.spec.ts:47`: acting before the page is redrawn on the browser's clock. With the CPU slowed 6× here, the first film card is `ramayana` (baked) on load and `tele-x-zikora` 0.6 s later, the film CI opened.
- **Red:** new test `kit.spec.ts` "…still holds every tab when the open tab's name is drawn wider" (letter-spacing 1px): `Expected: <= 342, Received: 353.21875`.
- **Changed:**
  - `nav.module.css`: the open tab may shrink (`flex: 0 1 auto; min-width: 0`); before the springs load its name ends in "…" when short of room; on the live bar it is clipped (no "…" while the springs open it).
  - `navSprings.ts` `fullName`: measures the name to the fraction with a Range, undoing a tap's press scale. `scrollWidth` rounded 95.22 to 95, so the name was always cut by 0.2 px, which the "…" showed ("Starting so…" at 390).
  - `AppFrame.tsx`: `NowMark` sets `html[data-now]` once the page has been redrawn on the browser's clock; `live(page)` in `tests/e2e/helpers.ts` waits for it; the four tests call it after `goto`/`reload`.
  - `motion-nav.spec.ts`: the clock is held around the tap, then three frames (48 ms) run; the pill must be past Films and short of Starting soon (stricter than before: it also fails if the pill never moves).
- **Checked:** lint (0 errors; the 10 warnings were there before), typecheck, 827 unit tests. Eight e2e specs: 74 pass on a sample build; motion-nav 5 × 4 pass; the touched specs 3 × 47 pass. Nav screenshots at 360 and 390 with each tab open, before vs after: full names, same sizes (only the poster behind the blur differs). proof:verifier: 7 of 9 verified by reading, the 2 runtime ones covered by the runs above. Code review (medium, --fix): 3 fixed (no "…" on the live bar, press scale, `NowMark` so the 30 s tick doesn't redraw the frame); left: `data-now` is never cleared after a client-side move (no test relies on that), and it is a test-only marker on every page.
- **Gotcha, again:** the code-review agent ran `npm run build` (live data) while the gate's e2e ran, and three unrelated tests failed. Rebuilt on sample: they pass.
- **Not verified:** GitHub CI on this commit (runs on push).

## 17 Nov 2026 — e2e always tests sample data; plan brought up to date

Chime: keep the new mockups local, update the plan, fix "tests vs live data", and set up the timer token's renewal.

- **Changed:**
  - `playwright.config.ts`: the e2e run serves a prebuilt `out/` only when `E2E_PREBUILT` is set (`ci.yml`'s E2E step sets it); everywhere else, the proof gate included, it rebuilds on sample data at 08:00 Lagos first. Before, the gate's `CI=true` made it serve whatever `out/` held, so a live `npm run build` failed the sample tests and code changes were never rebuilt before e2e.
  - `mockup/round4*`, `mockup/r6/`, `mockup/motion-audit/` listed in `.git/info/exclude` (local only).
  - PLAN: ticked the two-city decision, the 13 build units, the motion pass, the source line (D-72), Abuja's clock, the refresh workflow (Lagocine on /about only, D-130/D-132) and the film/cinema pages, each with its evidence; outreach and the phone checks annotated, still open; the token renewal added under After launch (by 1 Nov 2027). `features.json` D6-4 passes.
- **Checked:** `npm run build` (live data, `out/data/lagos.json` `sample: false`), then `CI=true npx playwright test --max-failures=1`: failed at `about-screen.spec.ts:9` before the fix; after it, 276 pass (3.1 min) and `out/` ends on sample data. Code review (medium, --fix): one finding fixed (the explicit `E2E_PREBUILT` flag).
- **Not verified:** a GitHub CI run with `E2E_PREBUILT` (runs on push). The page-weight budget now always measures the sample build; nothing measures a live build's pages (the refresh checks each data file's 20 KB, not the page total). The gate still gets `retries: 1` from `CI=true`.
- **Next:** Chime's phone checks; FilmOne draft; follow-ups on 24 Nov.

## 17 Nov 2026 — Filmhouse: what's showing, without times (D-131)

Chime approved the stopgap in the honest form proposed after the first look (the entry below): only the banner films Filmhouse's home page has on today, chain-wide, never "and N more".

- **Changed:**
  - New `scripts/sources/filmhouse.ts`. It reads the banner data in the home page's `self.__next_f` scripts, keeps only films whose `nearest_show_times_date` is today in Lagos, and gives each one's runtime and rating. It throws on a missing banner, a banner that is not for "All" locations, no films, a missing title or a date that is not yyyy-mm-dd. The page's `is_coming_soon` is not used. One request a run.
  - `reduce-fixture.ts` gets an `extract` mode and a `filmhouse-home` rule. The fixture `tests/fixtures/filmhouse/2026-11-17-home.html` is cut from the one saved copy (15:59 UTC). It keeps only the banner fields (3.3 KB), with no images, trailers or markup.
  - Data:
    - Schema `featured` (types, `validate.ts`, new `src/lib/data/featured.ts`).
    - `pipeline.ts`: titles are matched to the showings' films without changing them, and `only` cuts the list.
    - `cities.ts` cuts it too.
    - `live.ts`: a new reader `filmhouse-home`. A source with `featuredFor` is read even with no `cinemaIds`. A failed read keeps the last good list while its day lasts.
    - `refresh.ts`: the fixture becomes sample data, moved onto today. A new `leaveOut` drops Palms Lekki's 2 rows from the 11 Nov Lagocine sample.
    - `assemble.ts`: the `featuredFor` type.
  - `data/sources.json`: new `filmhouse-home` entry (cleared, `cinemaIds: []`, `featuredFor` = Filmhouse's 7, robots and why it's allowed under D-77). `filmhouse` stays pending.
  - `tests/fixtures/index.json`: the fixture entry and `leaveOut`.
  - UI: `toListData` sends the list only for cinemas with no showing in the city file (real times win), and `featuredAt` gives it only on its own Lagos day. `lib/wording/featured.ts` writes "Filmhouse's home page features … today." and "All times are on Filmhouse's site." It appears:
    - on the cinema page under "No times listed today.", with the Book button kept;
    - on the Cinemas row under "Times not available yet" (Today only);
    - on the area card.
  - New CSS classes use existing tokens only (`--text-secondary`, `--type-caption`/`--type-meta`).
  - DATA.md (§Featured films without times) and D-131.
- **Existing tests changed because behaviour changed:**
  - `live.test.ts` READERS key list gains `filmhouse-home`.
  - `refresh.test.ts`: three sample counts 294 → 292, and the per-cinema loop now expects Palms Lekki to have none (`leaveOut`).
  - `film-screen.spec.ts`: the "Started earlier today" line no longer names Palms Lekki at 2:00 PM. Its "not listed as a venue" check moved from Palms Lekki (now vacuous) to Genesis Purple Mall, which is in Lekki and in the earlier line. The verifier flagged this; fixed.
  - No test was weakened otherwise.
- **Red runs:**
  - `tests/unit/scripts/sources/filmhouse.test.ts`: `Error: Cannot find module '../../../../scripts/sources/filmhouse'`.
  - `tests/unit/lib/data/featured.test.ts` and `tests/unit/lib/wording/featured.test.ts`: `Cannot find package '@/lib/data/featured'` / `'@/lib/wording/featured'`.
  - `tests/unit/scripts/featured.test.ts` › "is cleared, feeds no cinema's times …": `AssertionError: expected undefined to match object { status: 'cleared', …(3) }`.
  - `tests/e2e/featured.spec.ts` › "a Filmhouse cinema with no times …": `expect(locator).toHaveText(...)` on `films.featured`: `element(s) not found` (sample build before the UI).
- **Checked:**
  - Lint 0 errors; typecheck clean.
  - Vitest: 65 files, 826 tests pass.
  - Sample build. Full e2e `CI=true … --max-failures=1`: 273 passed, 3 flaky, 0 failed. The flaky three (audit F5, audit F3, states D-106 j) also fail on a first attempt on a clean build of HEAD `c19cca2` (repeat-each 3, no retries: F5 2/3, F3 1/3, states 3/3), so they predate this unit.
  - Budget passes (`lagos/cinemas.html` 223.9 of 225 KB).
  - Screenshots at 390×844 and 360×800 on the sample's first day at noon:
    - Palms Lekki's cinema page: the line spans 16–374 at 390 and 16–344 at 360, 3 lines, 53 px.
    - Its Cinemas row: 4 lines at 390 (62 px) and 5 lines at 360 (78 px). The text column is narrow beside the heart and chevron, but nothing overflows.
    - The Lekki area card: 2 lines at 390 and 3 at 360.
    - No page scrolls sideways at either width.
- **Live run** (`refresh --live`, 16:40 UTC, the one run at the end):
  - Filmhouse's home page read OK. It features Ghost Soldier, How to Rob a Bank, Five Figurines and Dear Ajayi for 17 Nov, for all 7 cinemas, matched to the showings' titles.
  - Lagocine listed Filmhouse times again this run (89 rows: Lekki IMAX 14, Surulere 18, Circle Mall 12, Ikota 15, Palms 6, Oniru 9, Landmark 15), so on the live site the line shows nowhere until Lagocine drops them again. Real times win.
  - 575 showings; lagos.json 15.9 KB, abuja.json 4.5 KB.
- **Motion skills:** none ran. The unit adds one static line of text that comes with the page and has no state change, so no motion has a purpose here (rules: no animation without one).
- **Not verified:**
  - Chime's phone.
  - The line on the live site: Lagocine has Filmhouse times right now.
  - Whether Filmhouse's banner lists every film it shows. It does not: it is a promotion, so the wording never says so.
- **Next:** the coordinator's code review. Keep asking Filmhouse/CINEsync for the real times.

## 17 Nov 2026 — sources credited with links on About; the Filmhouse stopgap not built (D-132)

- **Changed:** each source's name in the About table links to its own site (new tab, hover gated); Lagocine's 11 Nov yes recorded in `data/sources.json`. `about-screen.spec.ts` changed with it: Lagocine's row is no longer "Permission asked" (red on the old build, then green), and the test checks the link.
- **Not built:** the "what Filmhouse is showing" stopgap. Filmhouse's home page leaves its Now Showing list empty until CINEsync fills it in the browser; only 9 promoted films are in the HTML (4 showing today, chain-wide), so a list from it would mislead (rule 8). The saved copy is in the git-ignored `tmp/filmhouse/`.
- **Not sent:** the correction to Paul (Chime: "No need to give him the correction").

## 17 Nov 2026 — Lagocine's line on every page; Filmhouse outreach (D-128, D-129)

- **Outreach (Chime: "Send the mail for me"):** sent from ekpenduchimezie1@gmail.com to Filmhouse (sales@, cc info@, from its contact page) and CINEsync (inquiries@); FilmOne left as a Gmail draft for Chime (Claude Code's safety check stopped the third send). Replied to Lagocine's 11 Nov yes: our stack, what we read, his link, and whether Filmhouse's times will come back. Instagram and LinkedIn messages drafted for Chime to send. IMAX's site answers our bot with a Cloudflare challenge (403), so it is not a source.
- **Changed:** `LAGOCINE_LINE` and `LAGOCINE_URL` in `src/lib/wording/films.ts`; the shared footer links to Lagocine on every page (D-129). Test first: `tests/e2e/lagocine.spec.ts` red (element not found), then green on ten pages.
- **Checked:** footer at 390 and 360 (link 333 × 44, no side scroll), types, lint.
- **Timer:** cron-job.org starts the refresh job at 06:17, 12:17, 16:17 Lagos (D-128); test run 204.

## 17 Nov 2026 — the job on GitHub; Ozone and Sky back on Lagocine (D-127)

- **First job run with every reader (GitHub, 10:14 UTC, started by hand):** every source read except Ozone, which answered 403 for its page for tomorrow; the run kept Ozone and Sky's last good times and raised a `::warning::`, as D-119 intends. lagos.json 16.4 KB, abuja.json 5.4 KB; 520 Lagos and 181 Abuja showings; committed by the job as `0f70a90`.
- **Changed:** Ozone and Sky go back on Lagocine's list (D-76, D-127); `reachcinema` feeds no cinema and its pages are kept in its notes; `live.ts` skips a cleared source that feeds no cinema (test red then green). Two tests changed with the data: the page-names test no longer expects the paused source, and its stand-in reader returns a Viva row.
- **Review of D-124/D-125 (high --fix, `095c1ec`):** fixed Reach's padded day ("Dec 07", which would have failed Ozone, Viva and Nova from the 1st to the 9th of each month), one per-day loop, one tab-label helper, gzip once, `isCity` in `pageFiles`. Left: Sky's day check needs the live page looked at; the 30 s wait after a click; rows lost on a just-moved cinema's first failure; Genesis's error wording when every film page times out.
- **Schedule:** GitHub has not run the job on its schedule yet (only the two runs started by hand); checked again at 11:17 UTC.
- **Not verified:** Chime's phone.

## 17 Nov 2026 — readers for the script-built sites, and the data budget per city (D-125, D-126)

- **Changed:** `browser.ts`: `click` (a date tab, clicked once the page settles, marked `data-sinima-clicked`, read when the network has been quiet 0.5 s; no match = page as it is). New `reach.ts` (Reach Cinema: dated addresses for Ozone, Viva and Nova with the highlighted slide checked; Sky's tabs clicked; the page must name the cinema in `pageNames`), `ebonylife.ts` (date clicked; each booking link's `showtimeDate` must be the day), `thc.ts` (tab clicked; the white tab must be the day), `magnificent.ts` (review.html, tab clicked; the pressed tab must be the day), `tabbed.ts` (the shared click-per-day reader: two loads per cinema; no times on any day fails the source). `dates.ts`: `shortMonth`, `shortWeekday`, `longWeekday`, `ordinal`, `isoDay`; `monthNumber` reads "Nov". `raw.ts` `Reader` gets `names`; `live.ts` passes `pageNames` and runs the six new sources. `reduce-fixture.ts`: rules `reach-day`, `reach-tabs`, `ebonylife`, `thc`, `magnificent`. `data/sources.json`: `cinemaPages` (and `pageNames` for Reach) for reachcinema, viva, nova, ebonylife, thc, magnificent; Lagocine's `cinemaIds` 14 → 8; notes. `data/film-aliases.json`: AGBARANLA, CLAY FACE, WHALE FALL. **Per-city data (D-126):** `assemble.ts` `pageFiles` writes `lagos.json` and `abuja.json` (and `data/live/` copies); `loadCity` reads its city's file; `refresh.ts` `pageLoads`/`overBudget`: the budget holds for each city and area file, not all.json (build-time only) or showtimes.json; e2e `dataFile` reads the city files. DATA.md (readers table, `pageNames`, per-city files), PLAN (script-built readers ticked), D-125, D-126.
- **Browser check for D-126:** grep of `src/`, `public/sw.js`, `src/lib/offline.ts`: the only data file the browser fetches is `/data/search.json` (search); no browser code fetches `all.json` or an area file. all.json is read at build time by About and the search index.
- **Fixtures (rendered once each through `politeBrowser`, our bot name, 17 Nov 01:38–01:45 UTC, cut down, listed in `tests/fixtures/index.json`, none as sample):** `reachcinema/2026-11-17-{ozone,ozone-nov-18,sky-nov-17th,sky-nov-18th}.html`, `viva/2026-11-17-{ikeja,lekki-empty}.html`, `nova/2026-11-17-{lagos,abuja}.html`, `ebonylife/2026-11-17-movies-{17,18}-nov.html`, `thc/2026-11-17-home-nov-{17th,18th}.html`, `magnificent/2026-11-17-review-{17,18}.html`. Exploration loads besides those (to learn the layouts and how each day is reached): 6 first renders, Ozone 18 Nov and 18 Dec, Viva Ikeja, Nova Abuja, Sky, Magnificent review.html, and three click tests in a plain Playwright script under our bot name (Ozone, Sky, EbonyLife, Magnificent, THC; the THC one failed on a wrong selector).
- **Red runs seen:** `browser.test.ts` 2 failed ("clicks the control it is given…": `expected 'today' to be 'tomorrow'`; Chromium "clicks a tab, waits…": `expected '<!DOCTYPE html>…' to contain '8:15 PM (18th)'`). `reach.test.ts`: `Cannot find module '../../../../scripts/sources/reach'`; then 4 failed on the Sky tests (`no date tabs found`: the parser looked under `main`, the cut-down fixture's root is `article`). `ebonylife.test.ts`, `thc.test.ts`, `magnificent.test.ts`: `Cannot find module`. `live.test.ts` 2 failed (`expected [ 'bluepictures', 'genesis', …(3) ] to deeply equal [ 'bluepictures', 'ebonylife', …(9) ]`; pageNames `expected { reachcinema: undefined, …(2) }`); then the no-double-feed test (`expected [ 'ebonylife-vi', 'ozone-yaba', …(4) ] to deeply equal []`) until the six left Lagocine. `refresh.test.ts` 5 failed (`pageLoads is not a function`; city files missing). `films.test.ts` 2 failed (the new aliases). Passed first time: the dates label tests, the registry `pageNames` test.
- **Tests changed because the data changed:** `live.test.ts`'s run-mechanics tests now use a copy of the registry with Lagocine's 14 cinemas as on 17 Nov (`LAGOCINE_ON_17_NOV`), since today's 8 leave too few rows on the 11 Nov page for their checks; `refresh.test.ts` writes 20 files, not 18; `films.test.ts` pins the alias file with the three new aliases.
- **Live runs (two):** 01:54 UTC: every source read, nothing written: all.json 21.9 KB gzipped, over the 20 KB limit (an offline rebuild from the saved pages and the 00:55 set gave the same 729 rows and 21.9 KB; booking links ≈ 7.9 KB). Reported to the coordinator, who chose per-city files (D-126). 02:06 UTC, after D-126: every source ok, 729 showings, 34 films. Reach 82 (Ozone 20 + 20, Sky 21 + 21), Viva 38 (19 + 19), Nova 98 (Lagos 26 + 26, Abuja 23 + 23), EbonyLife 38 (28 + 10), THC 22 (11 + 11), Magnificent 68 (34 + 34), Silverbird 167, Genesis 141, Grand 24, Blue Pictures 7, Lagocine 44 (Filmworld 22 + 22; Filmhouse none at 03:06 Lagos). The six match what Lagocine listed for them at 00:55. Files: lagos.json 16.8 KB, abuja.json 5.7 KB (limit 20 each), all.json 21.7 KB (not budgeted), largest area file victoria-island 3.7 KB. Page loads a run: Reach 4, Viva 2, Nova 4, EbonyLife 2, THC 2, Magnificent 2, plus robots.txt per host; the run took 7 min (5 s per host). Filmworld's Veezi page checked once at 02:52 Lagos: still "No shows currently scheduled"; it stays on Lagocine.
- **Checked:** see the commit's gate run (lint, typecheck, unit, sample build, e2e, budget).
- **Motion skills:** none run; no UI change.
- **Not verified:** the scheduled job on GitHub with the browser readers (Chromium install, run time with 16 page loads); a single-digit day's Reach address (`Mon+Dec+07+2026`, the padded form `Date.toDateString` writes) against the live site; how the Reach pages, EbonyLife, THC and Magnificent show a day with nothing on (only Viva Lekki's empty page was seen); THC's started times (`disabled`) are still read as showings; Chime's phone.
- **Next:** check the 06:17 scheduled run's log; "Maybe Or Maybe Not" (Magnificent, Silverbird) vs "Maybe… Maybe Not" (D-123 f); Filmworld once its Veezi page lists times.

## 17 Nov 2026 — reader fixes from the D-122 review (D-124)

- **Changed:** `polite.ts`: `PageError` (a failed page's `status`) and `pageMissingOrSlow` (404, 410 or a timeout; never 401, 403, 429). `genesis.ts`: a film page that is gone or slow is skipped with a log line, a refusal still stops the read; each location's booking-link name comes from `bookingSites` in `data/sources.json` (checked against the page's links), so a location with nothing today keeps its tomorrow. `raw.ts` `Reader` gets `sites`; `live.ts` passes each source's `bookingSites`. `dates.ts` `dateNearest`: nearest year, then the year after for a date behind the day read whose weekday only agrees next year; `veezi.ts` passes the weekday through it. DATA.md (`bookingSites`, live-data rules), D-124, Genesis's source note.
- **Red runs seen:** `polite.test.ts` "says which status a failed page answered…": `AssertionError: The instanceof assertion needs a constructor but undefined was given.` `dates.test.ts` "takes next year for a date far ahead…": `Error: 21 May is not a Friday in 2026`. `veezi.test.ts` "reads a booking date more than six months ahead…": `Error: Veezi page: "Friday 21, May" is not a Friday in 2026`. `genesis.test.ts`: "skips a film page that answers 404…": `PageError: https://genesiscinemas.com/ceddi-plaza-abuja/film/2769/spiderman-brand-new-day answered 404.`; "keeps tomorrow's times at a location that has nothing on today": `expected [] to deeply equal [ …(2) ]`; "refuses to read when a cinema has no site in the data…": `promise resolved "[ { …(3) } ]" instead of rejecting`. `live.test.ts` "gives Genesis's reader each cinema's name…": `expected undefined to deeply equal { …(4) }`. Passed first time (behaviour already right, now pinned): the refusal test (401/403/429 stop the read), "counts a page that did not answer in time as missing", the registry `bookingSites` test.
- **Checked (numbers):** unit 762/762, lint 0 errors (10 warnings in untracked `mockup/`), typecheck clean, sample build, e2e 270 passed with 2 flaky that passed on retry (`audit.spec.ts` F3, `motion-poster.spec.ts`; motion specs untouched by this unit), budget passes.
- **Not verified:** a real 404 or timeout from genesiscinemas.com (fakes only); the next live run.
- **Next:** readers for the script-built sites (Reach, EbonyLife, THC, Magnificent).

## 17 Nov 2026 — own readers: Veezi, Genesis, Grand, Blue Pictures (D-122, D-123)

- **Changed:** `scripts/sources/dates.ts` (shared: 12- and 24-hour clocks, nearest-year dates with the weekday checked, late shows before 04:00 on the next day, today-and-tomorrow window; every time through `lagosLocalToUtc`). `veezi.ts`: `readVeezi` (one sessions page per cinema; each booking link must carry that cinema's own `siteToken`; only `/sessions/?siteToken=` addresses are read), nearest-year dates, "No shows currently scheduled" read as none. New `genesis.ts` (location pages, then one film page per film, at most 30; VIP as the format; a film page with no times skipped with a log line), `grand.ts` (weekday tabs), `bluepictures.ts` (today only). `raw.ts`: the shared `Reader` type and `notes` for the run's log. `live.ts`: readers for `silverbird`, `genesis`, `grand`, `bluepictures`, each given its source's `cinemaPages`; notes go to the log. `data/sources.json`: `cinemaPages` for Silverbird, Filmworld, Genesis, Grand, Blue Pictures; Lagocine's `cinemaIds` 20 → 14; notes. `data/film-aliases.json`: Isakaba's four spellings and Tele & Zikora. `reduce-fixture.ts`: rules `veezi-empty`, `genesis-location`, `genesis-film`, `grand`, `bluepictures`. About: each city's line counted from the built times (`cityReading`, `cityReadingLine`) in place of "being researched". DATA.md (§Source registry `cinemaPages`, §Live data readers table), PLAN week 3 line split, the workflow's header comment.
- **Fixtures (saved once each through `politeFetcher`, our bot name, 5 s apart, 17 Nov 00:14–00:18 UTC, cut down, listed in `tests/fixtures/index.json`, none as sample):** `genesis/2026-11-17-{lekki-purple,festac,maryland,ceddi-plaza}.html`, `genesis/2026-11-17-film-{street-fighter,spiderman-brand-new-day}.html`, `grand/2026-11-17-home.html`, `bluepictures/2026-11-17-home.html`, `silverbird/2026-11-17-galleria-empty.html`, `filmworld/2026-11-17-idimu-empty.html`. Exploration requests besides those: Genesis home, `/buy-tickets/`, the jacro `script.js` (to see how date tabs load: `admin-ajax.php`), one more film page (the Cat in the Hat, after the first live run); Silverbird Ikeja's Veezi page (not kept; the 11 Nov fixture stays).
- **Red runs seen:** `dates.test.ts`: `Cannot find module '../../../../scripts/sources/dates'`. `veezi.test.ts`: 6 failed (`Veezi page: "Thursday 31, December" is not a Thursday in 2027`; `Veezi page: no films found. Has the page layout changed?` on Galleria's empty page; `TypeError: readVeezi is not a function` ×4). `genesis.test.ts`: `Cannot find module '../../../../scripts/sources/genesis'`; later "skips a film page that shows no times…": `Error: Genesis film page: no showtimes found. Has the page layout changed?`. `grand.test.ts`, `bluepictures.test.ts`: `Cannot find module`. `live.test.ts`: 2 failed (`expected [ 'lagocine' ] to deeply equal [ 'bluepictures', 'genesis', …(3) ]`; `expected undefined to deeply equal { Object (grand-lekki) }`). About: `cityReading is not a function`, `cityReadingLine is not a function` (5 failed). Written after the code, so no red run: the live log-notes test, the alias merge test, the About e2e lines.
- **Tests changed because the data changed:** `live.test.ts` runs Lagocine's reader alone where it reads the saved day page (other readers now exist); `films.test.ts` pins the alias file, now with D-122's four aliases; `about-screen.spec.ts` reads Lagocine's cinema count from the registry (14, not 20).
- **Live runs (two, the brief's limit):** 00:53 UTC: Genesis failed on a film page with no times (nothing kept, none earlier); the others read. Fixed (skip such a page with a log line; fail only if none shows times). 00:55 UTC: every source ok. 631 showings, 37 films, all.json 16.2 KB gz (limit 20). Silverbird 167 (Ikeja 28 + 28, SEC 30 + 30, Jabi 27 + 24, Galleria none), Genesis 141 (Lekki 17 + 16, Festac 15 + 15, Maryland 19 + 19, Ceddi Plaza 21 + 19; 21 VIP; three VIP film pages showed no times, those films today only), Grand 12 + 12, Blue Pictures 7 (today), Lagocine 292 for its 14 (312 rows left out at cinemas it no longer feeds). Requests per run: Lagocine 2, Veezi 4, Genesis 30 (4 + 26 film pages), Grand 1, Blue Pictures 1, plus one robots.txt per host.
- **Checked (numbers):** unit 751/751 (`npx vitest run --maxWorkers=2`), lint 0 errors (10 warnings, all in untracked `mockup/`), typecheck clean, sample build (`refresh --fixtures --now <today>T07:00:00Z && next build`), e2e 271 passed, 1 flaky (`audit.spec.ts` F5 heart on Enter, passed on retry; untouched by this unit; a first run showed 268 + 3 flaky in the same motion/colour specs), budget: about.html 201.3 KB of 225 (JS 154.6 of 165).
- **Motion skills:** none run; no UI motion added (About gains two data-driven sentences in existing slots).
- **Not verified:** the scheduled job's run of the new readers on GitHub; the aliases apply from the next live read (the committed data/live was read before they were added, so Isakaba and Tele & Zikora still show as several films until 06:17 Lagos). Filmworld's Veezi page in daytime. Chime's phone. "Maybe Or Maybe Not" vs "Maybe… Maybe Not".
- **Next:** script-built readers (Reach for Ozone and Sky, Viva, Nova Lagos and Abuja, EbonyLife, THC, Magnificent) through `renderText`; re-check Filmworld's Veezi page; watch all.json against the 20 KB limit as more readers add booking links (16.2 KB now).

## 17 Nov 2026 — Abuja: the city layer (D-120, D-121)

- **Changed:** `data/cinemas.json`: `city` on every area; Abuja's areas (Central Business District, Jabi, Lugbe, Kuje; neighbours CBD–Jabi, CBD–Lugbe, Lugbe–Kuje) and five cinemas (`silverbird-sec`, `silverbird-jabi`, `genesis-ceddi-plaza`, `nova-abuja`, `jays-kuje`), addresses only for Nova and The Jays (their own pages). `data/sources.json`: the Abuja ids in `silverbird`, `genesis`, `nova` (not Lagocine). `data/logos.json` `withoutLogo` for The Jays. Silverbird SEC's and Jabi's Veezi pages saved once each (17 Nov 00:38 Lagos, `politeFetcher`, SinimaBot UA, 5 s gap), cut down with `reduce-fixture.ts veezi` into `tests/fixtures/silverbird/2026-11-17-{sec,jabi}.html`, listed as sample in `tests/fixtures/index.json`; `refreshFromFixtures` reads `veezi-sessions` pages with `parseVeeziSessions`. App: `lib/data/cities.ts` (`inCity`, `cityOfCinema`), `load.ts` (`Area.city`, `areasIn`, `cityOfArea`, `loadCity`); all seven `[city]` routes build both cities from the city's own data (films per city they show in, cinemas and areas under their own city); screens take `city` and name it through `CITY_NAMES` / `lib/wording/city.ts` `cityWords`; search index cinemas carry their area's city; city sheet lines per city; Where's Abuja card from the data; search's no-match action names the page's city; Cinemas title stickers per city; old `/film`, `/cinema`, `/area` forwards for Lagos only. Removed `app/abuja/*`, `CityComingScreen`, `components/city/city.module.css`, `comingWords`, `WHERE.abuja`. DATA.md §Cinema registry, PLAN ticks, D-120, D-121.
- **Red runs seen:** `registry.test.ts` "two cities (D-120)": 5 failed (`lekki: expected [ 'lagos', 'abuja' ] to include undefined`; `expected {} to deeply equal { …(4) }`). `refresh.test.ts` "holds Abuja's sample times…": `expected [] to have a length of 30 but got +0`. `search.test.ts` "keeps only what a result shows, each cinema with its area's city": `expected { sample: true, …(4) } to deeply equal …` (Abuja's cinema came out as Lagos); `cities.test.ts` failed to import (`@/lib/data/cities` did not exist). The Veezi parser tests on the two new fixtures passed first time (the parser already existed). The e2e specs were written after the build already had the change, so their red was not seen; while iterating, three failed for real reasons and were fixed in the tests: "Enter in search on an Abuja page" (Films filters in place, so it now starts from /abuja/cinemas), "both cities groups the results" (Spider-Man has no Abuja show after 5:30 PM; now Street Fighter), and the city sheet's old Abuja line.
- **Checked (numbers):** sample data 699 showings, 35 films (Abuja: SEC 30 + 30, Jabi 27 + 24; 5 films only in Abuja; "AGBARA NLA" merges into "Agbara Nla: The Return"); all.json 14.3 KB gz (limit 20), central-business-district.json 2.1, jabi.json 1.8. Build: 2 cities × 4 tabs, 46 film pages (30 Lagos, 16 Abuja), 27 cinema pages, 16 area pages. Unit tests 699/699 (`npx vitest run --maxWorkers=2`), lint 0 errors (10 warnings, all in untracked `mockup/`), typecheck clean. e2e full suite 272/272 (`CI=true npx --no-install playwright test --retries=0`, 2.9 min), including the new `abuja.spec.ts` (Films lists Abuja's films only; Cinemas lists its 5, The Jays "Times not available yet"; Silverbird Jabi's page shows Street Fighter's times, back to Abuja's cinemas; Dear Ajayi's page says "Times in Abuja" and no "Lagos"; Lagos Cinemas lists 22 and no Abuja cinema; area page). Budget: Lagos Films 219.8, Cinemas 221.3, Soon 219.5, Yours 217.4, area 219.0, cinema 216.6, film 217.7, Abuja Films 215.1 (limit 225). Screenshots at 390×844 and 360×800 of Abuja and Lagos Films and Cinemas: same layout, stickers and circled city; no horizontal overflow at either width.
- **Tests changed because Abuja changes what they assert:** `refresh.test.ts` (16 areas not 12, 18 files not 14, Lagos counts now filtered to Lagocine's rows, 35 films not 30, the AGBARA NLA merge in the log, 294 + 30 + 24 tomorrow); `search.test.ts` (`searchIndex` takes the area-to-city lookup; Abuja's cinema is in Abuja); `logos.test.ts` (a chain may be listed in `withoutLogo` with a decision number, and must then really have none); `where.test.ts` (`WHERE.abuja` removed; Abuja's line from its areas); `wording/search.test.ts` (`noMatch` takes the page's city); e2e: 14 specs that compare `/lagos` pages with `all.json` now read `dataFile(request, "lagos")` (all.json cut to Lagos's cinemas, `helpers.ts`), because all.json holds both cities; `city.spec.ts` (Abuja's placeholder tests replaced by: titles and /abuja links, each page only under its own city, old addresses Lagos only, Enter lists matches on Abuja's Films); `search.spec.ts` (both-cities grouping with an Abuja group, a film only in Abuja, no-match in Abuja); `round2.spec.ts` (the city menu's per-city lines).
- **Motion skills:** none run; no motion was added or changed (the screens are the existing ones with another city's data).
- **Not verified:** Chime's phone. The live site: `refresh --build` keeps the cinemas of the last live read, so until the next scheduled live run Abuja's tabs on the deployed site list no cinemas, and after it they list Abuja's five with "Times not available yet" until the Silverbird, Genesis and Nova readers exist (next unit). The Jays's logo. Abuja's addresses for SEC, Jabi and Ceddi Plaza. Code review left to the coordinator.
- **Next:** live readers for Silverbird's Veezi (SEC, Jabi, then Ikeja leaving Lagocine), Genesis (Ceddi Plaza and the Lagos three) and Nova (Lugbe, Sangotedo) through `renderText`; consider the tab bar's saved count per city (D-121 e).

## 17 Nov 2026 — shared reading pieces: headless fetcher, film matching, last good data (D-119)

- **Changed:** `scripts/sources/browser.ts` (`politeBrowser`: Playwright's Chromium under the D-77 rules, using `politeRules` now exported from `polite.ts` (pacing, robots.txt, the same-site check), our bot name as the user agent, 30 s to answer and 30 s to render, a non-2xx page final, each redirect fetched without following and checked before its target opens, off-site refused, images/fonts/media aborted, script navigations stopped, service workers blocked, one browser per run started on first use, `close()`); `refresh --live` shares one set of rules between the fetcher and the browser and always closes the browser. `matchFilms` in `scripts/pipeline.ts` (same id, or short title + ":" / " - " / " – " / " — " into the one longer film; never a bare prefix; two longer candidates leave it apart and log it; mixed case preferred for the shown title); `data/film-aliases.json` with `"ramayana-rise-of-a-legend": "ramayana"` (Chime's coordinator chose this over rewriting the e2e specs: keeps /film/ramayana, the Figma example and shared links). Credits, posters and trailers are looked up under the merged id, then each spelling's id (`creditsLookup`); `tmdb.ts` does the same for `tmdb-overrides.json` and its saved answers (a head spelling only when one film showing starts with it). `refreshLive`: a source whose read throws keeps its previous rows (its cinemas, today on, original `fetchedAt` and `via`), `health: "failing"`, `lastOkAt` kept; the run fails only when every source fails; readers can be injected and get `renderText`. Workflow installs Chromium (`npx playwright install --with-deps chromium`) before the read. DATA.md §Live data, D-119.
- **Red runs (all seen):** `browser.test.ts` against a stub: 8 failed ("names itself…": `Error: not built yet`; "refuses a path robots.txt disallows": `expected [Function] to throw error matching /robots\.txt/ but got 'not built yet'`). `films.test.ts`: 13 failed (`TypeError: matchFilms is not a function`; `ENOENT … data/film-aliases.json`; buildShowtimes `expected [ Array(2) ] to deeply equal [ ObjectContaining{…} ]`). `live.test.ts`: 4 failed (`Error: lagocine.com answered 503` — one failing source still killed the run; the all-fail test `got 'lagocine.com answered 503'` without the second source's error). Credits fallback: 4 in `films.test.ts` (alias `expected {} to deeply equal …`; `expected [ [ 'agbara-nla-the-return' ], …(1) ]` without spellings; creditsLookup found no poster under the spelling) and 1 in `tmdb.test.ts` (no `as TMDB 1792115 (by hand)`).
- **Checked:** the real Chromium test (local server on 127.0.0.1: script-built list rendered with `waitFor`, our UA on the page request, no image request, a 302 to `localhost` refused with no request reaching it, robots-disallowed path and a 404 refused) passes in 0.4 s, skipped where Chromium isn't installed (CI's unit step); no browser left running. On today's live titles no film id changes and no credits are lost; the two possible merges (AGBARA NLA, Ramayana) land on ids credits.json holds. `npm run lint` (0 errors; 10 warnings in untracked `mockup/`), `npm run typecheck`, `npx vitest run --maxWorkers=2` 676/676; sample build; e2e 264/264 (`CI=true npx playwright test --max-failures=1`, 2.8 min); budget passes.
- **Tests changed because the data changed shape:** `refresh.test.ts` sample data has 30 films, not 31 (the two Ramayanas are one), and its log gains `films: "Ramayana: Rise of a Legend" is shown as "Ramayana"`. Two live-test expectations compare kept rows with a good read at the same hour, because the validator drops shows that ended over an hour before the run. `film-screen.spec.ts`: the merged Ramayana is at 16 cinemas on the sample day, not 10, so the facts line now counts them from the data; the area orders (Lekki kept: Lekki, VI, Sangotedo, then Maryland 6:45, Festac 6:50, Agege 7:05, Yaba 7:10, Surulere 7:50; no area: VI 5:40 first), the "Started earlier" line (Viva 11:40 AM and Filmworld 5:00 PM added) and the two-to-a-row pair (Sangotedo and Maryland) were each checked against the sample showings before being written in.
- **Not verified:** a real script-built cinema site (no reader yet; nothing fetched in this unit); `npx playwright install --with-deps chromium` on the GitHub runner (first scheduled run); the build step (`liveBuildFiles`) re-applies credits by film id only, so a poster found under a spelling's id at read time lasts until `tmdb.ts` saves it under the merged id (it runs right after the read when the secret is set). Code review not run in this unit (left to the coordinator).
- **Next:** the cinema readers (Veezi, Genesis, Grand, Blue Pictures; Reach, EbonyLife, THC, Magnificent through `renderText`), each dropping its cinemas from Lagocine's `cinemaIds`; consider "Maybe Or Maybe Not" / "Maybe… Maybe Not" (two ids today) for an alias once checked by eye.
- **Review (code-review high --fix, after the commit):** 10 findings, 4 fixed: credits found separately for TMDB and Chime's own entries across a film's spellings; the build step changes a film only when something is saved under its id (`savedOnly`); an error closing the browser no longer fails a run that wrote its data; a misplaced doc comment. Plus a GitHub `::warning::` on the run when a source can't be read, so a failing site doesn't pass unseen. Three regression tests added.
- **Left on purpose:** the headless browser lets a page make its own requests (scripts, its API calls) as a visitor's browser would; robots.txt and the 5 s gap apply to the pages we open (D-77 allows script-built pages read "the way a visitor sees it"). A short title still merges into its only subtitled film ("Wicked" into "Wicked: For Good" if both ever show); an alias splits them. tmdb.ts and the pipeline find a film's spellings two ways (a later refactor). Chromium is installed on each run although no reader needs it until the next units.


## 16 Nov 2026 — trailers on YouTube, and TMDB for the live films (D-117)

- **Changed:** `pickTrailer` in `scripts/credits.ts` (YouTube, type Trailer, official → English → newest); `tmdb.ts` asks for videos, re-asks any saved film without a trailer field, and looks up the live films as well as the sample ones; `trailerKey` on films (validator: an 11-character YouTube id or null); `trailer` on ListFilm; "Watch the trailer" (secondary button, external-link icon) under Stay or Go on the film page; the build step puts today's `credits.json` on the live films; the scheduled job runs `tmdb.ts` after each read when the `TMDB_READ_TOKEN` secret is set, and commits `data/credits.json`.
- **TMDB run:** 20 of 37 films matched (all 20 with posters), 19 with a trailer. Matches read by eye; five trailer keys checked against YouTube's oEmbed titles, all the films' official trailers.
- **Checked:** red then green: `tests/unit/scripts/trailer.test.ts`, `tests/unit/lib/data/trailer.test.ts`, the build-step credits test; `tests/e2e/trailer.spec.ts` (href, new tab, noopener, accessible name, no button without a trailer); 647 unit tests; screenshots at 390 and 360 (button 184 × 47).
- **Tests changed because the data changed shape:** whole-object expectations in `select.test.ts` and `credits.test.ts` gained `trailer`/`trailerKey: null`; `tmdb.test.ts`'s fake TMDB answers the new address (`keywords,videos`) and now checks the trailer it keeps.
- **Review:** code-review medium --fix, no bugs; fixed: a failed TMDB step no longer stops the showtimes commit (`continue-on-error`), the token is set only on the TMDB step, the screen-reader words are a `more` field instead of a slice, one JSON reader in tmdb.ts. Skipped: the build step's validator log, and films losing a poster when credits.json drops them (as D-117 intends).
- **Tests that held TMDB's numbers:** `film-screen.spec.ts` wrote Ramayana's runtime ("3 h 21 min") and calendar end ("9:21 PM") from 201 min; TMDB now says 195. Both now read the runtime from the data. Flagged to Chime.
- **Real-clock tests (D-118):** `motion-poster.spec.ts`, then `audit.spec.ts`, opened Films on the real clock and found no film card to tap near midnight; a copy at the sample day's noon passed, so the hour was the cause. With Chime's OK, `tests/e2e/test.ts` now gives every page the sample day's noon unless the test sets its own clock (Playwright: a second `install` replaces the first, checked); all 29 specs import from it. Full suite: 263 of 264 passed; the offline file opts out with `test.use({ realClock: true })`, because the worker saves files on timers a fake clock holds back (4 of 4 then passed).
- **Motion skills:** not run for this unit; the button is the existing `Button`, which already fades its hover and press (DESIGN.md §Motion).
- **Not verified:** Chime's phone; the job's TMDB step (needs the secret).

## 16 Nov 2026 — live data, Lagos through Lagocine (D-116)

- **Why the site was still a demo:** every source but Filmhouse's own was cleared on 15 Nov, but `refresh` could only read saved pages, only 2 readers existed (Lagocine, Veezi), the scheduled job was off, and Abuja has no cinemas in the data yet.
- **Changed:** `scripts/sources/polite.ts` (our bot name, robots.txt per path including after a redirect, 5 s per host, 30 s timeout, a refusal is final); `scripts/live.ts` (`refresh --live`: Lagocine's day pages for today and tomorrow, only its `cinemaIds`, into `data/live/`; any failure writes nothing); `scripts/assemble.ts` (the step sample and live data share, moved out of `refresh.ts`); `refresh --build` as `prebuild` (live data split again for the build's areas, else sample data); `refresh-showtimes.yml` on at 06:17, 12:17, 16:17 Lagos, commits `data/live/`, rebases before pushing. DATA.md §Live data, D-116.
- **First live run:** 16 Nov 22:10 UTC, 260 showings (today's remaining and tomorrow's), 33 films, all.json 8.9 KB gzipped; a build on it has no Sample banner and the cinema page's Book goes to Genesis's own site.
- **Checked:** unit tests for polite.ts (robots rules, gap, UA, 403, redirects, empty agent) and live.ts (pages read, real links, cinema filter, failure, build step); 636 unit tests; e2e on a sample build. The red run was not seen: proof's memory guard blocked it (the tests failed at import before the modules existed). code-review high --fix: 9 findings, 5 fixed (above), 3 skipped (gap from sources.json, maxRunsPerDay enforcement, one UA string).
- **Verifier (fresh context):** 6 of 8 passed at first. Fixed both gaps: redirects are now followed by hand, each hop checked against robots.txt and the site before it is requested, with the 5 s gap and at most 3 hops (two tests, red then green); the cinema-filter test now drops EbonyLife from Lagocine's list in a copy of the registry and checks its rows go (shown to fail with the filter switched off).
- **Filmhouse in the first run:** only 2 rows, because the run was at 23:10 Lagos, when today's had ended and Lagocine had not yet listed Filmhouse's tomorrow. Today's saved page has 15 Filmhouse rows across 5 cinemas, so the reader handles them. 15 Lagos cinemas had times in that run; check Filmhouse after the 06:17 run.
- **Found:** a build made with live data fails sample-data e2e tests (About says "In use"; no IMAX left late at night). Rebuild with `refresh --fixtures --now <today>T07:00:00Z && next build` before the gate.
- **Not verified:** the scheduled job on GitHub (first run after the push); films new to live data have no TMDB match (no poster, runtime or credits) until the TMDB unit.
- **Next:** TMDB matching in the job and trailers; Abuja (cinemas, Veezi live for Silverbird SEC and Jabi, then Genesis and Nova); each Lagos cinema's own reader.

## 16 Nov 2026 — security patch: Next.js 16.4.6 (D-115)

- **Why:** `next build` printed a security notice. `npm audit`: 8 moderate, from two advisories: GHSA-mfr8-8qww-v76h (Next.js 16.3.0–16.4.4, `'use cache'` through `unstable_cache()` on a running server) and GHSA-g3hv-75wg-m249 (minimatch under typescript-eslint, dev only). Neither reached the live site (static export, neither feature in `src/`, minimatch not shipped); Chime chose to patch.
- **Changed:** `next` and `eslint-config-next` 16.4.3 → 16.4.6 (exact), typescript-eslint refreshed in the lockfile. CLAUDE.md stack line and D-115. The upgrade tool's own command was not used; the versions were set by hand.
- **Checked:** `npm audit` 0 vulnerabilities; build shows Next.js 16.4.6, 147 pages, no notice; full gate green (lint, unit, typecheck, e2e, budget). Code review skipped: no source change.
- **Not verified:** the portfolio repo still pins 16.4.3.

## 16 Nov 2026 — 12-hour clock (D-114)

- **Changed:** `formatTime` in `src/lib/time/lagos.ts` says "7:30 PM" (no leading zero, no-break space, "12:00 AM" midnight, "12:00 PM" noon); `formatLateTime` follows ("12:30 AM (Sat)"). Every on-screen and screen-reader time goes through it. `icsFileName` keeps "1930" from `toLagos`. Example times in the wording doc comments and the `/kit` labels moved to 12-hour; rule comments ("the evening ends at 04:00") stay. CLAUDE.md rule 1 updated.
- **Tests:** red first in `tests/unit/lib/time/lagos.test.ts` (midnight, noon, 9:05 AM, 10:45 PM, 11:59 AM, late-night day); 13 wording test files' expected text moved to 12-hour; `refresh.test.ts` got its own 24-hour `clock` helper because it sorts times as text (7:30 PM would sort after 10:00 PM). e2e: `shownClock` in `tests/e2e/helpers.ts` for expected on-screen times; `lagosClock` stays 24-hour for finding a showing by its time.
- **Checked:** 620/620 unit tests; e2e time files on a build with the 08:00 sample data; no time chip wraps or overflows and no side scroll on film, cinema, Starting soon and Films at 390 and 360 (Chromium, measured); worst case "Next 10:30 PM · 11 cinemas" stays one line at 360.
- **Review:** code-review medium --fix found no bugs; it added `clock24` (for file names and sort keys, never the screen) and moved stale 24-hour examples in comments and SPEC. Shared text (`shareText`) now uses a plain space before PM, red then green. Full gate green: lint, 620 unit, typecheck, e2e, budget.
- **Skills that ran:** proof:build, code-review (medium --fix).
- **Not verified:** Chime's iPhone; Abuja pages by eye (same code).

## 16 Nov 2026 — posters through Sinima's own address (D-113)

- **Bug:** on Chime's iPhone on MTN every poster showed Safari's broken-image icon; on Wi-Fi and on the PC they loaded. Chime confirmed: MTN can't reach `image.tmdb.org`, Wi-Fi can.
- **Diagnosis:** live markup fine, TMDB sends `access-control-allow-origin: *`, Playwright WebKit at iPhone size loads 8/8 posters from the live site with and without the service worker. So the code was fine; the network blocks TMDB's image CDN (a known ISP pattern).
- **Changed:** `vercel.json` rewrites `/poster/:size(w154|w342|w500)/:file` to TMDB (only those sizes) with rewrite caching on; `src/lib/data/posters.ts` (`posterSrc`, `posterSrcSet`) gives `/poster/` on Vercel builds (`VERCEL` set → `POSTER_BASE` in `next.config.ts`) and TMDB directly elsewhere; `Poster.tsx` and `SearchOverlay.tsx` use it; `sw.js` keeps `/poster/` copies in the posters cache.
- **Test fixed:** `tests/e2e/states.spec.ts` "films without a poster…" ran on the real clock and failed after about 21:00 Lagos (8 films, 2 without posters, against 29 and 15 at noon); it now freezes the clock at the sample day's 12:00 like the other e2e tests. Flagged to Chime.
- **Checked:** red then green `tests/unit/lib/data/posters.test.ts` (4 tests); `VERCEL=1 next build` has no `image.tmdb.org` left in `out/` except `sw.js`; e2e on a build made with the 08:00 sample data; code-review medium --fix (no bugs; fixed a duplicated srcSet and a long comment); proof:verifier 6/6.
- **Not verified yet:** `/poster/` on the live deploy and Chime's iPhone on MTN after the deploy.
- **Skills that ran:** proof:build, code-review (medium --fix), proof:verifier.

## 16 Nov 2026 — motion audit and its 22 picks (D-112)

- **Audit (read-only, one pick page):** skills in order: improve-animations (32 animations), review-animations by hand (block on small fixes only), animation-performance (Chromium at 4x and 8x CPU, WebKit, desktop; rAF deltas, long frames, traces), remove-animations (report only), find-animation-opportunities (3 of 17 kept), animation-vocabulary. Pick page `mockup/motion-audit/index.html`; Chime took every recommendation.
- **Built, in 8 units:** F1 heart pop eased per keyframe · F4/F5/C7 `ui/inputMode.ts` marks `html[data-input=keys]`: sheets, search panel, chevrons, the heart, let go and Show more have no motion after a key · F10 lift keeps the fill fades · F11 reduced-motion fixes · F12 started line draws by clip · C4 cascade capped at 275 ms · C5 no search fade · C6 no row chevron nudge · C9 countdown fades only · F8 toast slips away, restarts its time on another save · F9 a moving sheet can be caught · F6/C8 `html[data-arrived]`: hero stickers and the film poster press on only on a fresh page · F7 poster travel rewritten to one transform in `onShare` · F2 nav springs read then write, open widths cached · F3 heart and Today/Tomorrow answer first, the list after the paint (`afterPaint`, scheduler.postTask) · F13 ring glide in 12 steps, dropdown and cord on their own layers, chevrons turn on wrappers · N1 count pops on save (not on hydration) · N2 share ✓ swaps in · N3 a tapped tick pops.
- **Budget:** the wordmark's paths moved from every page's script to `public/brand/wordmark.svg`, drawn through a CSS mask (2.6 KB JS and 2.4 KB HTML less per page; the service worker keeps `/brand/` offline). Heaviest page now 163.5 of 165 KB.
- **Measured:** forced layouts on a tab switch 354 → 28 (34 → 11 ms) at 4x; tap to first frame at 8x: heart 122–137 ms → 9–15 ms, Today/Tomorrow 91–95 ms → 6–11 ms. Total missed frames for the heart's save are higher (the list redraw now follows the paint), but the pop runs on the compositor through it.
- **Tests:** tests/e2e/audit.spec.ts (new), plus updates where Chime's picks changed behaviour: search results no longer fade (C5), lift durations (F10), ring timing (F13), chevron wrappers, day-swap tests wait for the list (F3), the brand test reads the wordmark mask. Flaky tests found and fixed: the poster test needs the 1.5 s prefetch wait; the catch test needed a slow pull.
- **Found:** the "flaky" cinema-page test was not flaky: the proof gate runs Playwright with CI=true, which serves the existing out/; a build made with `npm run build` stamps the sample data at the real hour and drops the day's earlier showings. Build with `node scripts/refresh.ts --fixtures --now <today>T07:00:00Z && npx next build` before committing.
- **Partly, on purpose:** F2's second half (the pill's travel off the page's thread) is not built. Its forced layouts are gone (354 → 28), but while React draws the new page (40–120 ms on a slow phone) no script runs, so the pill, its tab names and their colours pause together; moving only the pill to the compositor would pull it away from the names for that moment. At 8x a tab switch still misses 6–10 frames (11 before). F3's poster tap: its answer is the CSS press, already instant; the wait after is the page itself. F7's aside (the browser's own Back makes no poster travel) is not built.
- **Skills that ran:** the audit's six (in order, above), animation-performance again to remeasure F2 and F3 (scratchpad results-trace-tab.json, results-raf-x8-tab.json, results-latency.txt), code-review high --fix (7 of 10 fixed: a stale heart after Undo, a double-tap toast, a stale Today/Tomorrow thumb, a 6 px toast jump under reduced motion, router moves not marking arrival, the wordmark under forced colours, a misplaced comment; then the menu's layer only while open and the toast's exit from its token), proof:verifier (20 of 22 fully, F2 and F3 partial as above; the wordmark added to the worker's install list). The build skills (animate, choreograph, gestures, apple-design) were not invoked per unit: their rules came in through the audit's exact values. mobile-native and break-ui have not run yet.
- **Not verified:** Chime's iPhone and an Android; the real GitHub CI builds at the real hour too, so that test would fail there late in the day (to look at).

## 16 Nov 2026 — hovers lighter again (D-111)

- **Changed:** `--hover-fill` and `--hover-fill-raised` 3 % → 2 %, `--hover-fill-page` 1.5 % → 1 %, sheet close 4 % → 3 %.
- **Checked:** unit test (values), round2 and states e2e, build, budget, screenshots light and dark. Code review skipped: token values only, no behaviour.
- **Not verified:** whether 2 % still reads in dark mode on Chime's screen.

## 16 Nov 2026 — lighter hovers, city tip (D-110)

- **Changed:** every grey hover is one token, half as dark: `--hover-fill` (surface + 3 % text colour, was 5–8 % per element), `--hover-fill-page` for rows on the page (1.5 %, was 3 %), `--hover-fill-raised` for chips (3 %, was 6 %), the sheet's close button 4 % (was 8 %). The computer's city menu shows the sheet's tip under the cities (described to screen readers through `aria-describedby`).
- **Skills run:** emil-design-eng (hover fills, pointer-gated), code-review medium --fix (fixed: the tip's place in the listbox for screen readers, a comment moved off the toast tokens; chips getting darker on white caught and fixed with the raised token).
- **Checked:** lint, typecheck, unit tests (hover-fill.test.ts guards against hand-mixed greys), round2 + states + search e2e, budget; screenshots of the menu hover and the city tip at 1440 in light and dark.
- **Not verified:** Chime's eye on a real screen; the tip shows at once while the rows fade in.

## 16 Nov 2026 — review round 2 (D-109)

- **From:** Chime's screen recording (BetterShot_2026-11-16-14-37-16.mov), every frame read at 2 s; Design Bookmark's Spring dropdown source (index.html, dropdown.css, dropdown.js, shared motion.js) read in full.
- **Skills run:** animate (chevron, value roll, page slide), choreograph (menu rows falling in 45 ms apart, exits together and quicker), apple-design (springs from the live value, interruptible, critical damping for reduced motion), emil-design-eng (no motion on keyboard opens, origin at the trigger), code-review high --fix.
- **Page slide:** 40 px over 300 ms (was 12 px over 220 ms, over before the eye saw it).
- **Spring dropdown** (`ui/SpringMenu.tsx`, `springMenu.module.css`): their springs as they are: menu height 300/23 widening from 90 %, rows 300/24, highlight 620/36 leading and 200/20 trailing (it stretches between rows), tick 260/26, chevron 300/18 and value 340/26 sampled into CSS `linear()` tokens. Not taken: their whole control lifting to stay centred (ours sits in the page). On a computer it drops 8 px under Area, Day, Format (`cinemas/PickerMenus.tsx`, loaded only at a computer's width) and "Lagos ⌄" (`search/CitySheet.tsx`); the trigger stays in view and a second click closes it; Enter opens it at once, arrows move, Enter picks, Escape closes and gives focus back. Phones keep the sheets. Chevrons turn up on every picker and both city triggers. A value picked by tap rolls into its picker.
- **Toast:** `--toast-info` blue-600 (white text 5.2:1) and `--toast-error` (Figma red/500 deepened), picked by `tone`; an error is `role=alert`. Figma's own toast colours still to come from Chime.
- **Pull cord:** the bulb drawn before the shade, so the shade hides its top half.
- **Checked:** lint, typecheck, 613 unit tests, round2.spec.ts 7/7, cinemas-screen, motion-m5-m9, search, theme, states, yours-screen 66/66; budget: every page under (heaviest a film page, JS 164.9 of 165 KB) after moving the computer menus out of the page's first load; screenshots at 1440 (light, dark, mid-open, mid-hover), 390 and 360.
- **Review and verifier:** code-review high fixed 6 of 9 (the menu re-opening on every frame redraw, a stale fold timer closing the next menu, ticks not following a change made elsewhere, Tab leaving focus past the end of the page, a failed menus load never retried, a spent roll replaying; the computer popover code removed from Sheet; `--dur-page` token). proof:verifier then caught the highlight invisible in dark (raised and surface are one colour there: now the pickers' hover tint, with a focus ring when the arrows move it), chevrons turning on a key open (now `data-keys`, no transition), and the press spring (500/18) not built (now `--spring-press` on the pickers, the search pill and the title's "Lagos ⌄").
- **Kept on purpose:** the row stagger stops growing after the ninth row (the Area menu's last rows would wait over half a second); the city menu has no value roll, since picking a city opens that city's page; the computer city menu leaves out the sheet's footer tip (Chime to say).
- **Not verified:** Chime's phone and Safari; whether the menu's fade-in (see-through for its first ~0.1 s, as in the reference) reads well over busy rows.
- **Next:** Chime's review; Figma toast colours.

## 16 Nov 2026 — review round 1: R1–R10 (D-106, D-107)

- **From:** Chime's screen recording of the built site (desktop and phone) and two Design Bookmark references; every frame read at 4 s; their pull-cord and bottom-bar source read (springs from their tokens.css).
- **Skills run:** emil-design-eng (R3, R4: state fades, pointer-gated hovers), animate and choreograph rules (R8), apple-design (R9: springs from the live value, interruptible, critical damping for reduced motion), gestures rules (R10's drag), code-review high --fix.
- **R1 favicon:** Figma's Favicon frame (173:146, the tilted blue ticket face) as icon.svg; the PNGs rendered from it (Apple and maskable on white, the ticket in the safe zone).
- **R2 ticket sticker:** its die-cut outline ran 2 units past the top of the SVG's box (Figma doesn't clip it), cut off on a dark page. The SVG has 3 units of room each side; the image grows by as much with a negative margin, so it stays where Figma puts it; the two empty states' gaps moved off the sticker.
- **R3/R4 states and hovers:** chips, buttons, icon buttons, sheet rows, pickers, time chips, Book, cinema rows, the + and add card, hearts, Save, Where cards, search results and tabs fade their fill, edge and colour (`ease`, `--dur-fast`) and answer a pointer hover with a tint mixed from tokens (both themes checked: raised and surface are one colour in dark, so hovers mix with the text colour).
- **R5 Cinemas tab icon:** Figma's nav uses Lucide store with its awning (151:1361); the Iconography doc's store (built from) lacks it. Now the nav's, scaled from 22 to 24.
- **R6 posters:** a film without one gets one of five tints from its title (Figma's folder pastels and a soft amber); dark mode keeps each hue deep (relative colour, oklch L 0.34 C 0.09; mixed fallback).
- **R7 quick save:** a heart on every Cinemas row (the link stretches over the row; the heart above it; pop and the Saved toast with Undo); the + and the dashed card on Your cinemas, and the empty state's button, open "Add your cinemas": every cinema in the city by area, tick on and off at once, Done. Words changed with it (EMPTY, ADD, addLabel, PICK) and their tests.
- **R8 page to page:** every in-site link slides the next page in: deeper from the right, back up (back button, crumb, browser back) from the left, tabs by their order; Films ↔ film page is left to the poster travel.
- **R9 nav:** Design Bookmark's Bottom bar springs (highlight 340/28, names 300/26, icon pop 520/14) on a pill layer; the state lives in the page's script so each page's nav carries on from the last; the words go white exactly as far as the pill covers them; a key press snaps; no script: the tab's own pill. Loaded after the page (budget).
- **R10 pull cord (D-107):** the theme switch is a small pull cord in the header's corner: lamp on a wire from the header's top, 5-link weighted cord, bead to pull (their cord.js physics and springs); past the click the theme turns, the new theme opening as a circle from the bulb (view transition, their light springs 120/21 and 170/27 sampled to linear()); reduced motion: at once. Drawn at rest from markup; physics loads after the page or on the first press.
- **Budget:** the round put JS over 165 (up to 167.1) and Cinemas over 225; loading the cord's physics and the nav's springs after the page brought it back: Cinemas 223.4, Films 222.1, Starting soon 221.8, area 221.5, film 220.2 of 225; JS at most 164.6 of 165.
- **Tests changed with the requirements:** yours-screen (the + opens the list; new words), theme.spec (D-60's instant change → D-107's view transition; drag test added), films-screen (the 40 px round switch → the cord's 44 target). New: states.spec, motion-nav.spec, brand (favicon, store icon, sticker edge), yours (list, row heart), motion-m5-m9 (page slides). Red first for R1, R2, R3/R4, R5, R6, R7, R8; R9 and R10 tests were written with the code, not seen red.
- **Code review (high --fix):** 10 found, 7 fixed by it: a tap lost when the cord's physics arrived mid-tap (the physics now stays loaded and a remounted cord is alive at once); two quick pulls stripping each other's light-switch classes (numbered); nav springs left up to 5 % off target and measured 4 times a frame; a right-click on the bead pulled; an unused `_city`; the spring code twice (now `ui/spring.ts`). By hand after it: Enter or Space on the cord switch the theme at once, with no pull and no light (global rule: no motion on keyboard actions; tested). Left: the browser's forward after a back between same-depth pages slides from the left (no history index); the save logic is in two screens.
- **Verifier (round 1):** every D-106 (a)–(j) and D-107 item built as specified; gaps fixed: theme.spec had lost the "no colour fades across a switch" check (restored on the Enter path); a screen reader's click (no press before it) did nothing once the cord's physics were loaded (now switches at once; tested); and found while fixing it: with the physics already loaded, the effect returned before wiring Enter, so Enter did nothing on later pages (fixed; tested on a second page). The cord's physics now load only on pointer-over, press or focus. Budget counting of late-loaded code recorded as D-108 for Chime. where.module.css is 337 lines (was 329 before this round).
- **Not verified:** on Chime's phone (the cord's drag, the nav springs at 120 Hz, the light flood in Safari).

## 16 Nov 2026 — motion M6, M8, M9, M10 and the M4/M5/M7 review fixes (D-103)

- **Skills run:** animate (M6, M8, M9), gestures (M10), choreograph rules (M9: the bar stays still, one entrance), animation-performance (transform and opacity; the ring's registered property repaints a 40 px arc).
- **M6, countdowns:** the ring's `--share` is a registered property (`ui/countdown.module.css`) and glides to each 30 s tick over 1 s, linear (progress). The number rolls up (rises 0.35 em, `--dur-fast`) when it changes while watched, never on the first draw (`useRolls` keys it). Reduced motion: the ring steps, the number fades.
- **M8, search:** a film that joins the results fades in (`--dur-fast`, opacity only); rows already there keep their place and don't animate, so typing never flickers. None with reduced motion.
- **M9, tabs:** a tapped tab's page content slides 12 px in from its side and fades up (`ui/tabSlide.ts`, read by AppFrame's first draw); the tab bar and header stay still; a key press or reduced motion opens the page as it is.
- **M10, swipe a sheet down:** `ui/useSwipeDown.ts`: touch events (pointer events lose the gesture to scrolling), 1:1 while the finger is down, a fifth as far pulled up, close past 25 % of the height or a flick over 0.11 px/ms on the sheet's own close transition, else a 220 ms snap back; the scrim lifts with the pull (`--pull`); only from the top of the sheet's content; phones and iPads only. Vaul (the skill's default) would be a new dependency (D-02); the native dialog already gives focus trapping and Escape.
- **Review of M4, M5, M7 (verifier, 4 gaps, all fixed):** the drawn strike sat on a full line-through (the code review had moved the inline style into a class that lost on specificity); the Book copy stayed in the layout; with JavaScript off the Where clapper stayed invisible (the animation now waits for `data-motion`); a pressed poster stayed lifted and next-area cards kept the press timing. New checks look at what is drawn (computed decoration, opacity, transform, transition), not only animation names; each failed on the old build. Not covered by a test: the Book copy (sample data has no booking links).
- **Red:** M6 :165 (no roll); M8 :93 (joined rows didn't fade); M9 :115 (no slide); M10 all four (no drag; the first stretch test was wrong: Chromium holds touch moves under ~15 px, so it now starts with a 40 px pull). The reduced-motion M6 test first passed hollowly (no animations at all) and now requires one.
- **Checked:** motion, motion-m5-m9, motion-sheet, soon, films, kit specs: 70 passed; earlier full gate (M1–M9) all 4 checks green. Frames: tab slide at 0.1×, sheet mid-pull and snap back, search.
- **Not verified:** on Chime's phone (the swipe needs a real iPhone: iOS touch slop, Safari's ::backdrop inheriting `--pull`).
- **M11, the poster travels (spike passed):** Next 16.4's own docs (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) say React's `<ViewTransition>` works in the App Router with no configuration. `ui/PosterTravel.tsx` names the Films card's poster and the film hero's poster `poster-<film>` (share class `poster`, no default, so only the pair moves and tabs start no view transition); `globals.css` times the group 300 ms `--ease-in-out`; reduced motion: no travel. The straight poster turns into the tilted hero sticker. Red: motion-poster.spec :31 (no transition names); after: 32 passed with the film specs. It plays when the film page was prefetched (Next does this for links on screen); otherwise the page just appears.
- **Last review (M6, M8–M11, verifier) and second code review:** code review fixed four (flick speed read over the last 100 ms only; a leftover snap-back transition; an upward flick past a quarter no longer closes; a modified click on a tab no longer slides the next page). By hand: a sheet closed during its snap-back kept its inline timing (now dropped on transitionend/cancel and on close; test reproduces it on the old build); Where stickers already in before the script runs no longer re-enter (`data-shown`), the M5 tests now delay the pictures (the case they describe) and a new test delays the script instead; a showing card lifts only when it opens something; D-105 (h)–(i) record the remaining differences from the demos. Final gate: all 4 checks green.
- **Budget, the whole pass:** Films 219.2, Starting soon 219.0, area 218.6, Cinemas 218.0, film 216.6, cinema 214.9, Your cinemas 212.6, `/` 202.2 of 225: at most about 2.4 KB per page over the 217.0 measured before it (estimate was 4–6).

## 16 Nov 2026 — motion M4, M5, M7 and the code review (D-103, D-105)

- **Skills run:** animate (M4, M5), choreograph (M5's sticker wave), emil-design-eng rules for hover (M7: pointer-gated, `ease`), animation-performance (transform, opacity, clip-path), code-review medium --fix.
- **M4, a showing starts while watched:** `useJustStarted` in `ui/Status.tsx` (true only when the clock passes the start with the row on screen; never on a page that opens after it). The chip's strike draws left to right, "Started …" fades in; the badge's full ring fades as the grey dot grows; a pill's Book button shrinks away as a hidden copy (the real link goes at once, rule 4); the showing sheet's notice, next times and Share row fade in (OptionRow takes `className`). Styles in `ui/started.module.css`. Reduced motion: fades.
- **M5, Where on a first visit:** stickers press on 0/40/70/90/100 ms, each once its picture is in (`data-ready` from an effect; `img.complete` covers a cached image); the picked card's check springs in (linear() sampled from a damped spring, ratio 0.7, 400 ms, 4.6 % overshoot); "found you in Lagos!" writes in (clip-path, 450 ms). Title, cards and buttons never move. `where/arrive.module.css`. Reduced motion: fades together.
- **M7, cards lift under a pointer:** `ui/hover.module.css`, only `(hover: hover) and (pointer: fine)`: a film card lifts its poster 4 px; showing cards, cinema folders and next-area cards 2 px; never while pressed; none with reduced motion. Area cinema cards are not links, so they don't lift.
- **Code review (medium --fix):** 8 found, 5 fixed by it (an empty start time could throw in the sheet; the sheet replayed M4 on reopening; Enter/Space on Today | Tomorrow animated; stale FLIP rects if a save fails; an inline style moved to CSS). Fixed by hand after it: the Cinemas day picker by keyboard animated (Pickers passes tap or keys). Left: the day-change handler is repeated in four screens (cleanup); a row that newly mounts past six while Show more is open would rise in (data doesn't add rows today).
- **Red:** M4 motion.spec :207, :233 against a build without M4; M5 motion-m5-m9 :30, :45 with arrive.module.css emptied (a first try was void: the review had rebuilt with M5 in); M7 :58 against a build without it. The Enter-key test was written after its fix.
- **Checked:** motion, motion-m5-m9, where, films, cinemas, film, kit specs: 75 passed. Frames at 0.1× for M4 (sheet and chip), M5 (390 and 1440), M7 hover at 1440. Budget: Films 218.3, Starting soon 218.1, area 218.0 (its CSS +2 KB: the build groups the new shared modules into its sheet), Cinemas 216.8, film 215.9, cinema 214.3, Your cinemas 211.7, `/` 201.5 of 225.
- **Not verified:** on Chime's phone; focus drops to the page after "Show more" and after letting a cinema go (both before this pass; for Chime).
- **Next:** M6 ring and digits, M8 search, M9 tabs, M10 sheet swipe, M11 poster travel.

## 16 Nov 2026 — motion M1–M3: day switch, Show more, keep / let go (D-103, D-104)

- **Picks:** Chime kept all seven proposals and added five of the six left-out ideas (D-103). Page limit now 225 KB (D-104): Starting soon was 217.1 before any motion (the day's data moved it).
- **Skills run:** animate (M1, M3), choreograph (M2's wave, M3's travel), animation-performance rules (transform and opacity only, WAAPI on the compositor), find-animation-opportunities earlier for the picks.
- **M1, the day's list follows Today | Tomorrow:** `ui/useSwapIn.ts`; every `data-swap` element (Films sections and both empty states, the film page's areas and earlier line, the cinema's rows and none, Cinemas groups and none) enters from the thumb's side, 8 px, `--dur-base`, `--ease-out`, after React draws the new day. Segmented's `onChange` now says `tap` or `keys`; keys never animate and stop a running swap. Reduced motion: fade, `--dur-fast`. Shared token reader `ui/motion.ts` (the minifier writes 220ms as .22s).
- **M2, Show N more:** added rows only carry `data-enter`; CSS `rowIn` with a shrinking wave (0, 30, 55, 75, 90, 100 ms; later rows with the sixth). Reduced motion: fade together.
- **M3, keep / let go:** Save pops the heart (scale 1.25 at 40 %, `--dur-base`), saving only, never on load or un-saving, none with reduced motion. On an area, letting go is a FLIP (`ui/useFlip.ts`): cards, headings and next-area cards glide to their new places (`--ease-in-out`, 220 ms + distance/20, at most 300); the card let go travels above the rest. Differs from the pick page demo, where the card vanished: on the real page it moves to the area's other cinemas, so it travels there.
- **Red:** motion.spec M1 "a tap slides…" `expect(forward.length).toBeGreaterThan(0)` received 0; M2 line 103 (added rows had no animation); M3 lines 154/170/182 with the pop and FLIP helpers switched off. The Films empty-state test was written after its fix (the verifier found the gap), so it was not seen red.
- **Checked:** motion.spec 10 + area, cinema, soon screen specs: 49 passed. Frames at 0.1× playback looked at for each (day switch, Show more, let go, pop); the let-go card passed under others until it was lifted. Budget: Films 217.5, Starting soon 217.3, Cinemas 216.2, area 215.6, film 215.2, cinema 213.7 of 225 (M1–M3 add 0.2–0.7 per page).
- **Not verified:** on Chime's phone (feel, iPhone Safari's WAAPI); the Cinemas day change mostly runs behind its closing sheet.
- **Next:** M4 a showing starts, M5 Where first visit, M6 ring and digits, M7 hover lift, M8 search, M9 tabs, M10 sheet swipe, M11 poster travel.

## 16 Nov 2026 — motion pass, step 1: pick page (D-102)

- **Found:** build units 1–13 never ran the 18 design-engineering skills D-82 asked for (session logs: only proof:build, figma-use, code-review). Logged as D-102; memory `invoke-named-skills` added.
- **Skills run:** find-animation-opportunities (sweep of every screen, four-question gate).
- **Made:** `mockup/motion-picks/index.html` + `demos.js`: 7 proposals (sheet swipe-to-close, Today/Tomorrow list follows the switch, Where are you watching? first visit, poster travels to the film page, the moment a showing starts, keeping/letting go of a cinema, Show N more), each with a Now/Proposed live demo, ¼ speed, reduced-motion preview, exact values, cost; 7 kept-as-is; 6 left out with the gate that ruled each out ("Add it anyway" boxes); Keep/Drop/Change, Copy my picks.
- **Checked:** headless Chromium at 1440/390/360/320: no console errors, no sideways scroll, fonts load; every demo shot mid-motion and at rest and looked at; the sheet closes after a drag past a quarter. Fixed before showing: card overflow at phone widths, stickers over the title, strike line over the format, sticky header covering demos at 320.
- **Not verified:** on Chime's phone; poster travel's cost and whether Next 16.4.3 starts React's ViewTransition on a static export (spike needed); swipe JS size (~1.5 KB is an estimate).
- **Next:** Chime's picks → step 2, build with animate / choreograph / gestures, checked with animation-performance and break-ui.

## 16 Nov 2026 — build unit 12, Where are you watching? (D-101)

- **Red:** tests/unit/lib/location.test.ts and wording/where.test.ts: `Cannot find package '@/lib/location'` / `'@/lib/wording/where'`; then "elsewhere is neither": Ibadan came out as Lagos at 120 km (it is 114 km in a straight line), so the radius is per city (80, 100). Budget: `/` 256.5 KB (the hidden desktop stickers were preloaded) and Starting soon 217.0 (the large city sticker's style in the shared sticker sheet).
- **Changed:** `/` is `components/where/WhereScreen` with a script that opens a kept city before the page is drawn; `lib/location.ts` (`cityFromPosition`), `lib/wording/where.ts`; CitySticker `large` (22 px pin; the card's sticker style lives in where.module.css); the `/` forwarder from unit 13 is gone.
- **Checked:** unit location 3, where wording 4 (613 total); e2e where.spec 5 (found in Abuja: picked, note, Continue keeps `ls.city` and opens `/abuja`, the next `/` opens Abuja at once; found in Lagos; London offers Lagos and a tap picks Abuja; no permission offers Lagos; the page's own HTML with nothing picked), city.spec, offline.spec; screenshots at 390, 834 and 1440 (found in Abuja) compared with Figma 162:262, 172:661, 172:720.
- **Tests changed:** city.spec's "/" test expects the question with no city kept (D-65); offline.spec's fallback test keeps a city first (an unsaved page falls back to `/`, which opens the kept city).
- **Reviewed:** `/code-review medium --fix` (8 found, 5 fixed): a late location answer overrode a tapped card (only the latest ask counts now); an unanswered prompt waited forever (Lagos after 15 s, D-65); offline, an unsaved city page falls back to that city's Films before `/`; the redirect script reads `CITIES`; a stray line. proof:verifier PASS 6 of 6, with one risk fixed: a returning visitor could be asked for location in the moment before the kept city opened (the page now never asks when a city is kept); and a test added that offline an unsaved city page opens that city's Films. Left: a possible offline loop if both city pages failed to save at install (before this unit too); where.module.css is 329 lines (Figma's values; "about 300"); the logo on `/` goes to Lagos.
- **Budget:** `/` 200.4; Lagos Films 216.9, Starting soon 217.0, Cinemas 215.6 of 217.
- **Not verified:** the location prompt on Chime's iPhone (Safari asks once per site); Figma's iPad sticker places were read from a screenshot.

## 16 Nov 2026 — build unit 13, the city layer (D-98, D-100)

Done before unit 12: Where are you watching? sits at `/` and leads to `/lagos` or `/abuja`, which this unit makes.

- **Red:** tests/unit/lib/city.test.ts: `Cannot find package '@/lib/city'`. tests/e2e/city.spec.ts first run: 1 of 5 failed on my locator (the film card is an article, its link inside). Budget: Lagos Films, Cinemas and Starting soon 0.5–0.7 KB over 217 with Abuja's screen in the same routes.
- **Changed:** pages moved to `src/app/[city]/…` (Lagos only); Abuja's tabs at `src/app/abuja/…` (`components/city/CityComingScreen`, words `lib/wording/city.ts`); old paths and `/` forward (`components/city/Forward`); `lib/city.ts` (`cityPath`, `cityOfPath`, `CITY_KEY`); `components/ui/CityLink` (`Link`, `useCityRouter`, `useCityPath`, `useCity`, `useKeptCity`), used by every component in place of next/link and next/navigation's router; share links carry the city; AppFrame's search bar follows the page's city; CitySheet picks either city and opens the same tab there; `lib/data/load.ts` `cityParam`; the service worker saves `/`, `/lagos`, `/abuja` at install; `check-budget.mjs` measures the moved pages and Abuja's Films.
- **Checked:** unit city 4 (605 total); e2e city.spec 5 (old addresses forward with `#s=` kept, `/` follows `ls.city`, Lagos links carry `/lagos`, Abuja's four tabs say its cinemas are being added with no times and lead to Lagos, Abuja film and cinema pages 404), search.spec's new pick-Abuja test; full e2e 173 green after the move.
- **Tests changed:** every e2e path moved to `/lagos/…` (Films `/lagos`); search.spec's city sheet test no longer asserts that Abuja can't be picked (D-98 makes it pickable) and a new test picks it; the `?q=` address check is `/lagos?q=`; `check-budget.mjs`'s page list follows the moved pages.
- **Reviewed:** proof:verifier 6 of 8: the 404's button said Lagos but followed the kept city (now names the city it opens); Enter on an Abuja page landed on Abuja's empty Films (now lists the matches on Lagos's Films); both tested in city.spec. `/code-review medium --fix` (9 found, 5 fixed): search results link to their own city's film page; `/kit` and `#` links keep their path; the `/` forwarder reads `CITY_KEY`; tidy-ups. By hand after it: switching city on About stays on About; the worker saves `/`, `/lagos` and `/abuja` one by one and moves to cache v2 so the old pages' copies go. Left: the 404 page is built without a city, so on `/abuja/…` its links may first be drawn for Lagos (not seen).
- **Budget:** Lagos Films 216.8, Starting soon 216.9, Cinemas 215.5, Your cinemas 210.7, area 214.7, cinema 213.0, film 214.4; Abuja 198.5; About 200.4; 404 203.3; `/` 168.8 of 217.
- **Not verified:** on Chime's phone. Abuja has no times until its cinemas and saved pages are added (PLAN week 2).

## 16 Nov 2026 — build unit 11, About, 404 and Offline (D-99)

- **Red:** tests/unit/lib/wording/offline.test.ts: `Cannot find package '@/lib/wording/offline'`. The About logic and wording tests were written in the same step as their code, so they were not seen failing first. Budget, after the 404: every page over (JS 178 of 165 KB; Next loads the 404 in every page's root boundary).
- **Changed:** `/about` (`components/about/AboutScreen`; logic `lib/data/about.ts` reads data/sources.json and the built times; words `lib/wording/about.ts`); `app/not-found.tsx` loads `components/notfound/NotFoundScreen` lazily (the torn ticket SVG's viewBox grew to 232 so the left half's edge and shadow aren't cut; the margin keeps Figma's 204); offline: `public/sw.js` (pages, page data and times network first with the saved copy as fallback; site files, fonts, stickers, logos and up to 120 TMDB posters saved first), `lib/offline.ts` (`useOffline`, `useOfflineNotice`, `useServiceWorker`), `lib/wording/offline.ts`, `OfflineNotice` and `PageNotice` in ui/Status (offline replaces the page's notice on all seven screens), the `wifi-off` icon (Lucide); every footer links to About; `ABOUT_LINK` and `LOGO_NOTE` live in `lib/wording/films.ts`.
- **Checked:** unit tests about (3 data, 3 wording), offline wording 4; e2e about-screen.spec 6 (sources with real statuses against data/sources.json, TMDB notice, links, Fluent credit, footer link on five pages, 404 status and words and the way to Films, no sideways scroll at 390/360/320), offline.spec 2 (Films offline with Figma's banner 25 min after saving, the notice back once online, a saved page offline, an unsaved one falls back to Films); full e2e 167 green before the budget fix; screenshots of About at 390 and 1440, 404 at 390, offline at 390 and 1440 compared with Figma 208:9122, 208:10621, 208:9467, 208:9731.
- **Reviewed:** proof:verifier FAIL: opaque TMDB posters (about 7 MB each against storage) and a failed save could break a poster load; site files saved first never refreshed; one saved time for all pages; `?_rsc=` copies kept per value; a page opened once had nothing saved; About and 404 not in the budget check; the TMDB mark is a word chip, not TMDB's logo (D-99 i, for Chime). `/code-review medium --fix` (9 found, 5 fixed): saves that can fail without failing the response, redirected copies, network first for unhashed files, the saved time per page with a bad value ignored, one `PageNotice` for all screens. By hand after both: posters with CORS and only loaded ones saved; `_rsc` dropped from the key; Films saved at install; a page asks to be saved with the build files it loaded (again 4 s in, for the parts loaded at idle); build files capped at 400; offline keeps the sample or old-times banner under the offline one (rules 2 and 8, D-99 h); About and 404 added to `check-budget.mjs`. A slip of mine along the way: an edit deleted the worker's save helpers, so nothing was saved; the offline test caught it.
- **Tests changed:** offline.spec now expects the sample note to stay visible offline (rule 8; stricter), and has a third test, a first-visit page offline.
- **Budget:** Starting soon 216.4, Cinemas 216.1, Films 216.0, area 215.4, cinema 213.7, film pages 213.9, Your cinemas 210.4, About 200.9, 404 203.8 of 217.
- **Not verified:** the service worker on a real iPhone and Android (Safari keeps a site's storage 7 days without a visit); the install prompt.
- **Next:** unit 12, Where are you watching?

## 16 Nov 2026 — build unit 10, Your cinemas (D-97)

- **Red:** tests/unit/lib/data/yours.test.ts and wording/yours.test.ts: `Cannot find package '@/lib/data/yours'` / `'@/lib/wording/yours'`; tests/e2e/yours-screen.spec.ts "none saved": "Browse cinemas in Lagos" opened a new tab (Button sent every link to a new tab, also Starting soon's "See tomorrow in Lekki"); the gate's tab test at 320 px: one tab over the edge (the tab bar never fitted "Your cinemas" or "Starting soon" below 360, since unit 3).
- **Changed:** `/yours` is `components/yours/YoursScreen` in AppFrame: the title row ("Your cinemas", "4 saved on this phone", "your usual spots", a + to the Cinemas tab), the Sample banner, a CinemaFolder per saved cinema soonest first (165 wide, 2 to a row on a phone, one row from an iPad; tints by chain), the dashed add card (SVG dash, 6 on 6 off; beside the folders on a computer), the footer line, and None saved (three logo stickers spaced from Figma's turned boxes, the words, "Browse cinemas in Lagos"). Logic `lib/data/yours.ts` (`yourCinemas`, `folderTint`), words `lib/wording/yours.ts`. CinemaFolder takes `line` and hides a zero count. `Button` opens a link inside the site in place. The tab bar below 360 px: 12 px padding (44 targets) and a 14 px name. The D-57 logo line is one `LogoNote` (words in `lib/wording/films.ts`) on Cinemas, Area, Cinema and Your cinemas. Deleted: Shell, Search, Tabs, Logo, Icons, old Cards, Filters, old CinemaRow, YoursBoard, `sinima.css`, `cinemas.css`, and the old token names except `--color-focus` and `--color-stale`; `Poster` draws the TMDB image only; ThemeToggle's icons are required.
- **Checked:** unit tests for yours (8 data, 6 wording); e2e yours-screen.spec 9 (Figma Default at 17:30: order, counts, next times, logos, links, footer; heart, reload, let go; None saved and Browse; nothing more today and unread; JS off; 165 folders at 390/834/1440 with the add card below or beside; no sideways scroll and 44 px at 390/360/320); cinemas.spec's tab test now runs on Your cinemas, Starting soon, Cinemas and Films at 390/360/320; soon-screen, kit, nav, cinemas-screen, area-screen, cinema-screen green. Screenshots at 390, 834, 1440 and None saved compared with Figma 206:8570, 206:9217, 206:9633, 206:8921, 206:9455.
- **Tests changed:** cinemas.spec's three Your cinemas tests moved to yours-screen.spec with Figma's words; nav.spec's two old-search tests removed with the old search box (search.spec covers opening over the page, matches, no match and Escape); features.json D3-6 and D3-9 point at the new specs.
- **Reviewed:** proof:screen-judge 3 findings: the None saved stickers overlapped more and sat 13 px short (CSS turns them in place; Figma spaces the turned boxes) — fixed from Figma's centres; the desktop header ends at 1340, not Figma's 1372 — left: Figma's navbar overflows its own 100 px padding by 32 px, and the header has been this way on every page since unit 3 (for Chime); the handwritten note looked heavier (low confidence, left). proof:verifier 6 of 7: the logo footer sentence was written in four screens, not lib/wording — fixed (LogoNote); noted, not changed: the tab bar counts saved ids even if a cinema leaves the data, while the page leaves it out. `/code-review medium --fix` (8 found, 3 fixed by it): a `//host` link counted as this site's (now only a single `/`); `yourCinemas` worked out today's rows twice; ThemeToggle's doc comment was split. By hand after it: the dashed border uses SVG attributes, not CSS geometry, so iPhone Safari draws it. Left: the tab count/page count gap; the no-poster mark now in three places and the search handler in six (later cleanup); no Sample banner on None saved (D-97 j).
- **Budget:** Your cinemas 207.2 (was 190.2 on the old frame), Films 213.5, Cinemas 213.9, Starting soon 213.9, area 212.8, cinema 211.1, film pages 211.2 of 217.
- **Not verified:** on Chime's phone; TMDB posters in the folders (the headless shots load none).
- **Next:** unit 11, About, 404 and Offline.

## 16 Nov 2026 — build unit 9, Starting soon (D-96)

- **Red:** tests/unit/lib/data/soonPage.test.ts and wording/soon.test.ts: `Cannot find package '@/lib/data/soonPage'` / `'@/lib/wording/soon'`; after review, `bookLabel is not a function` and `Not a UTC time ending in Z: ""` (a hand-edited `ls.countdowns` crashed the page). tests/e2e/soon-screen.spec.ts first run: the h2 locator matched the card titles (test fixed); later the 320/390 title-clearance test listed victoria-island, lagos-island, ikorodu-road and sangotedo (layout fixed, below).
- **Changed:** `/soon` is `components/soon/SoonScreen` in AppFrame: SoonHero ("Starting soon in Lekki", circle, ticket sticker, "next 2 hours" once the time is known; a long name takes a third line on a phone and the note goes, and on an iPad a name longer than Lekki goes under "Starting soon in"), AreaChips (kept area, its neighbours, All Lagos; with none kept All Lagos then every area; the phone row scrolls under a fade that goes at the end, with scroll padding so a chip never sits on the screen edge), Your countdowns (kept with the showing sheet's "Keep a countdown", D-88), Next 2 hours (ShowingCard, 2/4/6 columns, 405 tall as Figma), Later tonight (rows, 1/2/2 columns, six then "Show N more", folded again on another area), the quiet state (Figma's Nothing in 2 hours, plus the undrawn cases in D-96 e), and before the clock the day as rows. Logic `lib/data/soonPage.ts`, words `lib/wording/soon.ts`. ShowingCard takes `onOpen` (a tap on the card opens the showing sheet, Book stays on top) and `oneLine` (Figma's one-line title, cinema and meta; poster 155 × 223, 223 tall from an iPad; info 80). Deleted: `SoonBoard.tsx`, the old `Showing.tsx` panel, `Share.tsx`; old `Cards.tsx` keeps only Banner and sourceLine and `Filters.tsx` only the AreaInfo type for /yours (unit 10).
- **Checked:** unit tests for soonPage (15) and soon wording (15); e2e soon-screen.spec 13 (Figma Default at 17:30 in Lekki: chips, cards and order, badge, pill, no Book on sample, later note, Show more and its reset; All Lagos and Victoria Island chips; no area kept; card opens the sheet and Escape gives focus back; a kept countdown leads and goes at its start; Nothing in 2 hours at 22:50 word for word with tomorrow and the button; the page's own HTML with JS off; 2/4/6 and 1/2/2 columns at Figma's widths with 405 px cards; every area's title clear of the sticker, note and chips at 320/360/390/834/1440), plus nav, films, showing, kit, theme and cinemas specs (all green on a fresh build). Screenshots at 390, 834, 1440 and the quiet state compared with Figma 204:7192, 204:8247, 204:9053, 204:7931.
- **Tests changed:** nav.spec's chip test counts 13 chips (All Lagos and 12 areas, no "More areas" menu, D-96 b) instead of 5; its two old-search tests moved to /yours (the old Shell until unit 10). films.spec's Starting soon test reads the cards' start times and the countdown badge. showing.spec lost the old panel's tests (share card, Remind me, Escape) with the panel; calendar, countdown and Escape are covered by film-screen, cinema-screen and soon-screen specs.
- **Reviewed:** proof:screen-judge 6 findings: the time pill sat 13 px high and the desktop poster grew with the card (fixed: info 80, poster 223, cards 405 as Figma); "Show 8 more" 6–10 px low (a button centres its words; fixed); the quiet ticket 10 px high (fixed); the desktop header ends 32 px short of Figma's (shared AppFrame since unit 3, not changed here); the saved-count badge (no saved cinemas in the shot). The countdown ring at "30 min" is three-quarters full by the rule (Figma's frame draws it fuller). proof:verifier 6 of 7, the e2e part unverified (port in use); fixed its findings: Show more stayed open across areas, the Book label skipped lib/wording and the day after midnight, a malformed kept id crashed the page. `/code-review medium --fix` (5 found, 4 fixed): restored an e2e test that an old `#s=` link on a cinema's page opens its sheet (it went with the share-card test); `soonPage` and `keptRows` are memoised so typing in search doesn't rebuild them; `list()` in credits wording takes "or" instead of a copy; `showingMeta` simplified. Left: the Book label says "on Filmhouse's site" even when the link is a booking engine the cinema uses, as the sheet does.
- **Budget:** Starting soon 214.7, Films 214.0, Cinemas 214.3, area 213.4, cinema 212.0, film pages 212.1, Your cinemas 190.2 of 217.
- **Not verified:** on Chime's phone; TMDB posters (the headless shots load none).
- **Next:** unit 10, Your cinemas (`/yours`); it deletes the old Shell, Search, Tabs, Cards, Filters, CinemaRow and the old stylesheets.

## 16 Nov 2026 — build unit 8, Cinema (D-93, D-94)

- **Red:** tests/unit/lib/data/cinemaPage.test.ts and wording/cinemaPage.test.ts: `Cannot find package '@/lib/data/cinemaPage'` / `'@/lib/wording/cinemaPage'`; tests/e2e/cinema-screen.spec.ts first test: `cinema.address` not found (the old page).
- **Changed:** `/cinema/[id]` is `components/cinema/CinemaScreen` (info: logo, name, address, area and format tags, Save, Book; films: heading, Today · Tomorrow toggle or today alone with "hasn't listed … yet", "Times from yesterday" warning, FilmRow per film), logic `lib/data/cinemaPage.ts`, words `lib/wording/cinemaPage.ts`. New `ui/Toast` (Figma's saved toast, Undo, 4 s); `Notice` draws old and stale data as Figma's banner with the new `alert` icon (exported from Figma 201:8803); stale banner copy is Figma's on every page (bannerFor, DATA.md); token `--fx-shadow-poster`. AppFrame exports `BarBack`, `BarTitle`, `Crumb` (Film, Area, Cinema use them; their copies of the CSS are gone). `film/useLazySheet` loads the showing sheet on first tap on Film, Area and Cinema, and opens a showing named in the link (`#s=`). `next.config.ts`: graph CSS chunking (D-94). Deleted: `CinemaBoard`, `KeepButton`.
- **Checked:** unit 545; e2e cinema-screen.spec 10 (Figma's example at 17:30: info, tags, Book, note, toggle, film order and times, Agbara Nla's started line, Stay chip; Tomorrow; today alone on the data's last day; Save, toast, Undo, timeout; sheet and focus; a door-only cinema; bar vs crumb, 1/2/2 columns at 358/377/391, desktop columns at 100 and 544; 44 px, no sideways scroll and whole day labels at 390/360/320), plus cinema, cinemas, showing, films, nav, area-screen, film-screen specs. Screenshots at 390, 834, 1440, 320 (default, saved, day old) compared with Figma 201:6415, 201:6823, 201:7090, 201:7479, 201:8523.
- **Tests changed:** cinema.spec.ts rewritten (poster on every film; late at night every film says when it started); the five-across grid and "Nothing more is showing today" tests went with the old page. showing.spec.ts: the old panel's tests (share card, Remind me, Escape) run on /soon, where the old panel stays until unit 9; the shared link now opens the new sheet on the cinema page; the live-booking and stale tests use the new sheet (no per-showing source line since D-72). cinemas.spec.ts: the sheet and Tomorrow tests use the new sheet and toggle. Stale banner text updated in select.test.ts and showing.spec.ts with the copy change.
- **Reviewed:** proof:verifier FAIL (6 of 7): Undo was 31 px wide (now a 44 × 44 touch area, same look); also the desktop crumb was 41 tall (now 44, words unmoved) and next.config named D-93 for D-94. Size checks added to cinema-screen.spec first (red: 31, 41). `/code-review medium --fix` fixed: a picked Tomorrow stayed picked when the toggle went away (the page now shows today), and a stray blank line. Left as calls (D-93 i, j): no maps or website link; Book opens the website. Also left: a shared link whose sheet fails to load isn't retried until the link changes.
- **Budget:** Films 214.6, Cinemas 213.6, area 212.7, cinema 211.2, film pages 213.4 of 217.
- **Not verified:** on Chime's phone; TMDB posters load lazily (not in full-page screenshots).

## 16 Nov 2026 — build unit 7, Area (D-92)

- **Red:** tests/unit/lib/data/areaPage.test.ts and wording/areaPage.test.ts: `Cannot find package '@/lib/data/areaPage'` / `'@/lib/wording/areaPage'`; tests/e2e/area-screen.spec.ts "kept cinemas first…": expected "Cinemas in Lekki", received "Cinemas near Lekki" (the old board).
- **Changed:** `/area/[slug]` is `components/area/AreaScreen` in AppFrame with Figma's top bar (back to /cinemas, "Area", share) and the desktop crumb: AreaHero ("Cinemas in Lekki", the name circled, ticket sticker, "6 cinemas"; a long name takes its own line, decided from its set width in `nameWidth.ts`), CinemaCard (logo, name, line, next three times as time chips with films, soonest marked within the hour, "All times"; a filled heart on kept cards lets them go), NextAreaCard (up to three logos, "4 cinemas · next 17:40 at …", opens the area), the quiet state ("Nothing more starts in Lagos Island tonight", neighbours lead). Logic `lib/data/areaPage.ts` (kept / others / neighbours, quiet, last showing, `soonest`), words `lib/wording/areaPage.ts`. The page carries only its own and its neighbours' showings. The showing sheet loads on the first tap. Deleted: old `CinemasBoard`, old `Pickers`, `FormatChips`/`DayTabs`. Bridge until unit 8: `KeepButton` on the old cinema page. Cinemas title circle turned the right way (3°).
- **Checked:** unit 527 (areaPage data 9, wording 14); e2e area-screen.spec 16 (groups and order against the data, card times and soonest, sheet, heart lets go, quiet state at Lagos Island 19:01, unread cinemas and footer, bar vs crumb, 1/2/3 columns at 358/377/403 and neighbour cards 358/377/612, every area's title clear of its sticker at 320/360/390/834/1440, 44 px and no sideways scroll at 390/360/320); cinemas, nav, cinemas-screen, film-screen specs green. Screenshots at 390, 834, 1440, 360, 320 (default, quiet, Victoria Island) compared with Figma 198:5743, 198:6729, 198:7466, 198:6351, 198:8055.
- **Tests changed:** cinemas-rows.spec.ts deleted (old logo rows, pickers, source line and day sheet on /area: none are on Figma's Area page); in cinemas.spec.ts the old area-home, area-picker and More-areas-menu tests are gone (area-screen.spec covers the page), the heart test keeps a cinema from `/cinema/grand-lekki`. features.json: D3-1, D3-5, D3-7 criteria marked superseded by D-92; D3-7 verify now `cinemas-screen`, D3-1 `area-screen cinemas`. film-screen.spec.ts (unit 4) had "Monday 16 November" typed in, so it failed on any build day but 15 Nov (it did when the date rolled to 16 Nov): it now formats the sample day itself, still an exact match.
- **Reviewed:** proof:verifier FAIL (6 of 7): at 320 and 360 px the cards were 371 px wide (nowrap film names sized the grid's one column) and the sideways-scroll checks compared with `innerWidth`, which Pixel 7 emulation stretches. Fixed with `minmax(0, 1fr)`; area-screen and cinemas specs now compare with `clientWidth` and each card's right edge (red first at 320). Its wording note fixed too: with only some neighbours still showing, "One area next to it still has times tonight". `/code-review medium --fix` fixed: after midnight the next day's times said "tomorrow" (now "later today", via nextDayName); the Keep button's spoken name didn't contain "Keep"/"Kept"; dead picker and day-tab CSS left in cinemas.css and sinima.css. Left as calls (D-92 h, i): opening an area doesn't keep it; a failed sheet load is silent.
- **Budget:** area 214.7, film pages 216.3, Films 216.6 of 217.
- **Not verified:** on Chime's phone. Other screens' sideways-scroll tests still compare with `innerWidth` (same blind spot); worth switching in their units.

## 15 Nov 2026 — build unit 6, Cinemas (D-91)

- **Red:** tests/unit/lib/data/cinemas.test.ts and wording/cinemas.test.ts: `Cannot find package '@/lib/data/cinemas'`; tests/e2e/cinemas-screen.spec.ts "with Lekki kept…": expected "Cinemas in Lagos", received "Cinemas near Lekki" (the old redirect to /area/lekki).
- **Changed:** `/cinemas` is `components/cinemas/CinemasScreen` in AppFrame: CinemasHero (centred title, four logo stickers placed by their centres, hand-drawn ellipse, "22 of them!"), Pickers (Area · Day · Format; phone row scrolls under a 56 px fade; sheets in Figma's picker style, popover over the picker on desktop that follows it on scroll and stays inside the window), CinemaRow (logo sticker, name, "Next at 18:00 · 3 films tonight", area and format badge, chevron). Logic `lib/data/cinemas.ts` (every cinema, grouped by the kept area, its neighbours, the rest; soonest first, then nothing left, then not readable), words `lib/wording/cinemas.ts`. `Sheet` takes `picker`; `AppFrame` takes `footer`, loses `areas`; the Cinemas tab (new nav and old Tabs) no longer redirects to `/area/<saved>`; `rememberArea` moved to `lib/area.ts`.
- **Checked:** unit 504 (cinemas data 7, wording 16); e2e cinemas-screen.spec 14 (area groups and order, row words, unread cinemas and note, no-area list, area picked in place and kept, sheet geometry at 390 and 834, desktop popover at the picker and after scrolling, Tomorrow, IMAX with the left-out count, 1/2/2 columns at Figma's widths, 44 px and no sideways scroll at 390/360/320, logo footer); cinemas, cinemas-rows, nav, theme, films specs green (old-board tests now on `/area/lekki`). Screenshots at 390, 834, 1440 (default and area picker), 360, 320 and dark compared with Figma 196:5185, 196:6403, 196:7372, 196:5769, 196:7943.
- **Tests changed:** removed the `/cinemas` versions of the redirect, IMAX and row tests (now in cinemas-screen.spec); the old sheet's test, logo, pickers, day and fresh-line tests point at `/area/lekki`; nav's saved-area test now expects the area first on `/cinemas` (D-91); the old search test moved to `/soon`.
- **Reviewed:** proof:verifier PASS 9/9; restored the old area sheet's "All Lagos forgets" test on `/area/lekki` and the IMAX left-out count it flagged. `/code-review medium --fix` fixed the sort's repeated `indexOf`, dead `areaCount`, a leftover re-export and unused test imports; by hand after it: the popover follows its picker on scroll and resize and stays inside the window; "Next to …" names only neighbours with cinemas listed.
- **Budget:** Cinemas 215.1; Films 215.8 (+0.9) and film pages 216.9 (+1.2) of 217: Turbopack puts this page's picker and row styles in the stylesheet the three pages share (`cssChunking: "strict"` is webpack-only).
- **Flagged (D-91):** no "Use my location" (no cinema coordinates); no "All of Lagos" in the area sheet (Figma), so a kept area can't be cleared on this tab; no close button on picker sheets; no hearts on rows; format tag "4D" not "MX4D"; two ties at 18:00/19:00 sit the other way from Figma's frame.
- **Not verified:** on Chime's phone.
- **Next:** unit 7, Area (`/area/[slug]`, Figma 200:6420); decide D-91 (i) first, and the budget before unit 7 adds more shared CSS.

## 15 Nov 2026 — build unit 5, Search and city (D-89)

- **Red:** tests/unit/lib/wording/search.test.ts: `Cannot find package '@/lib/wording/search'`; later "after midnight … today's": expected "Today 14:00 · Sky", received "Tomorrow 14:00 · Sky".
- **Changed:** `lib/data/search.ts` (index for `/data/search.json` built from toListData, `matchesTitle` ignoring case/accents/punctuation, `searchFilms` per city with today worked out from all the city's times), `lib/wording/search.ts`; `app/data/search.json/route.ts` (static); `components/search/` SearchOverlay (phone full screen with Cancel and the tab bar on top; iPad/desktop panel over the bar, page dimmed; scope chips; results; both cities; no match; Abuja coming; the page's banner) and CitySheet (Lagos picked, Abuja not pickable), both loaded in their own chunk at idle, never behind Suspense (React's reveal timer); AppFrame opens them (`OpenCity` context for the Films title's "Lagos ⌄"); SearchBar `onFocus`/`inputRef`; Sheet `className`, OptionRow `lead`; icon chevron-right; token `--fx-shadow-panel`. Films uses the same matcher.
- **Checked:** unit 482 (search data 9, wording 8); e2e search.spec 8 (phone search, both cities, no match per scope, Cancel/Escape, Enter from a film page, panel geometry at 834 and 1440, city sheet from both triggers) and the whole suite (119) green; screenshots at 390, 834, 1440 for typing, both cities, no match and the city sheet compared with Figma 192:7519. `/data/search.json` 25 KB, 3.9 KB gzipped, fetched only when search opens.
- **Flagged (D-89):** Abuja is shown as coming, not sample (no Abuja data until unit 13; rule 8); "Saved on this phone." left out; 22 cinemas, not Figma's 21. films.spec: typing now opens the panel over Films, so the test presses Enter before clicking a card (and now checks the list narrows to 1).
- **Reviewed:** `/code-review medium --fix` fixed: Enter in the bar did nothing before the panel loaded; Escape cleared the query; the panel always opened on Lagos; an O(films × showings) index build. By hand: "Tomorrow" after midnight for a same-day show. proof:verifier FAIL (8 of 12), all fixed: Cancel 36 → 44 px; after midnight a film's words depended on what else matched (anchor from all the city's rows) and a 14:00 show read "tonight"; the Enter hint counted tomorrow's films; the Abuja scope suggested a spelling mistake; search on a phone hid the Sample data banner (now carried in the index and shown); city stickers hidden from screen readers.
- **Budget:** Films 214.9; film pages 215.7, over the old 215: Turbopack puts a lazily loaded component's CSS module in the page's first stylesheet (+0.9 KB), plus ~0.5 KB of wiring. Chime raised the limit to 217 until unit 12 (D-90); no more raises after that.
- **Not verified:** on Chime's phone (iOS keyboard handing focus from the bar to the panel's field).

## 15 Nov 2026 — build unit 4, Film and the showing sheet (D-88)

- **Red:** tests/unit/lib/data/filmPage.test.ts and tests/unit/lib/wording/filmPage.test.ts: `Cannot find package '@/lib/data/filmPage'` / `'@/lib/wording/filmPage'`.
- **Changed:** `lib/data/filmPage.ts` (areaGroups: your area, next to it, the rest soonest first; struck times for the last 30 min; startedEarlier; cinemasOn; nextNearby), `lib/wording/filmPage.ts` (facts line, hero note, times subtitle, area tags, the earlier box, sheet words, shortAddress), `formatLabel` (IMAX, MX4D as the cinema says), `ListFilm.stay.verdict`; `components/film/` FilmScreen, FilmHero (poster sticker, glasses, popcorn, note), ShowingSheet (Book / Sample only / Check / Tickets at the cinema, Add to calendar, Keep a countdown, Share; started: note, next times nearby, Share this film); AppFrame `bar` (Figma's top bar on phone and iPad); TimeChip note "IMAX · in 30 min", `<time>` in chips, `testId`; OptionRow `tone="soft"` and a non-link row; SearchBar Enter → `/?q=`; `lib/saved.ts` keeps countdowns (`ls.countdowns`); `shareLink` (share sheet or copy); icons `info`, `share-up` from the Film frames. FilmBoard deleted.
- **Checked:** unit tests (filmPage 11 + wording 15, select updated for `verdict`); e2e tests/e2e/film-screen.spec.ts 10 (area order and tags, soonest chip, earlier box, Stay chip and notes, sheet: sample not bookable, .ics, countdown kept, Escape returns focus; started at 18:05 with Figma's three next times; live booking until the second it starts; shared link; Tomorrow empty; top bar vs desktop column; 360 hero); films, nav, cinemas, kit specs green. Budget: film pages 214.2 of 215 KB (JS 159.4). Screenshots at 360, 390, 834, 1440 (default, sheet, started, no poster) compared with Figma's frames.
- **Reviewed:** `/code-review medium --fix` fixed: a linked sheet closed blank; a second #s= link would not open; toggling a countdown at its start second; Enter during IME input; dead .film/.fposter CSS. Then fixed by hand: "Check on X's site" with no site to link ("Check with the cinema"), the copy timer, film.module.css split (sheet styles in showing.module.css). proof:verifier FAIL (13 of 15), all fixed: next times after midnight could list a later day (now the showing's own evening, unit test); back button 40 → 44 px touch area (e2e); "Tickets at the cinema" would have told Lagocine-fed Filmhouse sheets they don't sell online (now only for cinemas with no online sales; others book on their own site; address shortened); option rows were all announced as toggles (aria-pressed only on Keep a countdown).
- **Flagged:** D-50's format and area chips are not on Figma's film page, so they went; films.spec's chip test removed, nav.spec's chip-fit test moved to /soon.
- **Not verified:** on Chime's phone; Safari share sheet; Starting soon does not show kept countdowns yet (unit 9); search on this page only sends Enter to Films (unit 5 builds search).

## 15 Nov 2026 — build unit 3, Films (D-86, D-87)

- **Red:** tests/unit/lib/data/films.test.ts and tests/unit/lib/wording/films.test.ts: `Cannot find package '@/lib/data/films'` / `'@/lib/wording/films'`.
- **Changed (working tree):** `lib/data/films.ts` (sections: next 2 hours, later tonight, one list for tomorrow, a format, or before the clock; format coverage; last start), `lib/wording/films.ts`; `ui/AppFrame` (lockup with Figma's wordmark, search bar, nav, theme switch, footer), `ui/Cards` NoPoster, `ui/Status` Notice; `components/films/` FilmsScreen, FilmsHero (stickers anchored to the edges on phone and iPad, round the centre on desktop; "tonight!" waits for the clock), hero stickers from Figma in `public/stickers/`; the die-cut ticket is one SVG file. `/` uses it; FilmsBoard deleted. Old stylesheets now load with the old Shell only. Desktop layout from 1200 px (D-86).
- **Checked:** unit tests (films 20); e2e: films-screen.spec 8 new (2-hour split, IMAX and its note, nothing more today with and without tomorrow, 2/4/5 columns, nav position), whole suite green after updating tests to the new design (flagged: home title "What's on in Lagos"; search field id; brand test for Figma's two-part lockup; tab-name test measures text, not icons).
- **Budget:** Films 212.6 KB, Cinemas 200.2 against the old 200: Chime raised the limit to 215 / 165 JS for the build (D-87).
- **Reviewed:** `/code-review medium --fix`: cards said "Next 14:00" before the clock (now "From" until it is known; rule 3, D-05); banner logic shared as `pageBanner`; filmSections simplified. proof:verifier FAIL, fixed: theme switch and logo now 44 px touch targets (Figma's 40 circle drawn inside), "tonight!" only beside today's list, last inline sentences moved to lib/wording, and at 360 px the glasses covered "in" (corner stickers now shrink below 390; e2e checks no overlap at 360 and 390). Full gate green.
- **Not done:** Abuja state (unit 13); the city pill and "Lagos ⌄" open nothing yet (unit 5); real posters need TMDB data; not checked on Chime's phone.

## 15 Nov 2026 — after-midnight day on time pill and chip (D-85)

- **Red:** parts.test.ts › after midnight › `TypeError: lateDay is not a function`.
- **Changed:** `lateDay` (lib/time/lagos.ts; formatLateTime now uses it) and `spokenTime` (lib/wording/showing.ts); TimePill and TimeChip show "Sat" in small type after a 00:00–03:59 time, spoken as "00:30 on Saturday".
- **Checked:** unit tests; kit.spec.ts 16 (chip still 44 tall, pill still 46, day at 12 px, spoken name); screenshot at 390.

## 15 Nov 2026 — build unit 2, shared components (D-82, D-84)

- **Red:** tests/unit/lib/wording/parts.test.ts › countdownParts › "Starts in / 5 min": `TypeError: countdownParts is not a function`.
- **Changed:** `src/components/ui/`: Icon (Figma's 20 Lucide paths, generated), Actions (Button, IconButton, Chip, Segmented), SearchBar, SectionNav (phone tab bar and desktop pill), Cards (FilmCard, ShowingCard, CinemaFolder), Status (CountdownPill, CountdownBadge, TimePill, TimeChip, FormatBadge, SampleNote, Freshness), Sheet and OptionRow, Stickers (TicketFace, TicketFaceSticker, DrinkSticker, NotFoundTicket, CitySticker, LogoSticker), one CSS module per group. New wording: countdownParts, spokenCountdown (exported), filmNextLine, showingsTonight, cinemaNextLine; countdownShare for the ring. Tokens: Figma's unbound layer values (tab bar and navbar shadows, count sticker shadow, focus ring, format badge, tints). `public/stickers/` (drink PNG, 404 SVG, both Figma exports). `/kit` shows them all with Figma's example values (not linked, noindex). Old components untouched: screens move over from unit 3.
- **Checked:** parts.test.ts pass; all unit tests (415); lint (0 errors; 10 warnings are in the untracked mockup/r6 files); typecheck; full gate (`gate.mjs --run`: lint, test, types-build-e2e-budget, spec) green; e2e 89/89 incl. tests/e2e/kit.spec.ts 15 (also: no Book link in the static HTML, tab bar fits a 360 phone whichever tab is open, 44 px segment touch area) (Figma sizes, rule 3 on the static HTML, D-05 no booking once started, segmented arrow keys, tab bar 24 px from the bottom, desktop pill, sheet 8 px in and 440 wide on desktop, Escape and close, logos inside their tiles, worst-case data at 360/390/834/1440 with no sideways scroll); budget: heaviest Cinemas 199.5 of 200 KB. Screenshots at 390, 834, 1440 compared with the Figma Doc frames by eye. Fixed on the way: square and tall logos (Silverbird, Filmworld) overflowed their tiles; a long format list overflowed the poster; the desktop nav stretched; the kit's sheet subtitle had "Starts in 10 min" baked in (caught by the rule-3 test).
- **Reviewed:** `/code-review medium --fix` fixed a Book link present in the static HTML before the clock was known (rule 4) and made countdownParts build its pieces directly (countdown.ts) instead of splitting a sentence; skipped the after-midnight day marker on TimePill/TimeChip (changes Figma's content: Chime's call). proof:verifier FAIL, all fixed: the kit's freshness line was baked in (rule 3; the test regex missed "hours ago"), tab bar overflowed at 360 px, segments had no 44 px touch area; plus link-variant selected option, 2 px focus/selection jumps, folder's spoken name, pill threshold back to ≤ 60 min as the old card. TimePill now takes `now` and draws no Book link until it is known. Folder count stays Urbanist Bold 12 (Figma's layer) where the Doc note says Label/Strong (13).
- **Not verified:** on Chime's phone; Safari on iPhone (backdrop blur, `@starting-style` sheet motion, `::backdrop` reading tokens); dark mode (stand-in); posters are title posters until TMDB posters are in the data; no swipe-to-dismiss on the sheet (Figma doesn't specify one).

## 15 Nov 2026 — build unit 1, foundation (D-82), in progress

- **Changed:** `src/styles/tokens.css` rewritten from Figma's variables and styles (26 primitives, 25 semantic colours, spaces, radii, 15 text styles as font shorthands, 9 effects, motion curves); old role names point at the new tokens until each component is rebuilt. `docs/design/figma-tokens.json` is the Figma export; `tests/unit/tokens.test.ts` now holds tokens.css to it and checks contrast, with Figma's three low pairs listed (O-17). Fonts: Urbanist and Story Script (OFL), trimmed with fontTools to 24 KB and 12 KB; Geist and Anton removed. `tests/e2e/theme.spec.ts` updated to the Figma palette and fonts (cap still 40 KB). pageColours reads `--bg-page`; the budget counts the new fonts.
- **Checked:** token test (Figma drift, contrast incl. focus ring and stale wording, Badge tracking), all unit tests, lint, typecheck, 74/74 e2e, budget (heaviest page Cinemas 198.3 of 200 KB after trimming fonts to 22 KB + 6 KB). Reviewed by proof:verifier: its gaps (dropped focus and stale contrast checks, an untrue ₦ note, untested Badge tracking) fixed.
- **Not verified:** how the old screens look in the new palette (they are rebuilt from unit 3 on); dark mode is a stand-in.

## 15 Nov 2026 — popular cinemas, Nova Lagos added (D-81)

- Abuja popularity from 2025 box office (FilmOne yearbook via ATQ; Nairametrics): Silverbird Jabi Lake Mall first, Genesis Ceddi Plaza second; all five box-office cinemas covered.
- Read each Reach-platform site's own cinema list in a headless browser: found Nova Lagos (live, 24 times) and Viva Lekki (no times). Added Nova Cinemas Sangotedo, its cleared source and logo (176×101, 21 KB). Logo, registry and refresh tests: 60 passed.
- Not done: Figma counts still say 21.

## 15 Nov 2026 — outreach drafts, Abuja audit, Doomsday date (D-79, D-80)

- `docs/OUTREACH.md` §4: Filmhouse, FilmOne, CINEsync drafts (voice score 100/100, voice check clean; follow-up sign-off fixed to Chimezie).
- Abuja: 6 cinemas found, 4 readable directly (Silverbird SEC and Jabi on Veezi, Genesis Ceddi Plaza, Nova Lugbe by headless browser, 23 times). Recorded in docs/RESEARCH.md.
- Avengers: Doomsday opens in Nigeria Fri 18 Dec (Filmhouse's own page); O-14 closed.
- Not done: Abuja areas need Chime's confirmation; two Abuja addresses need confirming on the cinemas' pages.

## 15 Nov 2026 — data sources: read each cinema directly (D-76, D-77)

- Checked (about 25 requests, 5 s apart per host, named UA): Filmhouse times come from filmhouseng.api.cinesync.io (403 to plain requests; headless browser got "Access Denied"); Genesis booking pages carry times in HTML; robots and pages of all 8 independents; headless browser on ozone.reachcinema.io showed 19 times.
- `data/sources.json`: Genesis and Silverbird cleared; Lagocine cleared as fallback for the 16 cinemas not yet read directly; 7 new sources (Reach, Filmworld, Grand, Blue Pictures, Viva, THC, Magnificent) pending terms or a browser test. `data/cinemas.json`: websites and booking hosts for the 8 independents.
- Not done: terms of the 7 new sources; browser test of EbonyLife, Viva, THC, Magnificent; Abuja.

## 15 Nov 2026 — screen review round 4 (D-75)

- 404 picture: torn ticket made a component and placed at three sizes (checked by screenshot); frame fitted so the caption sits under it. Admit one component deleted after checking Design screens had no instances left.

## 15 Nov 2026 — screen review round 3 (D-74)

- Drink sticker component; replaced Admit one in 24 Films titles and 6 Where are you watching? screens; checked by screenshot at phone, desktop and iPad.
- 404: three on-brand pictures that show "404" (torn ticket, ticket as the zero, big screen), placed in 404 iPhone copies for review.
- Not done: 404 pick; phone check.

## 15 Nov 2026 — screen review round 2 (D-73)

- Cinemas title centred with four logo stickers left and right and "21 of them!" below, at three sizes on Default and Area picker open; overlap check: none; phone title block 163 px.
- Admit one: eight options in review section `225:9281` (Fluent Emoji 3D, MIT, die-cut with PIL, uploaded to Figma). Not applied until Chime picks.
- Not done: phone check.

## 15 Nov 2026 — screen review round 1 (D-72)

- Figma only. Removed every "From Lagocine, which read…" / "Read from Lagocine…" line (153); reworded stale-data and About texts without "read".
- Shadows: audit script over every screen on Design screens; 378 clipping containers unclipped, stickers nudged, tab bar lifted to 34 px with a tighter shadow, iPad search panel inset; re-audit clean except edge-docked sheets.
- Day toggles: iPad track height and equal halves; Film page iPhone toggle was hidden; Cinema page toggles detached and sized to the longer label.
- Chip rows: 48 px edge fade where rows scroll; non-overflowing rows unclipped.
- New review section `219:8741`: Cinemas title left vs centred, three sizes. iPad Cinemas logos moved off the title.
- Docs: D-72; CLAUDE.md rule 2; PRD, SPEC, PLAN.
- Not done: phone check; Chime's pick on the centred title.

## Every screen at three sizes (Sun 15 Nov 2026)

**Changed** (design only, in Figma; nothing in the app)
- Designed the rest of sitemap draft 3: Films states, Film (+ sheet, dialog, started), Search and city, Cinemas, Area, Cinema, Starting soon, Your cinemas, About, 404 and Offline, each at iPhone, iPad and desktop, one section per flow (D-71).
- Fixed wrong data in earlier screens: Ramayana at 16 cinemas (merged ids), Ramayana's credits scene "not known yet", "Later tonight", 16 films in the next 2 hours, 30 films tomorrow, last showing 23:40, the folders' films and next times.
- Design System: new Time chip; Showing card poster stretches; Cinema folder samples corrected.

**Checked**
- Every number cross-checked against `data/*.json` with scripts at the fixed clock; wording matched to `lib/wording` and `lib/time/countdown.ts`.
- Screenshots of every flow at all three sizes; fixed clipped text, non-wrapping lists, black scrims and buttons, overlapping stickers, and sections overlapping after rows grew.

**Not verified**
- Not seen on a real phone; dark mode not designed; Abuja is still sample content.

**Next**
- Chime's corrections, then approval of the screens.

## Round 9, desktop layouts, and the finalists in Figma (Sat 14 Nov 2026)

**Changed** (design only; nothing in the app)
- Round 9 (`mockup/r6/round9.html`): five variants with only Chime's round 8 points fixed on the phone, plus a desktop layout for all four pages of each. Chime then kept four: PamPam, Posh, Phantom, Sweatpals (Town out).
- Figma: those four, phone and desktop, as 32 editable screens in https://www.figma.com/design/2WxAK7rxGC6t4Wkd5IQ6p2/Sinima, one page per variant.
- Tools in `mockup/r6/tools/` (render, board, Figma capture).
- UI8 MCP server signed in (user scope); its tools load in the next session.

**Checked**
- Every round 9 variant rendered at 390, 1024 and 1440: no sideways scroll, no page errors; the board's switches and keys tested in a browser.
- Figma: 8 screens per variant confirmed by listing each page; screens from all four compared with the HTML by eye; posters and PamPam's stickers fixed and recaptured.

**Not verified**
- No real phone or laptop; no dark mode; tablet widths only checked for breakage.

**Next**
- Check the UI8 tools; ask Chime what comes next in Figma (components offered); colour palettes still to do.

## Design rounds 5 to 8: finding Sinima's look (Fri 13 to Sat 14 Nov 2026)

**Changed** (design only; nothing in the app)
- Round 5: a style and colour board of 241 Mobbin references (`docs/design/reference-board/round5.html`), with a zoom that holds the whole answer form.
- Round 6: a colour board of 209 references in 14 families (`round6-colours.html`), and 41 variants on frozen snapshots of the real site (`mockup/r6/`), one per style screen Chime picked, built after studying 342 more screens from the 37 liked apps.
- Round 7: Chime's 19 refined with a UX audit and the design skills (`mockup/r6/refined.html`).
- Round 8: the 8 Chime kept, redesigned from their notes (`mockup/r6/round8.html`).
- Outside the repo: 18 design-engineering skills reinstalled; the routing table added to `~/.claude/CLAUDE.md`; four new memories.

**Checked**
- Every board: no broken images, no sideways scroll and no script errors at 1440 px light and 390 px dark; the zoom, keys and answer saving were tested in a browser.
- 164 round 6 renders, 76 round 7 and 32 round 8, all with no errors. Before and after compared by eye for every variant.

**Not verified**
- No variant on a real phone. Bottom docks especially need a phone.

**Next**
- Chime's round 8 answers, then palettes from the 32 colour picks, the winner on desktop and in light and dark, and a build only when Chime says so.

## Your cinemas gets its own tab; round 4's look is dropped (Fri 13 Nov 2026, evening)

**Changed** (D-61)
- Earlier today: a hover state on the "More areas" menu; Verity matched to TMDB by hand; a round 4 reference board (89 Mobbin screens, local only), a picks page, and a mockup in a black-and-yellow "Marquee" look (`mockup/round4.*`). Chime rejected that look outright: fonts, colours, and the poster-less Starting soon rows.
- Built in the existing design: a fourth tab, Your cinemas (`/yours`, `YoursBoard.tsx`). Hearted cinemas list there, soonest first; one with nothing more today stays and says so; with none kept, the page says how to keep one and links to the cinemas. The block is removed from the Cinemas tab. On a phone the tab is a heart alone.

**Checked**
- Red first: the new test failed on the old code at `expect(page.getByTestId("saved")).toHaveCount(0)` (received 1).
- `cinemas.spec` and `nav.spec`: 33 pass (6 new: the tab, the empty state, a quiet kept cinema, four tabs whole at 390, 360 and 320 px). The old "tabs read Films, Cinemas, Starting soon" test now expects the fourth name, as Chime asked.
- Screenshots at 390, 360, 320 and 1440 px, light and dark, with 0 to 4 kept cinemas.

**Not verified**
- On a real phone.

**Next**
- Chime's call on the Starting soon time filter (30 min · 1 hour · 2 hours · 4 hours · Today) in the existing design, posters kept. Posters for the 13 Nollywood films not on TMDB.

## The theme switch follows Rune Icons (Fri 13 Nov 2026, afternoon)

**Changed** (D-60, supersedes D-59's circle)
- Chime sent a screen recording of Rune Icons' switch and asked for its motion and icon. Frame by frame at 60 fps, the page cuts in one frame both ways and only the icon moves, in about 8 frames.
- `ThemeToggle.tsx`: no view transition and no circle. A `theme-cut` class turns other transitions off until the new theme has been drawn (two frames), so tabs, chips and rows no longer fade their colours across.
- `src/styles/theme-switch.css` (new; the switch rules moved out of `sinima.css`, now 289 lines): the icon shows the theme on screen (it used to show the other one). The new icon grows in from 60% size, 3 px blur and transparent over 200 ms; the old one goes the same way; reduced motion only fades.
- `Icons.tsx`: a new sun (a ring with eight short rays) and a fuller crescent moon.

**Checked**
- Red first: the new motion test failed on the old code at `toHaveCSS("opacity", "1")` for the sun (received "0"); the colour check then failed with 34 running colour transitions, before the `theme-cut` fix.
- `theme.spec`: 11 pass. Lint, typecheck and 384 unit tests pass.
- The icon captured at 60 fps steps (animations paused and stepped) next to Rune's frames from the recording, both ways: both read as the new icon by the fourth frame. Headers at 390, 360 and 1440 px, light and dark.
- `/code-review medium --fix`: fixed a timing race in the new test and a moon drawn 0.5 px off centre.

**Not verified**
- On a real phone.
- When the phone's own setting flips with no choice kept, colours still fade across (as before).

**Next**
- Chime checks the switch on the phone; then the next item on the review.

## Theme-switch motion: four options for Chime (Fri 13 Nov 2026, past midnight)

**Changed**
- Chime rejected the circle reveal (D-59) as the style of their own portfolio. `mockup/theme-motion/index.html` plays four replacements on light and dark screenshots of the Cinemas tab: A Curtain, B Widescreen, C House lights, D Next frame. Each has an icon motion where the sun sets as the moon rises, and the page has quarter-speed, pause and copy-my-pick controls. The screenshots are git-ignored.

**Checked**
- Each option was captured three times during one switch at quarter speed. The motion runs as described, and the switch drawn on top sits at the real button's measured place (x 330, y 12 at 390 px).

**Next**
- Build Chime's pick in `ThemeToggle.tsx` (see HANDOFF).

## The theme switch animates (Thu 12 Nov 2026, night)

**Changed** (D-59)
- `ThemeToggle.tsx`: the switch runs `document.startViewTransition`, and the new page opens in a `clip-path` circle from the button (400 ms, strong ease-out). Both icons are drawn, and the hidden one sits turned away and faded (200 ms transitions, so a quick double tap reverses smoothly).
- With reduced motion: the browser's cross-fade, and the icons only fade. A browser without view transitions switches at once.

**Checked**
- `theme.spec`: 11 pass, 2 of them new. The new tests could not run red first, because the memory guard stopped the run. On the old code they would time out, since nothing started a view transition.
- Recorded on a phone and a computer, and stepped through at a quarter speed. The circle grows from the switch and covers the page; the icon turns.

**Not verified**
- Safari on an iPhone. View transitions need iOS 18; older versions switch at once.

## A light and dark switch (Thu 12 Nov 2026, night)

**Changed** (D-58)
- `ThemeToggle.tsx`: a round button beside search on every screen (moon in light, sun in dark). It follows the phone until tapped, then keeps the choice (`ls.theme`). A script in the page head applies the kept choice before the first paint. The browser bar colour follows.
- Tokens: `:root[data-theme]` fixes `color-scheme`. `--color-tile-edge` replaces the one `prefers-color-scheme` media query, so the dark logo tiles follow the switch too.
- Header grid: four columns on a computer, three on a phone (logo, search, switch).
- The phone pickers size to their words, and the area pin hides under 350 px. Labels were cut short at 360 and 320 px ("All L…"), which the earlier test did not check.

**Checked**
- `theme.spec`: 9 pass, 3 of them new. The new tests were written before the code, but the memory guard stopped the first run. So the red run is shown by `theme.toggle` being absent from HEAD, not by a failing run.
- `cinemas-rows.spec`: 8 pass. The new label check failed first at 360 and 320 px.
- Screenshots of the header at 390, 360, 320 and 1440 px, light and dark.

**Not verified**
- On a real phone.

## The Cinemas tab as logo rows (Thu 12 Nov 2026, night)

**Changed** (D-56)
- Two mockup rounds (`mockup/cinemas.html`) after Chime's round 3 Instacart picks:
  - Round 1: logo rows.
  - Round 2: three phone filter options. Logos trimmed so they centre, Magnificent's real logo, the freshness line moved away from the filters.
  - Chime picked Option 1 and said: build it, show the real logos with a way to have one removed, Cinemas page only, merge Leisure Mall.
- Built:
  - `CinemaRow.tsx`: logo tile, name, "Next at 14:00 · 4 films · Lekki", tags, a stretched link and a heart.
  - `Pickers.tsx`: on a phone, three pickers in one row, each opening a sheet.
  - `CinemasBoard.tsx`: groups (Your cinemas, the area, next door, then six from the rest of Lagos with "Show all"). The freshness line sits once, under the first heading.
  - `src/styles/cinemas.css`, and the tile colour tokens.
  - `CinemaCard` is gone; the times now live on each cinema's page.
- Logos: 12 chains in `public/logos/` (41 KB together), each trimmed, resized and cut to 256 colours. `data/logos.json` names the source of each. The footer says the logos belong to their owners and links to GitHub issues for removal.
- `rowWarning()` in `freshness.ts` puts "Times from yesterday" or "Times may have changed" on a row with old times.
- `data/cinemas.json`: Leisure Mall merged into Filmhouse Surulere (21 cinemas).
- Tests changed for the new requirement:
  - `cinemas.spec`: the row states its next time in words; a time is tapped on the cinema's page; areas and formats are picked through the sheets.
  - `nav.spec`: the chip test moved to a film's page, which still has chips.
  - `playwright.config.ts` and CI (`.github/workflows/ci.yml`): the test build makes its sample data as of 08:00 Lagos. Without that, a build after about 20:00 holds only the evening's last showings and two HTML tests fail. Those tests were not changed.

**Checked**
- `cinemas-rows.spec` (8 tests), plus `cinemas.spec` and `nav.spec`: 34 pass.
- Unit tests: `logos.test.ts` 14 tests, the registry merge test, `rowWarning` 3 tests.
- Not run red first: the browser tests in `cinemas-rows.spec` were written before the components but not run before them. The unit tests were run red first.
- Screenshots of `/cinemas` and `/area/lekki` at 390 and 360 px and 1440 px, light and dark, with the area and format sheets open, compared with the mockup.

**Not verified**
- On a real phone: the sheets, and the keyboard rising for search.
- The Films page and film pages keep their chips (Chime: Cinemas page only for now).

## Chime's review, first fixes: Films first, search, phone chips (Thu 12 Nov 2026, evening)

**Changed** (D-55)
- Chime reviewed the live site by screen recording. The first three fixes are in:
  - The tabs now read Films · Cinemas · Starting soon. `/` is Films; Cinemas moved to `/cinemas`; `/films` is gone. A saved area now sends the Cinemas tab to that area (`src/components/Tabs.tsx`), not the home page.
  - Search (`src/components/Search.tsx`): on a phone the search button opens a box on the page you're on, and matching films show as you type. Before, it only jumped to the Films tab.
  - On a phone the area chips wrap onto a second line. Before, they scrolled under "More areas" and were cut in half. Tab names also stay on one line down to 320 px.
- Docs: `SPEC.md` routes, flows and acceptance check 14; `features.json` D3-6. `scripts/check-budget.mjs` now measures `cinemas.html` instead of the removed `films.html`; the limits are unchanged.
- Existing tests were moved to the new addresses: `films.spec` uses `/` for `/films`, and `cinemas.spec` uses `/cinemas` for `/`. The requirement changed (D-55); the tests weren't weakened.
- Mobbin references for the Cinemas page redesign are on `docs/design/reference-board/round3-cinemas.html` (local only: 24 references). The logo source for each brand is listed in the session notes.

**Checked**
- `tests/e2e/nav.spec.ts`: 9 tests, written first and red on the old code:
  - The tab and search tests failed: no Films home, and no `search.open`.
  - At 390 px the chip test listed `area.chip.ikeja` and `area.chip.all` as cut off.
  - At 360 and 320 px the one-line test listed "Starting soon" as wrapped.
- All 9 pass now. The full gate results are in the commit.
- Budget: the heaviest page is 187.8 KB of 200.
- Screenshots at 390 and 360 px and at 1440 px desktop, compared with the live site.

**Not verified**
- Not tried on a real iPhone: does the keyboard rise when the search button is tapped? The code focuses the box inside the tap, which iOS needs.
- The Cinemas page redesign (logos, connected cards) is not started; it waits for Chime's reference picks and a mockup.

**Next**
- Chime picks references on round 3. Then a Cinemas page mockup with logos, which needs a call on using chain logos. After approval, build it.

## The redesign, built (Thu 12 Nov 2026)

**Changed**
- Chime rejected the Day 3 home screen as a design (D-49). Since then: a structure document (sitemap and journeys, PDF), a second reference board, and four mockup drafts (Danfo; cofounder.co style; back to the first with motion; Lagoon colours). Chime approved draft 4.
- The app now is that mockup: `/`, `/area/[slug]`, `/cinema/[id]`, `/films`, `/film/[slug]`, `/soon`, the showing panel and the share dialog. Lagoon tokens, Geist and Anton, the mockup's styles and motion in `src/styles/sinima.css`.
- Data: TMDB poster paths through `tmdb.ts`, `credits.json`, the pipeline and `Film.posterPath`; "Ramayana" matched by hand. `src/lib/data/format.ts`, `programme.ts`, richer list data; `src/lib/wording/film.ts`; `src/lib/browser.ts`, `src/lib/saved.ts`.
- `SPEC.md` §5 and §8, `features.json` and the palette tests rewritten for the new design (D-54). The Day 3 components and their browser tests are deleted.

**Red first**
- Unit: `credits.test` "gives every film an entry" (posterPath missing); `programme.test` "Cannot find package '@/lib/data/format'"; `select.test` "keeps what a screen shows" (no `at`); `programme.test` "anchorFor is not a function".
- **Browser tests were written before the screens but first run once the screens existed.** Three failed on that first run: one for a real fault (a build between midnight and 04:00 showed nothing under Today; fixed, D-54 c), two for faults in the tests (a heading locator; a 44 px check that needed half a pixel of rounding).

**Checked**
- Unit 366 pass. Browser 44 pass (run twice). Lint, typecheck, build clean.
- `/code-review --fix` at high effort: 10 findings, 9 fixed by it. The serious ones: closing Share emptied the showing panel but left it blocking the page; "More areas" was cut off on phones and its lower options sat under the cards; the film page scrolled sideways at 390 px; a shared link with a broken `%` crashed the page. The tenth (rule 3: "today", "tomorrow" and "still to start" were written into the page's own HTML from the build time) was fixed afterwards: before the browser has the time, days are named by date, nothing is called soon, and the whole day is listed. A test now checks every kind of page for clock-dependent words.
- Budget: the gate caught home at 200.9 KB, over the 200 limit, once the after-midnight fix put today's cards into the page's own HTML. The two fonts were then cut down to the letters and weights the site uses (35.3 KB to 21.6 KB). Now: home 188.0 KB, Films 184.2, Starting soon 185.5, heaviest area 188.0, cinema 180.7, film 181.5.
- Screens captured from the built site at 1440 and 390 px, light and dark, and compared by eye with the mockup: home, a cinema, a film with IMAX chosen, Films, Starting soon, the panel on desktop and phone, share.
- Text contrast on the mockup, both modes: nothing under 4.5:1 (3:1 large).

**Not verified**
- On a real phone. Posters loading over mobile data. A screen reader on the panel and the share dialog.
- No fresh-context verifier ran on this build (the review ran instead; the Mac was at its memory ceiling).
- Review notes left open: "Remind me" is still offered after a showing has started; font sizes are written in `sinima.css`, not as tokens; `validate.ts` does not check `posterPath`; unused helpers remain (`filmCounts`, `soonCount`, `nextDayName`, `loadArea`, `showingLine`, `showingSentence`).
- The motion by eye: tests confirm it runs in the mockup; in the app it was not watched.
- Kids and Nollywood filters, "Save image", the WhatsApp preview image, the About page, offline: not built.
- Anton now holds capitals, digits and punctuation only; a film title with a letter outside those would fall back to Geist on its title poster.

**Next**
- Chime looks at the live site. Then: About page, the remaining Should items, a daily rebuild.

## Day 3: the home screen (Wed 11 Nov 2026, night)

**Changed**
- Routes: `/` (all of Lagos), `/area/[slug]` (12 areas), `/film/[slug]` (a plain list for now).
- `src/lib/data/select.ts` (list data, sections, banner, film counts, section names) and `load.ts`; `src/lib/time/useNow.ts`.
- Components: `Page`, `ShowingsBoard`, `ShowingRow`, `AreaPicker`, `FilmList`.
- `npm run build` now runs `refresh --fixtures` first. The budget script measures `/`, the largest area page and the largest film page.
- `docs/design/direction-board/posters.html`: three poster options for Chime to pick from. D-48.

**Red first**
- `select.test.ts` failed with "Cannot find package '@/lib/data/select'"; later additions failed with "laterName is not a function", "nextDayName is not a function" and, for film counts with the time, a wrong count.
- **The browser tests were written before the screens but first run after them, so they were not seen failing.** One failed for its own reason (it looked for `datetime`, React writes `dateTime`). A verifier then judged each: most would fail if their requirement broke; the weak ones it named were fixed or removed, and three tests were added (section order with Tomorrow, the real Book path, films that have finished).
- The smoke test's heading check changed from "Sinima" (the placeholder) to the wordmark plus "Starting soon in Lagos".

**Checked**
- Unit 324 pass. Browser 32 pass. Lint, typecheck and build clean.
- Budget with tonight's build: `/` 188.3 KB, Lekki 177.0, the largest film page 175.2, of 200. With a full two-day programme `/` measured 195.7.
- Screenshots at 390 and 360 px, light and dark, compared by eye with the direction B frame: header, title, banner, rows, picker sheet, empty state, film list.
- `/code-review --fix`: 10 findings, 7 fixed (a showing could stay bookable up to 30 s after its start; the "Check on" link could open the wrong site; the sample banner could vanish on an area with no rows). Fresh-context verifier: 11 of 12 requirements passed; its one gap (a "Today and tomorrow" heading baked into the page) and its note on film counts are fixed.

**Not verified**
- On a real phone (the Day 3 gate, D3-3). VoiceOver or TalkBack reading a row.
- The deployed site: Vercel must run the new prebuild step; not checked yet.
- Soft navigation to `/` does not redirect to the saved area (D-48 d).
- Type sizes written in components (`text-[14px]`, `text-[19px]`, `text-[10px]`) are not tokens yet.
- The site empties two days after a build; nothing rebuilds daily.

**Next**
- Chime: pick a poster option; look at the site on the phone.
- Day 4: film page (areas, Stay or Go tile), cinema page, started rows.

## Day 2: TMDB run for real; neighbours confirmed (Wed 11 Nov 2026, night)

**Changed**
- Chime added a TMDB key. `scripts/tmdb.ts` now also takes TMDB's short API key (sent in the address, never printed). `data/credits.json` written and committed: 14 films.
- Neighbouring areas confirmed by Chime and added to `data/cinemas.json`; automated reviews allowed (D-46). D-47: the TMDB results and poster sizes.

**Red first**
- The first real run failed with "TMDB answered 401": the key in `.env.local` is the short API key, and the script only sent the long token's header.
- `refresh.test.ts` › "gives each showing its id, its film ..." failed once `data/credits.json` existed (it expected `tmdbId: null`). The test read a file that now changes weekly, so that line now checks only the film's id and origin.

**Checked**
- `node scripts/tmdb.ts` against the live API: 14 of 31 matched. Each checked by eye with a second script that printed TMDB's title, release date and country: all 14 right. 2 of 31 have a credits answer (Spider-Man: Brand New Day, after; Street Fighter, during).
- After `refresh`, those films carry the TMDB id, runtime and answer in `data/showtimes.json`.
- The key's value appears in no file under `out/`, `data/`, `public/`, `scripts/`, `src/`, `tests/` or `docs/`.
- Poster sizes from TMDB's image host for the 14 matches: 5.6 KB average at 92 px, 12.9 KB at 154 px, 17.5 KB at 185 px.
- Unit: 301 pass. Lint, typecheck and build clean.

**Not verified**
- Three films a person could match by hand: "Ikenga" (TMDB has "Ikenga: The Last Festival", Aug 2026), "Ramayana" (probably the same film as "Ramayana: Rise of a Legend", listed twice by different cinemas) and "Verity" (two 2026 films share the title). Left unmatched.
- The GitHub secret is not set; nothing in CI needs it yet.

**Next**
- Day 3: the home screen; posters shown to Chime side by side.

## Day 2: the data (Wed 11 Nov 2026, evening)

**Changed**
- `src/lib/data/types.ts` (all of schema v1) and `validate.ts` (every rule in DATA.md §Rules).
- Two Lagocine fixtures cut down from the saved pages (`tests/fixtures/lagocine/`), listed with the Veezi one in `tests/fixtures/index.json`. `reduce-fixture` can now keep a page's build stamp.
- Parsers: `scripts/sources/lagocine.ts` (day page, cinema page) and `veezi.ts`.
- `scripts/pipeline.ts` and `refresh.ts`: `npm run refresh -- --fixtures` writes `data/showtimes.json`, `public/data/all.json` and 12 area files on today's and tomorrow's dates. The files are git-ignored (D-45).
- Credits: `scripts/credits.ts` (match rule, keywords, manual entries, share), `scripts/tmdb.ts`, `data/tmdb-overrides.json`, `data/credits-manual.json` (both empty).
- D-45 (the open cases), the O-10 draft, DATA.md notes on how the validator reads the table and on sample data.

**Red first**
- `validate.test.ts`, the two parser tests, `refresh.test.ts`, `credits.test.ts`: each failed with "Cannot find module" / "Cannot find package" before its module existed.
- `refresh.test.ts` › "puts the TMDB id, runtime and credits answer on a film" failed with "expected { id: 'whalefall', … } to match object { tmdbId: 11 … }" before refresh merged credits.
- Corrections to new tests, not to behaviour: the order of two error messages; Ramayana's rating (the page says "NR"); showing counts, after the parser showed Lagocine repeats 59 rows (checked with a separate script: all Genesis, same booking link); a missing fake answer in the TMDB test.

**Checked**
- Unit: 299 pass (145 new). `lib/data` 58, `scripts/sources` 20, `scripts/refresh` 39, `scripts/credits` and `scripts/tmdb` 28. Lint and typecheck clean.
- Parser counts match counts taken from the saved pages with a separate Python script (353 rows, 31 films, 20 cinemas, 207 booking links, 52 formats). The Veezi and Lagocine pages for Silverbird Ikeja agree on all 70 start times.
- `npm run refresh -- --fixtures` run for real: 14 files, largest 10.3 KB gzipped for a full two days (limit 20). `node scripts/tmdb.ts --dry-run`: 31 films to look up, no network.
- `/code-review --fix` ran twice (one background helper each, about 100k and 147k tokens). First: 10 findings, 7 fixed (credits shape checked, missing link or price becomes null, reused showing ids dropped, more tracking parameters, log order). Second: 8 findings, 4 fixed (a show after midnight no longer counts as a saved tomorrow, a format written only in the title is kept, `--now` is checked, one duplicate constant removed).

**Not verified**
- **TMDB: nothing has been asked of the live API** (no key). The script's tests use TMDB's documented response shapes. D2-4 is not passing.
- Review findings left open: fields the validator does not check behind its type (source `url` and `health`, cinema `sourceIds`, `via.url`); Veezi's year guess fails on a page that still lists yesterday; a cinema with a mistyped area would be missing from every area file with no warning; `writeFiles` never deletes a file for an area that has gone.
- The build stamp as "when Lagocine read the cinema" is an inference (D-45 d).
- No fresh-context verifier ran (the two reviews were the only helpers). Nothing on screen yet uses the data.
- Poster source and cost: not decided; it needs the TMDB key to measure.
- The neighbouring-areas draft was written from general knowledge, not checked on a map.

**Next**
- Chime: the TMDB key; a yes on the neighbouring areas.
- Day 3: the home screen. Decide how a build gets fresh sample data (a `prebuild` step, plus something that rebuilds daily, or the deployed demo empties after a day).

## Day 1, core lane: time, wording and the calendar file (Wed 11 Nov 2026, late night)

**Changed**
- `src/lib/time/`: `lagos.ts` (UTC to Lagos, the one local-to-UTC function, day and evening helpers), `showingState.ts`, `countdown.ts`.
- `src/lib/wording/`: `freshness.ts`, `credits.ts`, `showing.ts` (the row line and the full screen-reader sentence).
- `src/lib/ics/ics.ts`: the Remind me calendar file and its file name. `src/lib/data/types.ts`: the credits and via shapes.
- D-44 records the cases the docs left open.

**Red first**
- Each test file failed with "Cannot find package '@/lib/...'" before its module existed (lagos, countdown, freshness, credits, showing, ics).
- `credits.test.ts` › "no Go with a checked date that is not a UTC time" failed with "Not a UTC time ending in Z: \"5 Nov\"" (a crash) before `citable()` was made safe.
- One correction to a new test, not to behaviour: its expected error text had a lower-case "not" where the message says "Not".

**Checked**
- Unit: 154 pass (125 new). Each feature's verify command passes: `lib/time` 56, `lib/wording/freshness` 23, `lib/time/showingState` 29, `lib/wording/credits` 18, `lib/ics` 14.
- A generated .ics file parsed with an independent library (Python icalendar): start 18:30 UTC, duration 2 h 17 min, alarm 30 min before, accented and escaped text intact, longest line 75 bytes.
- Lint and typecheck clean.

**Not verified**
- The .ics file opened in iPhone Calendar and Google Calendar (Day 5 gate, needs Chime's phone).
- Nothing is on screen yet: these are functions with tests; the pages that use them start on Day 3.
- No fresh-context or automated code review was run (cost rule: no helper agents without asking).

**Next**
- Day 2: data types and validator, the Lagocine and Veezi parsers, sample data on today's dates, TMDB matching (needs Chime's TMDB key).

## Day 1: logo and colours settled; logo in the app (Wed 11 Nov 2026, late night)

**Changed**
- Chime chose the logo, Ticket S (D-42), and the colours, Ink and blue (D-43), after four rounds of options on HTML pages (`logos.html`, `logos2.html`, `refine.html`, `ticket.html`). Three mascot images were generated with Figma AI on the GenAI-Labs team and not used.
- Illustration style: Doodle (D-39).
- In the app: `src/components/Logo.tsx` in the header; `public/icons/` (SVG tab icon, 192 and 512 PNG, maskable 512, Apple touch icon 180) drawn by `scripts/make-icons.mjs`; `public/manifest.webmanifest`; browser-bar colour read from `tokens.css` at build time.

**Red first**
- `tests/e2e/brand.spec.ts` › "the header shows the Ticket S mark beside the name" failed with "element(s) not found" before the logo was added.

**Checked**
- e2e: 10 pass (3 new: mark in the header as one cut shape; tab, Apple and manifest icons all return 200 as images; PNGs are 192, 512, 512 and 180 px). Theme tests now also check the browser-bar colour.
- Unit: 29 pass. Lint (after it caught two colours typed into `layout.tsx`, now read from the tokens file) and typecheck clean.
- Build and budget: home page 162.1 KB of 200 (JS 131.9 of 160).
- Looked at the built home page at 390 px in light and dark, and at every icon.

**Not verified**
- Adding the site to a real phone's home screen. How the maskable icon is cropped by Android launchers.
- No fresh-context or automated code review was run (cost rule: no helper agents without asking).
- CI on GitHub for this commit; earlier runs today were cancelled by later pushes or failed on GitHub's network.

**Next**
- Core lane, tests first: `src/lib/time`, `src/lib/wording`, `src/lib/ics` (D1-4 to D1-8). The doodle character and the empty state.

## Day 1: direction B written up; tokens and font in the app (Wed 11 Nov 2026, night)

**Changed**
- `docs/design/UI-BRIEF.md` §1 to 3 written for direction B · Poster.
- `src/styles/tokens.css`: the real palette (G with the blue Book button), type sizes, radii and motion, as Tailwind's theme. Tailwind's own colour palette is off (D-38).
- Outfit self-hosted at `public/fonts/outfit-sinima.woff2`, 25.5 KB, weights 400 to 600, with its licence (D-37). Counted in the page budget.
- `scripts/check-tokens.mjs` now also fails on Tailwind palette classes and named colours.

**Red first**
- `tests/unit/tokens.test.ts` › "defines every colour role in light and dark" failed against the placeholder tokens (6 roles missing) before the new tokens were written.

**Checked**
- Unit: 29 pass (26 new: roles, contrast AA and AAA from the token values, the colour check's hits and misses).
- e2e against the built site: 7 pass (light and dark palette as rendered, font served from our site at 25.5 KB, no sideways scroll at 390, 360 and 320).
- Build and budget: home page 161.2 KB of 200 (JS 131.9 of 160), now counting the font.
- Built CSS: `light-dark()` is compiled with a fallback for older Safari; no Tailwind palette classes are emitted.
- Lint and typecheck clean.

**Not verified**
- On a real phone. The home page is still the placeholder, so only the font, colours and heading show.
- No fresh-context or automated code review was run (cost rule: no helper agents without asking).
- CI on GitHub for this commit.

**Next**
- Illustration and icon references (O-13). Core lane, tests first: `src/lib/time`, `src/lib/wording`, `src/lib/ics`.

## Day 1: direction B and the name Sinima; renamed everywhere but Vercel (Wed 11 Nov 2026, night)

**Changed**
- Chime picked direction B · Poster (D-35) on a new side-by-side pick page, and the name Sinima (D-36) from a names page.
- Renamed to Sinima: app title and heading, package name, fetcher user agent, README, CLAUDE.md, docs and design pages; GitHub repo to `ChimeXXD/sinima`; project folder to `Sinima`.

**Checked**
- After the rename: lint and typecheck clean, 3 unit tests pass, build 136.1 KB total (limit 200), e2e smoke test passes with the heading "Sinima", spec check PASS (40 features, 8 passing).
- `gh repo view ChimeXXD/sinima` returns the repo; local `main` tracks it.
- Outfit variable font, Latin subset: 32,228 bytes, over the 30 KB limit.

**Not verified**
- Vercel: not renamed (no login available to Claude). Whether the deploy still builds after the repo rename was not checked.
- Name clash: two web searches only; no trademark search.

**Next**
- Chime renames the Vercel project. Then UI brief §1 to 3, tokens, illustration references (O-13).

## Day 1, design lane: references answered, three directions built (Wed 11 Nov 2026, late)

**Changed**
- Reference board topped up from 75 to 127 references (every section at 10 or more). Chime answered it: 52 liked, 13 "Not for us", palette G with a blue Book button (D-34).
- `docs/design/REFERENCES.md`: picks table and pattern summary filled from Chime's answers.
- `docs/design/direction-board/`: three directions (A · Rail, B · Poster, C · Board), each with Starting soon, the stale state and a film page with Stay or Go, at 390 px, with light/dark and name switches.
- O-13 opened: illustrations and the app icon (Chime wants custom ones, references from Pinterest first).

**Checked**
- Headless Chromium, 9 frames in light and dark (18 renders): every frame 390 px wide, no sideways overflow, no clipped element, every link and button at least 44 x 44, all text at least 4.5:1 and start times at least 7:1, both fonts loaded, no console errors.
- proof design check on the board: 9 screens, 1 issue left (no `interactions.json`; that belongs to the locked mockup after the pick).
- ESLint clean on `board.js`. Reference board re-run after the palette edit: 127 images load, no errors.

**Not verified**
- The boards in Dia or on a phone (headless Chromium only).
- Font file sizes for Figtree and Outfit against the 30 KB limit, and the data cost of posters (direction B). The board loads the fonts from Google; the site would self-host a subset.
- No fresh-context review was run (cost rule: no helper agents without asking).

**Next**
- Chime picks a direction and the name (O-1). Then UI brief §1 to 3, tokens, and the illustration references (O-13).
- Core lane, tests first: `src/lib/time`, `src/lib/wording`, `src/lib/ics`.

## Day 0, part two: deploy and source audit (Wed 11 Nov 2026)

**Changed**
- Chime deployed to Vercel: https://lagos-showtimes.vercel.app.
- Finished the source audit: terms, listing URL patterns and days ahead in `data/sources.json`; findings in `docs/RESEARCH.md`; conclusions as D-31 (TMDB terms) and D-32 (no source clearable without a yes), with O-12 open (Silverbird via Veezi).
- `scripts/reduce-fixture.ts` cuts a saved page down to listing markup (D-24). First fixture: `tests/fixtures/silverbird/2026-11-11-ikeja.html`.
- Silverbird Ikeja's address and Veezi page added to `data/cinemas.json`.

**Checked**
- `curl https://lagos-showtimes.vercel.app/` returned 200; Vercel's commit status on `main` is success.
- Fixture: 38.8 KB, 70 `<time>` entries, 0 images, scripts or poster links; 9 date headings (11 and 12 Nov, then 4 to 10 Dec).
- Filmhouse film and showtimes pages: 0 times and 0 booking links in the HTML. EbonyLife home: embedded page data is empty.
- Spec check PASS (40 features, 7 passing). Lint and typecheck clean.

**Not verified**
- The deploy on Chime's phone.
- Whether Filmhouse's times come from `/api/` specifically (inferred: they are not in the HTML, and `/api/` is the disallowed data path).
- Lagocine's exact days ahead beyond the one cinema page read.

**Next**
- Chime: TMDB API key before Day 2; decide O-12.
- Day 1: design direction and core lane.

## Plan review and Day 0, part one (Wed 11 Nov 2026)

**Changed**
- Plan review written (`docs/PLAN-REVIEW.md`); Chime said yes to all. Logged as D-18 to D-25; `PLAN.md`, `SPEC.md`, `DATA.md`, `UI-BRIEF.md`, `CLAUDE.md` and `features.json` (now 40 items) brought into line.
- Scaffold: Next.js 16.4.3 static export, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, ESLint 9, Vitest 5.1.0, Playwright 1.64.1, cheerio 1.2.0. Placeholder home page and placeholder tokens. Scripts: `check-tokens.mjs`, `check-budget.mjs`, `serve-out.mjs`, `refresh.ts` (a stub that exits non-zero).
- `git init` on `main`. `.claude/proof.json` added (the checks the proof gate runs).
- Source audit, part one: robots.txt read once per host and recorded in `data/sources.json`; Genesis's terms page read. Home or listing pages saved to `tmp/audit/` (git-ignored).

**Checked**
- `npm run lint`: clean. `npm run typecheck`: clean. `npm test`: 3 of 3 passed. `npm run build`: wrote `out/`.
- `npm run budget` on the empty app: 131.9 KB JS, 2.4 KB CSS, 1.9 KB HTML, 136.1 KB total (gzip 9, `nomodule` polyfill excluded). D-12's 90 KB JS limit could not have held. D-26 proposes 160 KB JS and 200 KB total.
- Spec check: PASS, 13 acceptance criteria all with `verify:`, 40 features, 0 passing.
- All pinned versions exist on npm.

**Not verified**
- Playwright e2e: 1 of 1 passed locally once Chime closed Dia and Figma (the memory guard had refused it twice before).
- First commit `ce88d83` pushed to the private repo `ChimeXXD/lagos-showtimes`. **CI did not run:** GitHub refused to start the job (run 42930934222: "recent account payments have failed or your spending limit needs to be increased"). No deploy yet: the Vercel CLI is not installed and deploying needs Chime's login.
- Audit still open: terms for Filmhouse (privacy policy unread), EbonyLife, Silverbird; listing URL patterns and days ahead; cut-down fixtures (D-24); Silverbird Ikeja's Veezi token.
- Whether Filmhouse and EbonyLife times sit behind an API (inferred from script-drawn pages with no times in the HTML).

- CI on the public repo: run 42931829240 green on `9119eaf` (lint, typecheck, 3 unit tests, build, budget, 1 e2e). History was replaced with one clean commit before going public.

**Next**
- Chime: OK `.claude/proof.json`; read TMDB's terms (O-6). Done since: host is Vercel (D-27), budget confirmed (D-28), Genesis and Silverbird need a written yes (D-29), and the Lagocine and Filmhouse emails were sent on 11 Nov.
- Repo made public on Day 0 (D-30) so Actions can run at $0. Chime: import the repo in Vercel.
- Then: CI green (first Playwright run), private deploy, finish the audit.

## Project set up (Fri 6 Nov 2026)

**Changed**
- Wrote the PRD (research, competitors, brainstorm, phases, data access and legal), CLAUDE.md, DECISIONS (D-01 to D-17, O-1 to O-7), PLAN, SPEC, DATA (schema v1, freshness, showing and credits wording), RESEARCH, HANDOFF, KICKOFF-PROMPT, features.json (36 items), UI-BRIEF draft, REFERENCES template, OUTREACH drafts.
- `data/cinemas.json` (22 cinemas, 12 areas), `data/sources.json` (7 sources, none cleared), `docs/examples/showtimes-v1.example.json`.
- Repo config: README, MIT LICENSE, .gitignore, .claude/settings.json, CI workflow, disabled refresh workflow template, .env.example.

**Checked**
- Every JSON file parses with `python3 -c json.load`.
- Lagocine's robots.txt allows all; Showtimes NG's says `use=reference, ai-train=no` (6 Nov).

**Not verified**
- Filmhouse robots.txt and every chain's terms; TMDB's full API terms; name clashes beyond a web search; cinema coordinates.

**Next**
- Day 0: host pick, repo, scaffold, CI, private deploy, data-source audit, Chime sends outreach emails.
