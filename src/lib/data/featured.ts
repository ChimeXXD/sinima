import { lagosDayKey } from "../time/lagos.ts";
import type { Featured, ShowtimesFile } from "./types.ts";

// Films a chain's own page features for a day, without times (D-131). Relative imports with ".ts"
// so the refresh script can run this file under plain Node.

/** What a page sends the browser: the films' titles and the cinemas (positions in ListData) they are for. */
export type ListFeatured = { cinemas: number[]; day: string; films: string[] };

/** The file's featured lists cut to some cinemas: each keeps only those cinemas, and one left with none goes. */
export function cutFeatured(file: Pick<ShowtimesFile, "featured">, cinemaIds: Set<string>): Featured[] {
  return (file.featured ?? []).map((entry) => ({ ...entry, cinemaIds: entry.cinemaIds.filter((id) => cinemaIds.has(id)) })).filter((entry) => entry.cinemaIds.length > 0);
}

/** `file` with `featured` set to `list`, or without the key when the list is empty, as a file without any is written. */
export function withFeatured<T extends Pick<ShowtimesFile, "featured">>(file: T, list: Featured[]): T {
  const out: T = { ...file, featured: list };
  if (list.length === 0) delete out.featured;
  return out;
}

/**
 * The films featured for one cinema (a position in ListData): on their own Lagos day only. `today`
 * is null before the page knows the time (rule 3), when the line gives the date instead.
 */
export function featuredAt(data: { featured?: ListFeatured[] }, cinema: number, now: string | null): { films: string[]; day: string; today: boolean | null } | null {
  const entry = data.featured?.find((candidate) => candidate.cinemas.includes(cinema) && candidate.films.length > 0);
  if (!entry) return null;
  if (now !== null && lagosDayKey(now) !== entry.day) return null;
  return { films: entry.films, day: entry.day, today: now === null ? null : true };
}
