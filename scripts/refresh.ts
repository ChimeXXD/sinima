// Refresh showtimes: read sources -> normalise -> validate -> write data/showtimes.json and the
// per-area files (SPEC §4, DATA §Per-area files).
//
//   node scripts/refresh.ts --fixtures [--now 2026-11-20T18:00:00Z]   sample data from tests/fixtures/ (D-20)
//   node scripts/refresh.ts --live                                     the cleared sources, read now, into data/live/ (D-116)
//   node scripts/refresh.ts --build                                    before a build: data/live/ if it is there, else sample data
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { CITIES } from "../src/lib/city.ts";
import type { ShowtimesFile } from "../src/lib/data/types.ts";
import { lagosDayKey, toLagos } from "../src/lib/time/lagos.ts";
import { assemble, readJson, readSources, SAMPLE_PATHS } from "./assemble.ts";
import { LIVE_DIR, liveBuildFiles, refreshLive } from "./live.ts";
import { toSampleDays, type Batch } from "./pipeline.ts";
import { parseFilmhouseHome } from "./sources/filmhouse.ts";
import { parseLagocineCinema, parseLagocineDay } from "./sources/lagocine.ts";
import { parseVeeziSessions } from "./sources/veezi.ts";
import { politeBrowser } from "./sources/browser.ts";
import { politeFetcher, politeRules } from "./sources/polite.ts";
import type { ParsedPage } from "./sources/raw.ts";

/**
 * The most one public data file may weigh, gzipped. A page's HTML, CSS, JS, font and data share
 * 200 KB (D-28), and the empty app already takes 162, so data gets what is left after the page's
 * own markup. All of Lagos for two days (588 sample showings, no booking links) measured 10.3 KB on
 * 11 Nov 2026 (D-45); live rows carry booking links and will weigh more.
 */
export const DATA_FILE_LIMIT_KB = 20;

type FixtureEntry = {
  file: string; sourceId: string; page: string; cinemaId?: string; savedAt: string; sample: boolean;
  /** Cinemas whose rows on this page the sample leaves out, with the reason in the entry's `why` (D-131). */
  leaveOut?: string[];
};

/** Our bot's name and contact page, on every request (D-77). */
const USER_AGENT = "SinimaBot/0.1 (+https://github.com/ChimeXXD/sinima)";

function parseFixture(entry: FixtureEntry, html: string): ParsedPage {
  if (entry.page === "lagocine-day") return parseLagocineDay(html);
  // The films featured on the day the page was saved (D-131).
  if (entry.page === "filmhouse-home") return parseFilmhouseHome(html, { now: entry.savedAt });
  if (entry.page === "lagocine-cinema" && entry.cinemaId) return parseLagocineCinema(html, entry.cinemaId);
  // Veezi's dates carry no year: the page was read on the Lagos day it was saved (Abuja's clock too).
  if (entry.page === "veezi-sessions" && entry.cinemaId) {
    const { year, month, day } = toLagos(entry.savedAt);
    return parseVeeziSessions(html, { cinemaId: entry.cinemaId, readOn: { year, month, day } });
  }
  throw new Error(`No sample-data parser for the fixture ${entry.file} (page "${entry.page}")`);
}

