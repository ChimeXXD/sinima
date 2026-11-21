import type { FormatTag } from "@/lib/data/format";
import { anchorFor, byFilm, DAYS, formatsOf, showingOn, type Day } from "@/lib/data/programme";
import type { ListFresh, ListRow } from "@/lib/data/select";

// Search (Figma Search and city, 192:7519): the films whose title matches, per city, each with its
// next showing. The pages fetch a small index (/data/search.json) the first time search opens, so
// no page carries every film's times in its HTML.

export type City = "lagos" | "abuja";
export type Scope = City | "both";
export const CITIES: City[] = ["lagos", "abuja"];

export type SearchFilm = { id: string; title: string; poster: string | null; rating: string | null; runtimeMin: number | null };
/** A showing as [startsAt, film, cinema, format]: positions in the index's lists. */
export type SearchRow = [string, number, number, string | null];
/** A film under a city's Coming soon (D-151) as [film, city, "Opens Fri 18 Dec at Filmhouse"]: it has no rows. */
export type SearchComing = [number, City, string];
/**
 * `sample` and `fresh` give search the same banner the page shows (rules 2 and 8). `coming` is left
 * out when no city has a coming film.
 */
export type SearchIndex = { sample: boolean; fresh: ListFresh[]; films: SearchFilm[]; cinemas: { name: string; city: City }[]; rows: SearchRow[]; coming?: SearchComing[] };

export type SearchResult = { film: SearchFilm; next: { at: string; cinema: string }; cinemas: number; formats: FormatTag[]; day: Day };
/** A film only coming to the city (D-151): no times, only when it opens. */
export type SearchComingResult = { film: SearchFilm; opens: string };
export type SearchGroup = { city: City; results: SearchResult[]; coming: SearchComingResult[] };

/** True when the index has a cinema in the city: a live set read before Abuja was added has none (D-120). */
export const hasCinemas = (index: SearchIndex, city: City) => index.cinemas.some((cinema) => cinema.city === city);

/** Lower case, no accents, letters and digits only: "Spider-Man" and "spiderman" match. */
/** Lower case, no accents, letters and digits only: "Ọ̀zọ́ne Yaba" finds "ozone". */
export const fold = (text: string) => text.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");

/** True when the title holds the query. An empty query matches nothing. */
export function matchesTitle(title: string, query: string): boolean {
  const wanted = fold(query);
  return wanted !== "" && fold(title).includes(wanted);
}

/**
 * The matching films in each city of the scope, Lagos first. A film's result is its next showing
 * today that has not started (D-05), or else its first on the soonest of the next four days (D-142);
 * with none it is left out.
 * Soonest first; the matching films only coming to the city are apart, in `coming` (D-151). Today is
 * worked out from all of the city's times, as on Films, so a film's words never depend on which other
 * films match.
 */
export function searchFilms(index: SearchIndex, query: string, scope: Scope, now: string): SearchGroup[] {
  const wanted = new Set(index.films.flatMap((film, i) => (matchesTitle(film.title, query) ? [i] : [])));
  const rows: ListRow[] = index.rows.map(([at, film, cinema, format]) => ({ at, film, cinema, format, book: null, fresh: 0 }));
  return CITIES.filter((city) => scope === "both" || scope === city).map((city) => {
    const here = rows.filter((row) => index.cinemas[row.cinema]!.city === city);
    const anchor = anchorFor(here, now); // worked out once for the city, not once per day
    const results: SearchResult[] = [];
    for (const day of Array.from({ length: DAYS }, (_, i) => i as Day)) {
      for (const group of byFilm(showingOn(here, day, now, null, false, anchor))) {
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
    // The films only coming to the city (D-151), in Coming soon's order: they have no times.
    const coming = (index.coming ?? []).filter(([film, where]) => where === city && wanted.has(film)).map(([film, , opens]) => ({ film: index.films[film]!, opens }));
    return { city, results, coming };
  });
}

/** What Enter does in search: list the matches on Films, or open one film. */
export type EnterTarget = { films: number } | { film: SearchFilm; city: City } | null;

/**
 * Enter lists the matches on Films when Films has some of them today: `onFilms` is the search in
 * the city whose Films Enter opens (the page's), whatever cities are shown; the count is those.
 * Otherwise Films would list none, so it opens the top result shown: the first city's first film,
 * one with times before one only coming. Null when nothing shown matches.
 */
export function enterTarget(shown: SearchGroup[], onFilms: SearchGroup | undefined): EnterTarget {
  const films = onFilms?.results.filter((result) => result.day === 0).length ?? 0;
  if (films > 0) return { films };
  for (const group of shown) {
    const film = group.results[0]?.film ?? group.coming[0]?.film;
    if (film) return { film, city: group.city };
  }
  return null;
}
