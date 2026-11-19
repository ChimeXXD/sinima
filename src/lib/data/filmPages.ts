import { CITIES, type City } from "@/lib/city";
import type { Film } from "@/lib/data/types";
import { filmsWithShowings } from "@/lib/data/coming";
import { loadCity, loadLater } from "@/lib/data/load";

// Build time: which films have a page in a city, shared by the film pages and their share cards.
// Each film page and each card asks, so a city's day files are read and parsed once per build worker.
const memo: Partial<Record<City, Film[]>> = {};

/**
 * Every film showing in a city in the five days shown (D-142): one showing only on Saturday has its
 * page too. Only films with showings: a coming-only film (D-151) is in a city file's films too, and
 * gets its page in the Coming soon UI unit. A film showing on several days is listed once per day.
 */
export const filmsIn = (city: City): Film[] => (memo[city] ??= [loadCity(city), ...loadLater(city).map((later) => later.file)].flatMap(filmsWithShowings));

/** A film has a page in each city it is showing in (D-120): search and Films link to that city's. */
export const filmPageParams = (): { city: City; slug: string }[] => CITIES.flatMap((city) => [...new Set(filmsIn(city).map((film) => film.id))].map((slug) => ({ city, slug })));

/** The film behind a city's film page. */
export function filmIn(city: City, slug: string): Film {
  const film = filmsIn(city).find((candidate) => candidate.id === slug);
  if (!film) throw new Error(`No film "${slug}" in ${city}'s data`);
  return film;
}