/** Sample data from the saved fixtures, as the files to write (path under the repo root -> file). */
export function refreshFromFixtures(options: { now: string; root: string }): { files: Map<string, ShowtimesFile>; log: string[] } {
  const { now, root } = options;
  const entries = readJson<{ fixtures: FixtureEntry[] }>(join(root, "tests/fixtures/index.json")).fixtures.filter((entry) => entry.sample);
  const registry = readSources(root);

  // One batch per source: its pages were saved in one sitting, and a cinema's tomorrow may be on
  // a different page from its today.
  const batches: Batch[] = [];
  for (const sourceId of new Set(entries.map((entry) => entry.sourceId))) {
    const pages = entries.filter((entry) => entry.sourceId === sourceId);
    const parsed = pages.map((entry) => {
      const page = parseFixture(entry, readFileSync(join(root, "tests/fixtures", entry.file), "utf8"));
      const leaveOut = new Set(entry.leaveOut ?? []);
      return { ...page, showings: page.showings.filter((row) => !leaveOut.has(row.cinemaId)) };
    });
    const savedAt = pages.map((entry) => entry.savedAt).sort().at(-1) as string;
    // Featured films (D-131) move from the day the page was saved onto today, as showings do (D-20).
    const list = parsed.find((page) => page.featured)?.featured;
    const featuredFor = registry.find((source) => source.id === sourceId)?.featuredFor ?? [];
    batches.push({
      sourceId,
      fetchedAt: savedAt,
      builtAt: parsed.map((page) => page.builtAt).find((stamp) => stamp !== null) ?? null,
      through: sourceId === "lagocine",
      showings: toSampleDays(parsed.flatMap((page) => page.showings), lagosDayKey(savedAt), now),
      ...(list && featuredFor.length > 0 ? { featured: { cinemaIds: featuredFor, day: lagosDayKey(now), titles: list.films.map((film) => film.title) } } : {}),
    });
  }
  return assemble({ now, root, batches, method: "fixture", paths: SAMPLE_PATHS });
}

const UTC_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const gzipKb = (text: string) => gzipSync(text, { level: 9 }).length / 1024;
/**
 * The files pages are built from, each held to the budget (D-126): each city's (lagos.json,
 * abuja.json) and each area's. Not all.json: it holds both cities and is read only at build time
 * (About's counts and the search index, which is its own file); no page loads it, and no browser
 * code fetches it. Not showtimes.json: the whole set, kept readable for diffs.
 */
export const pageLoads = (path: string) => !path.endsWith("showtimes.json") && !path.endsWith("/all.json");
/** Each file's gzipped size as written, in KB. */
const sizes = (files: Map<string, ShowtimesFile>) => new Map([...files].map(([path, file]) => [path, gzipKb(serialise(path, file))]));
const overIn = (sized: Map<string, number>) => [...sized].filter(([path, size]) => pageLoads(path) && size > DATA_FILE_LIMIT_KB).map(([path]) => path);
/** The page files over the budget, by path. */
export const overBudget = (files: Map<string, ShowtimesFile>) => overIn(sizes(files));
/** Compact for files in public/ and data/live/; showtimes.json pretty, for diffs. */
const serialise = (path: string, file: ShowtimesFile) => (path.endsWith("showtimes.json") ? `${JSON.stringify(file, null, 2)}\n` : JSON.stringify(file));
const withoutStamp = (file: ShowtimesFile) => JSON.stringify({ ...file, generatedAt: null });

const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;

/**
 * Writes each file under `root`, skipping one whose content is the same apart from generatedAt.
 * Then removes the later-day files (D-147) beside each city file written this run that are no
 * longer among the days ahead, so the folder holds only the days a page can ask for.
 */
export function writeFiles(files: Map<string, ShowtimesFile>, root: string): { written: string[]; unchanged: number; removed: string[] } {
  const written: string[] = [];
  const removed: string[] = [];
  for (const [path, file] of files) {
    const target = join(root, path);
    if (existsSync(target)) {
      let same = false;
      try {
        same = withoutStamp(readJson<ShowtimesFile>(target)) === withoutStamp(file);
      } catch {
        // An unreadable file on disk is simply replaced.
      }
      if (same) continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, serialise(path, file));
    written.push(path);
  }
  for (const path of files.keys()) {
    if (!CITIES.some((city) => path.endsWith(`/${city}.json`))) continue;
    const folder = path.slice(0, -".json".length);
    if (!existsSync(join(root, folder))) continue;
    for (const name of readdirSync(join(root, folder))) {
      if (!DAY_FILE.test(name) || files.has(`${folder}/${name}`)) continue;
      unlinkSync(join(root, folder, name));
      removed.push(`${folder}/${name}`);
    }
  }
  return { written, unchanged: files.size - written.length, removed };
}

