import { utcMs } from "./lagos";
import { showingState, type ShowingState } from "./showingState";

const MIN = 60_000;

/** Whole minutes to the start (or since it), rounded down, with the showing's state. */
export function minutesFromStart(startsAt: string, now: string): { state: ShowingState; minutes: number } {
  return { state: showingState(startsAt, now), minutes: Math.floor(Math.abs(utcMs(startsAt) - utcMs(now)) / MIN) };
}

/**
 * The countdown in two pieces for the pill and the badge (Figma 11.1, 11.2): a quiet lead and a
 * strong value, e.g. "Starts in" / "1 h 20 min", "Starting" / "now", "Started" / "5 min ago".
 * Null once the showing has ended. Minutes round down, so it never promises more time than there is.
 */
export function countdownParts(startsAt: string, now: string): { lead: string; value: string } | null {
  const { state, minutes } = minutesFromStart(startsAt, now);
  if (state === "ended") return null;
  if (state === "started") return { lead: "Started", value: minutes === 0 ? "just now" : `${minutes} min ago` };
  if (minutes === 0) return { lead: "Starting", value: "now" };
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const value = hours === 0 ? `${minutes} min` : rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  return { lead: "Starts in", value };
}

/**
 * "Starts in 1 h 20 min", "Starts in 45 min", "Starting now", "Started 5 min ago", or null once the
 * showing has ended: `countdownParts` joined with a space, so the two never disagree.
 */
export function countdown(startsAt: string, now: string): string | null {
  const parts = countdownParts(startsAt, now);
  return parts === null ? null : `${parts.lead} ${parts.value}`;
}

const RING_MS = 120 * MIN;

/**
 * How much of the countdown ring is filled, 0 to 1: the share of the last 2 hours that has gone by
 * (Figma 11.2). Empty more than 2 h out, full from the start.
 */
export function countdownShare(startsAt: string, now: string): number {
  const left = utcMs(startsAt) - utcMs(now);
  return Math.min(1, Math.max(0, (RING_MS - left) / RING_MS));
}
