// Live data (D-116): every cleared source that has a reader, read now, into data/live/. The
// scheduled job commits that folder; the build copies it to where pages read their data, and
// falls back to sample data when there is none. Any source that can't be read fails the whole run,
// so nothing is written and the last good data stays up.
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ShowtimesFile } from "../src/lib/data/types.ts";
import { lagosDayKey, utcMs, utcString } from "../src/lib/time/lagos.ts";
import { assemble, readJson, readSources, SAMPLE_PATHS, type Paths } from "./assemble.ts";
import { splitByArea, type Batch } from "./pipeline.ts";
import { parseLagocineDay } from "./sources/lagocine.ts";
import type { FetchText } from "./sources/polite.ts";
import type { ParsedPage } from "./sources/raw.ts";

export const LIVE_DIR = "data/live";
const LIVE_PATHS: Paths = { main: `${LIVE_DIR}/showtimes.json`, part: (slug) => (slug === "all" ? `${LIVE_DIR}/all.json` : `${LIVE_DIR}/area/${slug}.json`) };
const DAY = 86_400_000;

type Reader = (input: { now: string; days: number; fetchText: FetchText }) => Promise<ParsedPage[]>;

/** The sources we can read live. A cleared source with no reader here is not read yet. */
const READERS: Record<string, Reader> = {
  // One day page holds every showing in Lagos that day.
  lagocine: async ({ now, days, fetchText }) => {
    const pages: ParsedPage[] = [];
    for (let day = 0; day < days; day += 1) pages.push(parseLagocineDay(await fetchText(`https://lagocine.com/day/${lagosDayKey(utcString(utcMs(now) + day * DAY))}/`)));
    return pages;
  },
};

/** Listings that compile other sites: their rows say which site they read (DATA §Freshness). */
const COMPILES_OTHERS = new Set(["lagocine"]);

export async function refreshLive(input: { now: string; root: string; fetchText: FetchText }): Promise<{ files: Map<string, ShowtimesFile>; log: string[] }> {
  const { now, root, fetchText } = input;
  const log: string[] = [];
  const batches: Batch[] = [];
  for (const source of readSources(root)) {
    const reader = READERS[source.id];
    if (source.status !== "cleared" || !reader) continue;
    const pages = await reader({ now, days: source.daysAhead ?? 2, fetchText });
    // A compiled listing also lists cinemas we read elsewhere; it only feeds the ones it is given.
    const given = new Set(source.cinemaIds);
    const rows = pages.flatMap((page) => page.showings);
    const kept = rows.filter((row) => given.has(row.cinemaId));
    if (kept.length < rows.length) log.push(`${source.id}: left out ${rows.length - kept.length} showings at cinemas it does not feed`);
    batches.push({ sourceId: source.id, fetchedAt: now, builtAt: pages.map((page) => page.builtAt).find((stamp) => stamp !== null) ?? null, through: COMPILES_OTHERS.has(source.id), showings: kept });
  }
  if (!batches.some((batch) => batch.showings.length > 0)) throw new Error("No showings were read from any source.");
  const built = assemble({ now, root, batches, method: "public-page", paths: LIVE_PATHS });
  return { files: built.files, log: [...log, ...built.log] };
}

/**
 * The build step: the committed live set as the files pages read, or null when there is none and
 * the caller makes sample data instead. The page files are split again here against today's
 * data/cinemas.json, so an area added since the last live run gets its file and the build does
 * not fail on a missing one.
 */
export function liveBuildFiles(root: string, now: string): Map<string, ShowtimesFile> | null {
  const mainPath = join(root, LIVE_PATHS.main);
  if (!existsSync(mainPath)) return null;
  const file = readJson<ShowtimesFile>(mainPath);
  const areaSlugs = readJson<{ areas: { slug: string }[] }>(join(root, "data/cinemas.json")).areas.map((area) => area.slug);
  const files = new Map<string, ShowtimesFile>([[SAMPLE_PATHS.main, file]]);
  for (const [slug, part] of splitByArea(file, areaSlugs, now)) files.set(SAMPLE_PATHS.part(slug), part);
  return files;
}
