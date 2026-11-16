import { CITY_NAMES, type City } from "@/lib/city";

// Words for a city with no cinemas in the data yet (Abuja until its pages are saved, D-98): said,
// never filled with made-up times (rule 8).

export type Section = "films" | "cinemas" | "soon" | "yours";

/** The screen's own title, as in the city that has times. */
export function sectionTitle(section: Section, city: City): string {
  const name = CITY_NAMES[city];
  return { films: `What's on in ${name}`, cinemas: `Cinemas in ${name}`, soon: `Starting soon in ${name}`, yours: "Your cinemas" }[section];
}

export const comingWords = (city: City, other: City) => ({
  title: `${CITY_NAMES[city]}'s cinemas are being added`,
  body: `Until then, Sinima has every cinema in ${CITY_NAMES[other]}. Switch any time in the search bar.`,
  action: `See what's on in ${CITY_NAMES[other]}`,
});
