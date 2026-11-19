import type { City } from "@/lib/city";
import { cityOfCinema, type CityOfArea } from "@/lib/data/cities";
import type { ComingFilm } from "@/lib/data/coming";
import { listFilm, toListData } from "@/lib/data/listData";
import type { ListFilm } from "@/lib/data/select";
import type { SearchComing, SearchFilm, SearchIndex } from "@/lib/data/search";
import type { ShowtimesFile } from "@/lib/data/types";
import { opensChip } from "@/lib/wording/coming";

// Build time: /data/search.json. Apart from search.ts, which the pages carry, so no page carries
// the code that makes the index (the page budget, D-21).

/** What search shows of a film. */
const searchFilm = ({ id, title, poster, rating, runtimeMin }: ListFilm): SearchFilm => ({ id, title, poster, rating, runtimeMin });

/**
 * The index the pages fetch, both cities in one: each cinema with its area's city (D-120), then each
 * city's Coming soon (D-151), the same list its Films shows, with the words saying when each opens
 * (made here, so the pages' scripts carry no date wording).
 */
export function searchIndex(file: ShowtimesFile, cityOfArea: CityOfArea, coming: Partial<Record<City, ComingFilm[]>> = {}): SearchIndex {
  const list = toListData(file);
  // A film only coming has no row, so it is not in the list's films: it joins them, made the same way.
  const films: SearchFilm[] = list.films.map(searchFilm);
  const at = new Map(films.map((film, i) => [film.id, i]));
  const soon: SearchComing[] = [];
  for (const [city, entries] of Object.entries(coming) as [City, ComingFilm[]][]) {
    for (const { film, firstDay, sinimas } of entries) {
      if (!at.has(film.id)) at.set(film.id, films.push(searchFilm(listFilm(film))) - 1);
      soon.push([at.get(film.id)!, city, opensChip(firstDay, sinimas)]);
    }
  }
  return {
    sample: list.sample,
    fresh: list.fresh,
    films,
    cinemas: list.cinemas.map((cinema) => ({ name: cinema.name, city: cityOfCinema(cinema, cityOfArea) })),
    rows: list.rows.map((row) => [row.at, row.film, row.cinema, row.format]),
    ...(soon.length > 0 ? { coming: soon } : {}),
  };
}
