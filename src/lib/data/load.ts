import { readFileSync } from "node:fs";
import { join } from "node:path";
import registry from "../../../data/cinemas.json";
import { isCity, type City } from "@/lib/city";
import { inCity } from "@/lib/data/cities";
import type { ShowtimesFile } from "@/lib/data/types";

// Build-time only: pages read the files `npm run refresh` wrote (DATA §Per-area files). Each page
// loads its own file, so an area page carries only that area's showings (D-18).

export type Area = { slug: string; name: string; /** Lagos or Abuja (D-120). */ city: City; neighbours: string[]; cinemas: number };

/** Every area of both cities, in the registry's order, with how many cinemas it has. */
export const areas: Area[] = registry.areas.map(({ slug, name, city, neighbours }) => {
  if (!isCity(city)) throw new Error(`The area "${slug}" in data/cinemas.json has no city (lagos or abuja)`);
  return { slug, name, city, neighbours, cinemas: registry.cinemas.filter((cinema) => cinema.area === slug).length };
});

/** One city's areas (D-120). */
export const areasIn = (city: City) => areas.filter((area) => area.city === city);

/** An area's city, or undefined for a slug the registry does not have. */
export const cityOfArea = (slug: string): City | undefined => areas.find((area) => area.slug === slug)?.city;

export function areaBySlug(slug: string): Area {
  const area = areas.find((candidate) => candidate.slug === slug);
  if (!area) throw new Error(`No area "${slug}" in data/cinemas.json`);
  return area;
}

function read(path: string): ShowtimesFile {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "public/data", path), "utf8")) as ShowtimesFile;
  } catch (error) {
    throw new Error(`Cannot read public/data/${path}. Run \`npm run refresh -- --fixtures\` first. (${error instanceof Error ? error.message : String(error)})`);
  }
}

export const loadAll = () => read("all.json");
/** One city's cinemas, showings, films and sources (D-120): what a city's page is built from. */
export const loadCity = (city: City) => inCity(loadAll(), city, cityOfArea);
export const loadArea = (slug: string) => read(`area/${slug}.json`);

/** A page's city from its address (D-98); a static page is only ever built for a known one. */
export function cityParam(slug: string): City {
  if (!isCity(slug)) throw new Error(`No city "${slug}"`);
  return slug;
}
