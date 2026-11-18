// Match the films now showing to TMDB and read their credits keywords, at build time only
// (D-09, D-10). Writes data/credits.json, which `refresh` merges into the data files.
//
//   node scripts/tmdb.ts --dry-run     what would be looked up, and the share already answered; no network
//   node scripts/tmdb.ts               needs TMDB_READ_TOKEN in .env.local or the environment
//
// The token never leaves this script: it is not printed, not written, and never in client code.
// TMDB data may be kept at most 6 months (D-31); an entry older than a week is asked again.
// First run against the live API on 11 Nov 2026: 14 of 31 films matched, each checked by eye.
// Since D-117 it also keeps each film's YouTube trailer, and it looks up the live films as well as the sample ones.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Coming, Film, Showing } from "../src/lib/data/types.ts";
import { lagosDayKey } from "../src/lib/time/lagos.ts";
import { answerShare, mergeCredits, pickComingMatch, pickMatch, pickTrailer, type ManualEntry, type TmdbFilm, type TmdbResult, type TmdbVideo } from "./credits.ts";
import { subtitleHeadIds } from "./pipeline.ts";
import { refreshFromFixtures } from "./refresh.ts";

const API = "https://api.themoviedb.org/3";
const WEEK_MS = 7 * 24 * 3_600_000;
/** Between requests. TMDB states no limit (D-31); this keeps us far from any. */
const GAP_MS = 300;

export type CreditsFile = { schemaVersion: 1; about: string; tmdb: Record<string, TmdbFilm & { tmdbTitle?: string }> };
export type Deps = { root: string; env: Record<string, string | undefined>; fetchFn: typeof fetch; now: string; wait: (ms: number) => Promise<void> };

const readJson = <T>(path: string, fallback: T): T => (existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback);

type DataFile = { films: Film[]; showings?: Showing[]; coming?: Coming[] };

/**
 * The films in the live data (D-116) and in the built (or else sample) data, once each: both need
 * posters and trailers. With them, the first date of each film that is only coming (D-151), which
 * no showing has in either file, for its own match rule.
 */
function filmsShowing(root: string, now: string): { films: Film[]; comingOn: Map<string, string> } {
  const live = readJson<DataFile>(join(root, "data/live/showtimes.json"), { films: [] });
  const onDisk = join(root, "data/showtimes.json");
  const sample = existsSync(onDisk) ? readJson<DataFile>(onDisk, { films: [] }) : (refreshFromFixtures({ now, root }).files.get("data/showtimes.json") as DataFile);
  const byId = new Map<string, Film>();
  for (const film of [...live.films, ...sample.films]) if (!byId.has(film.id)) byId.set(film.id, film);
  // A file with no showings list (an old one) counts every film as showing.
  const showing = new Set([live, sample].flatMap((file) => (file.showings ?? file.films.map((film) => ({ filmId: film.id }))).map((row) => row.filmId)));
  const comingOn = new Map<string, string>();
  for (const entry of [live, sample].flatMap((file) => file.coming ?? [])) {
    if (showing.has(entry.filmId) || entry.firstDay === null) continue;
    const known = comingOn.get(entry.filmId);
    if (known === undefined || entry.firstDay < known) comingOn.set(entry.filmId, entry.firstDay);
  }
  return { films: [...byId.values()], comingOn };
}

/**
 * Where `record` (tmdb-overrides.json or credits.json) keeps a film: under its own id, else under a
 * shorter spelling's id when the film was merged from it (D-119), "agbara-nla" for "Agbara Nla:
 * The Return". Only when no other film showing starts with that spelling, so one Avatar's match
 * never lands on another. Null when it holds nothing for the film.
 */
function keyFor(film: Film, films: Film[], record: Record<string, unknown>): string | null {
  if (Object.hasOwn(record, film.id)) return film.id;
  for (const head of subtitleHeadIds(film.title)) {
    if (!Object.hasOwn(record, head) || films.some((other) => other.id === head)) continue;
    if (films.filter((other) => subtitleHeadIds(other.title).includes(head)).length === 1) return head;
  }
  return null;
}

async function ask<T>(path: string, deps: Deps, token: string): Promise<T> {
  // TMDB gives two credentials: the long read token goes in a header, the short 32-character
  // API key goes in the address. Either works; the address is never printed.
  const isShortKey = /^[0-9a-f]{32}$/i.test(token);
  const url = isShortKey ? `${API}${path}${path.includes("?") ? "&" : "?"}api_key=${token}` : `${API}${path}`;
  const response = await deps.fetchFn(url, { headers: { Accept: "application/json", ...(isShortKey ? {} : { Authorization: `Bearer ${token}` }) } });
  if (!response.ok) throw new Error(`TMDB answered ${response.status} for ${path.split("?")[0]}`);
  await deps.wait(GAP_MS);
  return (await response.json()) as T;
}

