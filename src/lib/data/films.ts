import type { FormatTag } from "@/lib/data/format";
import { anchorFor, byCinema, byFilm, dayOf, showingOn, type Day } from "@/lib/data/programme";
import { startsSoon, type ListRow } from "@/lib/data/select";

// The Films screen's sections (Figma 175:3480). Today, once the page knows the time: the films
// with a showing in the next 2 hours, then the rest of tonight. Another day, a chosen format, or
// the page's own HTML (no clock, rule 3): one list. Soonest first; a started showing is gone (D-05).

export type FilmEntry = { film: number; /** The showing the card counts down to. */ next: string; /** Cinemas showing it that day. */ cinemas: number; rows: ListRow[] };
export type FilmSection = { key: "soon" | "later" | "day" | "format"; films: FilmEntry[] };

const entry = (group: { film: number; rows: ListRow[] }): FilmEntry => ({
  film: group.film,
  next: group.rows[0]!.at,
  cinemas: new Set(group.rows.map((row) => row.cinema)).size,
  rows: group.rows,
});

export function filmSections(rows: ListRow[], day: Day, now: string, live: boolean, format: FormatTag | null): FilmSection[] {
  const groups = byFilm(showingOn(rows, day, now, format, !live));
  if (groups.length === 0) return [];
  if (format !== null) return [{ key: "format", films: groups.map((group) => entry(group)) }];
  if (!live || day === 1) return [{ key: "day", films: groups.map((group) => entry(group)) }];

  const soon: FilmEntry[] = [];
  const later: FilmEntry[] = [];
  // Live rows are in time order and none has started, so a film's first row is its soonest.
  for (const group of groups) (startsSoon(group.rows[0]!.at, now) ? soon : later).push(entry(group));
  const sections: FilmSection[] = [];
  if (soon.length > 0) sections.push({ key: "soon", films: soon });
  if (later.length > 0) sections.push({ key: "later", films: later });
  return sections;
}

/**
 * With a format chosen: the chains whose cinemas say which format a showing is in, and how many
 * cinemas showing films that day give no format at all (they are left out, not guessed).
 */
export function formatCoverage(rows: ListRow[], day: Day, now: string, live: boolean, chainOf: (cinema: number) => string): { chains: string[]; silent: number } {
  const cinemas = byCinema(showingOn(rows, day, now, null, !live));
  const telling = cinemas.filter((group) => group.rows.some((row) => row.format !== null));
  return { chains: [...new Set(telling.map((group) => chainOf(group.cinema)))].sort(), silent: cinemas.length - telling.length };
}

/** When today's last showing started: for "Nothing more starts today". */
export function lastStart(rows: ListRow[], now: string): string | null {
  const anchor = anchorFor(rows, now);
  const today = rows.filter((row) => dayOf(row.at, anchor) === 0).map((row) => row.at).sort();
  return today.at(-1) ?? null;
}
