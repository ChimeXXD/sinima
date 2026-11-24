import { lagosDayKey } from "../time/lagos.ts";
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

/** How many days from a coming film's first date its tickets on sale are kept: as many as a listing shows (D-199). */
export const PRESALE_DAYS = 5;

/** A coming film's first PRESALE_DAYS days from `firstDay`, as Lagos dates (yyyy-mm-dd), in order (D-199). */
export const presaleDays = (firstDay: string): string[] =>
  Array.from({ length: PRESALE_DAYS }, (_, offset) => new Date(Date.parse(`${firstDay}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10));

/** True while a coming film's first date is still after `today` (a Lagos date); an undated one stays. */
export const stillComing = (entry: Pick<Coming, "firstDay">, today: string) => entry.firstDay === null || entry.firstDay > today;

/** The films that have a showing in the file: a coming-only film is in `films` without one (D-151). */
export function filmsWithShowings(file: Pick<ShowtimesFile, "films" | "showings">): Film[] {
  const shown = new Set(file.showings.map((showing) => showing.filmId));
  return file.films.filter((film) => shown.has(film.id));
}

/** A film under Coming soon (D-151): its first date (null: not announced) and the sinimas (chains) that list it. */
export type ComingFilm = { film: Film; firstDay: string | null; sinimas: string[] };

/**
 * The films under Coming soon in a city, from its file: one per film, by first date, undated last.
 * A film with any showing in the city's shown days (`showing`, their ids) is left out: it is on now,
 * and its page is the normal film page (D-154). A film two sinimas list takes the earliest date, with
 * the sinimas that give it. An entry no longer ahead of the file's Lagos day is left out.
 */
export function comingList(file: Pick<ShowtimesFile, "coming" | "films" | "cinemas" | "generatedAt">, showing: Set<string>): ComingFilm[] {
  const today = lagosDayKey(file.generatedAt);
  const chainOf = new Map(file.cinemas.map((cinema) => [cinema.id, cinema.chain]));
  const films = new Map(file.films.map((film) => [film.id, film]));
  const byFilm = new Map<string, ComingFilm>();
  for (const entry of file.coming ?? []) {
    const film = films.get(entry.filmId);
    if (!film || showing.has(entry.filmId) || !stillComing(entry, today)) continue;
    const sinimas = entry.cinemaIds.flatMap((id) => chainOf.get(id) ?? []);
    // An entry no sinima in the file gives can't name where the film opens: it never wins the date.
    if (sinimas.length === 0) continue;
    const known = byFilm.get(film.id);
    const earlier = known !== undefined && entry.firstDay !== null && (known.firstDay === null || entry.firstDay < known.firstDay);
    if (known === undefined || earlier) byFilm.set(film.id, { film, firstDay: entry.firstDay, sinimas: [...new Set(sinimas)] });
    else if (entry.firstDay === known.firstDay) known.sinimas = [...new Set([...known.sinimas, ...sinimas])];
  }
  const order = (day: string | null) => day ?? "9999";
  return [...byFilm.values()].sort((a, b) => order(a.firstDay).localeCompare(order(b.firstDay)));
}
