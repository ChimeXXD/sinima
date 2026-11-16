// Refresh showtimes: read sources -> normalise -> validate -> write data/showtimes.json and the
// per-area files (SPEC §4, DATA §Per-area files).
//
//   node scripts/refresh.ts --fixtures [--now 2026-11-20T18:00:00Z]   sample data from tests/fixtures/ (D-20)
//   node scripts/refresh.ts --live                                     the cleared sources, read now, into data/live/ (D-116)
//   node scripts/refresh.ts --build                                    before a build: data/live/ if it is there, else sample data
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import type { ShowtimesFile } from "../src/lib/data/types.ts";
import { lagosDayKey } from "../src/lib/time/lagos.ts";
import { assemble, readJson, SAMPLE_PATHS } from "./assemble.ts";
import { LIVE_DIR, liveBuildFiles, refreshLive } from "./live.ts";
import { toSampleDays, type Batch } from "./pipeline.ts";
import { parseLagocineCinema, parseLagocineDay } from "./sources/lagocine.ts";
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

type FixtureEntry = { file: string; sourceId: string; page: string; cinemaId?: string; savedAt: string; sample: boolean };

/** Our bot's name and contact page, on every request (D-77). */
const USER_AGENT = "SinimaBot/0.1 (+https://github.com/ChimeXXD/sinima)";

function parseFixture(entry: FixtureEntry, html: string): ParsedPage {
  if (entry.page === "lagocine-day") return parseLagocineDay(html);
  if (entry.page === "lagocine-cinema" && entry.cinemaId) return parseLagocineCinema(html, entry.cinemaId);
  throw new Error(`No sample-data parser for the fixture ${entry.file} (page "${entry.page}")`);
}

/** Sample data from the saved fixtures, as the files to write (path under the repo root -> file). */
export function refreshFromFixtures(options: { now: string; root: string }): { files: Map<string, ShowtimesFile>; log: string[] } {
  const { now, root } = options;
  const entries = readJson<{ fixtures: FixtureEntry[] }>(join(root, "tests/fixtures/index.json")).fixtures.filter((entry) => entry.sample);

  // One batch per source: its pages were saved in one sitting, and a cinema's tomorrow may be on
  // a different page from its today.
  const batches: Batch[] = [];
  for (const sourceId of new Set(entries.map((entry) => entry.sourceId))) {
    const pages = entries.filter((entry) => entry.sourceId === sourceId);
    const parsed = pages.map((entry) => parseFixture(entry, readFileSync(join(root, "tests/fixtures", entry.file), "utf8")));
    const savedAt = pages.map((entry) => entry.savedAt).sort().at(-1) as string;
    batches.push({
      sourceId,
      fetchedAt: savedAt,
      builtAt: parsed.map((page) => page.builtAt).find((stamp) => stamp !== null) ?? null,
      through: sourceId === "lagocine",
      showings: toSampleDays(parsed.flatMap((page) => page.showings), lagosDayKey(savedAt), now),
    });
  }
  return assemble({ now, root, batches, method: "fixture", paths: SAMPLE_PATHS });
}

const UTC_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const gzipKb = (text: string) => gzipSync(text, { level: 9 }).length / 1024;
/** The files a page loads (all.json and each area's), compact and under the budget; showtimes.json is the whole set, kept readable for diffs. */
const pageLoads = (path: string) => !path.endsWith("showtimes.json");
const serialise = (path: string, file: ShowtimesFile) => (pageLoads(path) ? JSON.stringify(file) : `${JSON.stringify(file, null, 2)}\n`);
const withoutStamp = (file: ShowtimesFile) => JSON.stringify({ ...file, generatedAt: null });

/** Writes each file under `root`, skipping one whose content is the same apart from generatedAt. */
export function writeFiles(files: Map<string, ShowtimesFile>, root: string): { written: string[]; unchanged: number } {
  const written: string[] = [];
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
  return { written, unchanged: files.size - written.length };
}

/** Checks each file a page loads against the budget, then writes them all; returns the exit code. */
function writeChecked(files: Map<string, ShowtimesFile>, log: string[], root: string, what: string): number {
  for (const line of log) {
    console.log(`refresh: ${line}`);
    // A source that failed keeps its old rows and the run still succeeds (D-119), so on GitHub it
    // is raised as a warning on the run, where it shows instead of passing unseen.
    if (process.env.GITHUB_ACTIONS === "true" && line.includes(": could not be read (")) console.log(`::warning title=A source could not be read::${line}`);
  }
  let overBudget = false;
  for (const [path, file] of files) {
    const size = gzipKb(serialise(path, file));
    const over = pageLoads(path) && size > DATA_FILE_LIMIT_KB;
    if (over) overBudget = true;
    console.log(`refresh: ${path}: ${file.showings.length} showings, ${file.films.length} films, ${size.toFixed(1)} KB gzipped${over ? ` (over the ${DATA_FILE_LIMIT_KB} KB limit)` : ""}`);
  }
  if (overBudget) {
    console.error("refresh: a data file is over the budget (D-21). Nothing was written.");
    return 1;
  }
  const { written, unchanged } = writeFiles(files, root);
  console.log(`refresh: ${what}. Wrote ${written.length} files, ${unchanged} unchanged.`);
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
  return writeChecked(files, log, root, `sample data for ${lagosDayKey(now)} and the day after (Lagos)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(await main(process.argv.slice(2)));
