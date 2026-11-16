# Handoff: read this first when you pick the project back up

## Now: building the Figma design into the site, units 1–11 done (16 Nov 2026, latest)

**What Chime asked (D-82):** build the Figma design into the site, exactly, with motion, using the 18 design-engineering skills (routing in `~/.claude/CLAUDE.md`, detail in `~/.claude/design-skills-guide.md`). Chime reviews when the build is done, then adds their own animation references. **Take every value from Figma exactly (D-83)**: raise a concern once, then build what Figma says.

**Units (PLAN week 2):** 1 foundation ✅ (`07cd9a0`) · 2 shared components ✅ · 3 Films ✅ · 4 Film + showing sheet ✅ · 5 Search and city ✅ · 6 Cinemas ✅ · 7 Area ✅ · 8 Cinema ✅ · 9 Starting soon ✅ · 10 Your cinemas ✅ · 11 About, 404, Offline ✅ · **12 Where are you watching? (next)** · 13 city layer (`/lagos/…`, `/abuja/…`, D-98). One unit per fresh session.

**Unit 1 (done):** `src/styles/tokens.css` holds Figma's tokens under Figma's CSS names (`--p-*`, `--bg-page`, `--text-primary`, `--space-16`, `--radius-card`, `--type-*` font shorthands, `--fx-*` effects, `--ease-out/-in-out/-drawer`, `--dur-*`); old names (`--color-*`, `--s*`, `--r-*`) point at them until each component is rebuilt, then go. `docs/design/figma-tokens.json` + `tests/unit/tokens.test.ts` hold the two together. Fonts: Urbanist (22 KB, wght 300–800) and Story Script (6 KB: a–z, 0–9, A I L M X and ! ? . , ' ’ … -; re-cut with fontTools if a note needs another character). Dark mode is a stand-in (not designed).

**Unit 2 (done, D-84):** the shared components are in `src/components/ui/` (Icon, Actions, SearchBar, SectionNav, Cards, Status, Sheet, Stickers), one CSS module per group so a page only carries what it uses. They take plain props (strings, `startsAt`, `now`), never fetch data, and draw no relative words until `now` is set (rule 3). See them all at `/kit` (not linked, noindex); `tests/e2e/kit.spec.ts` holds them to Figma's sizes and the rules. Old components (`src/components/*.tsx`, `sinima.css`) still drive the screens: each screen unit swaps its page to the new components, then deletes the old ones it no longer uses, and the old token names with them. Posters stay `<Poster>` passed in as `poster`.

**Unit 3 (done):** `/` is `components/films/FilmsScreen` in the new `ui/AppFrame` (lockup, search, nav, theme switch, footer). Old pages keep the old `Shell`, which now loads the old stylesheets itself; each screen unit moves its page to AppFrame and deletes what it replaces. Desktop layout from 1200 px (D-86). Budget 215 / 165 JS for the build (D-87); re-measure after unit 12. Test IDs: the nav keeps `tab.<id>`. Gotcha: any `npm run build` in the evening (review agents run one) breaks the cinema test; rebuild with the fixed clock before the gate.

**Unit 4 (done, D-88):** `/film/[slug]` is `components/film/FilmScreen` (hero, details, times by area) with `ShowingSheet`; logic in `lib/data/filmPage.ts`, words in `lib/wording/filmPage.ts`. AppFrame takes `bar` (Figma's phone/iPad top bar: back, title, share). Format and area chips are gone from the film page (Figma; flagged to Chime against D-50). "Keep a countdown" stores `ls.countdowns` (`useCountdowns`, `countdownStart` in `lib/saved.ts`): **unit 9 must show them on Starting soon**, the sheet promises it. SearchBar's Enter sends to `/?q=` until unit 5 builds search. The old `components/Showing.tsx` sheet still serves the cinema and soon pages until units 8 and 9. Film pages 214.2 of 215 KB.

**Unit 5 (done, D-89):** focusing the search bar opens `components/search/SearchOverlay` (phone full screen, iPad/desktop panel); `CitySheet` opens from "Lagos ⌄" in the bar and the Films title (`OpenCity` context in AppFrame). Both load in their own chunk at idle; don't put them behind Suspense (its reveal timer stalls under the e2e frozen clock). Search reads `/data/search.json` (route in `app/data/`). Abuja is "being added" everywhere until unit 13. Budget now 217 KB (D-90): film pages 215.7. Turbopack ships a lazy component's CSS module with the page's first stylesheet, so lazy loading saves JS only. After unit 12, set the limit from measured pages; no more raises (Chime).

**Unit 6 (done, D-91):** `/cinemas` is `components/cinemas/CinemasScreen` (hero, Pickers, CinemaRow); logic in `lib/data/cinemas.ts`, words in `lib/wording/cinemas.ts`. The tab no longer redirects to `/area/<saved>`: the kept area leads the page ("In Lekki", "Next to Lekki", "Elsewhere in Lagos"), and the Area picker keeps a new one in place (`rememberArea` now in `lib/area.ts`). `Sheet` takes `picker` (a ref to the button): Figma's picker sheet, no close button, 640 wide on iPad, a popover over the picker on desktop. `AppFrame` lost `areas` and takes `footer` (the page's own footer lines). Old `CinemasBoard`/`Pickers`/`Filters` still serve `/area/[slug]` (unit 7) and `CinemaRow` serves `/yours` (unit 10); old tests for them now point at `/area/lekki`. **Budget is at the edge:** Turbopack merges this page's picker and row styles into the stylesheet Films and the film pages share (film pages 216.9 of 217). Open for Chime (D-91): no "Use my location" until cinemas have coordinates; no "All of Lagos" in the area sheet (Figma), so a kept area can't be cleared here.

**Unit 7 (done, D-92):** `/area/[slug]` is `components/area/AreaScreen` (AreaHero, CinemaCard, NextAreaCard); logic `lib/data/areaPage.ts`, words `lib/wording/areaPage.ts`. Kept cinemas first (only after the browser reads `ls.cinemas`), the area's others with their next three times, then a card per neighbouring area; quiet state once nothing more starts there today. The page carries only its own and its neighbours' showings; the showing sheet loads on first tap (budget: area 214.7, film pages 216.3, Films 216.6 of 217). A long area name gets its own line, decided from `components/area/nameWidth.ts` (Urbanist Light advances): **unit 13 must check Abuja's names**, "Central Business District" is 10 em and won't fit a phone line as it stands. **Unit 8 must** give the cinema page Figma's keep heart and delete `components/KeepButton.tsx` (the bridge on the old page) and the old `CinemaRow` once Your cinemas moves (unit 10). Open for Chime: D-92 (a)–(i). Gotcha: under the Pixel 7 device `innerWidth` grows to fit too-wide content, so a sideways-scroll check must compare `scrollWidth` with `document.documentElement.clientWidth`; older specs still use `innerWidth`.

**Unit 8 (done, D-93, D-94):** `/cinema/[id]` is `components/cinema/CinemaScreen` (+ FilmRow); logic `lib/data/cinemaPage.ts`, words `lib/wording/cinemaPage.ts`. `ui/Toast` is shared (Your cinemas, unit 10, can reuse it). `Notice` draws day-old data as Figma's banner with the `alert` icon. `film/useLazySheet` is how Film, Area and Cinema open the showing sheet (first tap; `#s=` links). **Graph CSS chunking (D-94)** means each page carries mostly its own styles now; budget on 16 Nov: Films 214.6, film pages 213.4, area 212.7, cinema 211.2. The old `components/Showing.tsx` panel now serves only `/soon`, and old `Cards.tsx` only `/soon` and `/yours` (units 9 and 10 delete them; showing.spec.ts's old-panel tests go with the panel). D-93 (a)–(j) confirmed by Chime (D-95).


