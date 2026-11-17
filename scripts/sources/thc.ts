// Parser and reader for Cinemax THC's home page (cinemaxthc.ng, D-125), built by script and read
// rendered. Its "Now Showing" section has a tab per day ("Nov 18th") that changes the day without
// changing the address, so each day is read by clicking its tab; the tab showing is the one drawn
// in white. Each film lists its times ("01:40 PM", a 12-hour clock). The site says "Online booking
// not available" (tickets at the cinema), so there are no booking links.
import * as cheerio from "cheerio";
import { clock12, MONTH_ORDINAL, monthOrdinal, showStart, type Day } from "./dates.ts";
import { clean, type RawShowing } from "./raw.ts";
import { tabbedReader, type DayParser } from "./tabbed.ts";

/** How the page marks the day it is showing. */
const SHOWING = "!text-white";

export const thcDaySelector = (day: Day) => `span:text-is('${monthOrdinal(day)}')`;

export const parseThc: DayParser = (html, { cinemaId, day }) => {
  const $ = cheerio.load(html);
  const tabs = $("header span").filter((_, span) => MONTH_ORDINAL.test(clean($(span).text()) ?? ""));
  if (tabs.length === 0) throw new Error(`THC page for ${cinemaId}: no date tabs found. Has the page layout changed?`);
  const label = monthOrdinal(day);
  if (!tabs.toArray().some((tab) => clean($(tab).text()) === label)) return [];
  const shown = tabs.filter((_, tab) => ($(tab).attr("class") ?? "").split(/\s+/).includes(SHOWING));
  const showing = shown.length === 1 ? clean(shown.text()) : `${shown.length} tabs`;
  if (showing !== label) throw new Error(`THC page for ${cinemaId}: the page shows "${showing}", not "${label}".`);

  const showings: RawShowing[] = [];
  $('.grid > div:has(a[href^="/movies/"])').each((_, film) => {
    const filmTitle = clean($(film).find('a[href^="/movies/"]').first().text());
    if (!filmTitle) throw new Error(`THC page for ${cinemaId}: a film has no title.`);
    $(film).find("span.flex-wrap > button").each((_, button) => {
      const text = clean($(button).text()) ?? "";
      const time = clock12(text);
      if (!time) throw new Error(`THC page for ${cinemaId}: cannot read the time "${text}"`);
      showings.push({ cinemaId, filmTitle, rating: null, startsAt: showStart(day, time), format: null, bookingUrl: null });
    });
  });
  return showings;
};

/** The home page once per day, that day's tab clicked: two page loads a run. */
export const readThc = tabbedReader("THC", thcDaySelector, parseThc);
