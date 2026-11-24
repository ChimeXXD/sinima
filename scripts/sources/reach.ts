// Parsers and reader for the Reach Cinema platform (Fusion Intelligence, D-125), whose showtimes
// pages are built by script, so they are read rendered through politeBrowser. Two layouts:
// - Dated slides (Ozone, Viva, Nova): every day has an address a visitor can open,
//   /showtimes?cinemaId=<id>&date=Wed+Nov+18+2026, and the page highlights that day's slide.
// - Date tabs (Sky): one address; a visitor taps "Nov 18th" to see that day.
// Each film card lists its times ("01:00 PM", a 12-hour clock) and links to the film's page on the
// cinema's own site, where tickets are sold. The page names the cinema it shows, which must be ours.
import * as cheerio from "cheerio";
import type { RenderText, Tapped } from "./browser.ts";
import { clock12, isoDay, MONTH_ORDINAL, monthOrdinal, shortMonth, shortWeekday, showStart, type Day } from "./dates.ts";
import { clean, type RawShowing, type Reader } from "./raw.ts";
import { readEachDay } from "./tabbed.ts";

type Options = { cinemaId: string; day: Day; name: string; origin: string };
type Cheerio = ReturnType<typeof cheerio.load>;
const FILM_PAGE = /^\/movies\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NOT_RATED = "N/A";

/** The address of one day on a dated-slides page: the site's own form, "Wed Nov 18 2026". */
export function reachDayUrl(page: string, day: Day): string {
  const url = new URL(page);
  url.searchParams.set("date", `${shortWeekday(day)} ${shortMonth(day)} ${String(day.day).padStart(2, "0")} ${day.year}`);
  return url.href;
}

/** The tab a visitor taps for `day` on a date-tabs page: "Nov 18th". */
export const reachTabSelector = (day: Day) => `button:text-is('${monthOrdinal(day)}')`;

/** The cinema the page shows; it must be the one we asked for. */
function checkCinema($: Cheerio, { cinemaId, name }: Options): void {
  const shown = clean($('[aria-describedby^="popup"] span').first().text());
  if (shown?.toLowerCase() !== name.toLowerCase()) throw new Error(`Reach page for ${cinemaId}: the page shows "${shown}", not "${name}".`);
}

/** Every time on each film card in `cards`, on `day`. */
function readCards($: Cheerio, cards: ReturnType<Cheerio>, options: Options, titleOf: (card: ReturnType<Cheerio>) => string | null, ratingOf: (card: ReturnType<Cheerio>) => string | null): RawShowing[] {
  const { cinemaId, day, origin } = options;
  const showings: RawShowing[] = [];
  cards.each((_, element) => {
    const card = $(element);
    const filmTitle = titleOf(card);
    if (!filmTitle) throw new Error(`Reach page for ${cinemaId}: a film has no title.`);
    const href = clean(card.find('a[href^="/movies/"]').first().attr("href") ?? card.find("a[href]").first().attr("href"));
    if (href === null || !FILM_PAGE.test(href)) throw new Error(`Reach page for ${cinemaId}: "${href}" is not a film page on the cinema's site.`);
    const rating = ratingOf(card);
    card.find("ol li button").each((_, button) => {
      const text = clean($(button).find("span").first().text()) ?? "";
      const time = clock12(text);
      if (!time) throw new Error(`Reach page for ${cinemaId}: cannot read the time "${text}"`);
      showings.push({ cinemaId, filmTitle, rating, startsAt: showStart(day, time), format: null, bookingUrl: `${origin}${href}` });
    });
  });
  return showings;
}

/**
 * A dated-slides page (Ozone, Viva, Nova) for `day`: the highlighted slide must be that day and the
 * cinema picker our cinema. A day with no film cards is no showings (Viva Lekki's page).
 */
export function parseReachDay(html: string, options: Options): RawShowing[] {
  const $ = cheerio.load(html);
  const { cinemaId, day } = options;
  if ($(".swiper-slide").length === 0) throw new Error(`Reach page for ${cinemaId}: no date slides found. Has the page layout changed?`);
  // The site's own day address pads the day ("Dec 05"), so its slide may too: "05" is read as 5.
  const label = (slide: ReturnType<Cheerio>) => slide.find("span").map((_, span) => clean($(span).text())?.replace(/^0(?=\d$)/, "")).get().join(" ");
  const wanted = `${shortMonth(day)} ${day.day} ${shortWeekday(day)}`;
  // No slide for the day: the site hasn't published it yet, so nothing is on that day (as on a tabs page).
  if (!$(".swiper-slide").toArray().some((slide) => label($(slide)) === wanted)) return [];
  const active = $(".swiper-slide.bg-grad-yellow");
  const shown = active.length === 1 ? label(active) : `${active.length} highlighted slides`;
  if (shown !== wanted) throw new Error(`Reach page for ${cinemaId}: the page shows "${shown}", not "${wanted}".`);
  checkCinema($, options);
  const cards = $("main ul > li > section");
  return readCards($, cards, options, (card) => clean(card.find("p").first().text()), (card) => {
    const rating = clean(card.find("p.font-readex span").first().text());
    return rating === NOT_RATED ? null : rating;
  });
}

