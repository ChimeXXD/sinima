import { CITY_NAMES, type City } from "@/lib/city";

// The words that name a page's city (D-98, D-120): every "Lagos" on a city page comes from here or
// from CITY_NAMES, so Abuja's pages say Abuja.

export type Section = "films" | "cinemas" | "soon" | "yours";

/** The screen's own title, in the page's city. */
export function sectionTitle(section: Section, city: City): string {
  const name = CITY_NAMES[city];
  return { films: `What's on in ${name}`, cinemas: `Sinimas in ${name}`, soon: `Starting soon in ${name}`, yours: "Your sinimas" }[section];
}

/** The ways back to the city's tabs, and the film page's heading over its times. */
export const cityWords = (city: City) => {
  const name = CITY_NAMES[city];
  return { allCinemas: `All sinimas in ${name}`, allFilms: `All films in ${name}`, times: `Times in ${name}` };
};
