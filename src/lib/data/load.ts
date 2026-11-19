import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import registry from "../../../data/cinemas.json";
import { isCity, type City } from "@/lib/city";
import { cityOfCinema } from "@/lib/data/cities";
import { cityDays, type LaterFile } from "@/lib/data/cityDays";
import type { DayInfo } from "@/lib/data/days";
import { withShowingIds } from "@/lib/data/showingId";
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

/** Every cinema's city, by id: what the tab bar needs to count one city's saved cinemas (D-136). */
export function cinemaCityMap(): Record<string, City> {
  return Object.fromEntries(registry.cinemas.map((cinema) => [cinema.id, cityOfCinema(cinema, cityOfArea)]));
}

export function areaBySlug(slug: string): Area {
  const area = areas.find((candidate) => candidate.slug === slug);
  if (!area) throw new Error(`No area "${slug}" in data/cinemas.json`);
  return area;
}

function read(path: string): ShowtimesFile {
  try {
    // A page's file leaves out each showing's usual id (D-156).
    return withShowingIds(JSON.parse(readFileSync(join(process.cwd(), "public/data", path), "utf8")) as ShowtimesFile);
  } catch (error) {
    throw new Error(`Cannot read public/data/${path}. Run \`npm run refresh -- --fixtures\` first. (${error instanceof Error ? error.message : String(error)})`);
  }
}

/** Both cities: About's counts and the search index only (build time; no page carries it, D-126). */
export const loadAll = () => read("all.json");
/** One city's cinemas, showings, films and sources (D-120): what a city's page is built from, its own file (D-126). */
export const loadCity = (city: City) => read(`${city}.json`);
export const loadArea = (slug: string) => read(`area/${slug}.json`);

/** Every later day's file on disk for a city (D-147): `public/data/<city>/<yyyy-mm-dd>.json`. */
function laterFiles(city: City): LaterFile[] {
  const dir = join(process.cwd(), "public/data", city);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .map((name) => ({ date: name.slice(0, 10), file: read(`${city}/${name}`) }));
}

/** The later days a city's pages offer: only those from the third to the fifth day after its file was made. */
export function loadLater(city: City): LaterFile[] {
  const files = laterFiles(city);
  const shown = new Set(cityDays(loadCity(city), files).filter((day) => day.later).map((day) => day.date));
  return files.filter((later) => shown.has(later.date));
}

/** The days a city's page lists, with the sinimas listing each (D-146): what the date tiles and the sentence under them need. */
export const loadDays = (city: City): DayInfo[] => cityDays(loadCity(city), laterFiles(city));

/** A page's city from its address (D-98); a static page is only ever built for a known one. */
export function cityParam(slug: string): City {
  if (!isCity(slug)) throw new Error(`No city "${slug}"`);
  return slug;
}
