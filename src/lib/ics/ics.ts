import { clock24, lagosDayKey, utcMs } from "@/lib/time/lagos";

// The "Remind me" calendar file (RFC 5545). One event in UTC with one alert 30 minutes before.
// It opens in whichever calendar the phone uses; nothing is sent anywhere.

export type IcsShowing = {
  /** The showing's id; makes the event's UID, so adding it twice updates one event. */
  id: string;
  film: string;
  cinema: string;
  /** Only when we know it. Never guessed. */
  address?: string | null;
  startsAt: string;
  runtimeMin?: number | null;
  bookingUrl?: string | null;
  /** The freshness sentence shown on the row, e.g. "Read from Filmhouse's site 2 hours ago". */
  sourceLine: string;
};

const ALERT_MINUTES = 30;
const MAX_LINE_BYTES = 75;
const encoder = new TextEncoder();

/** "20261106T183000Z" */
function stamp(iso: string): string {
  return new Date(utcMs(iso)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Escape text for a property value: backslash, semicolon, comma and line breaks. */
function text(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold a line so no physical line is longer than 75 bytes; continuation lines start with a space. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // Continuation lines carry a leading space, which counts toward their 75 bytes.
    const limit = parts.length === 0 ? MAX_LINE_BYTES : MAX_LINE_BYTES - 1;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const calendar = (event: string[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sinima//Showtimes//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...event, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";

export function buildIcs(showing: IcsShowing, now: string): string {
  const { film, cinema, address, bookingUrl, sourceLine } = showing;
  const duration = showing.runtimeMin && showing.runtimeMin > 0 ? `PT${Math.round(showing.runtimeMin)}M` : "PT2H";
  const booking = bookingUrl ? `Book on the sinima's site: ${bookingUrl}` : "Tickets at the sinima.";
  return calendar([
    "BEGIN:VEVENT",
    `UID:${text(showing.id)}@sinima`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(showing.startsAt)}`,
    `DURATION:${duration}`,
    `SUMMARY:${text(`${film} at ${cinema}`)}`,
    `LOCATION:${text(address ? `${cinema}, ${address}` : cinema)}`,
    `DESCRIPTION:${text(`${booking}\n${sourceLine}. Times can change; check with the sinima.`)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${text(`${film} starts in ${ALERT_MINUTES} min at ${cinema}`)}`,
    `TRIGGER:-PT${ALERT_MINUTES}M`,
    "END:VALARM",
    "END:VEVENT",
  ]);
}

/** A coming film's first day (D-151): the words come from lib/wording/coming (comingCalendar). */
export type IcsDay = { uid: string; /** A Lagos date, "2026-12-18". */ day: string; summary: string; description: string; /** The alert at 9 in the morning of the day. */ alert: string };

/** "20261218" for a real yyyy-mm-dd date, and the day after it: an all-day event ends the next day (RFC 5545 3.6.1). */
function dateValues(day: string): [string, string] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  // Calendar arithmetic only, at UTC midnight: no clock time or zone is involved in a DATE value.
  const ms = match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : NaN;
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== day) throw new Error(`Not a date like 2026-12-18: "${day}"`);
  const value = (at: number) => new Date(at).toISOString().slice(0, 10).replace(/-/g, "");
  return [value(ms), value(ms + 86_400_000)];
}

/** An all-day event on a coming film's first day, with an alert at 9 that morning. */
export function buildAllDayIcs(event: IcsDay, now: string): string {
  const [start, end] = dateValues(event.day);
  return calendar([
    "BEGIN:VEVENT",
    `UID:${text(event.uid)}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${text(event.summary)}`,
    `DESCRIPTION:${text(event.description)}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${text(event.alert)}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
  ]);
}

/** Saves a calendar file through the browser: the phone offers to add it to its calendar. Nothing is sent anywhere. */
export function saveIcs(ics: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  // Not at once: Safari on an iPhone can still be reading the file when the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Lowercase words joined by hyphens, with accents removed: "Ọmọ Ghetto!" -> "omo-ghetto". */
export function fileSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "sinners-filmhouse-lekki-imax-2026-11-06-1930.ics": the Lagos day and time of the showing. */
export function icsFileName(showing: Pick<IcsShowing, "film" | "cinema" | "startsAt">): string {
  // The file name keeps the 24-hour "1930": short, sortable, no space (the screen says 7:30 PM, D-114).
  return `${fileSlug(showing.film)}-${fileSlug(showing.cinema)}-${lagosDayKey(showing.startsAt)}-${clock24(showing.startsAt).replace(":", "")}.ics`;
}
