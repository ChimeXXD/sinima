import type { FormatTag } from "@/lib/data/format";
import { byFilm, formatsOf, showingOn, type Day } from "@/lib/data/programme";
import { toListData, type ListFresh, type ListRow } from "@/lib/data/select";
import type { ShowtimesFile } from "@/lib/data/types";

// Search (Figma Search and city, 192:7519): the films whose title matches, per city, each with its
// next showing. The pages fetch a small index (/data/search.json) the first time search opens, so
// no page carries every film's times in its HTML.

export type City = "lagos" | "abuja";
export type Scope = City | "both";
export const CITIES: City[] = ["lagos", "abuja"];

export type SearchFilm = { id: string; title: string; poster: string | null; rating: string | null; runtimeMin: number | null };
/** A showing as [startsAt, film, cinema, format]: positions in the index's lists. */
export type SearchRow = [string, number, number, string | null];
/** `sample` and `fresh` give search the same banner the page shows (rules 2 and 8). */
export type SearchIndex = { sample: boolean; fresh: ListFresh[]; films: SearchFilm[]; cinemas: { name: string; city: City }[]; rows: SearchRow[] };

export type SearchResult = { film: SearchFilm; next: { at: string; cinema: string }; cinemas: number; formats: FormatTag[]; day: Day };
export type SearchGroup = { city: City; results: SearchResult[] };

/** The index the pages fetch. Every cinema is in Lagos until the city layer adds Abuja's (unit 13). */
export function searchIndex(file: ShowtimesFile): SearchIndex {
  const list = toListData(file);
  return {
    sample: list.sample,
    fresh: list.fresh,
    films: list.films.map(({ id, title, poster, rating, runtimeMin }) => ({ id, title, poster, rating, runtimeMin })),
    cinemas: list.cinemas.map((cinema) => ({ name: cinema.name, city: "lagos" })),
    rows: list.rows.map((row) => [row.at, row.film, row.cinema, row.format]),
  };
}

/** True when the index has a cinema in the city: Abuja has none until the city layer (unit 13). */
export const hasCinemas = (index: SearchIndex, city: City) => index.cinemas.some((cinema) => cinema.city === city);

/** Lower case, no accents, letters and digits only: "Spider-Man" and "spiderman" match. */
const fold = (text: string) => text.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");

/** True when the title holds the query. An empty query matches nothing. */
export function matchesTitle(title: string, query: string): boolean {
  const wanted = fold(query);
  return wanted !== "" && fold(title).includes(wanted);
}

/**
 * The matching films in each city of the scope, Lagos first. A film's result is its next showing
 * today that has not started (D-05), or else its first tomorrow; with neither it is left out.
 * Soonest first. Today is worked out from all of the city's times, as on Films, so a film's words
 * never depend on which other films match.
 */
export function searchFilms(index: SearchIndex, query: string, scope: Scope, now: string): SearchGroup[] {
  const wanted = new Set(index.films.flatMap((film, i) => (matchesTitle(film.title, query) ? [i] : [])));
  const rows: ListRow[] = index.rows.map(([at, film, cinema, format]) => ({ at, film, cinema, format, book: null, fresh: 0 }));
  return CITIES.filter((city) => scope === "both" || scope === city).map((city) => {
    const here = rows.filter((row) => index.cinemas[row.cinema]!.city === city);
    const results: SearchResult[] = [];
    for (const day of [0, 1] as const) {
      for (const group of byFilm(showingOn(here, day, now))) {
        if (!wanted.has(group.film) || results.some((result) => result.film === index.films[group.film])) continue;
        const first = group.rows[0]!;
        results.push({
          film: index.films[group.film]!,
          next: { at: first.at, cinema: index.cinemas[first.cinema]!.name },
          cinemas: new Set(group.rows.map((row) => row.cinema)).size,
          formats: formatsOf(group.rows),
          day,
        });
      }
    }
    return { city, results };
  });
}
