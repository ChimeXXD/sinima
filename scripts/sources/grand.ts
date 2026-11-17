// Parser and reader for Grand Cinemas' home page (grandcinemas.com.ng, D-122). It lists the week
// in weekday tabs (#Mon to #Sun) with no dates; inside each tab every film carries its times for
// each weekday ("tue-time": "3:00 pm"). Today's and the next days' tabs are read onto today's and
// the next days' dates. Tickets are sold at the cinema, so there are no booking links.
import * as cheerio from "cheerio";
import { clock12, lagosDay, showStart, weekdayOf } from "./dates.ts";
import { clean, type ParsedPage, type RawShowing, type Reader } from "./raw.ts";

/** Grand's rating for a film not yet classified. */
const NOT_RATED = "TBC";

export function parseGrand(html: string, options: { cinemaId: string; now: string; days: number }): ParsedPage {
  const $ = cheerio.load(html);
  const tabs = $(".fw-tabs.movies");
  if (tabs.length === 0 || tabs.find(".movie-tabs").length === 0) throw new Error("Grand page: no weekday tabs found. Has the page layout changed?");

  const showings: RawShowing[] = [];
  for (let offset = 0; offset < options.days; offset += 1) {
    const day = lagosDay(options.now, offset);
    // The weekday's tab: "tuesday" -> "Tue".
    const name = weekdayOf(day).slice(0, 3).replace(/^./, (c) => c.toUpperCase());
    const tab = tabs.find(`[id="${name}"]`);
    if (tab.length === 0) throw new Error(`Grand page: no "${name}" tab. Has the page layout changed?`);
    tab.find(".movie-tabs").each((_, film) => {
      const filmTitle = clean($(film).find("h3").first().text());
      if (!filmTitle) throw new Error("Grand page: a film has no title.");
      const certificate = clean($(film).find(".certificate").first().text());
      $(film).find(`.${name.toLowerCase()}-time .time`).each((_, slot) => {
        const text = clean($(slot).text()) ?? "";
        const time = clock12(text);
        if (!time) throw new Error(`Grand page: cannot read the time "${text}"`);
        showings.push({ cinemaId: options.cinemaId, filmTitle, rating: certificate === NOT_RATED ? null : certificate, startsAt: showStart(day, time), format: null, bookingUrl: null });
      });
    });
  }
  return { showings, builtAt: null };
}

/** The one home page holds the whole week. */
export const readGrand: Reader = async ({ now, days, fetchText, pages }) => {
  const read: ParsedPage[] = [];
  for (const [cinemaId, url] of Object.entries(pages)) read.push(parseGrand(await fetchText(url), { cinemaId, now, days }));
  return read;
};
