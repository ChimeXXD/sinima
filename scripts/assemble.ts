// The step sample and live data share: the sources' batches, with the cinema registry and the
// credits, built into the validated showtimes file and its per-area files (SPEC §4, D-18).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CITIES, type City } from "../src/lib/city.ts";
import { inCity } from "../src/lib/data/cities.ts";
import type { Cinema, ShowtimesFile, Source } from "../src/lib/data/types.ts";
import { mergeCredits, type FilmCredits, type ManualEntry, type TmdbFilm } from "./credits.ts";
import { buildShowtimes, splitByArea, type Batch } from "./pipeline.ts";

export type RegistryCinema = Omit<Cinema, "sourceIds"> & Record<string, unknown>;
export type RegistrySource = {
  id: string; name: string; homepage: string; status: Source["status"]; cinemaIds: string[]; daysAhead?: number;
  /** Each cinema's own listing page on this source, by cinema id (D-122). */
  cinemaPages?: Record<string, string>;
  /** The name this source's booking links give each cinema, by cinema id (Genesis, D-124). */
  bookingSites?: Record<string, string>;
  /** The name this source's pages show for each cinema, by cinema id (Reach Cinema, D-125). */
  pageNames?: Record<string, string>;
};

export const readJson = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
export const readSources = (root: string) => readJson<{ sources: RegistrySource[] }>(join(root, "data/sources.json")).sources;

/** Where each file goes: the whole file, then "all" and each area slug, then each city (D-126). */
export type Paths = { main: string; part: (slug: string) => string; city: (city: City) => string };
export const SAMPLE_PATHS: Paths = {
  main: "data/showtimes.json",
  part: (slug) => (slug === "all" ? "public/data/all.json" : `public/data/area/${slug}.json`),
  city: (city) => `public/data/${city}.json`,
};

/**
 * The page files cut from the whole file: "all" and each area's (the next two days), then each
 * city's cut from "all" (D-126), the file that city's pages are built from.
 */
export function pageFiles(file: ShowtimesFile, areas: { slug: string; city: string }[], now: string, paths: Paths): Map<string, ShowtimesFile> {
  const files = new Map<string, ShowtimesFile>();
  const parts = splitByArea(file, areas.map((area) => area.slug), now);
  for (const [slug, part] of parts) files.set(paths.part(slug), part);
  const cityOfArea = (slug: string) => {
    const city = areas.find((area) => area.slug === slug)?.city;
    return city === "lagos" || city === "abuja" ? city : undefined;
  };
  for (const city of CITIES) files.set(paths.city(city), inCity(parts.get("all") as ShowtimesFile, city, cityOfArea));
  return files;
}

/**
 * What scripts/tmdb.ts last wrote (if it has run) for a film, with Chime's own entries on top (D-19).
 * A merged film (D-119) is looked up under its own id first, then under each spelling's id, so it
 * keeps a poster or answer saved under the way one source writes it. TMDB's answer and Chime's own
 * entry are each found on their own, so one under the film's id never hides the other under a
 * spelling's. With `savedOnly`, a film with nothing saved under any of its ids gives undefined.
 */
export function creditsLookup(root: string, options: { savedOnly?: boolean } = {}): (filmId: string, spellings?: string[]) => FilmCredits | undefined {
  const creditsPath = join(root, "data/credits.json");
  const tmdb = existsSync(creditsPath) ? readJson<{ tmdb: Record<string, TmdbFilm> }>(creditsPath).tmdb : {};
  const manualPath = join(root, "data/credits-manual.json");
  const manual = existsSync(manualPath) ? readJson<{ films: Record<string, ManualEntry> }>(manualPath).films : {};
  return (filmId, spellings = []) => {
    const ids = [filmId, ...spellings];
    const tmdbKey = ids.find((id) => Object.hasOwn(tmdb, id));
    const manualKey = ids.find((id) => Object.hasOwn(manual, id));
    if (options.savedOnly && tmdbKey === undefined && manualKey === undefined) return undefined;
    return mergeCredits({
      filmIds: [filmId],
      tmdb: tmdbKey === undefined ? {} : { [filmId]: tmdb[tmdbKey] as TmdbFilm },
      manual: manualKey === undefined ? {} : { [filmId]: manual[manualKey] as ManualEntry },
    })[filmId];
  };
}

export function assemble(input: { now: string; root: string; batches: Batch[]; method: Source["method"]; paths: Paths }): { files: Map<string, ShowtimesFile>; log: string[] } {
  const { now, root, batches, method, paths } = input;
  const registry = readJson<{ areas: { slug: string; city: string }[]; cinemas: RegistryCinema[] }>(join(root, "data/cinemas.json"));
  const sourceRegistry = readSources(root);

  const sources: Source[] = batches.map((batch) => {
    const entry = sourceRegistry.find((source) => source.id === batch.sourceId);
    if (!entry) throw new Error(`The source "${batch.sourceId}" is not in data/sources.json`);
    return { id: entry.id, name: entry.name, url: entry.homepage, method, status: entry.status, fetchedAt: batch.fetchedAt, lastOkAt: batch.lastOkAt === undefined ? batch.fetchedAt : batch.lastOkAt, health: batch.health ?? "ok" };
  });
  const cinemas: Cinema[] = registry.cinemas.map((cinema) => ({
    id: cinema.id, name: cinema.name, chain: cinema.chain, area: cinema.area, address: cinema.address ?? null, geo: cinema.geo ?? null,
    website: cinema.website ?? null, bookingHost: cinema.bookingHost ?? null,
    sourceIds: sources.filter((source) => sourceRegistry.find((entry) => entry.id === source.id)?.cinemaIds.includes(cinema.id)).map((source) => source.id),
  }));

  // Chime's film aliases (D-119), when the file is there.
  const aliasPath = join(root, "data/film-aliases.json");
  const aliases = existsSync(aliasPath) ? readJson<{ aliases: Record<string, string> }>(aliasPath).aliases : {};
  const { file, log } = buildShowtimes({ generatedAt: now, sources, cinemas, batches, aliases, creditsFor: creditsLookup(root) });
  const files = new Map<string, ShowtimesFile>([[paths.main, file], ...pageFiles(file, registry.areas, now, paths)]);
  return { files, log };
}
