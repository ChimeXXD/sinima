// Tickets on sale before a film opens (D-194, D-199): the pipeline's split of rows after the shown days. Pure.
import { PRESALE_DAYS, presaleDays } from "../src/lib/data/coming.ts";
import type { Coming, Showing } from "../src/lib/data/types.ts";
import { EVENING_ENDS_HOUR, eveningDayKey, lagosDaysFrom, toLagos } from "../src/lib/time/lagos.ts";

/** True for a showing after the shown days: past the last day's evening, which runs to 04:00 (D-142). */
export function afterShownDays(now: string, startsAt: string, daysShown: number): boolean {
  const day = lagosDaysFrom(now, startsAt);
  return day > daysShown || (day === daysShown && toLagos(startsAt).hour >= EVENING_ENDS_HOUR);
}

export { PRESALE_DAYS };

/**
 * The showings within the shown days, and apart those after them on a coming film's first date or the
 * PRESALE_DAYS - 1 days after it (each by its evening: a 00:30 show is the night before's); any other
 * row that far ahead is dropped, one log line per source.
 */
export function splitPresales(showings: Showing[], coming: Coming[], now: string, daysShown: number, log: string[]): { shownNow: Showing[]; presales: Showing[] } {
  const openings = new Set(coming.flatMap((entry) => (entry.firstDay === null ? [] : presaleDays(entry.firstDay).map((day) => `${entry.filmId} ${day}`))));
  const presales: Showing[] = [];
  const dropped = new Map<string, number>();
  const shownNow = showings.filter((showing) => {
    if (!afterShownDays(now, showing.startsAt, daysShown)) return true;
    if (openings.has(`${showing.filmId} ${eveningDayKey(showing.startsAt)}`)) presales.push(showing);
    else dropped.set(showing.sourceId, (dropped.get(showing.sourceId) ?? 0) + 1);
    return false;
  });
  for (const [sourceId, count] of dropped) log.push(`${sourceId}: dropped ${count} ${count === 1 ? "showing" : "showings"} after the shown days that ${count === 1 ? "is" : "are"} not in a coming film's first ${PRESALE_DAYS} days`);
  return { shownNow, presales };
}
