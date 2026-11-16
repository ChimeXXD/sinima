import { showingOn } from "@/lib/data/programme";
import { groupShowings, type ListRow } from "@/lib/data/select";
import { countdownStart } from "@/lib/saved";
import { isBeforeStart, showingState } from "@/lib/time/showingState";

// Starting soon (Figma 204:7192 Default, 204:7931 Nothing in 2 hours): in the chosen place, what
// starts in the next 2 hours, then the rest of tonight. With nothing in the next 2 hours, the page
// says what there is instead: later here, soon in the areas next to it, what is left in the city
// tonight, and the place's first showing tomorrow. Before the page knows the time nothing is
// "soon" (rule 3): it lists the day.

/** An area and the areas next to it (data/cinemas.json), or null for all of the city. */
export type Place = { slug: string; neighbours: string[] } | null;

/** Shown in place of the next 2 hours when nothing starts in them. */
export type Quiet =
  /** More later here: the next one; the later list follows. */
  | { kind: "later"; next: ListRow }
  /** Nothing more here tonight, but the areas next to it have times in the next 2 hours. */
  | { kind: "nearby"; areas: string[]; rows: ListRow[] }
  /** Nothing here or next door: what is left in the city tonight, and tomorrow here. `areas` were checked. */
  | { kind: "city"; areas: string[]; rows: ListRow[]; tomorrow: ListRow | null };

export type SoonPage = { soon: ListRow[]; later: ListRow[]; day: ListRow[]; quiet: Quiet | null };

export function soonPage(input: { rows: ListRow[]; areaOf: (cinema: number) => string; place: Place; now: string; live: boolean }): SoonPage {
  const { rows, areaOf, place, now, live } = input;
  const inPlace = (row: ListRow) => place === null || areaOf(row.cinema) === place.slug;
  if (!live) return { soon: [], later: [], day: showingOn(rows, 0, now, null, true).filter(inPlace), quiet: null };

  const city = groupShowings(rows, now);
  const soon = city.soon.filter(inPlace);
  const later = city.later.filter(inPlace);
  const page = { soon, later, day: [], quiet: null };
  if (soon.length > 0) return page;
  if (later.length > 0) return { ...page, quiet: { kind: "later", next: later[0]! } };

  const neighbours = place?.neighbours ?? [];
  const nearby = city.soon.filter((row) => neighbours.includes(areaOf(row.cinema)));
  if (nearby.length > 0) return { ...page, quiet: { kind: "nearby", areas: neighbours.filter((slug) => nearby.some((row) => areaOf(row.cinema) === slug)), rows: nearby } };
  return { ...page, quiet: { kind: "city", areas: neighbours, rows: [...city.soon, ...city.later], tomorrow: city.tomorrow.find(inPlace) ?? null } };
}

/** The area chips: the kept area, then the areas next to it (Figma); with none kept, every area. */
export function chipAreas(areas: { slug: string; neighbours: string[] }[], kept: string | null): string[] {
  const home = areas.find((area) => area.slug === kept);
  return home ? [home.slug, ...home.neighbours.filter((slug) => areas.some((area) => area.slug === slug))] : areas.map((area) => area.slug);
}

const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/;

/**
 * The showings kept with "Keep a countdown" (ls.countdowns) that are still to start, soonest first,
 * wherever they are. One no longer in the data is left out.
 */
export function keptRows(rows: ListRow[], ids: string[], id: { film: (film: number) => string; cinema: (cinema: number) => string }, now: string): ListRow[] {
  // An id the site didn't write (storage edited by hand) is skipped, never read as a time.
  const wanted = new Set(ids.filter((kept) => UTC.test(countdownStart(kept)) && isBeforeStart(showingState(countdownStart(kept), now))));
  return rows.filter((row) => wanted.has(`${id.film(row.film)}|${id.cinema(row.cinema)}|${row.at}`)).sort((a, b) => a.at.localeCompare(b.at));
}
