import { formatDate, formatLateTime, toLagos } from "@/lib/time/lagos";
import { list } from "@/lib/wording/credits";

// Every sentence on a cinema's page (Figma Cinema 202:7192). `when` is "tonight" or "today" once
// the page knows the time, and null before (rule 3).

const films = (n: number) => `${n} ${n === 1 ? "film" : "films"}`;
const WEEKDAYS: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

/** The films' heading: "Films tonight", "Films tomorrow"; "Films on Fri 13 Nov" before the time is known. */
export function filmsTitle(input: { day: 0 | 1; when: "tonight" | "today" | null; date: string }): string {
  if (!input.when) return `Films on ${formatDate(input.date)}`;
  return input.day === 1 ? "Films tomorrow" : `Films ${input.when}`;
}

/** Under it: "4 films today · 3 still to start"; with old times, "3 films · times from yesterday". Nothing with no films: the page says no times are listed. */
export function filmsNote(input: { day: 0 | 1; live: boolean; total: number; left: number; warning: string | null }): string | null {
  const { total, left, warning } = input;
  if (total === 0) return null;
  if (warning) return `${films(total)} · ${warning.toLowerCase()}`;
  if (!input.live || input.day === 1) return films(total);
  return `${films(total)} today · ${left === 0 ? "all started" : `${left} still to start`}`;
}

/** A day in the toggle: "Today · Fri 13"; the date alone before the time is known. */
export function dayOption(input: { day: 0 | 1; date: string; live: boolean }): string {
  if (!input.live) return formatDate(input.date);
  const { weekday, day } = toLagos(input.date);
  return `${input.day === 0 ? "Today" : "Tomorrow"} · ${weekday} ${day}`;
}

/** Beside today when tomorrow has no times: "Filmhouse hasn't listed Sunday yet." */
export const notListedYet = (chain: string, tomorrow: string) => `${chain} hasn't listed ${WEEKDAYS[toLagos(tomorrow).weekday] ?? formatDate(tomorrow)} yet.`;

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
  return cinema.online ? `${cinema.chain} sells the tickets. Sinima only shows the times and sends you to their site.` : `${cinema.name} sells the tickets at the cinema. Sinima only shows the times.`;
}

/** In place of the films on a day with none: "No times listed for tomorrow yet." */
export function noFilms(input: { day: 0 | 1; live: boolean; date: string }): string {
  if (!input.live) return `No times on ${formatDate(input.date)}.`;
  return input.day === 1 ? "No times listed for tomorrow yet." : "No times listed today.";
}

/** The toast after Save (Figma: Saved). */
export const SAVED_TOAST = "Saved to Your cinemas. Only on this phone.";
