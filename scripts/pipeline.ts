// The pure steps between a parser's rows and the data files: film ids, sample dates (D-20),
// building and validating schema v1, and the per-area split (D-18). No file or network access.
import { cutComing, stillComing, withComing } from "../src/lib/data/coming.ts";
import { cutFeatured, withFeatured } from "../src/lib/data/featured.ts";
import { showingId } from "../src/lib/data/showingId.ts";
import type { Cinema, Film, Showing, ShowtimesFile, Source, SourceHealth } from "../src/lib/data/types.ts";
import { validateShowtimes } from "../src/lib/data/validate.ts";
import { EVENING_ENDS_HOUR, lagosDayKey, lagosDaysFrom, lagosLocalToUtc, toLagos } from "../src/lib/time/lagos.ts";
import { splitPresales } from "./presales.ts";
import { comingFilms } from "./coming.ts";
import { properTitle } from "./titles.ts";
import { featuredFilms, listedTitles, listMatcher } from "./lists.ts";
import type { ComingFilm, RawShowing } from "./sources/raw.ts";

/** One read of one source: its rows and when they were read. */
export type Batch = {
  sourceId: string;
  /** When we read the source (for a fixture: when the page was saved). */
  fetchedAt: string;
  /** When the source says it built its listing, if it says. */
  builtAt: string | null;
  /** True for a listing that compiles other sites (Lagocine): its rows then say which site it read. */
  through: boolean;
  showings: RawShowing[];
  /** "failing" for a source that could not be read this time, whose last good rows are kept (D-119). */
  health?: SourceHealth;
  /** When the source was last read without a problem, if not `fetchedAt`. */
  lastOkAt?: string | null;
  /** Films the source's page features for `day` (Lagos), without times, for `cinemaIds` (D-131). */
  featured?: { cinemaIds: string[]; day: string; titles: string[] };
  /** Films the source's page lists as coming, with the sinima's first date, for `cinemaIds` (D-151). */
  coming?: { cinemaIds: string[]; films: ComingFilm[] };
};

// "(IMAX)", "[3D]", "(IMAX 2D)" at the end of a title: a format, not part of the film's name.
const FORMAT_SUFFIX = /\s*[([]\s*(imax(?: [23]d)?|[234]d|4dx|mx4d|screenx)\s*[)\]]\s*$/i;
const UNKNOWN_CREDITS = { during: "unknown", after: "unknown", confidence: "unknown", sources: [], count: null } as const;

/** The title as shown: white space tidied and any format suffix removed. */
export function filmTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim().replace(FORMAT_SUFFIX, "");
}

/** The format a title ends with ("Ramayana (IMAX)" gives "IMAX"), or null. */
export function titleFormat(title: string): string | null {
  const found = FORMAT_SUFFIX.exec(title.replace(/\s+/g, " ").trim());
  return found ? (found[1] as string).toUpperCase() : null;
}

