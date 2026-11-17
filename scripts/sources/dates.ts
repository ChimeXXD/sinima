// The clock and calendar pieces the cinema readers share (D-122). Cinemas write times on a 12-hour
// clock ("6:35 PM", "4:20pm") or a 24-hour one ("09:15"), and dates with no year ("Tuesday,
// November 17th"). Every start time still becomes UTC through lagosLocalToUtc alone (rule 1).
import { EVENING_ENDS_HOUR, lagosLocalToUtc, toLagos } from "../../src/lib/time/lagos.ts";
import type { RawShowing } from "./raw.ts";

export type Day = { year: number; month: number; day: number };
export type Clock = { hour: number; minute: number };

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const TWELVE = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;
const TWENTY_FOUR = /^(\d{1,2}):(\d{2})$/;

/** "january" (any case) as 1, or 0 when it is not a month's name. */
export const monthNumber = (name: string) => MONTHS.indexOf(name.toLowerCase()) + 1;

/** "6:35 PM" or "4:20pm" as 18:35 and 16:20; "12:05 AM" is five past midnight. Null for anything else. */
export function clock12(text: string): Clock | null {
  const found = TWELVE.exec(text.trim());
  if (!found) return null;
  const hour12 = Number(found[1]);
  const minute = Number(found[2]);
  if (hour12 < 1 || hour12 > 12 || minute > 59) return null;
  return { hour: (hour12 % 12) + ((found[3] as string).toLowerCase() === "pm" ? 12 : 0), minute };
}

/** "09:15" as 9:15. Null for anything else. */
export function clock24h(text: string): Clock | null {
  const found = TWENTY_FOUR.exec(text.trim());
  if (!found) return null;
  const hour = Number(found[1]);
  const minute = Number(found[2]);
  return hour > 23 || minute > 59 ? null : { hour, minute };
}

/** The calendar day `days` after `day` (dates only; no clock is involved). */
export function addDays(day: Day, days: number): Day {
  const date = new Date(Date.UTC(day.year, day.month - 1, day.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/** The Lagos calendar day `now` falls on, or the one `days` after it. */
export function lagosDay(now: string, days = 0): Day {
  const { year, month, day } = toLagos(now);
  return addDays({ year, month, day }, days);
}

/** The day's weekday, lower case ("tuesday"). */
export const weekdayOf = (day: Day) => WEEKDAYS[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()] as string;

const dayNumber = (day: Day) => Date.UTC(day.year, day.month - 1, day.day) / 86_400_000;

/**
 * A date a page gives without a year, in the year that puts it nearest the day the page was read:
 * a listing looks ahead, so "4 January" read in November is next year, while "31 December" read
 * just after midnight on New Year's Day is the old one. When the page names the weekday, it must agree.
 */
export function dateNearest(date: { month: number; day: number; weekday?: string }, readOn: Day): Day {
  const candidates = [readOn.year - 1, readOn.year, readOn.year + 1]
    .map((year) => ({ year, month: date.month, day: date.day }))
    .filter((day) => addDays(day, 0).day === date.day);
  const name = `${date.day} ${(MONTHS[date.month - 1] ?? "?").replace(/^./, (c) => c.toUpperCase())}`;
  if (candidates.length === 0) throw new Error(`${name} is not a date`);
  const nearest = candidates.reduce((best, next) => (Math.abs(dayNumber(next) - dayNumber(readOn)) < Math.abs(dayNumber(best) - dayNumber(readOn)) ? next : best));
  if (date.weekday !== undefined) {
    if (weekdayOf(nearest) !== date.weekday.toLowerCase()) throw new Error(`${name} is not a ${date.weekday} in ${nearest.year}`);
  }
  return nearest;
}

/**
 * A showing's start in UTC from the day it is listed under and its time on the cinema's clock. A
 * time before 04:00 is a late show of that evening (SPEC §3), so it falls on the next calendar day.
 */
export function showStart(listedOn: Day, time: Clock): string {
  const day = time.hour < EVENING_ENDS_HOUR ? addDays(listedOn, 1) : listedOn;
  return lagosLocalToUtc({ ...day, ...time });
}

/** The rows from today in Lagos through `days` days, each day running to 04:00 the next morning. */
export function withinDays<T extends Pick<RawShowing, "startsAt">>(rows: T[], now: string, days: number): T[] {
  const start = lagosLocalToUtc({ ...lagosDay(now), hour: 0, minute: 0 });
  const end = lagosLocalToUtc({ ...lagosDay(now, days), hour: EVENING_ENDS_HOUR, minute: 0 });
  return rows.filter((row) => row.startsAt >= start && row.startsAt < end);
}
