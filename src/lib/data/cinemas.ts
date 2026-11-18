import type { FormatTag } from "@/lib/data/format";
import { showingOn, type Day } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";

// The Cinemas tab (Figma Cinemas 200:6415): every cinema in the city, grouped by your area, the
// areas next to it, then the rest. Inside a group, the soonest next showing first; then the
// cinemas with nothing left that day; then the ones whose times we cannot read yet.

/** `rows` are the cinema's showings on the day still to start (the whole day before the time is known). `listed` is false when the data has no times for it on any day. */
export type CinemaEntry = { cinema: number; rows: ListRow[]; listed: boolean };
export type CinemaSection = { key: "area" | "next" | "rest" | "all"; cinemas: CinemaEntry[] };
export type Home = { slug: string; neighbours: string[] };

/**
 * `known` are every row the page has (a later day's `rows` are only that day's, D-147) and
 * `alsoListed` the cinemas listing a later day: a cinema in either has times, just not that day
 * (D-146). `anchor`: the page's, for a later day's rows (showingOn).
 */
export function cinemaSections(input: { rows: ListRow[]; known?: ListRow[]; alsoListed?: number[]; cinemas: number; areaOf: (cinema: number) => string; day: Day; now: string; live: boolean; format: FormatTag | null; home: Home | null; anchor?: string }): CinemaSection[] {
  const { rows, known = rows, alsoListed = [], cinemas, areaOf, day, now, live, format, home, anchor } = input;
  const on = showingOn(rows, day, now, format, !live, anchor);
  const listed = new Set([...[...known, ...rows].map((row) => row.cinema), ...alsoListed]);
  const entries = Array.from({ length: cinemas }, (_, cinema): CinemaEntry => ({ cinema, rows: on.filter((row) => row.cinema === cinema), listed: listed.has(cinema) }))
    // With a format chosen, only the cinemas showing in it.
    .filter((entry) => format === null || entry.rows.length > 0);
  const order = new Map(on.map((row, index) => [row, index]));
  const rank = (entry: CinemaEntry) => (entry.rows.length > 0 ? 0 : entry.listed ? 1 : 2);
  // Soonest first in the rows' own order (time, then showing), as everywhere else; the rest keep the registry's order.
  entries.sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? order.get(a.rows[0]!)! - order.get(b.rows[0]!)! : 0));

  const sections: CinemaSection[] = home
    ? [
        { key: "area", cinemas: entries.filter((entry) => areaOf(entry.cinema) === home.slug) },
        { key: "next", cinemas: entries.filter((entry) => home.neighbours.includes(areaOf(entry.cinema))) },
        { key: "rest", cinemas: entries.filter((entry) => areaOf(entry.cinema) !== home.slug && !home.neighbours.includes(areaOf(entry.cinema))) },
      ]
    : [{ key: "all", cinemas: entries }];
  return sections.filter((section) => section.cinemas.length > 0);
}
