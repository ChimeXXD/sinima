import { byCinema, showingOn, type Day } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";
import { eveningDayKey } from "@/lib/time/lagos";
import { isBeforeStart, showingState } from "@/lib/time/showingState";

// One film's page (Figma Film 185:3558): the rows of one film, grouped by area. Your area first,
// then the areas next to it, then the rest by their soonest showing; inside an area, soonest
// cinema first. Today, once the page knows the time, a cinema is listed while it has a showing
// still to start, with a showing that started in the last 30 min kept as a struck time (D-05);
// a cinema whose times have all started is named in the line under the list instead.

export type CinemaTimes = { cinema: number; rows: ListRow[] };
export type AreaGroup = { area: string; tag: "home" | "next" | null; cinemas: CinemaTimes[] };
export type Home = { slug: string; neighbours: string[] };

const upcoming = (row: ListRow, now: string) => isBeforeStart(showingState(row.at, now));
const recent = (row: ListRow, now: string) => showingState(row.at, now) !== "ended";

/** The cinemas listed on a day, each with its times. */
function cinemaTimes(rows: ListRow[], day: Day, now: string, live: boolean): CinemaTimes[] {
  if (!live || day === 1) return byCinema(showingOn(rows, day, now, null, !live));
  const today = showingOn(rows, 0, now, null, true);
  const open = byCinema(today.filter((row) => upcoming(row, now)));
  // Ordered by their next showing, with the recently started ones put back in front of it.
  return open.map(({ cinema }) => ({ cinema, rows: today.filter((row) => row.cinema === cinema && recent(row, now)) }));
}

export function areaGroups(rows: ListRow[], day: Day, now: string, live: boolean, areaOf: (cinema: number) => string, home: Home | null): AreaGroup[] {
  const groups = new Map<string, CinemaTimes[]>();
  // Cinemas come soonest first, so each area's first cinema sets the area's place.
  for (const times of cinemaTimes(rows, day, now, live)) groups.set(areaOf(times.cinema), [...(groups.get(areaOf(times.cinema)) ?? []), times]);
  const rank = (area: string) => (home === null ? 2 : area === home.slug ? 0 : home.neighbours.includes(area) ? 1 : 2);
  const tag = (area: string) => (["home", "next", null] as const)[rank(area)]!;
  return [...groups]
    .map(([area, cinemas]) => ({ area, tag: tag(area), cinemas }))
    .sort((a, b) => rank(a.area) - rank(b.area)); // stable: soonest first within each rank
}

/** Cinemas that showed it today and have nothing left to start, with their last start, in time order. */
export function startedEarlier(rows: ListRow[], now: string): { cinema: number; at: string }[] {
  return byCinema(showingOn(rows, 0, now, null, true))
    .filter((group) => !group.rows.some((row) => upcoming(row, now)))
    .map((group) => ({ cinema: group.cinema, at: group.rows.at(-1)!.at }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** How many cinemas show it on a day, and how many showings, started ones too. */
export function cinemasOn(rows: ListRow[], day: Day, now: string): { cinemas: number; showings: number } {
  const on = showingOn(rows, day, now, null, true);
  return { cinemas: new Set(on.map((row) => row.cinema)).size, showings: on.length };
}

const NEXT_COUNT = 3;

/**
 * After a showing has started (Figma: Started showing): the next times today. One per cinema, the
 * soonest, in its area and the areas next to it (the same area first on a tie), always with this
 * cinema's own next time. With nothing left nearby, the soonest across the city.
 */
export function nextNearby(rows: ListRow[], picked: ListRow, now: string, areaOf: (cinema: number) => string, near: (area: string) => string[]): { rows: ListRow[]; near: boolean } {
  // The picked showing's own evening (a 00:30 show belongs to the evening before), not the clock's.
  const left = rows.filter((row) => row !== picked && eveningDayKey(row.at) === eveningDayKey(picked.at) && upcoming(row, now));
  const firsts = byCinema(left).map((group) => group.rows[0]!);
  const here = areaOf(picked.cinema);
  const area = near(here);
  const order = (a: ListRow, b: ListRow) => a.at.localeCompare(b.at) || Number(areaOf(b.cinema) === here) - Number(areaOf(a.cinema) === here);
  const nearby = firsts.filter((row) => areaOf(row.cinema) === here || area.includes(areaOf(row.cinema))).sort(order);
  const pool = nearby.length > 0 ? nearby : [...firsts].sort(order);
  const own = pool.find((row) => row.cinema === picked.cinema);
  const others = pool.filter((row) => row !== own).slice(0, own ? NEXT_COUNT - 1 : NEXT_COUNT);
  return { rows: [...others, ...(own ? [own] : [])].sort(order), near: nearby.length > 0 };
}
