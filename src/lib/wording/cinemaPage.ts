import type { Day } from "@/lib/data/programme";
import { formatDate, formatLateTime, toLagos } from "@/lib/time/lagos";
import { weekdayName } from "@/lib/wording/day";
import { list } from "@/lib/wording/list";

// Every sentence on a cinema's page (Figma Cinema 202:7192). `when` is "tonight" or "today" once
// the page knows the time, and null before (rule 3).

const films = (n: number) => `${n} ${n === 1 ? "film" : "films"}`;

/** The films' heading: "Films tonight", "Films tomorrow", "Films on Sunday"; "Films on Fri 13 Nov" before the time is known. */
export function filmsTitle(input: { day: Day; when: "tonight" | "today" | null; date: string }): string {
  if (!input.when) return `Films on ${formatDate(input.date)}`;
  return input.day === 0 ? `Films ${input.when}` : input.day === 1 ? "Films tomorrow" : `Films on ${weekdayName(input.date)}`;
}

/** Under it: "4 films today · 3 still to start"; with old times, "3 films · times from yesterday". Nothing with no films: the page says no times are listed. */
export function filmsNote(input: { day: Day; live: boolean; total: number; left: number; warning: string | null }): string | null {
  const { total, left, warning } = input;
  if (total === 0) return null;
  if (warning) return `${films(total)} · ${warning.toLowerCase()}`;
  if (!input.live || input.day !== 0) return films(total);
  return `${films(total)} today · ${left === 0 ? "all started" : `${left} still to start`}`;
}

/** A day in the toggle: "Today · Fri 13"; the date alone before the time is known. */
export function dayOption(input: { day: 0 | 1; date: string; live: boolean }): string {
  if (!input.live) return formatDate(input.date);
  const { weekday, day } = toLagos(input.date);
  return `${input.day === 0 ? "Today" : "Tomorrow"} · ${weekday} ${day}`;
}

/** Beside today when tomorrow has no times: "Filmhouse hasn't listed Sunday yet." */
export const notListedYet = (chain: string, tomorrow: string) => `${chain} hasn't listed ${weekdayName(tomorrow)} yet.`;

/**
 * On a film whose times have all started: "Started earlier today at 2:00 PM and 4:50 PM. Tomorrow at
 * 2:00 PM and 4:50 PM." After midnight the next day's times are "Later today" (nextDayName).
 */
export function earlierLine(started: string[], tomorrow: string[], next: "Tomorrow" | "Today" = "Tomorrow"): string {
  const times = (ats: string[]) => list(ats.map(formatLateTime));
  return `Started earlier today at ${times(started)}.${tomorrow.length > 0 ? ` ${next === "Today" ? "Later today" : "Tomorrow"} at ${times(tomorrow)}.` : ""}`;
}

/** The page's footer: who sells the tickets. */
export function ticketsFooter(cinema: { chain: string; name: string; online: boolean }): string {
  return cinema.online ? `${cinema.chain} sells the tickets. Sinima only shows the times and sends you to their site.` : `${cinema.name} sells the tickets at the sinima. Sinima only shows the times.`;
}

/** In place of the films on a day with none: "No times listed for tomorrow yet.", "No times listed for Sunday yet." */
export function noFilms(input: { day: Day; live: boolean; date: string }): string {
  if (!input.live) return `No times on ${formatDate(input.date)}.`;
  return input.day === 0 ? "No times listed today." : `No times listed for ${input.day === 1 ? "tomorrow" : weekdayName(input.date)} yet.`;
}

/** The toast after Save (Figma: Saved). */
export const SAVED_TOAST = "Saved to Your sinimas. Only on this phone.";
