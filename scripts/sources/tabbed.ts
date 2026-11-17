// The reader for a site whose days are tabs a visitor taps, with no address for each day
// (EbonyLife, THC, Magnificent; D-125). Each cinema's page is rendered once per day, the day's tab
// clicked (politeBrowser's `click`), and the parser checks the page shows that day. A cinema with
// no times on any day read fails the source, keeping its last good showings (D-119): these pages
// say nothing when they are empty, so an empty page and one whose times did not load look the same.
import { lagosDay, withinDays, type Day } from "./dates.ts";
import type { RawShowing, Reader } from "./raw.ts";

export type DayParser = (html: string, options: { cinemaId: string; day: Day; origin: string }) => RawShowing[];

export function tabbedReader(site: string, selector: (day: Day) => string, parse: DayParser): Reader {
  return async ({ now, days, renderText, pages }) => {
    const showings: RawShowing[] = [];
    for (const [cinemaId, page] of Object.entries(pages)) {
      const rows: RawShowing[] = [];
      for (let offset = 0; offset < days; offset += 1) {
        const day = lagosDay(now, offset);
        rows.push(...parse(await renderText(page, { click: selector(day) }), { cinemaId, day, origin: new URL(page).origin }));
      }
      if (rows.length === 0) throw new Error(`${site} page for ${cinemaId}: no times on any day read. Has the page layout changed?`);
      showings.push(...withinDays(rows, now, days));
    }
    return [{ showings, builtAt: null }];
  };
}