/** Runs the command line; returns the exit code. */
export async function main(argv: string[], deps: Deps): Promise<number> {
  const { root, now } = deps;
  const dryRun = argv.includes("--dry-run");
  const { films, comingOn } = filmsShowing(root, now);
  const overrides = readJson<{ films: Record<string, number | null> }>(join(root, "data/tmdb-overrides.json"), { films: {} }).films;
  const manual = readJson<{ films: Record<string, ManualEntry> }>(join(root, "data/credits-manual.json"), { films: {} }).films;
  const cachePath = join(root, "data/credits.json");
  const cache = readJson<CreditsFile | null>(cachePath, null)?.tmdb ?? {};
  // An answer saved before posters or trailers were kept lacks that field: ask again.
  // A film's saved answer and match by hand, under its id or a merged spelling's (D-119).
  const savedFor = (film: Film) => {
    const key = keyFor(film, films, cache);
    return key === null ? undefined : (cache[key] as TmdbFilm);
  };
  const byHandFor = (film: Film) => {
    const key = keyFor(film, films, overrides);
    return key === null ? undefined : overrides[key];
  };
  const fresh = (film: Film) => {
    const saved = savedFor(film);
    return saved !== undefined && saved.posterPath !== undefined && saved.trailerKey !== undefined && Date.parse(now) - Date.parse(saved.checkedAt) < WEEK_MS;
  };
  const report = (tmdb: Record<string, TmdbFilm>) => console.log(`tmdb: ${answerShare(mergeCredits({ filmIds: films.map((film) => film.id), tmdb, manual })).text}`);

  const noMatch = films.filter((film) => byHandFor(film) === null);
  const toAsk = films.filter((film) => !noMatch.includes(film) && !fresh(film));
  console.log(`tmdb: ${films.length} films showing; ${films.length - toAsk.length - noMatch.length} answered in the last week, ${noMatch.length} marked "no match" by hand, ${toAsk.length} to look up.`);

  if (dryRun) {
    for (const film of toAsk) console.log(`tmdb: would look up "${film.title}"${typeof byHandFor(film) === "number" ? ` as TMDB ${byHandFor(film)} (by hand)` : ""}`);
    report(cache);
    console.log(`tmdb: dry run. Nothing was asked of TMDB and nothing was written. Token ${deps.env.TMDB_READ_TOKEN ? "is" : "is not"} set.`);
    return 0;
  }

  // Trimmed: a pasted secret often ends in a line break, which would hide a short key from `ask`.
  const token = deps.env.TMDB_READ_TOKEN?.trim();
  if (!token) {
    console.error("tmdb: TMDB_READ_TOKEN is not set. Put the free read token or API key in .env.local (see .env.example). Nothing was asked or written.");
    return 1;
  }

  const tmdb: CreditsFile["tmdb"] = {};
  for (const film of films) if (fresh(film) && !noMatch.includes(film)) tmdb[film.id] = savedFor(film) as TmdbFilm;
  for (const film of toAsk) {
    const byHand = byHandFor(film);
    let tmdbId = typeof byHand === "number" ? byHand : null;
    if (tmdbId === null) {
      const found = await ask<{ results: TmdbResult[] }>(`/search/movie?query=${encodeURIComponent(film.title)}&include_adult=false`, deps, token);
      // A film only coming is matched against the sinima's first date (D-151); one with no date, or showing, against today.
      const firstDay = comingOn.get(film.id);
      tmdbId = firstDay ? pickComingMatch(film.title, found.results ?? [], firstDay) : pickMatch(film.title, found.results ?? [], lagosDayKey(now));
    }
    if (tmdbId === null) {
      console.log(`tmdb: no sure match for "${film.title}"; it stays "not known yet"`);
      continue;
    }
    const details = await ask<{ title?: string; runtime?: number | null; poster_path?: string | null; keywords?: { keywords?: { id: number }[] }; videos?: { results?: TmdbVideo[] } }>(`/movie/${tmdbId}?append_to_response=keywords,videos`, deps, token);
    tmdb[film.id] = {
      tmdbId,
      tmdbTitle: details.title,
      runtimeMin: typeof details.runtime === "number" && details.runtime > 0 ? details.runtime : null,
      posterPath: typeof details.poster_path === "string" ? details.poster_path : null,
      trailerKey: pickTrailer(details.videos?.results ?? []),
      keywordIds: (details.keywords?.keywords ?? []).map((keyword) => keyword.id),
      checkedAt: now,
    };
    console.log(`tmdb: "${film.title}" is TMDB ${tmdbId} "${details.title ?? "?"}"${typeof byHand === "number" ? " (by hand)" : ""}`);
  }

  const file: CreditsFile = {
    schemaVersion: 1,
    about: "Written by scripts/tmdb.ts. TMDB ids, runtimes and keyword ids for the films showing, keyed by film id. Kept at most 6 months (D-31). This product uses the TMDB API but is not endorsed or certified by TMDB.",
    tmdb,
  };
  writeFileSync(cachePath, `${JSON.stringify(file, null, 2)}\n`);
  report(tmdb);
  console.log(`tmdb: wrote data/credits.json (${Object.keys(tmdb).length} of ${films.length} films matched). Check each match above by eye; fix a wrong one in data/tmdb-overrides.json.`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  if (existsSync(join(root, ".env.local"))) process.loadEnvFile(join(root, ".env.local"));
  const deps: Deps = {
    root,
    env: process.env,
    fetchFn: fetch,
    now: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
  process.exit(await main(process.argv.slice(2), deps));
}
