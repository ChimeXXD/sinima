import { dayDates, type Day } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";
import { lagosDayKey } from "@/lib/time/lagos";

// Five days (D-142, D-146, D-147). Today's and tomorrow's times are in each page; days three to five
// are one file per city per day, fetched when a visitor picks that day. The page carries only which
// days exist and which of its sinimas list each, for the date tiles and the sentence under them.

/** A day the city has times for: its Lagos date, the sinimas listing it (positions in the page's cinemas), and `later` when its times are in a file of their own. */
export type DayInfo = { date: string; cinemas: number[]; later?: true };
/** The address of a later day's file. */
export const dayFileUrl = (city: string, date: string) => `/data/${city}/${date}.json`;

/** A tile on the page: which day it is, its date ("2026-11-20" and an instant on it), whether its times come from its own file, and the sinimas listing it. */
export type ShownDay = { day: Day; key: string; date: string; later: boolean; cinemas: number[] | null };

/**
 * In the browser: the days to show from `now`. Today and tomorrow always; a later day only when the
 * city has times for it. A page read a day after it was made drops yesterday, and a day it no longer
 * holds itself comes from that day's file.
 */
export function shownDays(rows: ListRow[], days: DayInfo[] | undefined, now: string): ShownDay[] {
  return dayDates(rows, now).flatMap((date, i) => {
    const day = i as Day;
    const key = lagosDayKey(date);
    const info = days?.find((candidate) => candidate.date === key);
    if (day > 1 && !info) return [];
    return [{ day, key, date, later: info?.later === true, cinemas: info?.cinemas ?? null }];
  });
}

/** A link that opens on the picked day when the page it leads to can't know it alone: a later day, or a day from its own file (a page a day old). */
export const dayHref = (path: string, shown: ShownDay) => (shown.day > 1 || shown.later ? `${path}?day=${shown.key}` : path);

/** How many sinimas have listed a day, of every sinima listing any day shown (D-146). */
export function listedCount(shown: ShownDay[], day: Day): { listed: number; total: number } {
  const total = new Set(shown.flatMap((candidate) => candidate.cinemas ?? [])).size;
  return { listed: shown.find((candidate) => candidate.day === day)?.cinemas?.length ?? 0, total };
}
