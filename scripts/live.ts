// Live data (D-116): every cleared source that has a reader, read now, into data/live/. The
// scheduled job commits that folder; the build copies it to where pages read their data, and
// falls back to sample data when there is none. A source that can't be read keeps its last good
// showings from the previous run, marked as failing and dated when they were read (D-119), so one
// site down does not empty the others. Only when every source fails is nothing written.
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ShowtimesFile } from "../src/lib/data/types.ts";
import { lagosDayKey, lagosLocalToUtc, toLagos, utcMs, utcString } from "../src/lib/time/lagos.ts";
import { COMPILERS } from "../src/lib/data/about.ts";
import { presaleDays, stillComing } from "../src/lib/data/coming.ts";
import { validateShowtimes } from "../src/lib/data/validate.ts";
import { assemble, creditsLookup, pageFiles, readJson, readSources, SAMPLE_PATHS, type Paths } from "./assemble.ts";
import { DAYS_SHOWN, type Batch } from "./pipeline.ts";
import { readBluePictures } from "./sources/bluepictures.ts";
import type { RenderText } from "./sources/browser.ts";
import { genesisReader, MAX_FILM_PAGES } from "./sources/genesis.ts";
import { readEbonyLife } from "./sources/ebonylife.ts";
import { readChecked } from "./sources/checked.ts";
import { readFilmhouseHome } from "./sources/filmhouse.ts";
import { readGrand } from "./sources/grand.ts";
import { lagocineHasFilms, parseLagocineDay } from "./sources/lagocine.ts";
import { readMagnificent } from "./sources/magnificent.ts";
import { pageMissingOrSlow, type FetchText } from "./sources/polite.ts";
import type { ParsedPage, Reader } from "./sources/raw.ts";
import { readReach } from "./sources/reach.ts";
import { readThc } from "./sources/thc.ts";
import { readVeezi, readVeeziProgramme } from "./sources/veezi.ts";
import { properTitle, titleLookup } from "./titles.ts";

export const LIVE_DIR = "data/live";
const LIVE_PATHS: Paths = {
  main: `${LIVE_DIR}/showtimes.json`,
  part: (slug) => (slug === "all" ? `${LIVE_DIR}/all.json` : `${LIVE_DIR}/area/${slug}.json`),
  city: (city) => `${LIVE_DIR}/${city}.json`,
  day: (city, date) => `${LIVE_DIR}/${city}/${date}.json`,
};
const DAY = 86_400_000;

export type { Reader };

/** How many days each source is asked for, today first (D-142, D-146). */
export const DAYS_AHEAD = DAYS_SHOWN;

/**
 * The sources we can read live. A cleared source with no reader here is not read yet. Each cinema
 * is read from its own site where it can be (D-76, D-122, D-125), and from Lagocine only while it can't.
 * Filmworld's Veezi page (the same reader as Silverbird's) is not read yet: on 17 Nov it said "No
 * shows currently scheduled" while Filmworld's own site, through Lagocine, listed 22 times (D-122).
 */
