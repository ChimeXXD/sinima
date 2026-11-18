import type { DayInfo } from "@/lib/data/days";
import { DAYS } from "@/lib/data/programme";
import type { ShowtimesFile } from "@/lib/data/types";
import { eveningDayKey, lagosDaysFrom, lagosLocalToUtc } from "@/lib/time/lagos";

// Build time (D-146, D-147): which days a city's page lists and the sinimas listing each. Apart
// from days.ts, which the pages carry, so no page carries this (the page budget, D-21).

/** A day's file: `/data/<city>/<yyyy-mm-dd>.json`. */
export type LaterFile = { date: string; file: ShowtimesFile };

const noonOn = (date: string) => lagosLocalToUtc({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)), hour: 12, minute: 0 });

/**
 * Build time: the days in the city's page file, then each later day's file from the third to the
 * fifth day after the page was made. Any other file (left from an older run, or a day the page
 * holds itself) is ignored.
 */
export function cityDays(page: ShowtimesFile, later: LaterFile[]): DayInfo[] {
  const at = new Map(page.cinemas.map((cinema, i) => [cinema.id, i]));
  const positions = (file: ShowtimesFile, date: string | null) =>
    [...new Set(file.showings.filter((showing) => date === null || eveningDayKey(showing.startsAt) === date).flatMap((showing) => at.get(showing.cinemaId) ?? []))].sort((a, b) => a - b);
  const held = [...new Set(page.showings.map((showing) => eveningDayKey(showing.startsAt)))].sort();
  const days: DayInfo[] = held.map((date) => ({ date, cinemas: positions(page, date) }));
  for (const { date, file } of [...later].sort((a, b) => a.date.localeCompare(b.date))) {
    const ahead = lagosDaysFrom(page.generatedAt, noonOn(date));
    if (ahead < 2 || ahead >= DAYS || held.includes(date)) continue;
    days.push({ date, cinemas: positions(file, null), later: true });
  }
  return days;
}
