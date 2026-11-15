import { cinemaSections, type CinemaEntry, type Home } from "@/lib/data/cinemas";
import { showingOn } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";
import { minutesFromStart } from "@/lib/time/countdown";
import { isBeforeStart, showingState } from "@/lib/time/showingState";

// An area's page (Figma Area 200:6420): the cinemas kept on this phone first, then the area's
// other cinemas soonest first (then those with nothing left, then those we can't read), then the
// areas next to it, soonest first. Once nothing more starts in the area tonight it is "quiet":
// the page says so and the areas next to it lead.

/** One of the area's cinemas: today's rows still to start, and tomorrow's for when none are left. */
export type AreaCinema = CinemaEntry & { tomorrow: ListRow[] };
/** A neighbouring area's card: how many cinemas, its soonest showing, up to three chains' logos. */
export type NextArea = { slug: string; cinemas: number; next: ListRow | null; chains: string[]; listed: boolean };
export type AreaPage = { saved: AreaCinema[]; others: AreaCinema[]; next: NextArea[]; quiet: boolean; last: ListRow | null };

const LOGOS = 3;

export function areaPage(input: { rows: ListRow[]; cinemas: number; areaOf: (cinema: number) => string; chainOf: (cinema: number) => string; home: Home; saved: (cinema: number) => boolean; now: string; live: boolean }): AreaPage {
  const { rows, areaOf, chainOf, home, saved, now, live } = input;
  const sections = cinemaSections({ rows, cinemas: input.cinemas, areaOf, day: 0, now, live, format: null, home });
  const tomorrow = showingOn(rows, 1, now);
  const here = (sections.find((section) => section.key === "area")?.cinemas ?? []).map((entry) => ({ ...entry, tomorrow: tomorrow.filter((row) => row.cinema === entry.cinema) }));
  const nearby = sections.find((section) => section.key === "next")?.cinemas ?? [];

  const next = home.neighbours
    .map((slug): NextArea => {
      const entries = nearby.filter((entry) => areaOf(entry.cinema) === slug);
      return { slug, cinemas: entries.length, next: entries[0]?.rows[0] ?? null, chains: [...new Set(entries.map((entry) => chainOf(entry.cinema)))].slice(0, LOGOS), listed: entries.some((entry) => entry.listed) };
    })
    .filter((area) => area.cinemas > 0)
    // Soonest first; an area with nothing left keeps its place after them (sort is stable).
    .sort((a, b) => (a.next && b.next ? a.next.at.localeCompare(b.next.at) : Number(a.next === null) - Number(b.next === null)));

  const quiet = live && here.some((entry) => entry.listed) && here.every((entry) => entry.rows.length === 0);
  const today = quiet ? showingOn(rows, 0, now, null, true).filter((row) => areaOf(row.cinema) === home.slug) : [];
  return { saved: here.filter((entry) => saved(entry.cinema)), others: here.filter((entry) => !saved(entry.cinema)), next, quiet, last: today.at(-1) ?? null };
}

/** The times drawn as the soonest ("18:00 in 30 min"): every row at the first start, when it is within the hour. */
export function soonest(rows: ListRow[], now: string | null): Set<ListRow> {
  const first = now === null ? undefined : rows.find((row) => isBeforeStart(showingState(row.at, now)));
  if (!first || minutesFromStart(first.at, now!).minutes > 60) return new Set();
  return new Set(rows.filter((row) => row.at === first.at));
}
