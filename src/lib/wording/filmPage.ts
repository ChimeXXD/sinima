import { formatTime, toLagos, utcMs, utcString } from "@/lib/time/lagos";
import type { CreditsVerdict } from "@/lib/wording/credits";
import { list } from "@/lib/wording/credits";
import { runtimeText } from "@/lib/wording/film";

// Words on a film's page and its showing sheet (Figma Film 185:3558).

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/**
 * The line under the title, as parts joined by dots: "2 h 25 min · 12A · IMAX · at 4 cinemas in
 * Lagos today". `on` is from dayWords ("today", or "on Fri 13 Nov" before the page has the time).
 */
export function filmFacts(film: { runtimeMin: number | null; rating: string | null }, formats: string[], where: { cinemas: number; city: string; on: string }): string[] {
  const place = where.cinemas > 0 ? `at ${plural(where.cinemas, "cinema")} in ${where.city} ${where.on}` : null;
  const parts = [film.runtimeMin ? runtimeText(film.runtimeMin) : null, film.rating, ...formats, place].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts : ["Runtime not listed"];
}

/**
 * The handwritten note beside the poster: "stay put!" when a source says there is a scene after
 * the credits, "in IMAX!" when it shows in IMAX. Story Script is cut to the letters these need.
 */
export function heroNote(verdict: CreditsVerdict, formats: string[]): string | null {
  if (verdict === "stay") return "stay put!";
  return formats.includes("IMAX") ? "in IMAX!" : null;
}

const WEEKDAYS: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Under "Times in Lagos": "Friday 13 November · your area first". `date` is any instant that day. */
export function timesSubtitle(date: string, homeKnown: boolean): string {
  const p = toLagos(date);
  return `${WEEKDAYS[p.weekday] ?? p.weekday} ${p.day} ${MONTHS[p.month - 1]} · ${homeKnown ? "your area first" : "soonest first"}`;
}

/** The tag beside an area's name. */
export function areaTag(tag: "home" | "next" | null, homeName: string): string | null {
  return tag === "home" ? "your area" : tag === "next" ? `next to ${homeName}` : null;
}

/** The box under today's list: who started earlier, and tomorrow's count. Null when it has nothing to say. */
export function earlierLine(started: { name: string; at: string }[], tomorrow: { showings: number; cinemas: number }): string | null {
  const parts = [
    started.length > 0 ? `Started earlier today: ${list(started.map((s) => `${s.name} at ${formatTime(s.at)}`))}.` : null,
    tomorrow.showings > 0 ? `Tomorrow: ${plural(tomorrow.showings, "showing")} at ${plural(tomorrow.cinemas, "cinema")}.` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

/** Under the sheet's title: "Ramayana: Rise of a Legend · IMAX · Lekki". */
export const showingSubtitle = (film: string, format: string | null, area: string) => [film, format, area].filter(Boolean).join(" · ");

/** Add to calendar's line: "6:00 PM to 9:21 PM, with an alert 30 min before." */
export function calendarLine(at: string, runtimeMin: number | null): string {
  const span = runtimeMin ? `${formatTime(at)} to ${formatTime(utcString(utcMs(at) + runtimeMin * 60_000))}` : formatTime(at);
  return `${span}, with an alert 30 min before.`;
}

export type BookCase = { kind: "book"; chain: string } | { kind: "sample"; chain: string } | { kind: "old"; chain: string; site: boolean } | { kind: "door"; chain: string; address?: string | null };

/** The sheet's first row. Booking is only ever on the cinema's own site; sample and old times can't be booked (D-25). */
export function bookOption(book: BookCase): { title: string; desc: string } {
  switch (book.kind) {
    case "book":
      return { title: `Book on ${book.chain}'s site`, desc: "Opens their booking page. We never sell tickets." };
    case "sample":
      return { title: "Sample only", desc: "These are saved sample times, so they can't be booked." };
    case "old":
      return { title: book.site ? `Check on ${book.chain}'s site` : "Check with the cinema", desc: "These times are old. Check them before you go." };
    case "door":
      return { title: "Tickets at the cinema", desc: book.address ?? "Buy them at the box office." };
  }
}

/** The note on a showing that has started (Figma: Started showing). */
export function startedNotice(at: string, next: "near" | "city" | "none", city = "Lagos"): string {
  const lead = `This showing started at ${formatTime(at)}, so it can't be booked here.`;
  if (next === "none") return `${lead} Nothing else starts today.`;
  return `${lead} The next times ${next === "near" ? "nearby" : `in ${city}`}:`;
}

/** Under a next time's cinema: its area, or "This cinema, in IMAX". */
export function nextPlace(next: { same: boolean; area: string; format: string | null }): string {
  if (!next.same) return next.area;
  return next.format ? `This cinema, in ${next.format}` : "This cinema";
}

/** The text that goes with a shared link: "Sinners · Filmhouse Lekki · Fri 7:30 PM" (UI brief §5), or a film's times. */
export function shareText(what: { film: string; cinema: string; at: string } | { film: string; city: string }): string {
  if ("city" in what) return `${what.film} · times in ${what.city}`;
  // A plain space before PM: shared text is pasted into chats and searched, where a no-break space is not one.
  return `${what.film} · ${what.cinema} · ${toLagos(what.at).weekday} ${formatTime(what.at).replace("\u00a0", " ")}`;
}

/** When a day has no cinema to list: nothing more today, or no times listed for that day yet. */
export function noTimes(film: string, on: string, todayIsOver: boolean): string {
  return todayIsOver ? `Nothing more starts ${on}.` : `No times for ${film} are listed ${on} yet.`;
}

/**
 * A cinema's address on its card: without the city (the page says it) and without a note left in
 * the registry, e.g. "Maryland Mall, Maryland, Lagos (no street address found)" → "Maryland Mall, Maryland".
 */
export const shortAddress = (address: string) => address.replace(/\s*\([^)]*\)\s*$/, "").replace(/,\s*(Lagos|Abuja)$/, "");
