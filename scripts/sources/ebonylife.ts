// Parser and reader for EbonyLife's /movies page (ebonylifecinemas.com, D-125), built by script and
// read rendered. A date picker ("18 Nov" / "Wednesday") changes the day without changing the
// address, so each day is read by clicking its date. Each time ("10:40 AM  Screen 5", a 12-hour
// clock) links to its own booking page on EbonyLife's site, which carries the date it is for
// (showtimeDate=2026-11-18): every one must be the day asked for, or the date was not clicked.
import * as cheerio from "cheerio";
import { clock12, isoDay, longWeekday, shortMonth, showStart, type Day } from "./dates.ts";
import { clean, type RawShowing } from "./raw.ts";
import { tabbedReader, type DayParser } from "./tabbed.ts";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const BOOKING = new RegExp(`^/movies/${UUID}\\?showTimeId=${UUID}&showtimeDate=(\\d{4}-\\d{2}-\\d{2})$`);

/** The date a visitor taps: "18 Nov". */
const dateLabel = (day: Day) => `${day.day} ${shortMonth(day)}`;
export const ebonyLifeDaySelector = (day: Day) => `button:has(p:text-is('${dateLabel(day)}'))`;

export const parseEbonyLife: DayParser = (html, { cinemaId, day, origin }) => {
  const $ = cheerio.load(html);
  const dates = $('[class*="DatePicker_item"]');
  if (dates.length === 0) throw new Error(`EbonyLife page for ${cinemaId}: no date picker found. Has the page layout changed?`);
  const offered = dates.toArray().some((button) => {
    const [date, weekday] = $(button).find("p").map((_, p) => clean($(p).text())).get();
    return date === dateLabel(day) && weekday === longWeekday(day);
  });
  if (!offered) return [];

  const showings: RawShowing[] = [];
  $('article[class*="MovieList_movie"]').each((_, article) => {
    const filmTitle = clean($(article).find('[class*="TitleDesc_title"]').first().text());
    if (!filmTitle) throw new Error(`EbonyLife page for ${cinemaId}: a film has no title.`);
    $(article).find('[class*="MovieList_showTimes"] a').each((_, link) => {
      const href = clean($(link).attr("href")) ?? "";
      const booking = BOOKING.exec(href);
      if (!booking) throw new Error(`EbonyLife page for ${cinemaId}: "${href}" is not a booking page on EbonyLife's site.`);
      if (booking[1] !== isoDay(day)) throw new Error(`EbonyLife page for ${cinemaId}: a time is for ${booking[1]}, not ${isoDay(day)}. Was the date clicked?`);
      const text = clean($(link).find('[class*="MovieList_white"]').text()) ?? "";
      const time = clock12(text);
      if (!time) throw new Error(`EbonyLife page for ${cinemaId}: cannot read the time "${text}"`);
      showings.push({ cinemaId, filmTitle, rating: null, startsAt: showStart(day, time), format: null, bookingUrl: `${origin}${href}` });
    });
  });
  return showings;
};

/** The /movies page once per day, that day's date clicked: up to five page loads a run. */
export const readEbonyLife = tabbedReader("EbonyLife", ebonyLifeDaySelector, parseEbonyLife);
