import { FORMAT_TAGS, formatTag, type FormatTag } from "@/lib/data/format";
import type { ListRow } from "@/lib/data/select";
import { EVENING_ENDS_HOUR, eveningDayKey, toLagos, utcMs, utcString } from "@/lib/time/lagos";
import { isBeforeStart, showingState } from "@/lib/time/showingState";

// A cinema's or a film's programme for one day: which rows belong to which of the five days shown
// (D-142), and how they group. The day is the evening day: a 00:30 show belongs to the evening before.

/** 0 is today, 1 is tomorrow, up to 4: the fifth day (D-142). */
export type Day = 0 | 1 | 2 | 3 | 4;
/** How many days the site shows, today first (D-142). */
export const DAYS = 5;

const DAY_MS = 24 * 3_600_000;
const keyMs = (key: string) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

/** Which day a showing belongs to, or null when it is before today or past the fifth day. */
export function dayOf(at: string, now: string): Day | null {
  const days = Math.round((keyMs(eveningDayKey(at)) - keyMs(eveningDayKey(now))) / DAY_MS);
  return days >= 0 && days < DAYS ? (days as Day) : null;
}

/**
 * The instant "today" is counted from. Normally now. Between midnight and 04:00 the evening that
 * began yesterday is still today while it has a showing left to start; once it has none, today
 * is the new calendar day, so the page is not empty at 01:00 (D-54).
 */
export function anchorFor(rows: ListRow[], now: string): string {
  if (toLagos(now).hour >= EVENING_ENDS_HOUR) return now;
  const left = rows.some((row) => dayOf(row.at, now) === 0 && isBeforeStart(showingState(row.at, now)));
  return left ? now : utcString(utcMs(now) + EVENING_ENDS_HOUR * 3_600_000);
}

/**
 * An instant on each of the five days' dates, today first, for the date under each day ("Fri 6
 * Nov"). The date is the evening's: at 01:30 on Saturday with a late show left, today is Friday and
 * tomorrow is Saturday, the same days `showingOn` puts the rows on.
 */
export function dayDates(rows: ListRow[], now: string): [string, string, string, string, string] {
  const today = utcMs(anchorFor(rows, now)) - EVENING_ENDS_HOUR * 3_600_000;
  const on = (day: Day) => utcString(today + day * DAY_MS);
  return [on(0), on(1), on(2), on(3), on(4)];
}

/**
 * The rows on one day, in time order. Today leaves out a showing from the second it starts (D-05).
 * With a format, only rows in that format stay; a row that gives no format is left out, not guessed.
 * `keepStarted` gives the whole day: for the page's own HTML, which does not know the time.
 * `anchor` is the page's (`anchorFor` its own rows): a later day's file holds only that day's rows,
 * so after midnight they can't tell whether last evening is still today (D-147).
 */
export function showingOn(rows: ListRow[], day: Day, now: string, format: FormatTag | null = null, keepStarted = false, anchor = anchorFor(rows, now)): ListRow[] {
  return rows
    .filter((row) => dayOf(row.at, anchor) === day)
    .filter((row) => keepStarted || isBeforeStart(showingState(row.at, now)))
    .filter((row) => format === null || formatTag(row.format) === format)
    .sort((a, b) => a.at.localeCompare(b.at));
}

function groupBy<K extends "film" | "cinema">(rows: ListRow[], key: K): ({ rows: ListRow[] } & Record<K, number>)[] {
  const groups = new Map<number, ListRow[]>();
  for (const row of [...rows].sort((a, b) => a.at.localeCompare(b.at))) groups.set(row[key], [...(groups.get(row[key]) ?? []), row]);
  // Map keeps insertion order, and rows went in by time: the group with the soonest row is first.
  return [...groups].map(([id, list]) => ({ [key]: id, rows: list }) as { rows: ListRow[] } & Record<K, number>);
}

/** Rows grouped by film, the soonest film first. */
export const byFilm = (rows: ListRow[]) => groupBy(rows, "film");
/** Rows grouped by cinema, the soonest cinema first. */
export const byCinema = (rows: ListRow[]) => groupBy(rows, "cinema");

/** The formats these rows are showing in, in the order IMAX, 4D, 3D. */
export function formatsOf(rows: ListRow[]): FormatTag[] {
  const found = new Set(rows.map((row) => formatTag(row.format)));
  return FORMAT_TAGS.filter((tag) => found.has(tag));
}

/**
 * The format chips a day can offer (D-135): the formats of its showings still to start (on sample
 * data, all of the day's, as the lists show them). None means no format row at all, not a lone
 * "Any format" that filters nothing. The picked format stays so it can be cleared on any day.
 */
export function formatChoices(rows: ListRow[], day: Day, now: string, live: boolean, picked: FormatTag | null, anchor?: string): FormatTag[] {
  const found = new Set(showingOn(rows, day, now, null, !live, anchor).map((row) => formatTag(row.format)));
  if (picked) found.add(picked);
  return FORMAT_TAGS.filter((tag) => found.has(tag));
}
