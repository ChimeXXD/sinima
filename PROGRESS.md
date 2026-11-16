# Progress

Build log for the one-week plan (`docs/PLAN.md`). Newest entry first. Each entry: **Changed**, **Checked** (with real numbers), **Not verified**, **Next**.

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
