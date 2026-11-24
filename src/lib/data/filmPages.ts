import { CITIES, type City } from "@/lib/city";
import type { Film } from "@/lib/data/types";
import { inCity } from "@/lib/data/cities";
import { comingList, filmsWithShowings, type ComingFilm } from "@/lib/data/coming";
import { cityOfArea, loadAll, loadCity, loadLater } from "@/lib/data/load";
import type { ShowtimesFile } from "@/lib/data/types";

// Build time: which films have a page in a city, shared by the film pages, their share cards and
// Films' Coming soon. Each asks, so a city's day files are read and parsed once per build worker.
const showingMemo: Partial<Record<City, Film[]>> = {};
const comingMemo: Partial<Record<City, ComingFilm[]>> = {};

/**
 * Every film showing in a city in the five days shown (D-142): one showing only on Saturday has its
 * page too. A film showing on several days is listed once per day.
 */
const showingIn = (city: City): Film[] => (showingMemo[city] ??= [loadCity(city), ...loadLater(city).map((later) => later.file)].flatMap(filmsWithShowings));

/** The city's Coming soon (D-151): films a sinima lists as coming that have no showing in its shown days (D-154). */
export const comingIn = (city: City): ComingFilm[] => (comingMemo[city] ??= comingList(loadCity(city), new Set(showingIn(city).map((film) => film.id))));

const presaleMemo: Partial<Record<City, ShowtimesFile>> = {};
/**
 * A city's showings already on sale before their film opens (D-194), as a file whose showings they
 * are: from "all", which only the build reads, so no page carries them but the film's own.
 */
export const presalesIn = (city: City): ShowtimesFile => (presaleMemo[city] ??= ((all) => inCity({ ...all, showings: all.presales ?? [] }, city, cityOfArea))(loadAll()));

/** Every film with a page in a city: those showing in its five days, then those only coming (D-151). */
export const filmsIn = (city: City): Film[] => [...showingIn(city), ...comingIn(city).map((entry) => entry.film)];

/** A film has a page in each city it is showing in or coming to (D-120): search and Films link to that city's. */
export const filmPageParams = (): { city: City; slug: string }[] => CITIES.flatMap((city) => [...new Set(filmsIn(city).map((film) => film.id))].map((slug) => ({ city, slug })));

/** The film behind a city's film page. */
export function filmIn(city: City, slug: string): Film {
  const film = filmsIn(city).find((candidate) => candidate.id === slug);
  if (!film) throw new Error(`No film "${slug}" in ${city}'s data`);
  return film;
}
