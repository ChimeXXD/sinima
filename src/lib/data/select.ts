import type { DayInfo } from "@/lib/data/days";
import type { ListFeatured } from "@/lib/data/featured";
import type { SourceMethod, Via } from "@/lib/data/types";
import { EVENING_ENDS_HOUR, eveningDayKey, toLagos, utcMs, utcString } from "@/lib/time/lagos";
import { isBeforeStart, showingState } from "@/lib/time/showingState";
import type { CreditsVerdict } from "@/lib/wording/credits";
import { freshness, type FreshnessBand } from "@/lib/wording/freshness";

// What a list page needs from a data file, and how its rows fall into sections. The page sends
// ListData to the browser, so it holds only what a row shows, with repeated values stored once.

/** One source read at one time, optionally through the cinema's own site. */
export type ListFresh = { source: string; method: SourceMethod; url: string; fetchedAt: string; via?: Via };
/** `film`, `cinema` and `fresh` are positions in ListData's lists. */
export type ListRow = { at: string; film: number; cinema: number; format: string | null; book: string | null; fresh: number };
export type ListFilm = { id: string; title: string; /** TMDB's image path, or null. */ poster: string | null; /** The trailer's YouTube id, or null (D-117). */ trailer: string | null; rating: string | null; runtimeMin: number | null; stay: { verdict: CreditsVerdict; chip: string; detail: string } };
export type ListCinema = { id: string; name: string; area: string; chain: string; /** Has a booking page of its own. */ online: boolean; address: string | null; website: string | null };
export type ListData = {
  sample: boolean;
  /** When the file was made. Stands in for "now" until the browser has the time. */
  at: string;
  films: ListFilm[];
  cinemas: ListCinema[];
  fresh: ListFresh[];
  rows: ListRow[];
  /** Films a chain's page features today for its cinemas with no times at all (D-131); left out when none. */
  featured?: ListFeatured[];
  /** The days the city has times for and the sinimas listing each (D-146, D-147); Films, a film's, a sinima's and Sinimas pages only. */
  days?: DayInfo[];
};

const HOUR = 3_600_000;
const SOON_WINDOW = 2 * HOUR;

export const startsSoon = (at: string, now: string) => isBeforeStart(showingState(at, now)) && utcMs(at) - utcMs(now) <= SOON_WINDOW;

/**
 * The home sections: Starting soon (the next 2 hours), Later tonight (to 04:00) and Tomorrow.
 * A showing leaves the list the second it starts (D-05); anything past tomorrow evening is left out.
 */
export function groupShowings<T extends { at: string }>(rows: T[], now: string): { soon: T[]; later: T[]; tomorrow: T[] } {
  const tonight = eveningDayKey(now);
  const nextEvening = eveningDayKey(utcString(utcMs(now) + 24 * HOUR));
  const groups = { soon: [] as T[], later: [] as T[], tomorrow: [] as T[] };
  for (const row of [...rows].sort((a, b) => a.at.localeCompare(b.at))) {
    if (!isBeforeStart(showingState(row.at, now))) continue;
    const evening = eveningDayKey(row.at);
    if (startsSoon(row.at, now)) groups.soon.push(row);
    else if (evening === tonight) groups.later.push(row);
    else if (evening === nextEvening) groups.tomorrow.push(row);
  }
  return groups;
}

/** How many of these start times fall in the next 2 hours. */
export function soonCount(starts: string[], now: string): number {
  return starts.filter((at) => startsSoon(at, now)).length;
}

export type Banner = { kind: "sample" | "old" | "stale"; text: string };

/** The one banner a page shows for the rows on it: the worst case wins (DATA §Freshness). */
export function bannerFor(bands: FreshnessBand[]): Banner | null {
  if (bands.includes("sample")) return { kind: "sample", text: "Sample data. These times are for the demo, not for booking." };
  if (bands.includes("old")) return { kind: "old", text: "Some times are more than a day old and may have changed." };
  if (bands.includes("stale")) return { kind: "stale", text: "Some times are from yesterday. Sinimas change programmes; check before you travel." };
  return null;
}

/** The page's one banner for its data: sample data at once; the age of real times only once the browser has the clock (rule 3). */
export function pageBanner(data: Pick<ListData, "sample" | "fresh">, now: string | null): Banner | null {
  if (data.sample) return bannerFor(["sample"]);
  if (now === null) return null;
  return bannerFor(data.fresh.map((from) => freshness({ name: from.source, method: from.method }, from.fetchedAt, now, from.via).band));
}

/**
 * Each film with how many showings it has in the list, by title, for "Now showing". With the
 * time, only showings that have not started count, and a film with none left is not showing.
 */
export function filmCounts(data: ListData, now: string | null = null): (ListFilm & { showings: number })[] {
  const counts = (i: number) => data.rows.filter((row) => row.film === i && (now === null || isBeforeStart(showingState(row.at, now)))).length;
  return data.films
    .map((film, i) => ({ ...film, showings: counts(i) }))
    .filter((film) => film.showings > 0)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** From 17:00 until the evening ends at 04:00 it is "Later tonight"; in the daytime, "Later today". */
export function laterName(now: string): "Later tonight" | "Later today" {
  const { hour } = toLagos(now);
  return hour >= 17 || hour < EVENING_ENDS_HOUR ? "Later tonight" : "Later today";
}

/**
 * The section after tonight. After midnight the evening that began yesterday is still "tonight",
 * so the next section holds shows later the same calendar day: "Today", not "Tomorrow".
 */
export function nextDayName(now: string): "Tomorrow" | "Today" {
  return toLagos(now).hour < EVENING_ENDS_HOUR ? "Today" : "Tomorrow";
}