/** "Arnie & Barney" to "arnie-and-barney". The same film written two ways should give one id. */
export function filmIdFromTitle(title: string): string {
  const id = filmTitle(title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (id === "") throw new Error(`Cannot make a film id from the title "${title}"`);
  return id;
}

/** Where a subtitle starts: ":" or a dash with a space each side ("Spider-Man" has none). */
const SUBTITLE_SEPARATOR = /:\s*|\s+[-–—]\s+/g;

/** The ids of a title's shorter spellings: what comes before each subtitle separator ("agbara-nla" for "Agbara Nla: The Return"). */
export function subtitleHeadIds(title: string): string[] {
  const shown = filmTitle(title);
  const heads = [...shown.matchAll(SUBTITLE_SEPARATOR)].map((found) => shown.slice(0, found.index)).filter((head) => /[a-z0-9]/i.test(head));
  return [...new Set(heads.map(filmIdFromTitle))].filter((id) => id !== filmIdFromTitle(title));
}

/**
 * Every source's title to one film (D-119), so "AGBARA NLA" (Veezi) and "Agbara Nla: The Return"
 * (Lagocine) are one film. Titles that make the same id are one film. A short title joins a longer
 * one only when the longer is the short one followed by a subtitle separator, never on a bare prefix
 * ("Ikenga" is not "Ikenga 2"), and only when exactly one longer film starts that way. Chime's
 * aliases (data/film-aliases.json, by the source's title or by the id it makes) settle the rest.
 * The id is the longer title's, so data/credits.json keeps lining up; the title shown is that
 * film's own, as a source writes it in mixed case if any does.
 */
export function matchFilms(titles: string[], aliases: Record<string, string>): { films: Map<string, { id: string; title: string }>; log: string[] } {
  const log: string[] = [];
  const distinct = [...new Set(titles)];
  const ownId = new Map(distinct.map((title) => [title, filmIdFromTitle(title)]));
  const ids = new Set(ownId.values());

  // For each id, the longer films whose title is it plus a subtitle.
  const longer = new Map<string, Set<string>>();
  for (const [title, id] of ownId) {
    for (const headId of subtitleHeadIds(title)) if (ids.has(headId)) longer.set(headId, (longer.get(headId) ?? new Set()).add(id));
  }
  // "Mission: Impossible" and "Mission: Impossible - The Final Reckoning" both lead to one film; two
  // different films (two Avatar sequels) mean the short title can't be placed, so it stays itself.
  const roots = new Map<string, string>();
  const root = (id: string): string => {
    let found = roots.get(id);
    if (found === undefined) {
      const ends = new Set([...(longer.get(id) ?? [])].map(root));
      found = ends.size === 1 ? ([...ends][0] as string) : id;
      if (ends.size > 1) log.push(`films: "${distinct.find((title) => ownId.get(title) === id)}" could be ${[...ends].join(" or ")}; kept apart (add it to data/film-aliases.json)`);
      roots.set(id, found);
    }
    return found;
  };

  // Own keys only: a film called "Constructor" must not find Object's.
  const alias = (key: string) => (Object.hasOwn(aliases, key) ? aliases[key] : undefined);
  const idOf = new Map(distinct.map((title) => {
    const id = ownId.get(title) as string;
    return [title, alias(title.trim()) ?? alias(filmTitle(title)) ?? alias(id) ?? alias(root(id)) ?? root(id)];
  }));
  const films = new Map<string, { id: string; title: string }>();
  for (const id of new Set(idOf.values())) {
    const members = distinct.filter((title) => idOf.get(title) === id);
    const own = members.filter((title) => ownId.get(title) === id);
    const pool = (own.length > 0 ? own : members).map(filmTitle);
    const mixed = pool.filter((title) => /[a-z]/.test(title));
    const title = (mixed.length > 0 ? mixed : pool).reduce((best, next) => (next.length > best.length ? next : best));
    for (const member of members) {
      films.set(member, { id, title });
      if (filmTitle(member) !== title) log.push(`films: "${filmTitle(member)}" is shown as "${title}"`);
    }
  }
  return { films, log };
}

/** The Lagos calendar date `days` after today. */
function lagosDate(now: string, days: number): { year: number; month: number; day: number } {
  const today = toLagos(now);
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/**
 * Sample data sits on today's dates (D-20): rows from the day the fixtures were saved move onto
 * today, the day after onto tomorrow and so on for five days (D-142), keeping their wall-clock
 * times. Later days are dropped. A cinema with no saved tomorrow gets its saved day again (D-45). Booking links go: they
 * point at a session on the day the page was saved.
 */
export function toSampleDays(rows: RawShowing[], savedDay: string, now: string): RawShowing[] {
  const savedNoon = `${savedDay}T11:00:00Z`; // noon in Lagos
  const dayOf = (row: RawShowing) => lagosDaysFrom(savedNoon, row.startsAt);
  const move = (row: RawShowing, days: number): RawShowing => {
    const { hour, minute } = toLagos(row.startsAt);
    return { ...row, startsAt: lagosLocalToUtc({ ...lagosDate(now, days), hour, minute }), bookingUrl: null };
  };
  // A show after midnight belongs to the evening before (SPEC §3): on its own it is not a saved tomorrow.
  const isTomorrow = (row: RawShowing) => dayOf(row) === 1 && toLagos(row.startsAt).hour >= EVENING_ENDS_HOUR;
  const hasTomorrow = new Set(rows.filter(isTomorrow).map((row) => row.cinemaId));
  // The last day's evening runs past midnight too, so its 00:30 shows stay with it.
  const shown = (row: RawShowing, day: number) => day >= 0 && (day < DAYS_SHOWN || (day === DAYS_SHOWN && toLagos(row.startsAt).hour < EVENING_ENDS_HOUR));
  const moved = rows.flatMap((row) => {
    const day = dayOf(row);
    return shown(row, day) ? [move(row, day)] : [];
  });
  const repeated = rows.filter((row) => dayOf(row) === 0 && !hasTomorrow.has(row.cinemaId)).map((row) => move(row, 1));
  return [...moved, ...repeated];
}

/** Rows to a validated schema v1 file. Throws if the validator refuses it. */
export function buildShowtimes(input: {
  generatedAt: string;
  sources: Source[];
  cinemas: Cinema[];
  batches: Batch[];
  /** Chime's film aliases (data/film-aliases.json): a source's title or id to a film id (D-119). */
  aliases?: Record<string, string>;
  /**
   * What data/credits.json and Chime's own entries say about a film, if anything: under its id
   * first, then under the ids of the other spellings merged into it (D-119).
   */
  creditsFor?: (filmId: string, spellings?: string[]) => Pick<Film, "tmdbId" | "runtimeMin" | "credits" | "posterPath" | "trailerKey"> | undefined;
  /** TMDB's title for a matched film, for one a sinima writes in capitals (D-152c). */
  titleFor?: (filmId: string) => string | undefined;
}): {
  file: ShowtimesFile;
  log: string[];
} {
  const log: string[] = [];
  const cinemaById = new Map(input.cinemas.map((cinema) => [cinema.id, cinema]));
  const films = new Map<string, Film>();
  const showings: Showing[] = [];
  // Films are matched across every source before ids are made (D-119).
  const titles = input.batches.flatMap((batch) => batch.showings.filter((row) => cinemaById.has(row.cinemaId)).map((row) => row.filmTitle));
  const matched = matchFilms(titles, input.aliases ?? {});
  log.push(...matched.log);
  // Each film's other spellings, in the order first seen, for its credits.
  const spellings = new Map<string, string[]>();
  for (const [title, { id }] of matched.films) {
    const own = filmIdFromTitle(title);
    const list = spellings.get(id) ?? [];
    if (own !== id && !list.includes(own)) list.push(own);
    spellings.set(id, list);
  }

  for (const batch of input.batches) {
    const seen = new Set<string>();
    const unknown = new Map<string, number>();
    let repeats = 0;
    for (const row of batch.showings) {
      const cinema = cinemaById.get(row.cinemaId);
      if (!cinema) {
        unknown.set(row.cinemaId, (unknown.get(row.cinemaId) ?? 0) + 1);
        continue;
      }
      const { id: filmId, title } = matched.films.get(row.filmTitle) as { id: string; title: string };
      const film = films.get(filmId);
      if (!film) {
        films.set(filmId, {
          id: filmId, title, runtimeMin: null, rating: row.rating, origin: null, tmdbId: null,
          credits: { ...UNKNOWN_CREDITS, sources: [] },
          ...input.creditsFor?.(filmId, spellings.get(filmId) ?? []),
        });
      } else if (film.rating === null) {
        film.rating = row.rating;
      }
      const id = showingId({ cinemaId: cinema.id, filmId, startsAt: row.startsAt });
      // The same showing twice in one read is one showing: a day page and a cinema page overlap,
      // and Lagocine repeats some rows outright.
      if (seen.has(id)) {
        repeats += 1;
        continue;
      }
      seen.add(id);
      const readTheirSite = batch.through && (cinema.website !== null || Boolean(cinema.bookingHost));
      showings.push({
        id, filmId, cinemaId: cinema.id, screenId: null, startsAt: row.startsAt, format: row.format ?? titleFormat(row.filmTitle), language: null,
        price: null, bookingUrl: row.bookingUrl, sourceId: batch.sourceId,
        ...(readTheirSite
          ? { via: { name: `${cinema.chain}'s site`, ...(cinema.website ? { url: cinema.website } : {}), fetchedAt: batch.builtAt ?? batch.fetchedAt } }
          : {}),
        fetchedAt: batch.fetchedAt,
      });
    }
    for (const [cinemaId, count] of unknown) log.push(`${batch.sourceId}: dropped ${count} showings at "${cinemaId}", which is not in data/cinemas.json`);
    if (repeats > 0) log.push(`${batch.sourceId}: ${repeats} showings were listed more than once; kept one of each`);
  }

  showings.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));
  // Titles are matched again with the lists' only when some batch has a list (the match is not free).
  const lists = listedTitles(input.batches);
  const match = lists.length === 0 ? () => { throw new Error("No list to match"); } : listMatcher(matchFilms([...titles, ...lists], input.aliases ?? {}).films, titles, matched.films, films);
  const featured = featuredFilms(input.batches, match);
  // A coming film no showing has joins `films` with the sinima's rating, unknown credits and what credits.json says.
  const coming = comingFilms(input.batches, match, ({ id, title, spelling, rating }) => {
    const known = films.get(id);
    if (known) {
      known.rating ??= rating;
      return;
    }
    const own = filmIdFromTitle(spelling);
    films.set(id, { id, title, runtimeMin: null, rating, origin: null, tmdbId: null, credits: { ...UNKNOWN_CREDITS, sources: [] }, ...input.creditsFor?.(id, own === id ? [] : [own]) });
  });
  // After the shown days, only a coming film's opening day is kept, apart, as tickets on sale (D-194).
  const { shownNow, presales } = splitPresales(showings, coming, input.generatedAt, DAYS_SHOWN, log);
  const result = validateShowtimes({
    schemaVersion: 1, generatedAt: input.generatedAt, timeZone: "Africa/Lagos",
    sources: input.sources, cinemas: input.cinemas, films: [...films.values()].map((film) => ({ ...film, title: properTitle(film.title, input.titleFor?.(film.id)) })).sort((a, b) => a.id.localeCompare(b.id)), showings: shownNow,
    ...(featured.length > 0 ? { featured } : {}),
    ...(coming.length > 0 ? { coming } : {}),
    ...(presales.length > 0 ? { presales } : {}),
  });
  if (!result.ok) throw new Error(`The data file was refused:\n${result.errors.join("\n")}`);
  return { file: only(result.file, result.file.cinemas, () => true, true), log: [...log, ...result.log] };
}

