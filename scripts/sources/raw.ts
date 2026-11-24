// What every source parser returns: showings as the page gives them, with the start time already
// in UTC. Film titles are the source's own; matching them to film ids happens when the file is built.
import { lagosLocalToUtc } from "../../src/lib/time/lagos.ts";
import type { RenderText } from "./browser.ts";
import type { FetchText } from "./polite.ts";

export type RawShowing = {
  /** The id in data/cinemas.json. */
  cinemaId: string;
  filmTitle: string;
  /** The source's rating text ("18", "PG"), or null when it gives none. */
  rating: string | null;
  /** UTC, ending in Z. */
  startsAt: string;
  format: string | null;
  bookingUrl: string | null;
};

/** A film a chain's own page features for a day, without times (D-131). */
export type FeaturedFilm = { title: string; runtimeMin: number | null; rating: string | null };

/**
 * A film a sinima's own page lists as coming (D-151): its first date there, a Lagos date, or null
 * when the page flags it as coming without one ("Date not announced").
 */
export type ComingFilm = { title: string; firstDay: string | null; rating: string | null };

export type ParsedPage = {
  showings: RawShowing[];
  /** The films the page features for `day` (a Lagos date), when it gives films but no times (D-131). */
  featured?: { day: string; films: FeaturedFilm[] };
  /** The films the page lists as coming, after the day it was read (D-151). */
  coming?: ComingFilm[];
  /** When the listing says it was built, in UTC; null when it does not say. */
  builtAt: string | null;
  /** What the reader left out and why, for the run's log (D-122). */
  notes?: string[];
};

/**
 * One source's read for a live run: plain pages through `fetchText`, pages built by script through
 * `renderText`. `pages` is the source's `cinemaPages` in data/sources.json: each cinema's own
 * listing page on that source (D-122). `sites` is its `bookingSites`, where a source has them: the
 * name its booking links give each cinema (Genesis's "lekki-purple"), so a reader need not learn
 * it from the day's rows (D-124). `names` is its `pageNames`: the name a page shows for each cinema
 * it can show (Reach's "Nova Abuja"), so a reader can check it was given the cinema it asked for (D-125).
 */
export type Reader = (input: {
  now: string;
  days: number;
  fetchText: FetchText;
  renderText: RenderText;
  pages: Record<string, string>;
  sites?: Record<string, string>;
  names?: Record<string, string>;
  /** Coming films' first dates (Lagos, yyyy-mm-dd) to read too when they fall after the days asked for (D-194). */
  openings?: string[];
}) => Promise<ParsedPage[]>;

const OFFSET_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+01:00$/;

/**
 * "2026-11-11T15:50:00+01:00" to "2026-11-11T14:50:00Z", through `lagosLocalToUtc` (the only
 * local-to-UTC function). Any other offset is refused: it would not be a Lagos cinema's clock.
 */
export function lagosOffsetTimeToUtc(text: string): string {
  const found = OFFSET_TIME.exec(text.trim());
  if (!found) throw new Error(`Not a Lagos time (+01:00): "${text}"`);
  const [year, month, day, hour, minute, second] = found.slice(1).map(Number) as [number, number, number, number, number, number];
  const utc = lagosLocalToUtc({ year, month, day, hour, minute });
  return second === 0 ? utc : utc.replace(":00Z", `:${String(second).padStart(2, "0")}Z`);
}

/** Trimmed text with runs of white space collapsed, or null when nothing is left. */
export function clean(text: string | undefined): string | null {
  const tidy = (text ?? "").replace(/\s+/g, " ").trim();
  return tidy === "" ? null : tidy;
}
