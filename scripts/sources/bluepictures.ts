// Parser and reader for Blue Pictures' home page (bluepicturesng.com, D-122). Its "Movies Now
// Showing" list gives each film's times with no date ("4:20pm & 6:20pm"), so they are read as
// today's only: what tomorrow brings is not on the page, and we never guess it (rule 8). Online
// sale is not confirmed, so there are no booking links.
import * as cheerio from "cheerio";
import { clock12, lagosDay, showStart } from "./dates.ts";
import { clean, type ParsedPage, type RawShowing, type Reader } from "./raw.ts";

const HEADING = "Movies Now Showing";

export function parseBluePictures(html: string, options: { cinemaId: string; now: string }): ParsedPage {
  const $ = cheerio.load(html);
  const heading = $("h2.title").filter((_, h2) => clean($(h2).text()) === HEADING).first();
  const items = heading.closest(".elementor-widget").nextAll(".elementor-widget-movie_list").first().find(".mb-movie-item");
  if (items.length === 0) throw new Error(`Blue Pictures page: no "${HEADING}" list found. Has the page layout changed?`);

  const today = lagosDay(options.now);
  const showings: RawShowing[] = [];
  items.each((_, item) => {
    const filmTitle = clean($(item).find(".movie-title").text());
    if (!filmTitle) throw new Error("Blue Pictures page: a film has no title.");
    const text = clean($(item).find(".running-time").text()) ?? "";
    const times = text.split(/\s*(?:&|,|\/|\band\b)\s*/i).map(clock12);
    if (times.length === 0 || times.some((time) => time === null)) throw new Error(`Blue Pictures page: cannot read the times "${text}" for "${filmTitle}"`);
    for (const time of times) showings.push({ cinemaId: options.cinemaId, filmTitle, rating: null, startsAt: showStart(today, time!), format: null, bookingUrl: null });
  });
  return { showings, builtAt: null };
}

/** The one home page; `days` does not apply, as the page only gives today's times. */
export const readBluePictures: Reader = async ({ now, fetchText, pages }) => {
  const read: ParsedPage[] = [];
  for (const [cinemaId, url] of Object.entries(pages)) read.push(parseBluePictures(await fetchText(url), { cinemaId, now }));
  return read;
};