/**
 * The file cut down to some cinemas and showings, with only the films and sources those showings (and
 * featured and coming films, and presales when kept) use. Presales stay only where `presales` is true (D-194).
 */
function only(file: ShowtimesFile, cinemas: Cinema[], keep: (showing: Showing) => boolean, keepPresales = false): ShowtimesFile {
  const cinemaIds = new Set(cinemas.map((cinema) => cinema.id));
  const showings = file.showings.filter((showing) => cinemaIds.has(showing.cinemaId) && keep(showing));
  const presales = keepPresales ? (file.presales ?? []).filter((showing) => cinemaIds.has(showing.cinemaId)) : [];
  const featured = cutFeatured(file, cinemaIds);
  const coming = cutComing(file, cinemaIds);
  const filmIds = new Set([...showings, ...presales, ...coming].map((row) => row.filmId));
  const sourceIds = new Set([...showings, ...presales, ...featured, ...coming].map((row) => row.sourceId));
  const out: ShowtimesFile = withComing(withFeatured({
    ...file,
    sources: file.sources.filter((source) => sourceIds.has(source.id)),
    cinemas,
    films: file.films.filter((film) => filmIds.has(film.id)),
    showings,
    presales,
  }, featured), coming);
  if (presales.length === 0) delete out.presales;
  return out;
}

