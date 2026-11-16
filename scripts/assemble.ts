// The step sample and live data share: the sources' batches, with the cinema registry and the
// credits, built into the validated showtimes file and its per-area files (SPEC §4, D-18).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Cinema, ShowtimesFile, Source } from "../src/lib/data/types.ts";
import { mergeCredits, type FilmCredits, type ManualEntry, type TmdbFilm } from "./credits.ts";
import { buildShowtimes, splitByArea, type Batch } from "./pipeline.ts";

export type RegistryCinema = Omit<Cinema, "sourceIds"> & Record<string, unknown>;
export type RegistrySource = { id: string; name: string; homepage: string; status: Source["status"]; cinemaIds: string[]; daysAhead?: number };

export const readJson = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
export const readSources = (root: string) => readJson<{ sources: RegistrySource[] }>(join(root, "data/sources.json")).sources;

/** Where each file goes: the whole file, then "all" and each area slug. */
export type Paths = { main: string; part: (slug: string) => string };
export const SAMPLE_PATHS: Paths = { main: "data/showtimes.json", part: (slug) => (slug === "all" ? "public/data/all.json" : `public/data/area/${slug}.json`) };

/** What scripts/tmdb.ts last wrote (if it has run) for a film, with Chime's own entries on top (D-19). */
export function creditsLookup(root: string): (filmId: string) => FilmCredits | undefined {
  const creditsPath = join(root, "data/credits.json");
  const tmdb = existsSync(creditsPath) ? readJson<{ tmdb: Record<string, TmdbFilm> }>(creditsPath).tmdb : {};
  const manualPath = join(root, "data/credits-manual.json");
  const manual = existsSync(manualPath) ? readJson<{ films: Record<string, ManualEntry> }>(manualPath).films : {};
  return (filmId) => mergeCredits({ filmIds: [filmId], tmdb, manual })[filmId];
}

export function assemble(input: { now: string; root: string; batches: Batch[]; method: Source["method"]; paths: Paths }): { files: Map<string, ShowtimesFile>; log: string[] } {
  const { now, root, batches, method, paths } = input;
  const registry = readJson<{ areas: { slug: string }[]; cinemas: RegistryCinema[] }>(join(root, "data/cinemas.json"));
  const sourceRegistry = readSources(root);

  const sources: Source[] = batches.map((batch) => {
    const entry = sourceRegistry.find((source) => source.id === batch.sourceId);
    if (!entry) throw new Error(`The source "${batch.sourceId}" is not in data/sources.json`);
    return { id: entry.id, name: entry.name, url: entry.homepage, method, status: entry.status, fetchedAt: batch.fetchedAt, lastOkAt: batch.fetchedAt, health: "ok" };
  });
  const cinemas: Cinema[] = registry.cinemas.map((cinema) => ({
    id: cinema.id, name: cinema.name, chain: cinema.chain, area: cinema.area, address: cinema.address ?? null, geo: cinema.geo ?? null,
    website: cinema.website ?? null, bookingHost: cinema.bookingHost ?? null,
    sourceIds: sources.filter((source) => sourceRegistry.find((entry) => entry.id === source.id)?.cinemaIds.includes(cinema.id)).map((source) => source.id),
  }));

  const { file, log } = buildShowtimes({ generatedAt: now, sources, cinemas, batches, creditsFor: creditsLookup(root) });
  const files = new Map<string, ShowtimesFile>([[paths.main, file]]);
  for (const [slug, part] of splitByArea(file, registry.areas.map((area) => area.slug), now)) files.set(paths.part(slug), part);
  return { files, log };
}
