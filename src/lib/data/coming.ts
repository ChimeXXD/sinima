import type { Coming, Film, ShowtimesFile } from "./types.ts";

// Films a sinima lists as coming (D-144, D-151). Relative imports with ".ts" so the refresh script
// can run this file under plain Node.

/** The file's coming films cut to some cinemas: each keeps only those cinemas, and one left with none goes. */
export function cutComing(file: Pick<ShowtimesFile, "coming">, cinemaIds: Set<string>): Coming[] {
  return (file.coming ?? []).map((entry) => ({ ...entry, cinemaIds: entry.cinemaIds.filter((id) => cinemaIds.has(id)) })).filter((entry) => entry.cinemaIds.length > 0);
}

/** `file` with `coming` set to `list`, or without the key when the list is empty, as a file without any is written. */
export function withComing<T extends Pick<ShowtimesFile, "coming">>(file: T, list: Coming[]): T {
  const out: T = { ...file, coming: list };
  if (list.length === 0) delete out.coming;
  return out;
}

/** True while a coming film's first date is still after `today` (a Lagos date); an undated one stays. */
export const stillComing = (entry: Pick<Coming, "firstDay">, today: string) => entry.firstDay === null || entry.firstDay > today;

/** The films that have a showing in the file: a coming-only film is in `films` without one (D-151). */
export function filmsWithShowings(file: Pick<ShowtimesFile, "films" | "showings">): Film[] {
  const shown = new Set(file.showings.map((showing) => showing.filmId));
  return file.films.filter((film) => shown.has(film.id));
}
