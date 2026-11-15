import { countdown, minutesFromStart } from "@/lib/time/countdown";
import { formatDay, formatLateTime, formatTime, lateDay } from "@/lib/time/lagos";

// Sentences about one showing (D-05, DATA §Showing wording). Relative words come from `now`,
// so these run in the browser.

/** "19:30 · Starts in 1 h 20 min", or null once the showing has ended (it is hidden). */
export function showingLine(startsAt: string, now: string): string | null {
  const when = countdown(startsAt, now);
  return when === null ? null : `${formatLateTime(startsAt)} · ${when}`;
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** The countdown with its units spelled out, for screen readers: "starts in 1 hour 20 minutes". */
export function spokenCountdown(startsAt: string, now: string): string | null {
  const { state, minutes } = minutesFromStart(startsAt, now);
  if (state === "ended") return null;
  if (state === "started") return minutes === 0 ? "started just now" : `started ${plural(minutes, "minute")} ago`;
  if (minutes === 0) return "starting now";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const length = [hours > 0 ? plural(hours, "hour") : "", rest > 0 ? plural(rest, "minute") : ""].filter(Boolean).join(" ");
  return `starts in ${length}`;
}

/**
 * The whole row as one sentence (SPEC §7): "Sinners, Filmhouse Lekki, today at 19:30, starts in
 * 45 minutes. Read from Filmhouse's site 2 hours ago." Null once the showing has ended.
 */
export function showingSentence(row: { film: string; cinema: string; startsAt: string; freshness: string }, now: string): string | null {
  const when = spokenCountdown(row.startsAt, now);
  if (when === null) return null;
  const day = formatDay(row.startsAt, now);
  const spokenDay = day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day;
  return `${row.film}, ${row.cinema}, ${spokenDay} at ${formatTime(row.startsAt)}, ${when}. ${row.freshness}.`;
}

// The countdown in two pieces for the pill and the badge; built in lib/time with `countdown`.
export { countdownParts } from "@/lib/time/countdown";

/** A cinema folder's count (Figma 10.3): "7 tonight". */
export const showingsTonight = (count: number) => `${count} tonight`;

/** Under a cinema folder: "Lekki · next 17:40", or the area alone when nothing is left to start. */
export const cinemaNextLine = (area: string, at: string | null) => (at === null ? area : `${area} · next ${formatLateTime(at)}`);

const WEEKDAYS: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

/** A start time for screen readers: "19:30", or "00:30 on Saturday" after midnight. */
export function spokenTime(iso: string): string {
  const day = lateDay(iso);
  return day === null ? formatTime(iso) : `${formatTime(iso)} on ${WEEKDAYS[day] ?? day}`;
}