export const READERS: Record<string, Reader> = {
  // One day page holds every showing in Lagos that day. A later day Lagocine hasn't published yet
  // (404, or a page with no films) ends the read with the days before it; today's page missing or
  // empty, or any refusal, fails it.
  // Then each coming film's first date after those days and the days after it, once: its showings already on sale (D-194, D-199).
  lagocine: async ({ now, days, fetchText, openings = [] }) => {
    const pages: ParsedPage[] = [];
    const lastDay = lagosDayKey(utcString(utcMs(now) + (days - 1) * DAY));
    for (let day = 0; day < days; day += 1) {
      const key = lagosDayKey(utcString(utcMs(now) + day * DAY));
      let html: string | null;
      try {
        html = await fetchText(`https://lagocine.com/day/${key}/`);
      } catch (error) {
        if (day === 0 || !pageMissingOrSlow(error)) throw error;
        html = null;
      }
      if (html === null || (day > 0 && !lagocineHasFilms(html))) {
        pages[pages.length - 1]!.notes = [...(pages[pages.length - 1]!.notes ?? []), `no day page for ${key} yet; read ${day} days`];
        break;
      }
      pages.push(parseLagocineDay(html));
    }
    // Extra pages: each opening day, then the days after it up to PRESALE_DAYS (D-199) while Lagocine has
    // a page for each. One that fails is noted and ends that opening's days, never failing the days read.
    const note = (text: string) => (pages[pages.length - 1]!.notes = [...(pages[pages.length - 1]!.notes ?? []), text]);
    const read = new Set<string>();
    const missing = new Set<string>();
    for (const opening of [...new Set(openings)].filter((date) => date > lastDay).sort()) {
      for (const [offset, key] of presaleDays(opening).entries()) {
        if (missing.has(key)) break;
        if (read.has(key)) continue;
        const what = offset === 0 ? `opening day ${key}` : `${key}, after opening day ${opening},`;
        let html: string | null;
        try {
          html = await fetchText(`https://lagocine.com/day/${key}/`);
        } catch (error) {
          if (!pageMissingOrSlow(error)) {
            // Not asked again for another opening's days this run.
            missing.add(key);
            note(`${what} could not be read (${error instanceof Error ? error.message : String(error)})`);
            break;
          }
          html = null;
        }
        if (html === null || !lagocineHasFilms(html)) {
          missing.add(key);
          if (offset === 0) note(`no page for opening day ${key} yet`);
          break;
        }
        try {
          pages.push(parseLagocineDay(html));
          read.add(key);
        } catch (error) {
          missing.add(key);
          note(`${what} could not be read (${error instanceof Error ? error.message : String(error)})`);
          break;
        }
      }
    }
    return pages;
  },
  // Each cinema's own Veezi sessions page (Lagos and Abuja); the siteToken is in data/sources.json.
  silverbird: readVeezi,
  // Filmworld's own Veezi page (21 Nov 2026: Lagocine had 11:00 for its 11:20); an empty page is a failed read.
  filmworld: readVeeziProgramme,
  // Each location page, then one page per film for tomorrow's times (D-122).
  genesis: genesisReader(MAX_FILM_PAGES),
  grand: readGrand,
  bluepictures: readBluePictures,
  // Script-built pages, read rendered through the run's headless browser (D-125): the Reach Cinema
  // platform (Ozone and Sky; Viva; Nova in Lagos and Abuja), EbonyLife, THC and Magnificent, each
  // day by its own address or by clicking its date tab. Up to five page loads per cinema a run.
  reachcinema: readReach,
  viva: readReach,
  nova: readReach,
  ebonylife: readEbonyLife,
  thc: readThc,
  magnificent: readMagnificent,
  // Filmhouse's home page: the films it features today, no times, for Filmhouse's 7 (D-131).
  "filmhouse-home": readFilmhouseHome,
  // Filmhouse's own times for coming films, checked by hand on its site (D-200): a file in the repo, no network.
  "filmhouse-checked": readChecked,
};

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
 * only from today on in Lagos, dated when they were really read, the source marked failing. Its
 * featured films too (D-131), for the cinemas it still features them for, only while their day
 * lasts, and its coming films (D-151) while their first date is still ahead. Null when nothing is left to keep.
 */
function keptBatch(previous: ShowtimesFile | null, sourceId: string, given: Set<string>, featuredFor: Set<string>, now: string, checked = false): Batch | null {
  if (!previous) return null;
  const today = toLagos(now);
  const dayStart = lagosLocalToUtc({ year: today.year, month: today.month, day: today.day, hour: 0, minute: 0 });
  // Its presales too (D-194): the pipeline sorts them apart again.
  const rows = [...previous.showings, ...(previous.presales ?? [])].filter((row) => row.sourceId === sourceId && given.has(row.cinemaId) && row.startsAt >= dayStart);
  const list = previous.featured?.find((entry) => entry.sourceId === sourceId && entry.day >= lagosDayKey(now) && entry.cinemaIds.some((id) => featuredFor.has(id)));
  const featured = list ? { cinemaIds: list.cinemaIds.filter((id) => featuredFor.has(id)), day: list.day, titles: list.films.map((film) => film.title) } : undefined;
  const films = new Map(previous.films.map((film) => [film.id, film]));
  const ahead = (previous.coming ?? []).filter((item) => item.sourceId === sourceId && stillComing(item, lagosDayKey(now)) && item.cinemaIds.some((id) => featuredFor.has(id)));
  const coming = ahead.length > 0
    ? { cinemaIds: ahead[0]!.cinemaIds.filter((id) => featuredFor.has(id)), films: ahead.map((item) => ({ title: films.get(item.filmId)?.title ?? item.filmId, firstDay: item.firstDay, rating: films.get(item.filmId)?.rating ?? null })) }
    : undefined;
  if (rows.length === 0 && !featured && !coming) return null;
  const entry = previous.sources.find((source) => source.id === sourceId);
  const fetchedAt = entry?.fetchedAt ?? list?.fetchedAt ?? ahead[0]?.fetchedAt ?? (rows.map((row) => row.fetchedAt).sort().at(-1) as string);
  return {
    sourceId, fetchedAt, builtAt: rows.find((row) => row.via)?.via?.fetchedAt ?? null, through: COMPILERS.has(sourceId),
    health: "failing", lastOkAt: entry ? entry.lastOkAt : fetchedAt, ...(checked ? { checked: true } : {}),
    showings: rows.map((row) => ({
      cinemaId: row.cinemaId, filmTitle: films.get(row.filmId)?.title ?? row.filmId, rating: films.get(row.filmId)?.rating ?? null,
      startsAt: row.startsAt, format: row.format, bookingUrl: row.bookingUrl, ...(row.closed ? { closed: true as const } : {}),
    })),
    ...(featured ? { featured } : {}),
    ...(coming ? { coming } : {}),
  };
}

