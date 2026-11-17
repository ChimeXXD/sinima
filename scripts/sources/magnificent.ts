// Parser and reader for Magnificent's "Movies and showtimes" page (magnificentcinemas.com/
// review.html, D-125), built by script and read rendered. A tab per day (data-d="2026-11-18")
// changes the day without changing the address, so each day is read by clicking its tab; the tab
// showing is the one pressed (aria-pressed), and the page names the day ("Wednesday 18 November").
// Each film lists its times with their cinema ("10:00AM · Cinema 2"; the 24-hour time is in
// data-t). Its "Book" buttons are not links, so there are no booking links.
import * as cheerio from "cheerio";
import { clock24h, isoDay, showStart, type Day } from "./dates.ts";
import { clean, type RawShowing } from "./raw.ts";
import { tabbedReader, type DayParser } from "./tabbed.ts";

export const magnificentDaySelector = (day: Day) => `button.daytab[data-d='${isoDay(day)}']`;

export const parseMagnificent: DayParser = (html, { cinemaId, day }) => {
  const $ = cheerio.load(html);
  const tabs = $("#days button.daytab");
  if (tabs.length === 0) throw new Error(`Magnificent page for ${cinemaId}: no day tabs found. Has the page layout changed?`);
  const wanted = isoDay(day);
  if (!tabs.toArray().some((tab) => $(tab).attr("data-d") === wanted)) return [];
  const pressed = tabs.filter('[aria-pressed="true"]');
  const shown = pressed.length === 1 ? pressed.attr("data-d") : `${pressed.length} days`;
  if (shown !== wanted) throw new Error(`Magnificent page for ${cinemaId}: the page shows ${shown} (${clean($("#when").text())}), not ${wanted}.`);

  const showings: RawShowing[] = [];
  $("#list article.srow").each((_, row) => {
    const filmTitle = clean($(row).find("h2").first().text());
    if (!filmTitle) throw new Error(`Magnificent page for ${cinemaId}: a film has no title.`);
    $(row).find("button.stime").each((_, button) => {
      const text = clean($(button).attr("data-t")) ?? "";
      const time = clock24h(text);
      if (!time) throw new Error(`Magnificent page for ${cinemaId}: cannot read the time "${text}"`);
      showings.push({ cinemaId, filmTitle, rating: null, startsAt: showStart(day, time), format: null, bookingUrl: null });
    });
  });
  return showings;
};

/** review.html once per day, that day's tab clicked: two page loads a run. */
export const readMagnificent = tabbedReader("Magnificent", magnificentDaySelector, parseMagnificent);