**Unit 9 (done, D-96):** `/soon` is `components/soon/SoonScreen` (SoonHero, SoonParts: AreaChips, LaterRow, LaterList, QuietRows); logic `lib/data/soonPage.ts`, words `lib/wording/soon.ts`. Kept countdowns (`ls.countdowns`) lead the page as "Your countdowns". ShowingCard has `onOpen` and `oneLine` (Figma's 405 card on this screen). The old `Showing.tsx` panel, `Share.tsx` and `SoonBoard.tsx` are gone; `/yours` is the last page on the old Shell (old `Cards.tsx` now only Banner and sourceLine, `Filters.tsx` only the AreaInfo type): **unit 10 deletes Shell, Search, Tabs, Cards, Filters, CinemaRow, Icons and the old stylesheets**, and nav.spec's two old-search tests (now on /yours) go with them. Open for Chime: D-96 (a)–(k). Budget: Starting soon 214.7 of 217.


**Unit 10 (done, D-97):** `/yours` is `components/yours/YoursScreen` (CinemaFolder per saved cinema, the dashed add card, None saved); logic `lib/data/yours.ts`, words `lib/wording/yours.ts`. **Every page is on Figma's frame now:** the old Shell, Search, Tabs, Logo, Icons, Cards, Filters, CinemaRow, YoursBoard and `sinima.css`/`cinemas.css` are deleted, the old token names with them (only `--color-focus` and `--color-stale` remain, no Figma token yet). `Poster` draws the TMDB image only (callers use `NoPoster` without one). `Button` with an href inside the site opens it in place (it used to open every link in a new tab). CinemaFolder takes `line` and hides a zero count. The D-57 logo line is `LogoNote` in AppFrame. Below 360 px the tab bar is tighter (D-97 i). Open for Chime: D-97 (a)–(j), and the desktop header ends at the content edge (1340) where Figma's navbar runs to 1372 (Figma's navbar overflows its own padding; unchanged since unit 3). Known gap: the tab bar's count includes saved ids no longer in the data.


**Unit 11 (done, D-99):** `/about` (sources' real status from data/sources.json), the 404 (`app/not-found.tsx`, **loaded lazily: a plain not-found added 20 KB to every page**), offline (`public/sw.js`, `lib/offline.ts`; `PageNotice` shows the offline banner in place of a page's notice). Every footer links to About. Budget is tight: Starting soon 216.2 of 217. Open for Chime: D-99 (a)–(g).

**How to build each unit:**
- Read the frame in Figma (file `2WxAK7rxGC6t4Wkd5IQ6p2`; Design System page `155:1349`, Design screens `143:1349`) with `use_figma`; works without the desktop app. Component build notes are in each Doc frame (Actions `167:60`, Inputs `167:64`, Navigation `167:68`, Cards `167:72`, Status `167:76`, Overlays `167:80`, Stickers `167:84`, Layout `158:260`, Icons `158:162`: Lucide, inline SVG).
- Layout: iPhone 390 (16 margin, 12 gutter, 2 columns), iPad 834 (32 / 16, 3–4 columns), desktop 1440 (content 1240, 100 margin, 20 gutter, 5 columns).
- Motion: CSS and the Web Animations API only (no new dependency, D-02). Name a purpose; ease-out to enter; under 300 ms except sheets (`--dur-sheet` 450 ms, `--ease-drawer`); transform and opacity; reduced motion = gentler.
- Check: screenshots at 390, 834 and 1440 against the Figma frame (proof:screen-judge), break-ui worst cases, proof:verifier, `/code-review medium --fix`, then commit.

**Gotchas:**
- The proof gate runs Playwright with `CI=true`, which serves `out/` as built. If `out/` was built with today's real clock in the evening, a sample-data test fails (Genesis Purple has too few times). Rebuild first: `node scripts/refresh.ts --fixtures --now $(TZ=Africa/Lagos date +%Y-%m-%d)T07:00:00Z && npx next build`. Proposed (not done, Chime didn't answer): the same fixed clock for the CI build.
- Page budget: heaviest page Cinemas 199.5 of 200 KB (15 Nov build). Old JS is ~145 KB per page: a screen unit must remove the old components it replaces in the same commit, or it will go over.
- Memory: close Figma desktop and Dia before runs; Brave stays open (Chime uses it).

## Earlier: data sources, Abuja, popularity (15 Nov 2026)

### Data sources changed, read each cinema directly

- **D-76 / D-77:** each cinema is read from its own site; Lagocine only for cinemas not yet cleared (Filmhouse's 7 for the long run, since CINEsync answers our bot with 403). Rule: read what a visitor sees (headless browser OK), never use private back ends, disguise the bot or work around a block. CLAUDE.md rule 6 rewritten.
- **15 Nov findings** (all in `data/sources.json`): every independent has a public page (Reach for Ozone and Sky, Veezi for Filmworld, own sites for Viva, Grand, THC, Magnificent, Blue Pictures); `data/cinemas.json` fixed. Cleared: Genesis, Silverbird (Veezi). Headless browser worked on Reach (19 times); Filmhouse got "Access Denied 403 · CINEsync". Lagocine now sells tickets.
- **D-78:** terms read and the browser route tested: all 14 non-Filmhouse Lagos cinemas cleared. Each leaves Lagocine's list when its reader is built.
- **Done after that:** Filmhouse, FilmOne and CINEsync drafts in `docs/OUTREACH.md` §4 (voice score 100/100; the pre-flight's 4 job-application rules don't apply). Abuja audited (D-79): Silverbird SEC and Jabi (Veezi), Genesis Ceddi Plaza, Nova Lugbe (headless browser) readable; The Jays no times; Banex unconfirmed. Doomsday opens in Nigeria Fri 18 Dec (D-80, O-14 closed).
- **D-81:** popularity checked. Abuja's top cinema is Silverbird Jabi Lake Mall, then Genesis Ceddi Plaza; all box-office cinemas are covered. Nova Cinemas Sangotedo (Lagos) was missing and is added (22 cinemas; logo added); Viva Lekki shows no times and stays out. Viva, Nova, Ozone and Sky share the Reach platform (`?cinemaId=`).
- **Next:** Chime sends §4 and confirms the Abuja areas; update "21" to "22" in Figma; then week 2 (city layer, build the approved screens), with the readers in week 3. Probe script: scratchpad `probe.cjs` (Playwright, named UA, images blocked); memory sat at 83 to 85%, so one page at a time.

## Earlier: review round 4 done (15 Nov 2026)

- **404 (D-75):** the torn ticket ("40" | "4"), component *404 torn ticket* `231:8914` on Design System row 13.1, placed on 404 iPhone, iPad and desktop. Admit one component deleted; the review section is on Archive.
- Still open from earlier rounds: none. Next: Chime keeps reviewing the screens, then the week 1 gate (approve all screens), O-16, Abuja research, O-14.

## Earlier: review round 3 (15 Nov 2026)

- **Drink (D-74), done:** *Drink sticker* component `226:80` (Design System, 13.1) replaced Admit one in all 24 Films titles and the 6 Where are you watching? screens (iPad, desktop). Admit one component renamed "retired". PNG, licence and `diecut.py` in `docs/design/stickers/`.
- **404 (D-74), waiting:** *Review · 404 illustration* `225:9281`, right of Films: Now (Admit one), 1 torn ticket, 2 ticket as the zero, 3 on the big screen; close-ups under each screen. Built from the brand ticket path (SVG, `createNodeFromSvg`), booleans for the torn halves. When picked: make it a component, place it on 404 iPhone, iPad and desktop, delete the retired Admit one component.
- **Gotchas:** `clone()` of a node inside a frame came back with page-relative coordinates once grouped, so build fresh nodes instead of cloning when grouping; a mask must be the bottom layer of its group (`insertChild(0, mask)`); SVG paths with negative coordinates get cropped by the viewBox, so translate to 0,0 first.

## Earlier: review round 2 (15 Nov 2026)

- **Cinemas title (D-73), done in the design:** centred; two logo stickers left (Filmhouse, Genesis), two right (EbonyLife, Silverbird); "21 of them!" below. Phone two lines like Films, iPad and desktop one line. Default and Area picker open, all sizes. Old review section is on Archive.
- **Admit one (D-73), waiting:** options on *Review · Replace Admit one* `225:9281`, right of Films. Films title: A ticket without words, B ticket, C drink, D projector, E film strip. 404: F magnifier, G torch, H ghost. Art is Fluent Emoji 3D (MIT) with a white border made by `diecut.py` (scratchpad, PIL: alpha MaxFilter ≈4.5% of width, 9% padding). Once picked: replace on every Films-title screen (Ticket sticker frame), Where are you watching? iPad and desktop, and 404; credit Fluent on About.
- Countdown badge: Chime is happy with the ring vs pill split.

## Earlier: screen review round 1 (15 Nov 2026)

Chime started reviewing the D-71 screens. Everything asked is done in Figma and recorded as **D-72**.

| Asked | Done |
|---|---|
| Remove the "read from Lagocine" lines | 153 lines removed from every screen. Old times still say so ("Some times are from yesterday…", "3 films · times from yesterday"); Lagocine stays credited on About. CLAUDE.md rule 2, PRD, SPEC and PLAN updated |
| Shadows never clipped | 378 containers unclipped; edge stickers moved in; tab bar 34 px from the bottom with shadow 0 8 24; iPad search panel inset. Re-measured: only sheets that meet the screen edge over the backdrop still touch it |
| Day toggle on iPad | Was a 40 px track cutting 38 px pills, unequal halves. Now 46 px, equal halves, everywhere. Also found: Film page (iPhone) toggle was hidden by its heading; Cinema page "Tomorrow · Sat 14" spilled. Both fixed |
| Chip rows clip harshly | Rows that scroll fade over the last 48 px (Starting soon areas, Cinemas pickers on phone); rule on the Chip component |
| City dropdown flow | Already existed: Search and city, row 1 (City sheet). Row label now says it opens from "Lagos ⌄" in the title |
| Centred Cinemas title | Option only, section **Review · Cinemas title centred** `219:8741`, right of Cinemas. Not in the design until Chime picks |
| Admit One, countdown badge | Answered in chat, no change |

Also fixed: iPad Cinemas logos overlapped "Lagos"; "Genesis Deluxe Purple Mall" was cut mid-letter on Starting soon cards (now ellipsis).

**Open for Chime:** pick left or centred Cinemas title; keep reviewing the other sections. Risk to flag: D-33 promised Lagocine "full credit"; it is now only on About. A one-line footer credit would cover it if Lagocine asks.

**Gotcha:** instance sublayers of Segmented control would not resize or hug (FIXED override stuck, min-size can't be overridden), so the six Cinema page toggles were detached to frames.

## Earlier: every screen designed for review (15 Nov 2026)

**What Chime asked:** "design the rest of the screen and organize it… think through each decision… study the site map well." Done and recorded as **D-71**. Chime will review and send corrections; nothing else is planned until then.

**Where to look:** Figma file https://www.figma.com/design/2WxAK7rxGC6t4Wkd5IQ6p2/Sinima, page **Design screens**. Ten sections, top to bottom. Each has a navy header bar; under it, one row per state with **iPhone 390 · iPad 834 · desktop 1440** side by side. Every screen has the browser mockup on top; iPhone and iPad frames have radius 40, desktop is square. Phone and iPad pop-ups are sheets from the bottom; on desktop they are centred dialogs, or a popover for the area picker.

### The screens

The clock is **Fri 13 Nov 17:30 Lagos** unless the row says otherwise. Every number, time, address and credits answer comes from `data/showtimes.json`, `data/cinemas.json` and `data/sources.json`. Exception: the Abuja sample, see "Not from the data" below.

| Section (Figma id) | Rows | What is on them |
|---|---|---|
| Where are you watching? `172:519` | Asking · Found Abuja · Elsewhere → Lagos | Unchanged from D-70; clocks set to 17:30 to match the rest |
| Films `175:3480` | Default · IMAX chosen · Nothing more today (23:50) · Abuja | 16 films in the next 2 hours; "Later tonight" 4 films. IMAX: Ramayana only, next 18:00 at 2 cinemas, with a note that 13 cinemas don't say their format. Empty: last showing 23:40, tomorrow 30 films from 10:00 |
| Film `185:3558` | Spider-Man default · Ramayana, Stay or Go not known · Showing sheet / dialog · Started showing (18:05) | Spider-Man: "Stay: scene after the credits · TMDB"; Grand Lekki 18:00 and 20:40, Magnificent 18:00. Ramayana: 16 cinemas grouped by area (Lekki = your area, then Victoria Island and Sangotedo as "next to Lekki", then the rest), "Credits scene: not known yet". Sheet: 18:00 Filmhouse Circle Mall IMAX: Book on Filmhouse's site, Add to calendar (18:00 to 21:21, alert 30 min before), Keep a countdown, Share this showing. Started: no Book; next times nearby (18:15 Oniru, 19:00 Ikota, 22:00 Circle Mall IMAX) |
| Search and city `192:7519` | City sheet · Typing "Sp" (Lagos) · Both cities "Ramayana" · No match "Avengers" | City sheet: Lagos (21 cinemas) and Abuja (sample). Search: field, scope chips Both cities / Lagos / Abuja, results grouped by city. Desktop and iPad: a panel under the header search bar |
| Cinemas `200:6415` | Default · Area picker open | 21 cinemas: In Lekki (6), Next to Lekki (VI + Sangotedo, with Silverbird Galleria as "Times not available yet"), Elsewhere (soonest first). Pickers: Area, Day, Format. The area picker has "Use my location (stays on this phone)" and 12 areas with counts |
| Area `200:6420` | Lekki · Lagos Island, nothing left tonight (19:30) | Lekki: your saved cinema (Filmhouse Lekki IMAX), the other 5 with their next 3 showings, then Victoria Island and Sangotedo with "Show all". Lagos Island: Blue Pictures' last showing began at 19:00; Yaba 19:45, Surulere 19:50 and VI 21:15 next door |
| Cinema `202:7192` | Default · Saved (toast) · Times a day old (Sat 14 Nov) | Filmhouse Lekki IMAX, address, Save, Book on Filmhouse's site, freshness. Films: Street Fighter 19:00, 21:30 (Stay a little: scene during the credits); Ramayana 19:10 IMAX; Clayface 19:15, 21:30; Agbara Nla "Started earlier today at 14:00 and 16:50". Stale: banner, "Times from yesterday", freshness "…yesterday at 23:05 · check with the cinema" |
| Starting soon `205:8598` | Lekki · Nothing in 2 hours (22:50) | 10 equal-height cards (18:00 to 19:15), Later tonight rows (14 until 22:45, shows 6 + "Show 8 more"). Empty: one showing left in Lagos (23:40 The Perfect Spec, Filmworld Idimu); tomorrow Lekki starts 10:00 |
| Your cinemas `210:9891` | 4 saved · None saved | Folders soonest first: Ozone Yaba 17:35, EbonyLife 17:40, Genesis Maryland 18:35, Filmhouse Lekki IMAX 19:00, each with "N tonight" and films actually on there tonight. Empty: logo stickers, how to save, Browse cinemas |
| About, 404 and Offline `210:9896` | About · 404 · Offline | About: how it works (3 steps), sources table with real status (Lagocine 20 and Filmhouse 7: permission asked 11 Nov; Genesis 3, Silverbird Veezi 2, EbonyLife 1: not used yet), Abuja note, TMDB notice, logos and removal via GitHub. 404: Admit-one sticker, "We can't find that page". Offline: Films with a navy banner "You're offline… saved at 17:05, 25 min ago. Booking needs a connection." |

### Mistakes in earlier screens, now fixed

- **Ramayana's credits:** "Stay: scene after the credits · TMDB" → **"Credits scene: not known yet"**. The data has no TMDB answer for it; Spider-Man (after) and Street Fighter (during) are the only confirmed ones.
- **Ramayana's cinemas:** 4 → **16 cinemas** (12 still showing it after 17:30). The data lists it under two ids (`ramayana`, `ramayana-rise-of-a-legend`) that the app already merges (D-54 b). This also means **EbonyLife does show it**; the note in the old summary saying it didn't was wrong.
- **Films:** "21 films still to start today" → "16 films start in the next 2 hours"; "Later today · 8 films" → "Later tonight · 4 films" (the app's `laterName` rule from 17:00); Whalefall (19:30, inside the 2-hour window) moved into Now showing; on iPhone, Spider-Man and Other Mommy cards added.
- **Tomorrow's films:** 31 → 30, because of the merged Ramayana. **Last showing:** 23:15 → 23:40.
- **Formats:** "4D" → "MX4D". **Cinema name:** "Filmhouse IMAX Lekki" → "Filmhouse Lekki IMAX". **EbonyLife's area:** Victoria Island, not Lekki.
- **Cinema folder component:** posters and next times now match each cinema's films that night. Genesis is now "Genesis Deluxe Maryland Mall"; EbonyLife's count is "7 tonight".
- **Status bar clocks** (9:41 → 17:30, 18:05, 19:30, 22:50, 23:50 to match each state) and the desktop tab titles per page.

### Calls Claude made: check these first

1. **City sheet:** only Lagos and Abuja. "Both cities" is a search scope only, because browsing pages show one city (sitemap §05).
2. **Started showings:** a showing that has started **drops out of Starting soon** (CLAUDE.md rule 4). Sitemap draft 3 instead lists "started showings with no booking" on Starting soon. Chime to pick. On the Film page and its sheet, started times show struck through with "Started 5 min ago", no Book, and the next times nearby.
3. **Film page:** the top-right button is **Share**, not a heart. Only cinemas are saved.
4. **Film and Cinema pages:**
   - They list times still to come.
   - Earlier times collapse into one "Started earlier today" line.
   - A time within the next hour is highlighted blue with "in 30 min".
5. **Area order on the Film page:** your area first, then the areas next to it, then the rest by next time. iPad and desktop pair single-cinema areas side by side.
6. **Starting soon chips:** Lekki, Victoria Island, Sangotedo (its neighbours), All Lagos.
7. **Desktop About:** the Films tab stays highlighted. The desktop nav component has no "nothing selected" variant; add one if wanted.
8. **Booking-type tags** ("Tickets at the cinema") were left out: a missing booking site in the data doesn't prove there's none.
9. **Freshness wording:** screens show what live data would say ("From Lagocine, which read Filmhouse's site 2 hours ago"), with the Sample data note on top. The real fixtures date from 11 Nov.
10. **Address only where the data has one:** Filmhouse Lekki IMAX, EbonyLife, Ozone (E-Centre, Yaba) and Filmhouse Surulere (Leisure Mall) show an address; the rest show none (rule 8).

### Not from the data (flag in review)

- **Abuja is illustrative sample content:** Films · Abuja (6 films, next 18:20 etc.), the Abuja search result (2 cinemas, next 18:20) and the city sheet line. It is labelled "Sample" on screen. Abuja research hasn't started (week 1 items in PLAN).
- **Invented but plausible:** the Offline banner's times (saved 17:05, 25 min ago) and the Saved toast text.

### Design System changes

- **New: Time chip** `179:2000` (section 11.3b). Variants: Default, Soonest, Started; 44 px tall. Properties: Time, Note, Show note.
- **Showing card:** the poster area now fills the card width (phone 173, iPad 182, desktop 193).
- **Cinema folder:** variants corrected (above).

### Other moves

- The old iPhone screens with the wrong data are on the **Archive** page, section "Superseded 15 Nov · iPhone": City sheet, Search both cities, Starting soon, Film, Film sheet, Your cinemas.
- The empty iPad and Desktop per-device sections were deleted.

### How it was checked

- Numbers were computed with scripts over the data at each state's clock, using the same rules as `src/lib/data/select.ts`: next 2 hours inclusive, a showing drops out at its start time, "Later tonight" from 17:00.
- Wording was matched to `src/lib/wording/` and `src/lib/time/countdown.ts`.
- Every flow was screenshotted at all three sizes. Fixed along the way: clipped titles (now one line with an ellipsis), lists that didn't wrap, solid-black scrims and buttons, overlapping stickers, and sections overlapping after rows grew.

**Not checked:**
- No real phone.
- Dark mode is not designed.
- The iPad overlay frames hide the tab bar under the sheet, by design.
- `docs/features.json` was not touched (design only).

### Gotchas for the next Figma session

- **Paint opacity:** `setBoundVariableForPaint` drops the paint's opacity. Use layer opacity for scrims.
- **Variable colour:** pass the variable's resolved colour as the base colour, or the fill can render black.
- **Re-apply fills:** detached Option rows and Button Secondary instances need their fills re-applied from the main component.
- **Mixed-font text:** load each font from `getStyledTextSegments` before editing.
- **Wrap layouts:** they need a fixed or filled width on the parent, or they won't wrap.
- **Atomic scripts:** a failed `use_figma` script changes nothing, so it can be retried.

### Next

1. Chime reviews and sends corrections. Fix them and record each in DECISIONS.
2. Chime approves the screens: the week 1 gate in PLAN.
3. Still open:
   - Chime decides the two-city proposals and O-16 (one address per city).
   - Abuja research.
   - O-14 (Nigeria's Doomsday date).

## Earlier: designing flow by flow (15 Nov 2026)

Flow 1 **Where are you watching?** is done at iPhone, iPad and desktop: section `172:519` at the top of Design screens, one row per state (D-70). Every screen has the browser mockup on top (components `173:82` iPhone, `173:104` iPad, `173:140` desktop, in "Mockup · Browser chrome" on the Design System page); iPhone and iPad frames have radius 40. The old per-device sections (iPhone `166:530`, iPad `166:543`, Desktop `166:546`) hold the not-yet-redone flows; each flow moves into its own row-per-screen section as it is designed. Next flow per the sitemap: Films (then Film + sheet, Search and city, Cinemas, Area, Cinema, Starting soon, Your cinemas, About/404/Offline).

## Earlier: sitemap draft 3 waiting for approval (15 Nov 2026)

`docs/design/structure/Sinima - Sitemap (draft 3).pdf` (source `sitemap-v3.html`, rendered with Playwright; Urbanist and the Sinima tokens). Waiting for Chime's approval; nothing else changes until then (D-69). After approval: design every screen on its page 7 with **one row per screen: iPhone, iPad, desktop side by side, rows going down** (replaces the per-device sections).

## Earlier: file organised like Odin (15 Nov 2026)

D-68: pages Cover · Design screens · Design System · Archive, then dividers and the references. Cover thumbnail frame `166:394` is the file thumbnail (the plugin API can't set it; Figma already showed "Restore default thumbnail" for it, and the file tile shows it). Design screens: sections iPhone `166:530`, iPad `166:543`, Desktop `166:546`, each flow under a navy header bar, screens named "Flow - State - Device". Design System: guideline frame `168:60` at x 0, then Doc · 1 Colour … 13 Stickers in a row. Next: iPad and desktop versions of Entry, Search and city, Starting soon, Film (+ dialog) and Your cinemas, placed in their device sections under the same flow headers.

## Earlier: design system and design screens (15 Nov 2026)

Figma is organised: **Design screens** (was Round 10) and **Design System** first, then dividers: Logo Options | UI8 kits | Previous · PamPam/Posh/Phantom/Sweatpals | Archive. The Design System page holds the tokens (variables in Sinima · Primitives, Tokens, Size, with CSS names), text styles, effect styles, colour styles, and the components with build notes (D-66). Title is **What's on in Lagos** with the city tappable; first visit asks for location as the site opens; Lagos or Abuja is picked, anything else falls back to Lagos (D-65; rule 11 updated). Your cinemas folders show the chain logo sticker (D-67). Screens done: iPhone (Films, Starting soon, Film + sheet, Your cinemas, Entry 1 to 3, Phantom-style), iPad (Films · iPad `164:218`), desktop (Films). **Next:** iPad and desktop for Starting soon, Film and its sheet (desktop: centred dialog), Your cinemas and Entry; a no-poster variant for the Film card component; then Chime approves and the build starts (week 2). Gotcha: the use_figma screenshot often draws image fills inside instances or under background blur as one repeated poster; Figma itself is right (checked in Brave twice).

## Earlier: scope change (15 Nov 2026), read first

**D-62:** Sinima launches for **Lagos and Abuja**, on **X with a motion-graphics explainer video**, on **Tue 15 Dec 2026** (backup Wed 16), 2–3 days before Avengers: Doomsday opens (worldwide 18 Dec; Nigeria to confirm, O-14). `PLAN.md` is restructured into four weeks plus launch; PRD and CLAUDE.md updated. **D-63:** Round 10 (Ghost + Keepsy) is the working design; Ghost and Keepsy are the style reference for all design. Next in the plan (week 1): Chime approves Round 10 (or asks for more), the city picker, Abuja research (cinemas, sources, areas), and the open questions O-14 to O-16.

## Earlier: logo rework in Figma, with four UI8 brand kits (Sun 15 Nov 2026)

Chime is rebuilding every design in Figma first (https://www.figma.com/design/2WxAK7rxGC6t4Wkd5IQ6p2/Sinima), starting with the logo. Nothing in the app changed; the last app commit is still `63654cd`.

- **Main logo (Chime's pick):** "Frame 1" at the top of the **Logo Options** page: a tilted purple ticket with two eyes and a dashed tear line, wordmark "Sinima" in Manrope Bold. Not yet in `DECISIONS.md` or the app; ask before recording it.
- **Logo Options page** also holds every earlier logo, redrawn as editable vectors in six round frames (art.html, logos.html, identity.html, logos2.html, refine.html, ticket.html, plus Ticket S as the app shows it now). Mascots are PNG image fills.
- **UI8 brand kits** (board: `docs/design/reference-board/ui8-brand-kits/index.html`, same features as the Mobbin boards; excluded from git in `.git/info/exclude`). Chime chose Radesk, Optima, Digcy and Pulse Padel. Each has its own page after Logo Options:
  - **UI8 kit · Radesk:** Dark and Light sections (37 frames each) and a Components section; all 416 instances relinked to the local components.
  - **UI8 kit · Optima:** Brand Book (43 slides) and Style Guide sections; 39 instances relinked. Two text layers use General Sans, which is not installed.
  - **UI8 kit · Digcy:** 34 slides plus the Footer component; its 4 colour variables copied into the file. The phone mockup slide still uses Apple's iOS kit library (88 variables, 33 instances), which was external in the kit too.
  - **UI8 kit · Pulse Padel logos:** the 13 SVG logos only (the 1.2 GB guideline file was not downloaded).
- **Files:** `~/Downloads/UI8 for Sinima/` (outside the repo). UI8's licence forbids redistributing the files, so never commit them to the public repo. The imported drafts in the GenAI-Labs workspace (Radesk, Optima, Brand Guideline Presentation Kit) are no longer needed by Sinima and can be deleted.
- **How the kits got in:** the Figma MCP cannot import `.fig`; Chime dragged them into Figma in Brave, then Claude copied each page there with Claude in Chrome (⌘A, ⌘C, paste into Sinima) and tidied and relinked with `use_figma`. When a paste brings unpublished variables, click "Copy variables into this file" at once; the toast closes within seconds.
- **Six logo kits built (Logo Options page, under the main logo):** Chime's shortlist is Ticket face (the main pick), Screen face (round 2 #2), 3D glasses (#13), Peeking (#14), Ticket S and Front row (round 4). Each is a row of 7 slides in the UI8 kits' order: concept, construction on a 4-unit grid, lockups, clear space and minimum size, colour, misuse, app icon. Round 1 was deleted at Chime's request; rounds 2 to 6 are no longer on this page (Chime moved them, probably to Archive).
  - Marks are redrawn from exact geometry in `docs/design/logo/refined/marks.mjs` (one place per mark: sizes, radii, guides, clear-space unit, colours). `gen.mjs <0-6> [rowY]` writes the Figma script for one kit; `preview.mjs` renders all marks to HTML for a quick look.
  - Wordmark in every kit: Manrope Bold, −2 % tracking (from Chime's main logo). Each kit keeps the colours it was picked in; the overall colour choice is still open.
  - Figma gotchas met: SVG dash patterns repeat (draw arcs instead); `figma.flatten` merges colours (group the imported SVG instead); exported SVGs carry clip masks, and Peeking's is a luminance mask, so keep mask fills and set `maskType = "ALPHA"` before restyling.
- **Slides 8–12, "In use", added to every kit** (Chime asked for Radesk's section 5): browser, macOS, iOS, X and Instagram. Each is a copy of Radesk's own mockup with our mark swapped in, Radesk purple turned into the kit's brand colour (banners) or icon colour (icons, profile pictures, favicons), and real copy ("Clayface starts in 15 min at Filmhouse Lekki"). Each kit has two components to the right of its row: "on icon" and "one colour". Builder: `docs/design/logo/refined/inuse-builder.js` with data from `gen-inuse.mjs`.
  - Radesk gotchas: its icons hide the coloured logo and show a white overlay (a group "LOGO MARK - UNICOLOR" whose instance is a mask); swapping keeps Radesk's overrides, so call `resetOverrides()`, restore `isMask`, then show our coloured instance and hide the overlay. Its logo component is a 1024 box with the mark in the middle two-thirds. Scaling the mockup rounds text but not spacing, so wrapped header rows and short labels need widening afterwards.
  - Audit after building: 30 in-use slides, no Radesk text, lorem ipsum, Radesk logos or Radesk purple left; every footer reads "n / 12".
- **Kit 1b · Ticket face, blue** (Chime asked for a blue Ticket face): row at y 1570, right under kit 1, all 12 slides; kits 2–6 moved down to y 2820. Same geometry, only the colours change: Cornflower `#5B8DEF` ticket, Navy `#0B1B3F` eyes and name, Ice `#EEF3FF` backgrounds, and the app's Screen blue `#2F5FB3` as the deep shade (dark backgrounds, icon gradient). Eyes on the ticket read 5.23:1 against the purple's 4.61:1; the name on Ice is 15.2:1. Profile pictures and favicons are navy, because the mark disappears on cornflower. `LOGOS[6]` in `marks.mjs`. Same audit passed.
- **Wordmark is now drawn, not typed** (Chime: in the UI8 kits the name is a vector shape, not a font). Built by `docs/design/logo/refined/wordmark-builder.js` from Manrope Bold's own outlines, read from Figma: letters re-spaced by hand (112 between stems, where the font sets 120–130; 80 from m to a), and the i's rebuilt from shapes. Three components in "Components · Wordmark" (x −1800, y 1300): **drawn** (Manrope's square dots), **eye dots** (the dots become 92 × 138 ovals, the 2:3 shape of the mark's eyes) and **eye dots, tilted** (an option, not used). The comparison slide "Wordmark · drawn, not typed" sits left of kit 1 (x −1800, y 320).
  - Every kit's slides 1–7 were rebuilt by `gen.mjs` (now `node gen.mjs 0,6,1 > kits.js`: it rebuilds those slides in place in the existing rows; slides 8–12 untouched). Lockups use a wordmark instance sized so its cap height matches Manrope at the old size. Eye dots for the marks with eyes (Ticket face, its blue version, Screen face, Peeking: `wordmark: "eyes"` in `marks.mjs`); drawn for 3D glasses, Ticket S and Front row.
  - Fixes that used to live only in Figma are now in `gen.mjs`: misuse copies are groups, not flattened; masks set to alpha; the outline example skips masks; light swatches get a hairline. New: Peeking's busy-background example sits on its dark tile colour (it was white on white).
  - Audit: 7 rows × 12 slides, 13 wordmark instances per row, no Manrope text left except the Unsplash credit inside Radesk's Instagram mockup. Chime's own "Frame 1" still has typed Manrope; left alone.
- **Logo parked.** Next: Chime reviews the kits (purple and blue Ticket face side by side) and the wordmark (eye dots or plain), and narrows them down.
- **App look: new UI8 board** `docs/design/reference-board/ui8-app-styles/index.html` (git-excluded, opened in Dia). Chime finds PamPam, Posh, Phantom and Sweatpals generic and wants a playful, energetic (not childish) tone to suit the ticket face. Three parallel searches (cinema and events; playful styles in any category; local and lifestyle apps) ran about 195 UI8 searches and looked at about 175 kits; 18 kept in four sections: Loudest and most playful (Saucy, Quizpop, Eventmate, Lerno, Hopp), Lively and built like Sinima (Padle, Recipe AI, Gymmy, Eventra, Podify, Bonding), Borrow one idea (Keepsy, Numa, Tourly, Planny, Habitify), Near misses (Festra: our flow, generic look; Hotbite: our energy, a website). Nothing downloaded. Chime picks ten; then fetch those (ten of the day's 40 downloads), keep them out of the repo, and bring them into Figma.
  - **Outcome:** Chime picked only Keepsy and wants a CALM style like the Mobbin app Ahead (https://mobbin.com/apps/ahead-ios-5f6db6dd-13a1-4644-a51f-a58d600f3d7a/84466810-423a-44b1-9cec-2cc39d633bbf/screens): white and light lavender, hairline cards, one purple, pastel tints with tiny faces, rounded type, one simple mascot in the tab bar that speaks in callouts. Second board `docs/design/reference-board/ui8-calm/index.html` (git-excluded): Closest to Ahead (Miora, Hush, Hopp, Tentrem, Freud), One idea each (Moodly, Fluen AI, Conscio, Sleepyal, Design Monks), Characters and illustrations (Character Faces by Digcy, a free pack with a tilted rectangle with eyes; Freddy; Subtle Empty States; Funky Elements; Mind Shelter). Chime then asked for web designs too ("I just need something clean"); two web sections now lead the board: Clean web designs (Lifefit, Next.js 16 + Tailwind 4 like Sinima; Rounds; Eventverse; Ofative; Elyora) and Web layouts to borrow (Goliv, Calendr, Tickety, Magnolia, TripEasy, Astra, Retreat Ayana). Ghost (statsstudio crypto wallet, ghost-blob mascot app icon) added at Chime's request, first in Closest to Ahead. 28 items. **Chime picked Ghost and Keepsy.** Both .fig files downloaded to `~/Downloads/UI8 for Sinima/Ghost/` and `/Keepsy/` (2 of the day's 40 downloads; never commit them). Chime then asked for both in the Sinima file after all. Pages **UI8 kit · Ghost** (121:1349) and **UI8 kit · Keepsy** (121:1350), after Pulse Padel, filled by copy and paste from the imported drafts (Ghost `RiSam3MI0BFzxesg8I1I01`, Keepsy `py6sJAE4TamYjiSpSFvsaP`), one section per source page.
  - Ghost: Cover, Foundations, Assets (216 components), Screens (16 flows). 603 instances relinked to the local components; the rest (Badge, Spacer, Social icon...) come from an external library in the original too. 33 variables copied ("Primitive"); 921 bindings moved onto them. Semantic tokens such as text/primary are library-linked in the original as well.
  - Keepsy: Cover, Release Notes, Get Started, Design Area (47 screens), Style Guide, Icons (994 components), Component (144), Thank you (locked, as in the original; select it from the layers panel). 406 instances relinked; 943 colour bindings moved onto the copied 02-Tokens/01-Foundations variables. Left linked: the iOS keyboard and a few icons (library-linked in the original too) and 480 `.Swatch` style-guide swatches, whose main component is orphaned in the Keepsy file (on no page), so it cannot be copied. One invalid image was dropped from Keepsy's cover (its phones are blank in the original).
  - Gotchas: Select all skips locked layers; a failed copy makes the next paste repeat the last clipboard (a duplicate Component paste was removed); the "Copy variables into this file" toast vanishes fast, and a "Copy to Figma Slides" tip can appear instead (close it).
- **Round 10 · Ghost + Keepsy** (new Figma page `143:1349`, before PamPam). Chime commented on the finalists to mark the parts they like (read with get_comments): PamPam stickers around the title; Posh cards (one comment there, although Chime said Posh had none, so flag it); Phantom stats line, countdown pill and the Starting soon card; Sweatpals search bar, navbar and bottom nav. Style: Ghost's plainness, buttons and pop-up sheet; Keepsy's sticker structure. Logo: Ticket face, blue; type Urbanist plus Story Script for sticker labels.
  - Screens: Films · Phone `143:1350`, Starting soon · Phone `144:1356` (includes a started showing with no booking), Film · Phone `145:1369`, Film · Phone · Showing sheet `145:1435` (Book on the cinema's site / Add to calendar / Keep a countdown, plus a freshness line), Your cinemas · Phone `146:1351` (Keepsy folders), Films · Desktop `148:1352`; a notes card at x −700 lists what came from where.
  - **15 Nov, after Chime's review (D-63):** title is now "Films near you" (two cities); the PNG "Admit one" ticket is replaced by a vector ticket with a Keepsy die-cut, and every ticket-face sticker has a wider, even white border; countdown pills are centred on the poster (phone and desktop); Starting soon cards are all 405 px with the badge centred and the time pill at the bottom; new screen **Films · Phone · Phantom-style tab bar** `150:1457` (frosted pill, active tab as Ghost's blue button with label, icons only for the rest, a die-cut count sticker on Your cinemas); the original tab bar is kept. Desktop has no Phantom-style navbar yet.
  - **15 Nov, second pass (D-64):** the Phantom-style tab bar is now a component set `151:1442` (4 variants, max 336 px wide, small count sticker inside the bar, hidden on its own tab) swapped into Films, Starting soon, Your cinemas and the Phantom-style screen; desktop nav component `151:1629` in Films · Desktop. Title options board `152:1460` (y 4800): 1 "What's on in Lagos" (city tappable, proposed), 2 "Tonight at the cinema", 3 "Catch a film tonight", 4 "Next film in 12 min" (live). Two cities board `153:1460` (y 5440): A first visit picks the city, B the city chip in the search bar opens a Ghost sheet (Lagos, Abuja, Both cities), C search with Both cities groups results by city, D one address per city. Abuja rows are labelled sample. Waiting for Chime's picks.
  - Gotchas: the use_figma screenshot renders poster stickers under a BACKGROUND_BLUR panel as one repeated image; Figma itself renders them correctly (checked in Brave). A ticket-face sticker needs a white silhouette behind it, because stroking the face path also fattens the tear-line holes.

## Before: round 9, desktop, and the four finalists in Figma (Sat 14 Nov 2026)

Read this section first. The round 5 to 8 section below is background; where they disagree, this is right. Nothing in the app changed; the last app commit is still `63654cd` (D-61). All design work stays local and uncommitted, as before.

### Start here next time
1. **Check UI8.** Chime signed in to the UI8 MCP server (`https://mcp.ui8.net/mcp`, user scope) at the end of this session. `claude mcp get UI8` shows Connected, but the tools only load in a new session. First thing: confirm the UI8 tools are there and tell Chime what they can do. The budget is $0: use only free or already-owned material, never buy.
2. **The four finalists are in Figma:** https://www.figma.com/design/2WxAK7rxGC6t4Wkd5IQ6p2/Sinima. One page per variant (PamPam, Posh, Phantom, Sweatpals), each with a "Phone · 390" section and a "Desktop · 1440" section holding Films, Starting soon, Cinemas and Your cinemas: 32 screens. Ask Chime what comes next there.
3. **Offered, not done:** turn the repeated parts in Figma (poster card, countdown pill, cinema card, nav) into real components, so the file can be edited rather than only reviewed.
4. **Still open from before:** colour (about 10 palettes from Chime's 32 picks), the Starting soon time filter, posters for the 13 Nollywood films not on TMDB, the logo, dark mode for every variant, nothing seen on a real phone.

### What happened this session, in order
- **Round 8 answers:** Chime kept 5 of 8 (PamPam, Town, Posh, Phantom, Sweatpals); notes saved in `mockup/r6/notes-round8.json`. Chime said not to copy Sweatpals parts into the others this round: fix only what was flagged on the phone, then design desktop.
- **Round 9** (`mockup/r6/round9.html`, ids `<name>-9`, shots in `mockup/r6/shots9/` at 390, 1024 and 1440): five builder agents, one per variant.
  - PamPam: the countdown is a plain one-line butter pill; the cinema "Next at" is a small tilted sticker instead of the big serif stub.
  - Town: rebuilt from town-r (round 7); flat pastel countdown pill; Starting soon all vertical cards; desktop filters in one toolbar row under the heading.
  - Posh: the round 7 Starting soon ticket restored with posh-r's values; desktop Starting soon is an hour-by-hour agenda.
  - Phantom: Starting soon and Cinemas rebuilt (mascot-face countdown capsule with a filling ring; profile cards with a round logo).
  - Sweatpals: phone unchanged; desktop only.
  - Every variant has a desktop layout from 1024 px; the board has a Phone / Desktop switch (key D) and New / Before on the phone (key B).
- **Round 9 answers:** Chime marked PamPam, Posh, Phantom and Sweatpals "Like parts of it" with no notes. **Town is out.**
- **Figma:** the four variants were captured as editable layers (real text in each variant's fonts, frames, image fills) with Figma's page capture, driven by Playwright at exact widths from a local server.
  - Posters from TMDB came through blank until they were inlined as data URLs before capture.
  - PamPam's stickers use a shared SVG filter; the capture lost them, then dropped SVG images entirely. Fix: copy the needed defs into each SVG, draw it to a canvas and embed it as PNG. So the stickers are images, not vectors.
  - A small "Frame 1" on the Phantom page was not made by us; it was left alone.
- **UI8:** Chime asked to connect it; `claude mcp login UI8` needs a real terminal, so Chime ran it and signed in.

### Tools (`mockup/r6/tools/`)
- `render9.mjs <id>` renders a variant's four pages at 390 (2x), 1024 and 1440 into `mockup/r6/shots9/` and reports sideways scroll.
- `gen-round9.py` + `round9.tpl.html` build the round 9 board; `ROUND9-BRIEF.md` is the builders' brief.
- `fcap.mjs <variant> <page> <width> <captureId> <promptId>` sends one page to Figma. It needs `python3 -m http.server 4321` running in `mockup/r6`, and a capture ID from `generate_figma_design` for each screen. Pass `dry <out.png>` instead of the IDs to preview. Run captures in batches of 6 or fewer: a long-running command was stopped after 5 minutes.
- `sheet.py` makes side-by-side contact sheets.

### Known faults and things not verified
- No variant seen on a real phone or a real laptop; dark mode not designed.
- Between 761 and 1023 px the variants only had to not break; tablets aren't designed.
- On desktop, four variants hide the in-page "Find a film" box to keep one search; in the real site those two searches behave differently.
- Figma screens are faithful layouts, not linked components; Starting soon phone screens are about 25,000 px tall because they list every showing.

## Earlier: finding Sinima's look, design rounds 5 to 8 (Fri 13 to Sat 14 Nov 2026)

Read this section first. Everything below it is background; where they disagree, this is right.

Nothing in the app changed this session. All of it is design exploration, kept local and uncommitted on purpose, because the reference images are other products' copyrighted screens (`docs/design/reference-board/images/` is git-ignored) and the variants imitate them. The last app commit is still `63654cd` (D-61).

### Start here next time
1. **Wait for Chime's round 8 answers.** The board is `mockup/r6/round8.html` (open it in Dia). It has 8 finalists, each redesigned from Chime's round 7 note. Chime will paste "Copy all answers". Then narrow to one or two, make the winner's desktop layout and light and dark, and only build when Chime says build.
2. **Colour is not decided yet.** Chime picked 32 colour references (`docs/design/reference-board/round6-colour-answers.txt`). The plan agreed with Chime: turn them into about 10 Sinima palettes (light and dark, contrast-checked on real rows), then show the chosen variants in the palettes that suit them. One style per variant, never merged.
3. **Open questions from round 8, on the board:** PamPam's stickers still have red inside the drawings; Vocabulary's saved hearts are salmon; Town lost its typewriter font and tilted chips; Posh's caret after "Lagos" does nothing; most variants moved the nav into a **bottom dock** (ask if Chime wants that); none was seen on a real phone.
4. **Still open from round 4:** the Starting soon time filter (30 min · 1 hour · 2 hours · 4 hours · Today); posters for the 13 Nollywood films not on TMDB (Chime to choose: add them to TMDB, or ask distributors); the logo ("all right, but I'm still not convinced").

### How Chime works (saved to memory; follow it)
- **Plenty of references:** 15 to 20 or more per section on a Mobbin board, never 5 or 6.
- **One variant per picked style, never merged** (memory `style-picks-become-separate-variants`).
- **A liked reference means the whole app:** study that app's other Mobbin screens, not just the one picked (memory `liked-reference-means-whole-app`).
- **"Refine" means elevate:** round 7's polish (25 to 43 small value changes each) was judged "minor changes. They didn't really elevate the design." Make visible, structural improvements; keep exactly what Chime likes, rebuild what they don't (memory `refine-means-elevate`).
- **Boards:** a zoom view with the full answer form beside the image; keys ← → for screens, ↑ ↓ for variants, B for before and after, Esc to close; "Copy all answers" to paste back. Every refined card shows Chime's note and "You said → We did".
- **Chime speaks by voice, and the transcription garbles words:** "theme section" means Films, "starting zone" means Starting soon, "hijab" means Ijapa (Town's tortoise), "restaurant" means round.
- **Design skills:** 18 skills from aiforui.dev/skills (Emil Kowalski) were reinstalled fresh in `~/.claude/skills/` and apply in every project. The routing table is in `~/.claude/CLAUDE.md`; the full notes are in `~/.claude/design-skills-guide.md`. The old copies are kept in `~/.claude/skills/.trash/emil-skills-2026-11-04-backup/`. Four are user-only: `/pick-ui-library`, `/prototype`, `/review-animations`, `/learn-taste`.

### What happened, round by round
- **Round 5, design style and colour** (`docs/design/reference-board/round5.html`): Chime said the site "doesn't have character… not a modern design", so the current site became the **wireframe** (structure stays). 241 Mobbin references: 153 for style in six families (bold, playful, editorial, soft, dark, minimal) and 88 for colour. Its zoom was rebuilt so the whole answer form sits beside the image. Chime's picks: `round5-answers.txt` (41 style screens; Ahead's illustration and logo noted).
- **Round 6, colour board** (`round6-colours.html`): Chime said round 5 had too many greens and too little choice, so this has 209 references in 14 colour families, with greens capped at 10, plus the 13 round 5 picks. Answers: `round6-colour-answers.txt`. They group into near-black with one vivid accent (the strongest pattern), purple and indigo, gold and yellow, sky and teal and aurora, colour-blocked, and warm light grounds.
- **Round 6, 41 variants** (`mockup/r6/index.html`): three agents studied 37 liked apps (342 more Mobbin screens in `images/round6/apps/`, notes in the session scratchpad). Six builders made one variant per picked style screen. **How variants work:** `mockup/r6/base/{films,soon,cinemas,yours}.html` are frozen snapshots of the real built site (390 px, light, 17:30 Lagos, 3 hearted cinemas). A variant is `mockup/r6/variants/<id>.css`, `.js` and `.json`, loaded with `?v=<id>`; the JS may add original SVG illustration or restructure the page from what's already on it, never inventing data. Chime marked 19 "Like parts of it" and Nike "Not for us" (`mockup/r6/picks-round6.txt`).
- **Round 7, the 19 refined** (`mockup/r6/refined.html`, ids `<id>-r`): a senior UX audit plus unslop in polish mode, emil-design-eng, mobile-native, break-ui and apple-design; every change logged before → after. Chime kept 8, with notes (`mockup/r6/notes-round7.json`), and said the changes were too minor.
- **Round 8, the 8 redesigned** (`mockup/r6/round8.html`, ids `<id>-8`): Chime's notes from all rounds were turned into nine taste rules (in the brief, `ROUND8-BRIEF.md`, in the session scratchpad): soft not harsh colour; the nav needs designing; Starting soon as rich as Films; the countdown as a designed object (liked: Posh's ticket stub, Sweatpals' white pill); rich cinema cards; keep the liked characters (Ijapa, Phantom's ticket with eyes, Vocabulary's drawings, PamPam's stickers); no neo-brutalism; a big number must earn its space; keep Copilot's sun/moon toggle. Finalists: PamPam (from the original), Town, Posh, Copilot, Phantom, Sweatpals, Vocabulary, (Not Boring) Weather.

### Tools (in the session scratchpad, `scratchpad/r6/`; copy them into the repo if they're needed again)
- `snapshot.mjs` re-makes `mockup/r6/base/` from `out/`.
- `shot.mjs <id> <prefix>` renders one variant's four pages.
- `render-all.mjs <ids>` writes the 2x JPEGs the boards use. Its screen is as tall as the shot so bottom docks sit right; it waits for the DOM, then load, with one retry.
- `gen-index.py`, `gen-refined.py` and `gen-round8.py` build the three boards from the variant JSON; the briefs are `VARIANT-BRIEF.md`, `REFINE-BRIEF.md` and `ROUND8-BRIEF.md`.

### Known faults and things not verified
- No variant was seen on a real phone; all were judged from desktop renders at 390 px.
- The Mac slept several times when the lid closed, which stopped the agents. Keep it open during long runs.
- Mobbin reported high AI usage this month: unlimited during beta, but credits may be needed later, and the budget is $0.
- From before, unchanged: nothing checked on a real phone (sheets, search keyboard, switch); "Your cinemas" quirks; the freshness line could get long; old `/films` links give "page not found".

## Earlier: the theme switch follows Rune Icons (Fri 13 Nov 2026, afternoon)

### Start here next time
0. **Round 4 ended with D-61 (13 Nov, evening).** Chime rejected the Marquee mockup (fonts, colours, no posters) and asked for the previous design plus a Your cinemas tab, which is built (`/yours`). Do not reuse the Marquee look. Still open from Chime's recording: the Starting soon time filter (30 min · 1 hour · 2 hours · 4 hours · Today), to be done in the existing design with posters kept; real posters for 13 Nollywood films not on TMDB (Chime to choose: add them to TMDB, or ask distributors); the logo ("all right, but I'm still not convinced"). For Mobbin boards give 15 to 20 references a section.
1. **Ask Chime how the new switch feels on the phone** (D-60). The comparison page (Rune's frames above ours, a tappable copy at full and quarter speed) was in the session scratchpad, not the repo.
2. **Ask Chime what is next on the review.** Done so far: the tab order (D-55), phone search, the phone chips, the Cinemas tab (D-56, D-57), the light/dark switch (D-58) and its motion (D-60). Chime is happy with the Films, film and Starting soon pages for now.
3. **Open questions with Chime:**
   - Should the switch get a third state, "follow my phone"? Once tapped, there is no way back to the phone's setting.
   - Should the phone pickers go on the Films page and film pages? Chime said Cinemas only for now.
   - Should a saved cinema with nothing more today stay under "Your cinemas"?
4. **How to work with Chime here:**
   - Show results visually, before and after, opened in Dia.
   - Mockups are not builds: nothing goes into the app until Chime says build. ("Let's just use it" with a reference counts as build.)
   - For motion, show the options side by side and playing, with a quarter-speed control.

### What happened this session
- Chime's recording of runeicons: the page cuts in one frame; only the icon moves (shrink, blur and fade out; grow, sharpen and fade in), about 8 frames. The four motion options (`mockup/theme-motion/`) are dropped.
- Built (D-60): no view transition; other transitions off for the switch (`theme-cut`); the icon shows the theme on screen; new sun and moon glyphs; the switch styles moved to `src/styles/theme-switch.css`.
- Checks: theme.spec 11 pass, 384 unit tests, lint and types clean; frames compared with Rune's at 60 fps; code review fixed a test race and an off-centre moon.

### Known faults and things not verified
- Nothing checked on a real phone: the sheets, the search keyboard, the switch.
- When the phone's own setting flips with no choice kept, colours fade across over 150 ms (unchanged from before).
- "Your cinemas" lists only saved cinemas with showings left.
- The freshness line joins one line per source, so it could get long with live data.
- Search lists films with no showings left today.
- Old `/films` links give a "page not found".
- Still open from before: the About page with the TMDB notice, a daily rebuild, live data, "Remind me" after a showing starts, the Kids and Nollywood filters, the font pick.

## Earlier: the circle reveal and four motion options (Thu 12 to Fri 13 Nov 2026, past midnight)

The motion parts are superseded by D-60 above: Chime rejected the circle (D-59) as their portfolio's style, four options were made in `mockup/theme-motion/index.html`, then Chime sent the Rune Icons reference instead.

### What happened this session, in order
1. **Fixes from the first recording (D-55):**
   - The tabs read Films, Cinemas, Starting soon, and `/` is Films (`/films` is gone).
   - The phone search button opens a search box with matching films.
   - The area chips wrap instead of being cut off, and "Starting soon" stays on one line.
2. **Cinemas tab redesign:**
   - Round 3 references (`docs/design/reference-board/round3-cinemas.html`, local only). Chime picked Instacart's list and its web layout.
   - Mockup rounds 1 and 2 (`mockup/cinemas.html`). In the second round Chime asked for better phone filters, centred logos, Magnificent's real logo and better spacing on desktop. Chime also said: "Vet all this design before you show me."
   - Chime picked Option 1, one row of pickers (D-56), then answered the open points (D-57): real logos with a removal route, Cinemas page only, and Leisure Mall merged into Filmhouse Surulere.
3. **Built (D-56, D-57):**
   - logo rows, and phone pickers that open sheets
   - 12 chain logos (`public/logos/`, sources in `data/logos.json`)
   - a footer line on having a logo removed
   - the freshness line under the first heading
4. **Light/dark switch (D-58):**
   - A round button beside search on every screen. It follows the phone until tapped, then keeps the choice (`ls.theme`).
   - A head script in `layout.tsx` applies the kept choice before the first paint, browser bar included.
   - Also fixed: the phone picker labels were cut short at 360 and 320 px.
5. **Switch motion (D-59):** Chime found the instant switch "stagnant". I built a circle reveal using the browser's view transitions, with the icon turning a quarter. Chime then rejected the circle as their portfolio's style, and the four options above were made.
6. **The test build makes its sample data as of 08:00 Lagos**, locally (`playwright.config.ts`) and in CI. A late-evening build drops the day's ended showings, and two HTML tests failed; that broke CI twice.
7. **Memory:** the Mac sat near the memory guard's limit (78%). Browser test runs were refused twice until Chime closed Brave and Dia. Run browser tests one file at a time.

### Where it stands
- **Live:** https://sinima-app.vercel.app. The last app change is `f837df7` (the circle motion); `55fbc40` adds the pick page. CI was green on every push since `a7ff565`.
- **Checks:**
  - 384 unit tests pass.
  - The full browser suite passed on the last app commit, with 11 theme tests.
  - The heaviest page is 188.7 KB of 200.
  - 29 of 43 features pass.
- **Code map additions:**
  - `src/components/CinemaRow.tsx`, `Pickers.tsx`, `Search.tsx`, `Tabs.tsx`, `ThemeToggle.tsx`
  - `src/styles/cinemas.css`
  - `rowWarning` in `src/lib/wording/freshness.ts`
  - `THEME_KEY` in `src/lib/area.ts`
  - `--color-tile-*` tokens

### Known faults and things not verified
- Nothing checked on a real phone: the sheets, the search keyboard, the switch, and the motion. View transitions need iOS 18; older iPhones switch at once.
- "Your cinemas" lists only saved cinemas with showings left.
- The freshness line joins one line per source, so it could get long with live data.
- Search lists films with no showings left today.
- Old `/films` links give a "page not found".
- `src/styles/sinima.css` is 301 lines, just over the guideline of about 300. Move the theme switch rules out when the motion changes.
- Still open from before:
  - the About page with the TMDB notice
  - a daily rebuild
  - live data
  - "Remind me" after a showing starts
  - the Kids and Nollywood filters
  - the font pick

## Earlier: the redesign went live (Thu 12 Nov 2026, evening)


Read this section first. Everything below it is background; where they disagree, this is right.

### Start here tomorrow
1. **Ask Chime for the list of fixes.** Chime's last words: "I like it, it's a good starting point, but there are a lot of things we need to fix." The list has not been given yet. Do not guess it. Collect it, say it back in a table, then fix it item by item.
2. Fix against the live site (https://sinima-app.vercel.app) and the approved mockup (`mockup/index.html`, draft 4). Keep the layout, the Lagoon colours and the motion unless Chime says otherwise.
3. Show results visually (screens side by side, opened in Dia), not as terminal text.

### What happened this session, in order
1. **Day 2, the data** (D-45 to D-47): data format and validator, Lagocine and Veezi parsers, `refresh --fixtures` (sample data on today's dates), TMDB matching with Chime's key. All committed.
2. **Day 3, a first home screen** was built and went live. **Chime rejected it as a design** (D-49): one showing per row on desktop, empty poster boxes, an area dropdown, nothing of the references in it.
3. **Structure first:** a designed PDF, `docs/design/structure/Sinima - Sitemap and user journey (draft 2).pdf`. Chime approved it and all six decisions in it: Cinemas is home, area as chips, a panel per showing, day tabs not weeks, Starting soon as a tab, uncovered cinemas still listed.
4. **Format filter added** as a key feature (D-50): find a film by IMAX, 4D or 3D and by area.
5. **Second reference board** (`docs/design/reference-board/round2.html`, local only): 44 shown, 21 liked, 7 "Not for us". Picks are in `docs/design/REFERENCES.md`. Chime's instruction: follow the picks closely.
6. **Four mockup drafts** in `mockup/`: (1) Danfo colours: layout liked, yellow not; (2) restyled after cofounder.co: rejected; (3) draft 1 again with draft 2's motion; (4) Lagoon colours with a true dark mode: **approved** (D-52, D-53).
7. **Built into the app and deployed** (D-54), commit `df40dda`. A code review at high effort found ten faults; all ten are fixed.

### Where it stands
- **Live:** `/` and `/area/[slug]` (cinemas, soonest first), `/cinema/[id]`, `/films`, `/film/[slug]`, `/soon`; the showing panel (side panel on desktop, sheet on a phone); Share (tilted card, Share, Copy link, WhatsApp); Remind me (.ics); format, area and day filters; hearts and "Your cinemas".
- **Design:** Lagoon in light (Foam page `#eef6f4`, Sea mist `#d9ebe7` where white would be, Lagoon text `#0c3b47`, Teal `#0b6e69` primary), true black in dark with Sea mist text and Teal `#5fd4c8`. Dark mode follows the phone. Fonts: Geist for text, Anton for poster titles and the share headline, both cut down (21.6 KB together).
- **Code map:** tokens `src/styles/tokens.css`; component styles and motion `src/styles/sinima.css` (class names match `mockup/mockup.css`); boards in `src/components/` (`CinemasBoard`, `CinemaBoard`, `FilmsBoard`, `FilmBoard`, `SoonBoard`); shared `Cards.tsx`, `Filters.tsx`, `Showing.tsx`, `Share.tsx`, `Poster.tsx`, `Shell.tsx`; data helpers `src/lib/data/programme.ts`, `format.ts`, `select.ts`; day wording `src/lib/wording/day.ts`.
- **Data:** still sample data from the 11 Nov Lagocine pages; every Book button reads "Sample only". 15 of 31 films have a TMDB poster; the rest get a title poster.
- **Checks:** 366 unit and 44 browser tests; heaviest page 188.0 KB of 200. CI green on `df40dda`. 26 of 40 features pass.
- **The gate:** `.claude/proof.json` runs typecheck, browser tests and budget in order as one check. Chime pre-approves every change to that file; do not ask.

### Open with Chime
- **The fix list** (see Start here).
- **Font:** never picked. Geist is in because the mockup showed it. Six free options are in the mockup's top bar.
- **TMDB hand matches:** Ikenga and Verity are unmatched; Ramayana was matched to "Ramayana: Rise of a Legend" by assumption.
- **The wordmark:** should tapping "Sinima" go to the saved area instead of all of Lagos?
- **Title posters** use deep teal and navy in dark mode too; Chime dislikes a green tint in dark mode and has not commented on these.

### Not built yet
- About page with the TMDB notice (required before launch, D-09).
- Kids and Nollywood/Hollywood filters; "Save image" on the share sheet; the WhatsApp preview image; offline; "Use my location".
- A daily rebuild: the sample site empties two days after each deploy.
- Live data (Lagocine, Day 6 of the plan, D-33).

### Known faults and things not verified
- "Remind me" is still offered after a showing has started.
- Nothing has been checked on a real phone; the motion was not watched by eye in the app; no screen reader pass.
- The fresh-context verifier did not run on the final build (the Mac was at its memory ceiling; closing Dia and Brave frees about 8.9 GB).
- Font sizes are written in `sinima.css`, not as tokens. `validate.ts` does not check `posterPath`. Unused helpers remain (`filmCounts`, `soonCount`, `nextDayName`, `loadArea`, `showingLine`, `showingSentence`).
- A title with a letter outside Anton's cut-down set falls back to Geist on its title poster.

### How Chime works (learned this session; the earlier lists below still hold)
- **Judges by looking.** A design is only real once Chime has seen it. Function passing is not design approval.
- **Follow the picks.** Under each mockup screen, list which references it follows and what was taken from each.
- **Change only what was asked.** "Keep the layout, change the colours" means exactly that. The cofounder.co restyle went further than asked and was rejected.
- **Say it back first.** For a big request, write what was understood and the plan in a table before starting.
- **Documents must look designed** (the structure PDF is the standard).
- **Dictation is loose:** "downfall" meant Danfo; "D9EB7" meant `#d9ebe7`; "start day one" meant the next day.
- **Standing yeses:** automated reviews (one helper at a time), and every `.claude/proof.json` change.
- **Chime thinks out loud and reverses.** A pick is a shortlist until Chime says "approved" or "go with it".

## Earlier: the redesign in progress (Thu 12 Nov 2026)

**Read D-49 first.** Chime rejected the Day 3 home screen as a design. The plan's Day 4 is on hold.

- **Approved:** the structure in `docs/design/structure/Sinima - Sitemap and user journey (draft 2).pdf` (source: `sitemap-and-journey.html` beside it; re-render with Playwright's `page.pdf`). Cinemas first, Films and Starting soon as tabs, area as chips, a panel per showing, day tabs.
- **With Chime now:** `docs/design/reference-board/round2.html`, 44 references in six sections for the new structure (local only, like the first board; answers come back by "Copy all answers"). Chime's share pick from round one (Fixtured) leads the Share section and must go into the app.
- **Mockup (12 Nov):** `mockup/index.html`, draft 3 (D-52): draft 1's design with draft 2's motion. Chime rejected draft 2's cofounder.co style. Draft 4 puts it in Lagoon colours with a true dark mode (D-53). Waiting for Chime on the colours and the font. Posters and fonts under `mockup/` are local only. Still to design after that: Films tab, Starting soon tab, empty and error states; then test IDs, `interactions.json` and the proof design check before any build.
- **Next, in order:** (1) read Chime's answers into `REFERENCES.md`; (2) a font page: free fonts close to TT Neoris (cofounder.co's, paid), each on the same real screen; (3) Danfo colours on real screens, light and dark, contrast checked; (4) two or three full mockups, desktop and phone side by side, real posters, for Chime to pick; (5) only after "go with it": rebuild, checked against the mockup.
- **Posters:** never an empty box. TMDB poster where matched (14 of 31), hand matches next, and a designed title poster for the rest. Real posters for unmatched Nollywood films would need a rule change (posters from films' official pages) or Chime adding them to TMDB.
- **How Chime wants things shown:** documents as designed PDFs, not plain pages; references on a board to tick; say back what was understood before starting.
- **Format filter (D-50):** find a film by format (IMAX, 3D, 4D) and area; only Filmhouse rows carry a format today. It is page 9 of the structure PDF, now draft 2.
- **`.claude/proof.json`:** Chime confirms every change to it in advance (12 Nov); do not ask. It now runs typecheck, browser tests and budget in order as one check.

## Earlier: Day 3 as built (Wed 11 Nov 2026, night)

Read this first, then the Day 2 section under it for the data pipeline. Where they disagree, this one is right.

- **Built:** `/`, `/area/[slug]`, a plain `/film/[slug]`; showing rows, sections by the clock, area picker with a remembered area, "Now showing" with a filter, empty state with neighbouring areas, sample and stale banners. Details and open cases: D-48 and the Day 3 entry in `PROGRESS.md`.
- **Checks:** 324 unit and 32 browser tests pass. 23 of 40 features pass; D3-3 (Chime approves on the phone) is the one Day 3 item left.
- **Waiting for Chime:** a poster pick (`docs/design/direction-board/posters.html`; its poster images are local only, in the git-ignored `images/posters/`); a look on the phone; whether the wordmark should go to the saved area; three TMDB hand matches (Ikenga, Ramayana, Verity).
- **The gate:** `.claude/proof.json` now runs typecheck, then the browser tests (which build the site), then the budget as one check, in that order (Chime's OK, 11 Nov). Before, three checks built or read `.next` at once and the typecheck failed at random.
- **Risks to deal with:** `/` weighs 195.7 KB of 200 with a full programme, so it must carry less before live booking links arrive; the site empties two days after a build; type sizes in components are not tokens; Vercel has not yet been seen running the prebuild step.
- **Do next (Day 4):** film page grouped by area with the Stay or Go tile, cinema page, "Started 5 min ago" rows with no Book link, then the Should items. Wire in posters once Chime picks.

## Earlier: Day 2 (session of Wed 11 Nov 2026, evening to night)

Read this section first. The sections below are background; where they disagree with this one, this one is right. Design, name, working style, cost rules and "watch out for" in the Day 1 section still hold.

### Where it stands
- **Data format and validator** (D2-1): `src/lib/data/types.ts`, `validate.ts`. Every rule in DATA.md §Rules is enforced and tested.
- **Parsers** (D2-2): `scripts/sources/lagocine.ts` (day page and cinema page) and `veezi.ts`, on three cut-down fixtures listed in `tests/fixtures/index.json`.
- **Sample data** (D2-3): `npm run refresh -- --fixtures` writes `data/showtimes.json`, `public/data/all.json` and `public/data/area/<slug>.json` (12 areas) on today's and tomorrow's dates in Lagos. 294 showings a day across 20 cinemas and 31 films. **These files are git-ignored** (D-45): run the command to make them.
- **Credits** (D2-4): `node scripts/tmdb.ts` ran against TMDB with Chime's key. 14 of 31 films matched (all checked by eye); 2 have a credits answer. `data/credits.json` is committed; `refresh` puts the answers on films. The key in `.env.local` is TMDB's short API key, which the script accepts (D-47).
- **Checks:** 301 unit tests and 10 browser tests pass; home page still 162.1 KB of 200 (nothing on screen uses the data yet).
- **Features:** 19 of 40 passing (Days 0, 1 and 2). **Decisions:** D-01 to D-47. Open: O-3, O-7. The neighbouring areas are confirmed and in `data/cinemas.json` (D-46).

### Do next
1. **Posters:** sizes are measured (D-47). On Day 3 show Chime rows with 92 px and 154 px posters and the title tile side by side, then decide. Only 14 of 31 films have a poster.
1. Ask Chime about three hand matches for `data/tmdb-overrides.json`: Ikenga, Ramayana, Verity (see `PROGRESS.md`).
2. **Day 3, the home screen** (`docs/PLAN.md`): `/area/[slug]` and `/`, showing row, area picker, "Now showing" list, empty state, banners. Follow the proof build skill's mockup steps: tokens and shared components first, one screen at a time.
3. **Fresh sample data on every build:** add a `prebuild` step that runs `refresh --fixtures`, and something that rebuilds the site each day (a scheduled GitHub Action is free). Without it the deployed demo shows nothing a day after a deploy.
5. Still to draw: the doodle character and the "nothing showing" screen.

**Needs from Chime**
- The GitHub secret `TMDB_READ_TOKEN` (the same value as in `.env.local`), before the scheduled refresh goes live.
- Nothing more on reviews: Chime said yes to automated reviews (D-46). Run `/code-review --fix` after code changes and the verifier once per unit; still ask before launching several helpers at once. `.env.local` exists (copied from `.env.example`) and is waiting for the token.
- Open the site on the phone, and try adding it to the home screen.

### Found this session
- **Lagocine repeats rows:** 59 of the 353 rows on its 11 Nov day page are exact repeats (all Genesis). Each is counted once.
- **Veezi and Lagocine write some titles differently** ("AGBARA NLA" / "Agbara Nla: The Return"), so film ids from titles alone will not join two sources. Sample data uses Lagocine only. A second live source would need TMDB ids or an alias list first.
- Lagocine's page carries a build stamp (`lagocine-built`); it is used as "when Lagocine read the cinema", which is an inference.
- The commit gate once failed the typecheck while the build was rewriting `.next/types`; it passed on its own and on the retry.

### Not verified
- Review findings left open, listed in `PROGRESS.md` (unchecked fields behind the validator's type; Veezi's year guess; a mistyped area slug; old area files never deleted).
- Live booking links will make data files heavier than the 10.3 KB measured; the limit is 20 KB.
- Everything in the Day 1 list below that needs a real phone.

## Earlier: Day 1 (session of Wed 11 Nov 2026, afternoon to night)

Background. Its "Where it stands" and "Do next" lists are out of date; use the section above.

### Where it stands
- **Name:** Sinima (D-36). Repo `ChimeXXD/sinima`, folder `Projects/Personal Projects/Sinima`, site https://sinima-app.vercel.app (the Vercel project is `sinima-app`; `sinima` was taken).
- **Design, all decided:** direction B · Poster (D-35); type Outfit, self-hosted at 25.5 KB (D-37); logo Ticket S (D-42); colours Ink and blue, black and white with one calm blue (D-43); Doodle illustrations (D-39). UI brief §1 to 3 are written.
- **In the app:** tokens in `src/styles/tokens.css` (Tailwind's theme; its own colours are off, D-38); the logo in the header (`src/components/Logo.tsx`); tab icon, home-screen icons and manifest (`scripts/make-icons.mjs` redraws them from `docs/design/logo/sinima-mark.svg`). The home page is still the placeholder.
- **Core logic, done with tests first** (D1-4 to D1-8): `src/lib/time` (Lagos time, showing state, countdown), `src/lib/wording` (freshness, credits, showing), `src/lib/ics` (the Remind me calendar file). Open cases are settled in D-44.
- **Checks:** 154 unit tests and 10 browser tests pass; home page 162.1 KB of 200. **CI is green on `9d285fe`.**
- **Features:** 15 of 40 passing in `docs/features.json` (Day 0 and all of Day 1). **Decisions:** D-01 to D-44. Open: O-3 (push), O-7 (other cities), O-10 (neighbouring areas).

### What happened this session, in order
1. **Reference board topped up** from 75 to 127 references (every section at 10 or more). Chime answered it: 52 liked, 13 "Not for us". Picks and the pattern summary are in `docs/design/REFERENCES.md`.
2. **Three directions built** (A · Rail, B · Poster, C · Board). Chime asked to choose by looking, not by reading the terminal, so a side-by-side pick page was added. **Chime picked B · Poster.**
3. **Name.** Chime liked Sinima, asked for other options (first a set built on Sinima, which was wrong; then nine unrelated names), and chose **Sinima**. Renamed everywhere: app, package, user agent (`SinimaBot`), docs, GitHub repo, project folder; Chime renamed Vercel.
4. **Direction B put into the app:** tokens, Outfit cut down to fit the 30 KB limit, a stricter colour check, UI brief §1 to 3.
5. **Illustrations:** three styles shown with Pinterest references; **Chime picked Doodle.**
6. **Logo, five rounds.** Six code-drawn icons ("too basic"); 20 options (Chime shortlisted Screen face); a full identity presentation; then Chime reopened logo and colour and asked for more: three mascots generated with Figma AI (owl, agama, popcorn; not picked) and three marks from design prompts; Chime's three finalists refined; **Chime chose Ticket S**, asked for it to be cut properly (the notches were painted circles; now one cut shape with real holes) and shown in six colour sets; **Chime chose Ink and blue**, the colours already in the app.
7. **Logo wired into the app** (header, icons, manifest), tests first.
8. **Core logic built**, tests first (time, wording, calendar file).
9. **CI fixed.** The browser-install step hung on GitHub's package server; it now skips the extra system packages and has a 5-minute limit. No test was removed.

### Do next (Day 2: the data)
1. `src/lib/data/types.ts` (started) and `validate.ts` from `docs/DATA.md`; the DATA.md example must validate and each rule needs a failing fixture.
2. Cut down the saved Lagocine pages in the git-ignored `tmp/audit/` to fixtures (D-24). Parsers for Lagocine and Veezi, tests first. The Silverbird fixture has no year in its dates and 12-hour times: convert through `lagosLocalToUtc`, the only local-to-UTC function.
3. `scripts/refresh.ts --fixtures`: sample data on today's and tomorrow's dates, one file per area.
4. TMDB matching and credits. Decide here where posters come from and what they cost (UI brief §1); if they can't fit the budget and TMDB's terms, posters stay on the film page only.
5. Still to draw: the doodle character and the "nothing showing" screen (Day 3).

**Needs from Chime**
- The GitHub secret `TMDB_READ_TOKEN` (the same value as in `.env.local`), before the scheduled refresh goes live. Claude cannot enter keys.
- A yes on the neighbouring-areas list (O-10), which Claude drafts.
- Open the site on the phone, and try adding it to the home screen.

### Not verified
- Anything on a real phone: the site, the home-screen icon, the calendar file in iPhone and Google Calendar (the Day 5 check).
- The design pages in Dia itself; they were tested in headless Chromium only.
- Poster cost in data (direction B puts one on every row).
- Name clash: two web searches only, no trademark search. `sinima.com` and `sinima.app` belong to others.
- **No automated code review or fresh-context review ran this session**, although Chime's global instructions ask for one after code changes. It launches helper agents, and the cost rule below says to ask first. Chime has been told each time and has not yet said yes or no.

### How Chime likes to work (added this session; the Day 0 list below still holds)
- **Show, don't tell.** For any visual choice, build an HTML page with the options side by side and a way to pick ("Copy my pick" gives one line to paste back). Keep the terminal reply short.
- **Always open every HTML page made for Chime in Dia, without being asked:** `open -a "Dia" <file>`.
- **"Present a logo" means a full identity page**, with the logo and colours together: lockups on dark and light, mark, app icon, one colour, favicon at real sizes, named colour swatches with their uses, type, and the thing in use. `docs/design/direction-board/refine.html` and `ticket.html` are the standard. A plain grid of drafts is "basic".
- Chime thinks out loud and changes direction; a pick is a shortlist until Chime says "go with it". Read what was actually asked (the first names page missed it).
- Chime's notes are dictated, so wording can be loose; when a note is unclear, say how it was read.

### Cost and money rules
- **Never launch parallel agents or forks without asking Chime first and saying what it will cost.** Earlier, four parallel helpers used a whole five-hour usage limit in minutes.
- **No more Figma AI generations without asking.** Three mascot images were made on the GenAI-Labs team (Chime's workplace, with Chime's yes); the cost in credits is not visible to Claude. File: "Sinima logo mascots" (figma.com/design/yuQMvnOTE5B0cH3mWtzSRK).
- The reference library shows a "usage is high this month" notice; it is free during its beta. Pull 6 to 8 results per search.
- $0 is a hard limit.

### Design files, for the record (`docs/design/`)
| File | What it is |
| --- | --- |
| `REFERENCES.md` | Chime's 52 picks and the pattern summary |
| `UI-BRIEF.md` | Direction B, tokens, motion, pages, copy |
| `direction-board/index.html`, `pick.html` | The three directions; the side-by-side pick page |
| `direction-board/names.html` | Name options |
| `direction-board/art.html` | Illustration styles with Pinterest references, first icon drafts |
| `direction-board/logos.html`, `logos2.html` | 20 logo options; round two with mascots and marks |
| `direction-board/identity.html`, `refine.html` | Screen face identity; the three finalists refined |
| `direction-board/ticket.html` | Ticket S sculpted, six colour sets (`ticketPath()` in `ticket.js` generates the mark) |
| `logo/` | Final mark as SVG; Screen face in `archive/`; mascot images in `mascots/` |
| `reference-board/` | Local only, not in the repo (it names the reference library). 127 references; new ones go in the `EXTRA` array |

Skills: `logo-generator` (op7418) is installed. `ip-as-logo` (s1dashu) is not installed; Claude read its instructions from GitHub. Chime can run `npx skills add s1dashu/ip-as-logo-skill`.

### Watch out for (added this session)
- Claude's memory for this project lives under the new folder name; start sessions from `Projects/Personal Projects/Sinima`.
- The colour check (`npm run lint`) fails on any colour written outside `tokens.css`, including named colours and Tailwind's palette classes. Values the HTML needs (the browser-bar colour) are read from `tokens.css` at build time.
- Piping a long build into several `grep` commands hung a shell once; run the build on its own.

## Earlier: Day 0 (first session of Wed 11 Nov 2026)

Background. Its "Where it stands" and "Do next" lists are out of date; use the section above.

### What happened this session, in order
1. **Plan review.** Claude read every file and wrote `docs/PLAN-REVIEW.md`: what would not work as written, features to add, and the phases. Chime said yes to all of it (D-18 to D-25).
2. **Scaffold.** Next.js static export with the pinned versions, placeholder home page and tokens, lint, typecheck, unit tests, budget script, Playwright smoke test.
3. **Budget measured.** The empty app is 131.9 KB JS and 136.1 KB total, gzipped. Limits set at 160 KB JS and 200 KB total per page (D-26, D-28). Chime left the numbers to Claude.
4. **Host: Vercel** (D-27). Chime deployed it; since the rename it is https://sinima-app.vercel.app.
5. **Outreach.** Chime had Claude draft and send two emails from Chime's Gmail in the browser: Lagocine (`contact@lagocine.com`) and Filmhouse (`onlinesupport@filmhouseng.com`). No replies yet.
6. **Repo made public on Day 0** (D-30). GitHub would not run Actions on a private repo without a payment method, and the budget is $0. History was replaced with one clean commit first, because an early commit held a personal email address.
7. **Source audit finished** (D-32). Nothing can be cleared on robots and terms alone, except that Lagocine's own rules allow reading it.
8. **Chime's call: stop asking** (D-33). Lagocine becomes the live source on Day 6, with credit on every row, unless it objects first. No more emails.

### Where it stands
- **Repo:** `ChimeXXD/sinima` (renamed from `lagos-showtimes` on 11 Nov), public, `main` at the commit that holds this file. CI green (lint, typecheck, unit, build, budget, e2e).
- **Deploy:** https://sinima-app.vercel.app loads (HTTP 200, checked 11 Nov after the rename). Not yet opened on Chime's phone.
- **Decisions:** D-01 to D-33 in `docs/DECISIONS.md`. Open: O-1 (name), O-3 (push), O-7 (other cities), O-10 (neighbouring areas list).
- **Features:** 7 of 40 passing in `docs/features.json` (all of Day 0).
- **Data:** the site runs on sample data through Day 5.
  - Fixture on file: `tests/fixtures/silverbird/2026-11-11-ikeja.html` (Silverbird Ikeja's Veezi listing, cut down; 70 showings for today and tomorrow; dates have no year, times are 12-hour).
  - Full saved pages are in the git-ignored `tmp/audit/`, including a Lagocine cinema page and day page ready to cut down on Day 2.
- **Sources, in one line each:**
  - Lagocine: static HTML, rules allow everything. The live source from Day 6 (D-33).
  - Filmhouse, EbonyLife: no times in their HTML; never read directly.
  - Genesis: needs a written yes (D-29); not asked.
  - Silverbird: its Veezi page is readable, but its own terms forbid copying and linking; not read directly, sample fixture only.
- **TMDB:** terms read by Claude (D-31): non-commercial, cache at most 6 months, logo and notice. **The API key is still missing.**

### The plan for Days 1 to 5 (as agreed with Chime)

| Day | Focus | What gets built | What Chime does | Gate |
| --- | --- | --- | --- | --- |
| 1 | The look, and the logic underneath | Three visual directions on one phone page; tokens from the pick; time, showing-state, wording and calendar-file logic, tests first | Picks a direction and the name (O-1) | Direction and name chosen; logic tests green |
| 2 | The data | Data format and validator; readers for Lagocine and the Veezi fixture; sample data moved onto today's dates; one data file per area; TMDB matching | Gives the TMDB key; confirms the neighbouring-areas list (O-10) | Valid data files; both readers green |
| 3 | The home screen | Area pages and all-Lagos page; showing row; area picker; "Now showing" list with filter; empty state; banners | Approves on the phone | A showing found in under 20 seconds |
| 4 | Film, cinema and credits | Film page with the Stay or Go chip; cinema page; started-showing test | Nothing required | Every showing listed; a started showing can't be booked |
| 5 | Reminder, share, install | "Remind me" calendar file; live countdown; WhatsApp share to the exact showing | Checks the reminder on iPhone and Android | Reminder opens in both calendars with the alert |

Extras if a day has room. Day 4: filters, "out about 21:40", "report a wrong time". Day 5: preview card, add-to-home-screen, offline mode. Day 6 hardens and switches on Lagocine; Day 7 is the launch. Details: `docs/PLAN.md`.

### Do next
1. **Day 1, design lane:** references by surface (`docs/design/REFERENCES.md`), three directions at 390 px in `docs/design/direction-board/index.html`, then stop for Chime's pick and the name.
2. **Day 1, core lane, tests first:** `src/lib/time` (`lagos.ts`, `showingState.ts`, `countdown.ts`), `src/lib/wording` (`freshness.ts`, `credits.ts`, `showing.ts`), `src/lib/ics/ics.ts`, exactly as the tables in `docs/DATA.md` (credits wording as revised by D-19; hours band to under 6 h, D-25).
3. Chime: get the free TMDB key (themoviedb.org > Settings > API) into `.env.local` and the GitHub secret `TMDB_READ_TOKEN` before Day 2; open the deploy on the phone.
4. Left over from the code review for Day 1: stop Tailwind's built-in colour classes and named colours slipping past `check-tokens`, and fix the self-referencing tokens in `globals.css`, both when the real palette lands.

### How Chime likes to work (learned this session)
- Anything sent under Chime's name says "I'm Chimezie" and is signed "Chimezie Ekpendu", never "Chime".
- Plain words. Chime asked what "budget" meant: explain a term the first time it appears.
- Plans and comparisons as tables.
- Fewer questions: make the low-risk calls and say what was chosen. Chime said "I'm tired of asking."
- $0 is a hard limit: no paid plans, anywhere.

### Watch out for
- Never fetch a cinema site on a schedule until it is `cleared` (D-08). Never fetch booking links: Filmhouse and Veezi disallow them.
- The repo is public: no personal addresses, keys or full saved pages in commits.
- The proof guard refuses test runs when the Mac is near 80% memory. Closing Dia and Figma frees about 8.9 GB.
- The commit gate refuses a commit when the same command also changes files: edit first, then commit on its own. Changing `.claude/proof.json` needs Chime's OK.
- Rewriting git history is blocked by the permission system unless Chime allows it.
- This Mac runs Node 24.12; CI and `.nvmrc` say 22.
- Agmen (Tactics Board) is being built on the same Mac: one dev server at a time.