/** What a kept batch kept, for the log. */
const keptWhat = (kept: Batch) => (kept.showings.length > 0 ? "showings" : kept.featured ? "featured films" : "coming films");

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
    // A source that feeds no cinema is not read: Ozone refused us, so its reader waits (D-127). One
    // that features films for some cinemas, without times, is read for those (D-131).
    const featuredFor = new Set(source.featuredFor ?? []);
    if (source.status !== "cleared" || !reader || (source.cinemaIds.length === 0 && featuredFor.size === 0)) continue;
    // A compiled listing also lists cinemas we read elsewhere; it only feeds the ones it is given.
    const given = new Set(source.cinemaIds);
    // A hand check of the cinema's own site outranks the others for what it covers (D-200).
    const handChecked = source.method === "hand-checked";
    let pages: ParsedPage[];
    try {
      // Each cinema's own page on this source, for the cinemas it feeds (data/sources.json `cinemaPages`).
      const own = (map: Record<string, string> = {}) => Object.fromEntries(Object.entries(map).filter(([cinemaId]) => given.has(cinemaId)));
      // Coming films' first dates, from the last run's list: a source reads those after its days too (D-194).
      previous ??= previousLive(root);
      const openings = (previous?.coming ?? []).flatMap((entry) => (entry.firstDay !== null && stillComing(entry, lagosDayKey(now)) ? [entry.firstDay] : []));
      pages = await reader({ now, days: source.daysAhead ?? DAYS_AHEAD, fetchText, renderText, pages: own(source.cinemaPages), sites: own(source.bookingSites), names: own(source.pageNames), openings, root });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      previous ??= previousLive(root);
      const kept = keptBatch(previous, source.id, given, featuredFor, now, handChecked);
      if (kept) batches.push(kept);
      log.push(`${source.id}: could not be read (${message}); ${kept ? `kept its last good ${keptWhat(kept)} from ${kept.fetchedAt}` : "no earlier showings to keep"}`);
      continue;
    }
    read += 1;
    for (const note of pages.flatMap((page) => page.notes ?? [])) log.push(`${source.id}: ${note}`);
    const rows = pages.flatMap((page) => page.showings);
    const kept = rows.filter((row) => given.has(row.cinemaId));
    if (kept.length < rows.length) log.push(`${source.id}: left out ${rows.length - kept.length} showings at cinemas it does not feed`);
    const list = pages.find((page) => page.featured)?.featured;
    const featured = list && featuredFor.size > 0 ? { featured: { cinemaIds: [...featuredFor], day: list.day, titles: list.films.map((film) => film.title) } } : {};
    // Coming films (D-151) are for the cinemas the page speaks for, as its featured films are.
    const comingList = pages.flatMap((page) => page.coming ?? []);
    const coming = comingList.length > 0 && featuredFor.size > 0 ? { coming: { cinemaIds: [...featuredFor], films: comingList } } : {};
    // A hand check is as old as the check, not the run (D-200).
    const readAt = pages.map((page) => page.readAt).find((stamp) => stamp !== undefined) ?? now;
    batches.push({ sourceId: source.id, fetchedAt: readAt, builtAt: pages.map((page) => page.builtAt).find((stamp) => stamp !== null) ?? null, through: COMPILERS.has(source.id), showings: kept, ...featured, ...coming, ...(handChecked ? { checked: true } : {}) });
  }
  // Every source failing is a problem with the run (or the network), not with one site.
  if (read === 0 && failures.length > 0) throw new Error(`No source could be read: ${failures.join("; ")}.`);
  if (!batches.some((batch) => batch.showings.length > 0)) throw new Error("No showings were read from any source.");
  const built = assemble({ now, root, batches, method: "public-page", paths: LIVE_PATHS });
  return { files: built.files, log: [...log, ...built.log] };
}

/**
 * The build step: the committed live set as the files pages read, or null when there is none and
 * the caller makes sample data instead. The page files (each area's, each city's) are cut again
 * here against today's data/cinemas.json, so an area added since the last live run gets its file
 * and the build does not fail on a missing one.
 */
export function liveBuildFiles(root: string, now: string): Map<string, ShowtimesFile> | null {
  const mainPath = join(root, LIVE_PATHS.main);
  if (!existsSync(mainPath)) return null;
  // Today's credits.json on each film: a poster or trailer found since the read shows at once (D-117).
  // Only what is saved under the film's id: a merged film (D-119) keeps what the read found under
  // a spelling's id, instead of being wiped back to "not known".
  const creditsFor = creditsLookup(root, { savedOnly: true });
  const titleFor = titleLookup(root);
  const read = readJson<ShowtimesFile>(mainPath);
  const checked = validateShowtimes({ ...read, films: read.films.map((film) => ({ ...film, ...creditsFor(film.id), title: properTitle(film.title, titleFor(film.id)) })) });
  if (!checked.ok) throw new Error(`data/live/showtimes.json with today's credits was refused:\n${checked.errors.join("\n")}`);
  const file = checked.file;
  const areas = readJson<{ areas: { slug: string; city: string }[] }>(join(root, "data/cinemas.json")).areas;
  return new Map<string, ShowtimesFile>([[SAMPLE_PATHS.main, file], ...pageFiles(file, areas, now, SAMPLE_PATHS)]);
}
