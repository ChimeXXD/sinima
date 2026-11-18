// The reader for a site whose days are tabs a visitor taps, with no address for each day
// (EbonyLife, THC, Magnificent; D-125). Each cinema's page is rendered once per day, the day's tab
// clicked (politeBrowser's `click`), and the parser checks the page shows that day. A cinema with
// no times on any day read fails the source, keeping its last good showings (D-119): these pages
// say nothing when they are empty, so an empty page and one whose times did not load look the same.
import { isoDay, lagosDay, withinDays, type Day } from "./dates.ts";
import { pageMissingOrSlow } from "./polite.ts";
import type { ParsedPage, RawShowing, Reader } from "./raw.ts";

export type DayParser = (html: string, options: { cinemaId: string; day: Day; origin: string }) => RawShowing[];

/**
 * Each cinema's page read once per day, today and the next `days - 1`, by `readDay` (one page load
 * each). A cinema with no times on any day read fails the source (see above). Shared by the
 * tabbed readers and Reach's (D-125).
 */
export async function readEachDay(
  site: string,
  input: { now: string; days: number; pages: Record<string, string> },
  readDay: (cinemaId: string, page: string, day: Day) => Promise<RawShowing[]>,
): Promise<ParsedPage[]> {
  const { now, days, pages } = input;
  const showings: RawShowing[] = [];
  const notes: string[] = [];
  for (const [cinemaId, page] of Object.entries(pages)) {
    const rows: RawShowing[] = [];
    for (let offset = 0; offset < days; offset += 1) {
      const day = lagosDay(now, offset);
      try {
        rows.push(...(await readDay(cinemaId, page, day)));
      } catch (error) {
        // A later day missing or too slow ends this cinema's read with the days before it (D-147);
        // today's page failing, or a refusal, still fails the source (D-77).
        if (offset === 0 || !pageMissingOrSlow(error)) throw error;
        notes.push(`${cinemaId}: stopped at ${isoDay(day)} (${error instanceof Error ? error.message : String(error)}); read ${offset} days`);
        break;
      }
    }
    if (rows.length === 0) throw new Error(`${site} page for ${cinemaId}: no times on any day read. Has the page layout changed?`);
    showings.push(...withinDays(rows, now, days));
  }
  return [{ showings, builtAt: null, ...(notes.length > 0 ? { notes } : {}) }];
}

export function tabbedReader(site: string, selector: (day: Day) => string, parse: DayParser): Reader {
  return ({ now, days, renderText, pages }) =>
    readEachDay(site, { now, days, pages }, async (cinemaId, page, day) => parse(await renderText(page, { click: selector(day) }), { cinemaId, day, origin: new URL(page).origin }));
}
