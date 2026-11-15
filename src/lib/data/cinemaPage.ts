import { byFilm, showingOn, type Day } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";
import { isBeforeStart, showingState } from "@/lib/time/showingState";

// A cinema's page (Figma Cinema 202:7192): its films on the day, the soonest next time first. Today,
// a film lists only its times still to start; one whose times have all started comes last, with
// when they started and its times tomorrow (Figma: Agbara Nla).

/** `rows` still to start (the whole day before the time is known); `earlier` started today when none are left; `next` tomorrow's. */
export type FilmTimes = { film: number; rows: ListRow[]; earlier: ListRow[]; next: ListRow[] };
/** `total` films on the day, `left` with a time still to start, `tomorrow` whether tomorrow has any times. */
export type CinemaFilms = { films: FilmTimes[]; total: number; left: number; tomorrow: boolean };

export function cinemaFilms(input: { rows: ListRow[]; day: Day; now: string; live: boolean }): CinemaFilms {
  const { rows, day, now, live } = input;
  const tomorrow = showingOn(rows, 1, now);
  const whole = showingOn(rows, day, now, null, true);
  const keepAll = !live || day === 1;
  const films = byFilm(whole).map(({ film, rows: all }): FilmTimes => {
    const left = keepAll ? all : all.filter((row) => isBeforeStart(showingState(row.at, now)));
    return { film, rows: left, earlier: left.length === 0 ? all : [], next: left.length === 0 ? tomorrow.filter((row) => row.film === film) : [] };
  });
  // Soonest time still to start first; then the films that have all started, by when they first did (sort is stable).
  const first = (times: FilmTimes) => times.rows[0]?.at ?? null;
  films.sort((a, b) => (first(a) && first(b) ? first(a)!.localeCompare(first(b)!) : Number(first(a) === null) - Number(first(b) === null)));
  return { films, total: films.length, left: films.filter((times) => times.rows.length > 0).length, tomorrow: tomorrow.length > 0 };
}