/**
 * A date-tabs page (Sky) after the day's tab was clicked (politeBrowser marks it
 * `data-sinima-clicked`). No tab for the day means nothing is on that day. The page gives no rating.
 */
export function parseReachTabs(html: string, options: Options): RawShowing[] {
  const $ = cheerio.load(html);
  const { cinemaId, day } = options;
  const tabs = $("article button").filter((_, button) => MONTH_ORDINAL.test(clean($(button).text()) ?? ""));
  if (tabs.length === 0) throw new Error(`Reach page for ${cinemaId}: no date tabs found. Has the page layout changed?`);
  const label = monthOrdinal(day);
  if (!tabs.toArray().some((tab) => clean($(tab).text()) === label)) return [];
  const clicked = clean($("[data-sinima-clicked]").first().text());
  if (clicked !== label) throw new Error(`Reach page for ${cinemaId}: the clicked tab is "${clicked}", not "${label}".`);
  checkCinema($, options);
  const cards = $("article ul > li");
  if (cards.length === 0) throw new Error(`Reach page for ${cinemaId}: "${label}" has a tab but no films. Has the page layout changed?`);
  return readCards($, cards, options, (card) => clean(card.find('a[href^="/movies/"]').first().text()), () => null);
}

/** At most this many films a cinema a run for booking links (D-176): Nova Lagos showed 13 films on 21 Nov. */
export const MAX_FILM_PAGES = 25;

/**
 * Booking links for the first this many days read; later days keep the film page (D-196). Each day is
 * its own film page load, and five days of them would near the refresh job's 30 minutes.
 */
export const BOOKING_DAYS = 2;

/**
 * This many film pages timing out in a row end a cinema's film pages for the run (D-196): its back
 * end has stopped answering (22 Nov 2026: 26 of the job's 30 minutes). One slow page alone doesn't.
 */
const STOP_AFTER_TIMEOUTS = 2;

/** A film page opened on `day`: the site's own address for it, which opens with that day picked. */
export function filmDayUrl(film: string, day: Day): string {
  const url = new URL(film);
  url.searchParams.set("date", isoDay(day));
  return url.href;
}

/**
 * A film page's date slide reads "Mon23 Nov" (the weekday, then the day and month). Inside a quoted
 * selector Playwright reads `\s` as "s", so the pattern's backslash is doubled: with one, no date
 * matched, the page stayed on the day it opened on, and that day's times went to the next day's
 * showings (22 Nov 2026).
 */
const slideDate = (day: Day) => `"^${shortWeekday(day)}\\\\s*0?${day.day}\\\\s*${shortMonth(day)}$", "i"`;

/** The date a visitor taps on a film page: the slide's first line, the weekday. */
export const filmDateSelector = (day: Day) => `.swiper-slide:text-matches(${slideDate(day)}) > *`;

/** The date slide when it is the one picked (lit yellow, as the day a page opens on is). */
export const pickedDateSelector = (day: Day) => `.swiper-slide.bg-grad-yellow:text-matches(${slideDate(day)})`;

/** What each `tap` step found on a film page: day (YYYY-MM-DD) -> taps, or null when that day could not be picked. */
export function tapsOf(html: string): Map<string, Tapped[] | null> {
  const found = new Map<string, Tapped[] | null>();
  for (const [, label, json] of html.matchAll(/<script type="application\/json" data-sinima-taps="([^"]+)">(.*?)<\/script>/gs)) found.set(label!, JSON.parse(json!) as Tapped[] | null);
  return found;
}

/**
 * Viva's and Nova's own booking page for each showing (Chime, 21 Nov 2026; D-176). The listing links
 * only a film's page; there a visitor picks the cinema, taps a day, then a time, which opens
 * /book/<showing>. Each film's page is opened once a day, at that day's own address (a page load,
 * paced like any other), for the first BOOKING_DAYS days; the times are tapped and each address noted
 * unopened (politeBrowser's `tap`). A showing whose time is found gets that address; any other keeps
 * its film page. A film page that fails leaves a note, not a failed read; two that time out in a row
 * end the cinema's film pages for the run, so a back end that has stopped answering can't use up the job.
 *
 * A day's times are tapped only while the page shows that day picked: on 21 Nov a date that could
 * not be picked left the page on the day before, and its times went to the next day's showings at
 * the same hour. Once a time was tapped the page's dates stopped answering (24 Nov), so each day is a
 * fresh page. A booking page is one showing's, so one found for two showings goes to neither,
 * and a showing given two booking pages keeps its film page.
 */
