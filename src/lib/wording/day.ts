import type { Day } from "@/lib/data/programme";
import { formatDate, toLagos } from "@/lib/time/lagos";

// How a day is named (D-142, D-148). "Today" and "Tomorrow" depend on the clock, so they are only
// said once the browser has the time (`live`); before that, and in the page's own HTML, a day is its
// date or weekday (CLAUDE.md rule 3). `date` is any instant on that day.

const WEEKDAYS: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Friday". */
export const weekdayName = (date: string) => {
  const { weekday } = toLagos(date);
  return WEEKDAYS[weekday] ?? weekday;
};

/** The day's name in a list, and "on …" in a sentence: "Today" / "today", "Fri 20 Nov" / "on Friday". */
export function dayWords(day: Day, date: string, live: boolean): { name: string; on: string } {
  if (!live) return { name: formatDate(date), on: `on ${formatDate(date)}` };
  if (day === 0) return { name: "Today", on: "today" };
  if (day === 1) return { name: "Tomorrow", on: "tomorrow" };
  return { name: formatDate(date), on: `on ${weekdayName(date)}` };
}

/**
 * A date tile (Figma Day tile 290:86): the weekday small ("Today" on the first, once the time is
 * known) over the date large, and its full name for a screen reader ("Today, Wednesday 18 November").
 */
export function tileWords(day: Day, date: string, live: boolean): { weekday: string; date: string; label: string } {
  const p = toLagos(date);
  const full = `${weekdayName(date)} ${p.day} ${MONTHS[p.month - 1]}`;
  const lead = live && day === 0 ? "Today" : live && day === 1 ? "Tomorrow" : null;
  return { weekday: live && day === 0 ? "Today" : p.weekday, date: String(p.day), label: lead ? `${lead}, ${full}` : full };
}

/** "today's", "tomorrow's", "Friday's". */
const dayTimes = (day: Day, date: string, live: boolean) => (live && day === 0 ? "today's" : live && day === 1 ? "tomorrow's" : `${weekdayName(date)}'s`);
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Under the day row when not every sinima has put a day up (D-146): "7 of 21 sinimas have put up
 * Saturday's times so far." Null when all of them have, or none has (the list says so then).
 */
export function listedSentence(input: { listed: number; total: number; day: Day; date: string; live: boolean }): string | null {
  const { listed, total } = input;
  if (listed <= 0 || listed >= total) return null;
  return `${listed} of ${total} sinimas ${listed === 1 ? "has" : "have"} put up ${dayTimes(input.day, input.date, input.live)} times so far.`;
}

/** While a later day's times are on their way (D-147): "Getting Friday's times…". */
export const dayLoading = (day: Day, date: string, live: boolean) => `Getting ${dayTimes(day, date, live)} times…`;

/** When a later day's times could not be fetched: offline, "Friday's times need a connection." */
export function dayFailed(input: { day: Day; date: string; live: boolean; offline: boolean }): string {
  const times = capital(dayTimes(input.day, input.date, input.live));
  return input.offline ? `${times} times need a connection.` : `${times} times didn't load.`;
}

/** The button that fetches them again. */
export const TRY_AGAIN = "Try again";