/** How many days the site shows, today first (D-142): today and tomorrow in each page, the rest in day files (D-147). */
export const DAYS_SHOWN = 5;

/**
 * Days three to five (D-147), each its own file keyed by its Lagos date ("2026-11-22"), holding that
 * day's showings at every cinema: a day runs from 04:00 to 04:00 the morning after, so a 00:30
 * show stays with its evening. A day no cinema lists has no file. Featured films are today's only,
 * and coming films live in the city's own file (D-151).
 */
export function laterDays(file: ShowtimesFile, now: string): Map<string, ShowtimesFile> {
  const days = new Map<string, ShowtimesFile>();
  const withoutFeatured: ShowtimesFile = { ...file, featured: undefined, coming: undefined };
  for (let offset = 2; offset < DAYS_SHOWN; offset += 1) {
    const date = lagosDate(now, offset);
    const start = lagosLocalToUtc({ ...date, hour: EVENING_ENDS_HOUR, minute: 0 });
    const end = lagosLocalToUtc({ ...lagosDate(now, offset + 1), hour: EVENING_ENDS_HOUR, minute: 0 });
    const day = only(withoutFeatured, file.cinemas, (showing) => showing.startsAt >= start && showing.startsAt < end);
    if (day.showings.length > 0) days.set(lagosDayKey(start), day);
  }
  return days;
}

/**
 * One file per area plus "all" (D-18), each holding today's and tomorrow's showings. Tomorrow
 * runs to 04:00 the morning after, so a 00:30 show stays with its evening. Coming films stay
 * while their first date is after today (D-151).
 */
export function splitByArea(whole: ShowtimesFile, areaSlugs: string[], now: string): Map<string, ShowtimesFile> {
  const end = lagosLocalToUtc({ ...lagosDate(now, 2), hour: EVENING_ENDS_HOUR, minute: 0 });
  const soon = (showing: Showing) => showing.startsAt < end;
  const file = { ...whole, coming: whole.coming?.filter((entry) => stillComing(entry, lagosDayKey(now))) };
  const files = new Map([["all", only(file, file.cinemas, soon, true)]]);
  for (const slug of areaSlugs) files.set(slug, only(file, file.cinemas.filter((cinema) => cinema.area === slug), soon));
  return files;
}
