import { formatTime } from "@/lib/time/lagos";

// Words on the Films screen (Figma 175:3480): section headings, the format note and the
// "Nothing more starts today" state.

export const filmCount = (n: number) => `${n} ${n === 1 ? "film" : "films"}`;

type SectionInput =
  | { key: "soon"; count: number }
  | { key: "later"; count: number; later: string }
  | { key: "format"; count: number; format: string; on: string; city: string }
  | { key: "day"; count: number; on: string; live: boolean };

/**
 * A section's heading and the line beside it. `on` is from dayWords: "today", "tomorrow", or
 * "on Fri 13 Nov" before the page knows the time.
 */
export function sectionWords(input: SectionInput): { title: string; note: string } {
  switch (input.key) {
    case "soon":
      return { title: "Now showing", note: `${filmCount(input.count)} ${input.count === 1 ? "starts" : "start"} in the next 2 hours` };
    case "later":
      return { title: input.later, note: filmCount(input.count) };
    case "format":
      return { title: `In ${input.format}`, note: `${filmCount(input.count)} in ${input.city} ${input.on}` };
    case "day":
      return input.live && input.on === "tomorrow" ? { title: "Tomorrow", note: filmCount(input.count) } : { title: "Now showing", note: `${filmCount(input.count)} ${input.on}` };
  }
}

const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

/**
 * Under a format's films (Figma: IMAX chosen): who says which format a showing is in, and how many
 * cinemas say nothing and so are left out. Null when none are left out.
 */
export function formatNote(chains: string[], silent: number): string | null {
  if (silent === 0) return null;
  const left = silent === 1 ? "1 cinema doesn't, so it's left out here; its times are under Any format." : `${silent} cinemas don't, so they're left out here; their times are under Any format.`;
  if (chains.length === 0) return `No cinema says which format its showings are in, so none is listed here; every time is under Any format.`;
  return `Only ${list(chains)} ${chains.length === 1 ? "says" : "say"} which format each showing is in. ${left}`;
}

/** Figma's empty state once today is over. With no times for tomorrow yet, there is nothing to offer. */
export function nothingMoreToday(input: { city: string; last: string | null; tomorrowFilms: number; tomorrowFirst: string | null }): { title: string; body: string; action: string | null; note: string } {
  const began = input.last === null ? `Nothing more is showing in ${input.city} today.` : `The last showing in ${input.city} began at ${formatTime(input.last)}.`;
  const tomorrow = input.tomorrowFilms > 0 && input.tomorrowFirst !== null ? `Tomorrow's times are in: ${filmCount(input.tomorrowFilms)} from ${formatTime(input.tomorrowFirst)}.` : "Tomorrow's times aren't in yet.";
  return { title: "Nothing more starts today", body: `${began} ${tomorrow}`, action: input.tomorrowFilms > 0 ? "See tomorrow" : null, note: "see you tomorrow!" };
}

/** Under every rebuilt screen. */
export const FOOTER_NOTE = "Times come from each cinema's own pages. Always book on the cinema's site.";

/** Under a screen that shows cinema logos (D-57): they only name each cinema, and come off the same day if asked. */
export const LOGO_NOTE = {
  before: "Cinema logos belong to their owners and only name each cinema. A cinema that wants its logo removed can ",
  link: "ask here",
  href: "https://github.com/ChimeXXD/sinima/issues",
  after: "; it goes the same day.",
} as const;

/** On a film with no artwork yet, in two lines. */
export const NO_POSTER = ["Poster not", "listed yet"] as const;

/** When the list is empty for a reason the visitor chose: a search, a format, or a day with no times. */
export function noFilms(input: { query: string; format: string | null; on: string }): string {
  if (input.query) return `No film showing matches "${input.query}".`;
  if (input.format) return `No film is showing in ${input.format} ${input.on}.`;
  return `No times are listed ${input.on}.`;
}
