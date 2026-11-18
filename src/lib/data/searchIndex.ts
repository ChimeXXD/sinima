import { cityOfCinema, type CityOfArea } from "@/lib/data/cities";
import { toListData } from "@/lib/data/listData";
import type { SearchIndex } from "@/lib/data/search";
import type { ShowtimesFile } from "@/lib/data/types";

// Build time: /data/search.json. Apart from search.ts, which the pages carry, so no page carries
// the code that makes the index (the page budget, D-21).

/** The index the pages fetch, both cities in one: each cinema with its area's city (D-120). */
export function searchIndex(file: ShowtimesFile, cityOfArea: CityOfArea): SearchIndex {
  const list = toListData(file);
  return {
    sample: list.sample,
    fresh: list.fresh,
    films: list.films.map(({ id, title, poster, rating, runtimeMin }) => ({ id, title, poster, rating, runtimeMin })),
    cinemas: list.cinemas.map((cinema) => ({ name: cinema.name, city: cityOfCinema(cinema, cityOfArea) })),
    rows: list.rows.map((row) => [row.at, row.film, row.cinema, row.format]),
  };
}