export async function bookingLinks(renderText: RenderText, read: { cinemaId: string; name: string; origin: string; day: Day; showings: RawShowing[] }[], notes: string[]): Promise<void> {
  for (const cinemaId of new Set(read.map((entry) => entry.cinemaId))) {
    const mine = read.filter((entry) => entry.cinemaId === cinemaId);
    const { name, origin } = mine[0]!;
    const booked = new Set([...new Set(mine.map(({ day }) => isoDay(day)))].sort().slice(0, BOOKING_DAYS));
    const dated = mine.filter((entry) => booked.has(isoDay(entry.day)));
    // Only films showing on a booked day take a place under the cap or count as not opened.
    const films = [...new Set(dated.flatMap((entry) => entry.showings.map((showing) => showing.bookingUrl!)))];
    if (films.length > MAX_FILM_PAGES) notes.push(`${cinemaId}: ${films.length - MAX_FILM_PAGES} films over the cap keep their film page as the link`);
    const found = new Map<RawShowing, string | null>(); // null: two booking pages for one showing, so neither
    const opened = films.slice(0, MAX_FILM_PAGES);
    let timeouts = 0; // in a row
    pages: for (const [index, film] of opened.entries()) {
      const days = dated.filter((entry) => entry.showings.some((showing) => showing.bookingUrl === film));
      for (const { day, showings } of days) {
        const steps = [{ click: `text="${name}"` }, { click: filmDateSelector(day) }, { tap: `section:has(:text-is("${name}")) button`, capture: "/book/", label: isoDay(day), when: pickedDateSelector(day) }];
        let taps: Map<string, Tapped[] | null>;
        try {
          taps = tapsOf(await renderText(filmDayUrl(film, day), { steps }));
        } catch (error) {
          notes.push(`${cinemaId}: ${film} kept as the link (${error instanceof Error ? error.message : String(error)})`);
          const timedOut = error instanceof Error && error.name === "TimeoutError";
          timeouts = timedOut ? timeouts + 1 : 0;
          if (timeouts === STOP_AFTER_TIMEOUTS) {
            const left = opened.length - index - 1;
            if (left > 0) notes.push(`${cinemaId}: two film pages timed out in a row; ${left} more not opened this run, so their showings keep the film page`);
            break pages;
          }
          continue;
        }
        timeouts = 0;
        if (taps.get(isoDay(day)) === null) notes.push(`${cinemaId}: ${film} could not be moved to ${isoDay(day)}; its showings keep the film page`);
        for (const tap of taps.get(isoDay(day)) ?? []) {
          const time = clock12(/\d{1,2}:\d{2}\s*[AP]M/i.exec(tap.text)?.[0] ?? "");
          if (!time) continue;
          const startsAt = showStart(day, time);
          for (const showing of showings) if (showing.bookingUrl === film && showing.startsAt === startsAt) {
            const href = `${origin}${tap.href}`;
            found.set(showing, found.has(showing) && found.get(showing) !== href ? null : href);
          }
        }
      }
    }
    const uses = new Map<string, number>();
    for (const href of found.values()) if (href !== null) uses.set(href, (uses.get(href) ?? 0) + 1);
    for (const [showing, href] of found) if (href !== null && uses.get(href) === 1) showing.bookingUrl = href;
    for (const [href, count] of uses) if (count > 1) notes.push(`${cinemaId}: ${href} was found for ${count} showings; each keeps its film page`);
  }
}

/**
 * Each cinema's page for today and the next days: a page with `cinemaId` in its address by each
 * day's own address, one without by clicking each day's tab. Up to five page loads per cinema a run. A
 * cinema with no times on any day read fails the source (its last good showings are kept, D-119):
 * an empty page and one whose times did not load look the same.
 */
export const readReach: Reader = async ({ now, days, renderText, pages, names = {} }) => {
  const dated: Parameters<typeof bookingLinks>[1] = [];
  const read = await readEachDay("Reach", { now, days, pages }, async (cinemaId, page, day) => {
    const name = Object.hasOwn(names, cinemaId) ? names[cinemaId] : undefined;
    if (name === undefined) throw new Error(`Reach: ${cinemaId} has no entry in pageNames in data/sources.json.`);
    const options = { cinemaId, name, origin: new URL(page).origin, day };
    if (!new URL(page).searchParams.has("cinemaId")) return parseReachTabs(await renderText(page, { click: reachTabSelector(day) }), options);
    const showings = parseReachDay(await renderText(reachDayUrl(page, day)), options);
    dated.push({ ...options, showings });
    return showings;
  });
  // The showings are the same objects in `read`: their links are filled in place (D-176).
  const notes: string[] = [];
  await bookingLinks(renderText, dated, notes);
  return notes.length > 0 ? read.map((page) => ({ ...page, notes: [...(page.notes ?? []), ...notes] })) : read;
};
