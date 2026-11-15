import type { Day } from "@/lib/data/programme";
import { laterName } from "@/lib/data/select";
import type { City, Scope } from "@/lib/data/search";
import { EVENING_ENDS_HOUR, formatLateTime, lagosDaysFrom, toLagos } from "@/lib/time/lagos";
import { filmMeta } from "@/lib/wording/film";

// The words of search and the city sheet (Figma Search and city, 192:7519).

export const CITY_NAME: Record<City, string> = { lagos: "Lagos", abuja: "Abuja" };
const quoted = (query: string) => `“${query}”`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 films in Lagos match “Sp”". */
export function matchCount(n: number, city: City, query: string): string {
  return `${plural(n, "film", "films")} in ${CITY_NAME[city]} ${n === 1 ? "matches" : "match"} ${quoted(query)}`;
}

/**
 * The day after tonight, by the calendar: after midnight, while last night's late shows are still
 * to start, the next day's times fall on today's date, so they are "today", not "tomorrow".
 */
const dayAfter = (at: string, now: string) => (lagosDaysFrom(now, at) === 0 ? "today" : "tomorrow");

/** Today's word: "tonight" from 17:00 and for the late shows after midnight; "today" for a daytime show. */
function todayWord(at: string, now: string): "tonight" | "today" {
  const late = (iso: string) => toLagos(iso).hour < EVENING_ENDS_HOUR;
  if (late(now)) return late(at) ? "tonight" : "today";
  return laterName(now) === "Later tonight" ? "tonight" : "today";
}

/** "2 h 25 min · 12A · IMAX · 2 cinemas tonight": what we know of the film, then where it is on. `at` is its next showing. */
export function resultMeta(film: { runtimeMin: number | null; rating: string | null }, formats: string[], cinemas: number, day: Day, now: string, at: string): string {
  const when = day === 1 ? dayAfter(at, now) : todayWord(at, now);
  const known = film.runtimeMin || film.rating ? [filmMeta(film)] : [];
  return [...known, ...formats, `${plural(cinemas, "cinema", "cinemas")} ${when}`].join(" · ");
}

/** "Next 18:00 · Grand Cinemas Lekki", or "Tomorrow 14:00 · …" when nothing is left tonight. */
export function resultNext(next: { at: string; cinema: string }, day: Day, now: string): string {
  const word = day === 1 ? (dayAfter(next.at, now) === "today" ? "Today" : "Tomorrow") : "Next";
  return `${word} ${formatLateTime(next.at)} · ${next.cinema}`;
}

/** Under the results: Enter lists them on the Films page. */
export function enterHint(n: number): string {
  return `Press Enter to see ${n === 1 ? "it" : n === 2 ? "both" : `all ${n}`} on Films.`;
}

/** Nothing matched in the cities searched. */
export function noMatch(query: string, scope: Scope): { title: string; body: string; action: string } {
  const where = scope === "both" ? "Lagos or Abuja" : CITY_NAME[scope];
  return {
    title: `Nothing called ${quoted(query)} in ${where} yet`,
    body: "Times appear here as soon as a cinema lists them. Check the spelling, or see what's on now.",
    action: "See what's on in Lagos",
  };
}

/** Abuja has no cinemas in the data until the city layer (unit 13): said, never filled with made-up times. */
export const ABUJA_SOON = "Abuja's cinemas are being added";

/** The search index could not be fetched. */
export const SEARCH_FAILED = "Search could not load. Check your connection and try again.";

export const CITY_SHEET = {
  title: "Choose your city",
  subtitle: "Films, cinemas and times follow it.",
  footer: "To see both cities at once, search: results are grouped by city.",
};

/** "22 cinemas in Lekki, Victoria Island, Ikeja and 9 more areas": the first three areas by name. */
export function cityLine(cinemas: number, areas: string[]): string {
  const named = areas.slice(0, 3);
  const more = areas.length - named.length;
  const list = more > 0 ? `${named.join(", ")} and ${plural(more, "more area", "more areas")}` : named.length > 1 ? `${named.slice(0, -1).join(", ")} and ${named.at(-1)}` : named.join("");
  return `${plural(cinemas, "cinema", "cinemas")} in ${list}`;
}
