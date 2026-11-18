// Parser and reader for Filmhouse's public home page (D-131). Filmhouse's times come only from its
// ticketing provider, CINEsync, which refuses our bot (403), so we never read them (D-77). The home
// page itself answers, but its "Now Showing" list is empty in the HTML: the browser fills it from
// CINEsync. What the page does carry is its banner's data: each film's title, runtime, rating and
// the nearest date it has showtimes. A film whose nearest date is today (Lagos) is featured today.
// The banner is a promotion, not the whole programme, so this is never "everything Filmhouse shows"
// (rule 8). No times, so no showings; one request a run, and no CINEsync call. A banner film whose
// nearest date is after today is coming (D-151), from that date; one the page flags `is_coming_soon`
// with no date is coming with no date. The flag was false for all 9 on 17 Nov, so the date decides.
import { lagosDayKey } from "../../src/lib/time/lagos.ts";
import { clean, type ComingFilm, type FeaturedFilm, type ParsedPage, type Reader } from "./raw.ts";

export const FILMHOUSE_HOME = "https://www.filmhouseng.com/";

const PUSH = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
const BANNER = '"widgetId":"banner","widgetData":';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const fail = (why: string): never => {
  throw new Error(`Filmhouse home page: ${why}`);
};

/** The page's data as the browser receives it: every `self.__next_f.push([1, "…"])` string, decoded and joined. */
export function pagePayload(html: string): string {
  return [...html.matchAll(PUSH)].map((found) => JSON.parse(`"${found[1]}"`) as string).join("");
}

/** The JSON object that starts at `start`, read to its matching brace (strings may hold braces). */
function objectAt(text: string, start: number): unknown {
  if (text[start] !== "{") return undefined;
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (char === "\\") i += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth += 1;
    else if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  return undefined;
}

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => typeof value === "object" && value !== null && !Array.isArray(value);

/** The banner's data as the page gives it: where it is for, and its items. */
export function bannerData(html: string): { location: unknown; list: Row[] } {
  const payload = pagePayload(html);
  const at = payload.indexOf(BANNER);
  if (at < 0) fail("no banner data found. Has the page layout changed?");
  const data = objectAt(payload, at + BANNER.length);
  if (!isRow(data) || !Array.isArray(data.list)) return fail("no banner data found. Has the page layout changed?");
  const location = isRow(data.page_location) ? data.page_location.cinema_location_name : undefined;
  return { location, list: data.list.filter(isRow) };
}

/** "1h 30m", "2h 0m", "45m" in minutes; null for anything else. */
export function runtimeMinutes(text: unknown): number | null {
  const found = typeof text === "string" ? /^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*$/.exec(text) : null;
  if (!found || (found[1] === undefined && found[2] === undefined)) return null;
  return Number(found[1] ?? 0) * 60 + Number(found[2] ?? 0);
}

export function parseFilmhouseHome(html: string, options: { now: string }): ParsedPage {
  const { location, list } = bannerData(html);
  // The wording names the chain, so the banner must be the one for every location.
  if (location !== "All") fail(`the banner is for ${JSON.stringify(location)}, not every location`);
  const movies = list.filter((item) => item.type === "movie");
  if (movies.length === 0) fail("the banner has no films. Has the page layout changed?");

  const day = lagosDayKey(options.now);
  const films: FeaturedFilm[] = [];
  const coming: ComingFilm[] = [];
  for (const item of movies) {
    const title = clean(typeof item.movie_name === "string" ? item.movie_name : undefined);
    if (!title) return fail("a banner film has no title. Has the page layout changed?");
    const date = item.nearest_show_times_date;
    if (date !== null && !(typeof date === "string" && DATE.test(date))) fail(`"${title}" has the showtimes date ${JSON.stringify(date)}, not yyyy-mm-dd`);
    const rating = clean(typeof item.movie_certification_short_code === "string" ? item.movie_certification_short_code : undefined);
    if (date === day) films.push({ title, runtimeMin: runtimeMinutes(item.duration), rating });
    else if (typeof date === "string" ? date > day : item.is_coming_soon === true) coming.push({ title, firstDay: typeof date === "string" ? date : null, rating });
  }
  return { showings: [], builtAt: null, featured: { day, films }, coming };
}

/** The one home page; `days` does not apply: the page says only which films are on today. */
export const readFilmhouseHome: Reader = async ({ now, fetchText }) => [parseFilmhouseHome(await fetchText(FILMHOUSE_HOME), { now })];
