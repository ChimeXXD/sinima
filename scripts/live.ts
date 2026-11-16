// Live data (D-116): every cleared source that has a reader, read now, into data/live/. The
// scheduled job commits that folder; the build copies it to where pages read their data, and
// falls back to sample data when there is none. A source that can't be read keeps its last good
// showings from the previous run, marked as failing and dated when they were read (D-119), so one
// site down does not empty the others. Only when every source fails is nothing written.
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ShowtimesFile } from "../src/lib/data/types.ts";
import { lagosDayKey, lagosLocalToUtc, toLagos, utcMs, utcString } from "../src/lib/time/lagos.ts";
import { validateShowtimes } from "../src/lib/data/validate.ts";
import { assemble, creditsLookup, readJson, readSources, SAMPLE_PATHS, type Paths } from "./assemble.ts";
import { splitByArea, type Batch } from "./pipeline.ts";
import type { RenderText } from "./sources/browser.ts";
import { parseLagocineDay } from "./sources/lagocine.ts";
import type { FetchText } from "./sources/polite.ts";
import type { ParsedPage } from "./sources/raw.ts";

export const LIVE_DIR = "data/live";
const LIVE_PATHS: Paths = { main: `${LIVE_DIR}/showtimes.json`, part: (slug) => (slug === "all" ? `${LIVE_DIR}/all.json` : `${LIVE_DIR}/area/${slug}.json`) };
const DAY = 86_400_000;

/** One source's read: plain pages through `fetchText`, pages built by script through `renderText`. */
export type Reader = (input: { now: string; days: number; fetchText: FetchText; renderText: RenderText }) => Promise<ParsedPage[]>;

/** The sources we can read live. A cleared source with no reader here is not read yet. */
export const READERS: Record<string, Reader> = {
  // One day page holds every showing in Lagos that day.
  lagocine: async ({ now, days, fetchText }) => {
    const pages: ParsedPage[] = [];
    for (let day = 0; day < days; day += 1) pages.push(parseLagocineDay(await fetchText(`https://lagocine.com/day/${lagosDayKey(utcString(utcMs(now) + day * DAY))}/`)));
    return pages;
  },
};

/** Listings that compile other sites: their rows say which site they read (DATA §Freshness). */
const COMPILES_OTHERS = new Set(["lagocine"]);

/** A run with no browser (tests, or no reader that needs one) refuses a page built by script. */
const noBrowser: RenderText = async (url) => {
  throw new Error(`${url} needs a browser, and this run has none.`);
};

/** The last live file written, or null when there is none or it can't be read. */
function previousLive(root: string): ShowtimesFile | null {
  try {
    const path = join(root, LIVE_PATHS.main);
    return existsSync(path) ? readJson<ShowtimesFile>(path) : null;
  } catch {
    return null;
  }
}

/**
 * A source's showings from the previous run, as a batch again: only the cinemas it still feeds,
 * only from today on in Lagos, dated when they were really read, the source marked failing. Null
 * when nothing is left to keep.
 */
function keptBatch(previous: ShowtimesFile | null, sourceId: string, given: Set<string>, now: string): Batch | null {
  if (!previous) return null;
  const today = toLagos(now);
  const dayStart = lagosLocalToUtc({ year: today.year, month: today.month, day: today.day, hour: 0, minute: 0 });
  const rows = previous.showings.filter((row) => row.sourceId === sourceId && given.has(row.cinemaId) && row.startsAt >= dayStart);
  if (rows.length === 0) return null;
  const entry = previous.sources.find((source) => source.id === sourceId);
  const fetchedAt = entry?.fetchedAt ?? (rows.map((row) => row.fetchedAt).sort().at(-1) as string);
  const films = new Map(previous.films.map((film) => [film.id, film]));
  return {
    sourceId, fetchedAt, builtAt: rows.find((row) => row.via)?.via?.fetchedAt ?? null, through: COMPILES_OTHERS.has(sourceId),
    health: "failing", lastOkAt: entry ? entry.lastOkAt : fetchedAt,
    showings: rows.map((row) => ({
      cinemaId: row.cinemaId, filmTitle: films.get(row.filmId)?.title ?? row.filmId, rating: films.get(row.filmId)?.rating ?? null,
      startsAt: row.startsAt, format: row.format, bookingUrl: row.bookingUrl,
    })),
  };
}

export async function refreshLive(input: {
  now: string;
  root: string;
  fetchText: FetchText;
  /** The run's headless browser, for readers of pages built by script. */
  renderText?: RenderText;
  /** The readers to run; tests give their own. */
  readers?: Record<string, Reader>;
}): Promise<{ files: Map<string, ShowtimesFile>; log: string[] }> {
  const { now, root, fetchText, renderText = noBrowser, readers = READERS } = input;
  const log: string[] = [];
  const batches: Batch[] = [];
  const failures: string[] = [];
  let read = 0;
  let previous: ShowtimesFile | null | undefined;
  for (const source of readSources(root)) {
    const reader = readers[source.id];
    if (source.status !== "cleared" || !reader) continue;
    // A compiled listing also lists cinemas we read elsewhere; it only feeds the ones it is given.
    const given = new Set(source.cinemaIds);
    let pages: ParsedPage[];
    try {
      pages = await reader({ now, days: source.daysAhead ?? 2, fetchText, renderText });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      previous ??= previousLive(root);
      const kept = keptBatch(previous, source.id, given, now);
      if (kept) batches.push(kept);
      log.push(`${source.id}: could not be read (${message}); ${kept ? `kept its last good showings from ${kept.fetchedAt}` : "no earlier showings to keep"}`);
      continue;
    }
    read += 1;
    const rows = pages.flatMap((page) => page.showings);
    const kept = rows.filter((row) => given.has(row.cinemaId));
    if (kept.length < rows.length) log.push(`${source.id}: left out ${rows.length - kept.length} showings at cinemas it does not feed`);
    batches.push({ sourceId: source.id, fetchedAt: now, builtAt: pages.map((page) => page.builtAt).find((stamp) => stamp !== null) ?? null, through: COMPILES_OTHERS.has(source.id), showings: kept });
  }
  // Every source failing is a problem with the run (or the network), not with one site.
  if (read === 0 && failures.length > 0) throw new Error(`No source could be read: ${failures.join("; ")}.`);
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
  // Today's credits.json on each film: a poster or trailer found since the read shows at once (D-117).
  const creditsFor = creditsLookup(root);
  const read = readJson<ShowtimesFile>(mainPath);
  const checked = validateShowtimes({ ...read, films: read.films.map((film) => ({ ...film, ...creditsFor(film.id) })) });
  if (!checked.ok) throw new Error(`data/live/showtimes.json with today's credits was refused:\n${checked.errors.join("\n")}`);
  const file = checked.file;
  const areaSlugs = readJson<{ areas: { slug: string }[] }>(join(root, "data/cinemas.json")).areas.map((area) => area.slug);
  const files = new Map<string, ShowtimesFile>([[SAMPLE_PATHS.main, file]]);
  for (const [slug, part] of splitByArea(file, areaSlugs, now)) files.set(SAMPLE_PATHS.part(slug), part);
  return files;
}
