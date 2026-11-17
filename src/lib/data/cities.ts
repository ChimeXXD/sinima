import type { City } from "@/lib/city";
import type { ShowtimesFile } from "@/lib/data/types";
import { cutFeatured, withFeatured } from "./featured.ts";

// The city layer (D-98, D-120): a cinema's city is its area's, from data/cinemas.json. Each city's
// pages are built from the file cut to that city, so a Lagos page never carries Abuja's times.

/** Where an area is: its city, or undefined for a slug the registry does not have. */
export type CityOfArea = (slug: string) => City | undefined;

/** A cinema's city; a cinema in an area with no city is a mistake in the data, so it throws. */
export function cityOfCinema(cinema: { area: string }, cityOfArea: CityOfArea): City {
  const city = cityOfArea(cinema.area);
  if (!city) throw new Error(`No city for the area "${cinema.area}" in data/cinemas.json`);
  return city;
}

/** The file cut to one city's cinemas (with or without times), their showings and featured films (D-131), and the films and sources those use. */
export function inCity(file: ShowtimesFile, city: City, cityOfArea: CityOfArea): ShowtimesFile {
  const cinemas = file.cinemas.filter((cinema) => cityOfCinema(cinema, cityOfArea) === city);
  const ids = new Set(cinemas.map((cinema) => cinema.id));
  const showings = file.showings.filter((showing) => ids.has(showing.cinemaId));
  const films = new Set(showings.map((showing) => showing.filmId));
  const featured = cutFeatured(file, ids);
  const sources = new Set([...showings, ...featured].map((row) => row.sourceId));
  return withFeatured({
    ...file,
    sources: file.sources.filter((source) => sources.has(source.id)),
    cinemas,
    films: file.films.filter((film) => films.has(film.id)),
    showings,
  }, featured);
}
