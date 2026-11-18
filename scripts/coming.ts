// Coming films (D-144, D-151): the films a sinima's own page lists as coming, each with the first
// date the sinima gives (never TMDB's), matched to film ids like the showings' (D-119). Pure.
import type { Coming } from "../src/lib/data/types.ts";
import { lagosDayKey } from "../src/lib/time/lagos.ts";
import type { Batch } from "./pipeline.ts";

const DAY = 86_400_000;

/** A coming list's title, tidied: no space before a colon (Filmhouse's "DUNE : PART THREE"). The id is the same either way. */
export const comingTitle = (title: string) => title.replace(/\s+:/g, ":");

/**
 * A coming film's date in sample data (D-20): as many days after today (Lagos) as it was after the
 * day the page was saved, so the sample's "Opens" keeps its distance. Null stays null.
 */
export function sampleDay(day: string | null, savedDay: string, now: string): string | null {
  if (day === null) return null;
  const [year, month, date] = lagosDayKey(now).split("-").map(Number) as [number, number, number];
  const offset = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${savedDay}T00:00:00Z`)) / DAY);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

/** Undated last; otherwise by date, and the page's order on a tie (sort is stable). */
const byFirstDay = (a: Coming, b: Coming) => (a.firstDay === b.firstDay ? 0 : a.firstDay === null ? 1 : b.firstDay === null ? -1 : a.firstDay.localeCompare(b.firstDay));

/**
 * Each batch's coming films as entries, one per film per source (the first time the page lists it).
 * `match` gives a title's film id and title (the showings' when it is one of theirs); `add` puts a
 * film into `films` if it is not there yet, so its poster and credits are looked up like any other.
 */
export function comingFilms(batches: Batch[], match: (title: string) => { id: string; title: string }, add: (film: { id: string; title: string; spelling: string; rating: string | null }) => void): Coming[] {
  const list: Coming[] = [];
  for (const batch of batches) {
    if (!batch.coming) continue;
    const seen = new Set<string>();
    for (const film of batch.coming.films) {
      const { id, title } = match(comingTitle(film.title));
      if (seen.has(id)) continue;
      seen.add(id);
      add({ id, title, spelling: film.title, rating: film.rating });
      list.push({ sourceId: batch.sourceId, filmId: id, firstDay: film.firstDay, cinemaIds: batch.coming.cinemaIds, fetchedAt: batch.fetchedAt });
    }
  }
  return list.sort(byFirstDay);
}
