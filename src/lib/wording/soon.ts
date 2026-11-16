import { formatDate, formatLateTime } from "@/lib/time/lagos";
import { list } from "@/lib/wording/credits";
import { runtimeText, shortCountdown } from "@/lib/wording/film";
import { spokenTime } from "@/lib/wording/showing";
import { formatLabel } from "@/lib/data/format";

// Every sentence on Starting soon (Figma 204:7192 Default, 204:7931 Nothing in 2 hours).

const showings = (n: number) => `${n} ${n === 1 ? "showing" : "showings"}`;
/** "Ramayana" for "Ramayana: Rise of a Legend", as Figma says it in a sentence. */
const shortTitle = (title: string) => title.split(": ")[0]!;

/** Under "Next 2 hours": "10 showings in Lekki · booking closes when a film starts". */
export const soonNote = (input: { count: number; place: string }) => `${showings(input.count)} in ${input.place} · booking closes when a film starts`;

/** Under "Later tonight": "14 more in Lekki until 10:45 PM"; after midnight "until 12:30 AM Sat". */
export const laterNote = (input: { count: number; place: string; last: string }) => `${input.count} more in ${input.place} ${input.count === 1 ? "at" : "until"} ${formatLateTime(input.last)}`;

export const showMore = (n: number) => `Show ${n} more`;

/** Before the page knows the time, the list is the day's: "Showings on Fri 13 Nov" (rule 3). */
export const dayTitle = (date: string) => `Showings on ${formatDate(date)}`;
/** Under it: "24 showings in Lagos". */
export const dayNote = (input: { count: number; place: string }) => `${showings(input.count)} in ${input.place}`;

/** The showings kept with "Keep a countdown" on the showing sheet. */
export const KEPT = { title: "Your countdowns", note: "Kept on this phone until each film starts" } as const;

/** A card's line (Figma): runtime, the showing's format, the rating; "Runtime not listed" with none. */
export function showingMeta(film: { runtimeMin: number | null; rating: string | null }, format: string | null): string {
  return [film.runtimeMin ? runtimeText(film.runtimeMin) : null, formatLabel(format), film.rating].filter(Boolean).join(" · ") || "Runtime not listed";
}

/** A card's Book arrow, read as a sentence: "Book Clayface at 6:00 PM on Filmhouse's site"; after midnight with its day. */
export const bookLabel = (film: string, at: string, chain: string) => `Book ${film} at ${spokenTime(at)} on ${chain}'s site`;

/** A row's line in the empty state: "Filmworld Cinemas Idimu · starts in 50 min". */
export const rowLine = (cinema: string, at: string, now: string) => `${cinema} · starts ${shortCountdown(at, now)}`;

type Named = { at: string; film: string; cinema: string };
export type QuietInput =
  | { kind: "later"; next: Named }
  | { kind: "nearby"; areas: string[]; left: number }
  | { kind: "city"; areas: string[]; left: number; tomorrow: Named | null };

/** In place of the next 2 hours when nothing starts in them. `when` is "tonight" or "today"; `next` is nextDayName. */
export function quietWords(input: { place: string; city: string; when: "tonight" | "today"; next: "Tomorrow" | "Today"; quiet: QuietInput }): { title: string; body: string; tomorrow: string | null; action: string | null; note: string | null } {
  const { place, city, when, quiet } = input;
  const title = `Nothing starts in ${place} in the next 2 hours`;
  const none = { tomorrow: null, action: null, note: null };
  const three = (n: number) => (n > 3 ? ". The next three:" : ":");
  if (quiet.kind === "later") return { title, body: `The next one starts at ${formatLateTime(quiet.next.at)}: ${quiet.next.film} at ${quiet.next.cinema}.`, ...none };
  if (quiet.kind === "nearby") {
    const many = quiet.areas.length > 1;
    return { title, body: `But ${list(quiet.areas)} ${many ? "have" : "has"} ${quiet.left === 1 ? "one" : quiet.left} in the next 2 hours${three(quiet.left)}`, ...none };
  }
  const nor = quiet.areas.length > 0 ? `Nor in ${list(quiet.areas, "or")}. ` : "";
  const left =
    place === city && quiet.left === 0
      ? `Nothing more is showing in ${city} ${when}.`
      : quiet.left === 0
        ? `Nothing else is left in ${city} ${when}.`
        : quiet.left === 1
          ? `One showing is left in ${city} ${when}:`
          : `${quiet.left} showings are left in ${city} ${when}${three(quiet.left)}`;
  const day = input.next === "Today" ? "Later today" : "Tomorrow";
  const { tomorrow } = quiet;
  return {
    title,
    body: `${nor}${left}`,
    tomorrow: tomorrow && `${day} in ${place} starts at ${formatLateTime(tomorrow.at)} with ${shortTitle(tomorrow.film)} at ${tomorrow.cinema}.`,
    action: tomorrow && place !== city ? `See ${day.toLowerCase()} in ${place}` : null,
    note: "early night?",
  };
}