/** Checks each file a page loads against the budget, then writes them all; returns the exit code. */
function writeChecked(files: Map<string, ShowtimesFile>, log: string[], root: string, what: string): number {
  for (const line of log) {
    console.log(`refresh: ${line}`);
    // A source that failed keeps its old rows and the run still succeeds (D-119), so on GitHub it
    // is raised as a warning on the run, where it shows instead of passing unseen.
    if (process.env.GITHUB_ACTIONS === "true" && line.includes(": could not be read (")) console.log(`::warning title=A source could not be read::${line}`);
  }
  const sized = sizes(files);
  const over = new Set(overIn(sized));
  for (const [path, file] of files) {
    const size = sized.get(path) as number;
    const note = over.has(path) ? ` (over the ${DATA_FILE_LIMIT_KB} KB limit)` : pageLoads(path) ? "" : " (not loaded by a page, so not held to the budget)";
    console.log(`refresh: ${path}: ${file.showings.length} showings, ${file.films.length} films, ${size.toFixed(1)} KB gzipped${note}`);
  }
  if (over.size > 0) {
    console.error("refresh: a data file is over the budget (D-21). Nothing was written.");
    return 1;
  }
  const { written, unchanged, removed } = writeFiles(files, root);
  console.log(`refresh: ${what}. Wrote ${written.length} files, ${unchanged} unchanged, ${removed.length} past days removed.`);
  return 0;
}

/** Runs the command line; returns the exit code (a promise for --live, which reads the web). */
export function main(argv: string[]): number | Promise<number> {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  if (argv.includes("--live")) {
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    // One set of rules for both readers, so the 5 s gap to a host holds whichever one asks.
    const rules = politeRules({ userAgent: process.env.FETCH_USER_AGENT || USER_AGENT, minGapMs: 5000 });
    // The browser starts only if a reader needs it, and is always closed (memory is tight).
    const renderText = politeBrowser({ rules });
    return refreshLive({ now, root, fetchText: politeFetcher({ rules }), renderText })
      .then(
        ({ files, log }) => writeChecked(files, log, root, `live data read at ${now}`),
        (error: unknown) => {
          console.error(`refresh --live: ${error instanceof Error ? error.message : String(error)} Nothing was written; the last good data stays.`);
          return 1;
        },
      )
      // A browser that won't close must not fail a run whose data is already written.
      .finally(() => renderText.close().catch((error: unknown) => console.error(`refresh --live: the browser did not close cleanly (${error instanceof Error ? error.message : String(error)}).`)));
  }
  if (!argv.includes("--fixtures") && !argv.includes("--build")) {
    console.error("refresh: say --fixtures (sample data), --live (read the cleared sources) or --build (live data if it is there, else sample). Nothing was read or written.");
    return 1;
  }
  const nowFlag = argv.indexOf("--now");
  const now = nowFlag >= 0 ? (argv[nowFlag + 1] ?? "") : new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  if (!UTC_SECONDS.test(now) || Number.isNaN(Date.parse(now))) {
    console.error(`refresh: --now needs a UTC time like 2026-11-20T18:00:00Z, got "${now}". Nothing was read or written.`);
    return 1;
  }
  const live = argv.includes("--build") ? liveBuildFiles(root, now) : null;
  if (live) return writeChecked(live, [], root, `the live data in ${LIVE_DIR}/, read at ${live.get(SAMPLE_PATHS.main)?.generatedAt}`);
  const { files, log } = refreshFromFixtures({ now, root });
  return writeChecked(files, log, root, `sample data for ${lagosDayKey(now)} and the next four days (Lagos)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(await main(process.argv.slice(2)));
