// Parsers and reader for the Reach Cinema platform (Fusion Intelligence, D-125), whose showtimes
// pages are built by script, so they are read rendered through politeBrowser. Two layouts:
// - Dated slides (Ozone, Viva, Nova): every day has an address a visitor can open,
//   /showtimes?cinemaId=<id>&date=Wed+Nov+18+2026, and the page highlights that day's slide.
// - Date tabs (Sky): one address; a visitor taps "Nov 18th" to see that day.
// Each film card lists its times ("01:00 PM", a 12-hour clock) and links to the film's page on the
// cinema's own site, where tickets are sold. The page names the cinema it shows, which must be ours.
import * as cheerio from "cheerio";
import { clock12, lagosDay, ordinal, shortMonth, shortWeekday, showStart, withinDays, type Day } from "./dates.ts";
import { clean, type RawShowing, type Reader } from "./raw.ts";

type Options = { cinemaId: string; day: Day; name: string; origin: string };
type Cheerio = ReturnType<typeof cheerio.load>;
const FILM_PAGE = /^\/movies\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TAB = /^[A-Z][a-z]{2} \d{1,2}(?:st|nd|rd|th)$/;
const NOT_RATED = "N/A";

/** The address of one day on a dated-slides page: the site's own form, "Wed Nov 18 2026". */
export function reachDayUrl(page: string, day: Day): string {
  const url = new URL(page);
  url.searchParams.set("date", `${shortWeekday(day)} ${shortMonth(day)} ${String(day.day).padStart(2, "0")} ${day.year}`);
  return url.href;
}

/** The tab a visitor taps for `day` on a date-tabs page: "Nov 18th". */
const tabLabel = (day: Day) => `${shortMonth(day)} ${ordinal(day.day)}`;
export const reachTabSelector = (day: Day) => `button:text-is('${tabLabel(day)}')`;

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
  const active = $(".swiper-slide.bg-grad-yellow");
  const shown = active.length === 1 ? active.find("span").map((_, span) => clean($(span).text())).get().join(" ") : `${active.length} highlighted slides`;
  const wanted = `${shortMonth(day)} ${day.day} ${shortWeekday(day)}`;
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
  const tabs = $("article button").filter((_, button) => TAB.test(clean($(button).text()) ?? ""));
  if (tabs.length === 0) throw new Error(`Reach page for ${cinemaId}: no date tabs found. Has the page layout changed?`);
  const label = tabLabel(day);
  if (!tabs.toArray().some((tab) => clean($(tab).text()) === label)) return [];
  const clicked = clean($("[data-sinima-clicked]").first().text());
  if (clicked !== label) throw new Error(`Reach page for ${cinemaId}: the clicked tab is "${clicked}", not "${label}".`);
  checkCinema($, options);
  const cards = $("article ul > li");
  if (cards.length === 0) throw new Error(`Reach page for ${cinemaId}: "${label}" has a tab but no films. Has the page layout changed?`);
  return readCards($, cards, options, (card) => clean(card.find('a[href^="/movies/"]').first().text()), () => null);
}

/**
 * Each cinema's page for today and the next days: a page with `cinemaId` in its address by each
 * day's own address, one without by clicking each day's tab. Two page loads per cinema a run. A
 * cinema with no times on any day read fails the source (its last good showings are kept, D-119):
 * an empty page and one whose times did not load look the same.
 */
export const readReach: Reader = async ({ now, days, renderText, pages, names = {} }) => {
  const showings: RawShowing[] = [];
  for (const [cinemaId, page] of Object.entries(pages)) {
    const name = Object.hasOwn(names, cinemaId) ? names[cinemaId] : undefined;
    if (name === undefined) throw new Error(`Reach: ${cinemaId} has no entry in pageNames in data/sources.json.`);
    const options = { cinemaId, name, origin: new URL(page).origin };
    const dated = new URL(page).searchParams.has("cinemaId");
    const rows: RawShowing[] = [];
    for (let offset = 0; offset < days; offset += 1) {
      const day = lagosDay(now, offset);
      if (dated) rows.push(...parseReachDay(await renderText(reachDayUrl(page, day)), { ...options, day }));
      else rows.push(...parseReachTabs(await renderText(page, { click: reachTabSelector(day) }), { ...options, day }));
    }
    if (rows.length === 0) throw new Error(`Reach page for ${cinemaId}: no times on any day read. Has the page layout changed?`);
    showings.push(...withinDays(rows, now, days));
  }
  return [{ showings, builtAt: null }];
};
