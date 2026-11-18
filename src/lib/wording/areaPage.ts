import { formatLateTime } from "@/lib/time/lagos";
import { cinemaCount } from "@/lib/wording/cinemas";
import { shortAddress } from "@/lib/wording/filmPage";

// Every sentence on an area's page (Figma Area 200:6420). `when` is "tonight" or "today" once the
// page knows the time, and null before (rule 3): then no line says tonight, today or next.

type When = "tonight" | "today" | null;
/** What the next day is called: after midnight it is later the same calendar day (select.ts nextDayName). */
type NextDay = "Tomorrow" | "Later today";
const films = (n: number) => `${n} ${n === 1 ? "film" : "films"}`;

type HeadingInput = { key: "saved"; area: string } | { key: "area"; area: string; afterSaved: boolean; quiet: boolean } | { key: "next"; area: string; quiet: boolean };

/** A group's heading and the line under it (null: none). */
export function areaHeading(input: HeadingInput): { title: string; note: string | null } {
  switch (input.key) {
    case "saved":
      return { title: `Your sinimas in ${input.area}`, note: "Saved on this phone" };
    case "area":
      return { title: input.afterSaved ? `More sinimas in ${input.area}` : `In ${input.area}`, note: input.quiet ? null : "Soonest first" };
    case "next":
      // Leading the quiet page, the neighbours are where to go: soonest first says so.
      return { title: `Next to ${input.area}`, note: input.quiet ? "Soonest first" : null };
  }
}

/** Where a cinema is, in a word or two: the last part of its address before the city ("Lekki Phase 1"), or its area. */
export function locality(address: string | null, area: string): string {
  return address ? (shortAddress(address).split(",").at(-1)?.trim() ?? area) : area;
}

/**
 * The line under a cinema's name. With times: "3 films tonight · IMAX"; a kept cinema leads with
 * where it is instead of the formats ("Lekki Phase 1 · 3 films tonight", Figma). With none left:
 * where it is, and when tomorrow starts ("Lagos Island · tomorrow from 12:00 PM").
 */
export function cardLine(input: { films: number; formats: string[]; when: When; place: string | null; tomorrow: string | null; next?: NextDay }): string {
  const { when, place, next = "Tomorrow" } = input;
  if (input.films === 0) return [place, when && input.tomorrow ? `${next.toLowerCase()} from ${formatLateTime(input.tomorrow)}` : null].filter(Boolean).join(" · ");
  const count = when ? `${films(input.films)} ${when}` : films(input.films);
  return (place ? [place, count] : [count, ...input.formats]).join(" · ");
}

/** In place of the times on a cinema with none to show. `date` names the day before the page knows the time. */
export function cardBody(input: { listed: boolean; when: When; tomorrow: { films: number; from: string } | null; date: string; next?: NextDay }): string {
  const { when, tomorrow, next = "Tomorrow" } = input;
  if (!input.listed) return "Times not available yet";
  if (!when) return `No times on ${input.date}.`;
  return `Nothing more ${when}.${tomorrow ? ` ${next}: ${films(tomorrow.films)} from ${formatLateTime(tomorrow.from)}.` : ""}`;
}

/** A neighbouring area's line: "4 sinimas · next 5:40 PM at EbonyLife Cinemas". */
export function nextAreaLine(input: { cinemas: number; next: { at: string; name: string } | null; listed: boolean; when: When }): string {
  const { next, when } = input;
  const count = cinemaCount(input.cinemas);
  if (next) return `${count} · ${when ? "next" : "first"} ${formatLateTime(next.at)} at ${next.name}`;
  if (!input.listed) return `${count} · times not available yet`;
  return when ? `${count} · nothing more ${when}` : count;
}

/** The quiet page's heading (Figma: Nothing left tonight). */
export const quietTitle = (area: string, when: "tonight" | "today") => `Nothing more starts in ${area} ${when}`;

/** Under it: whose showing began last, and whether the areas next to it still have times. */
export function quietWhy(input: { last: { name: string; at: string } | null; cinemas: number; neighbours: number; neighboursWithTimes: number; when: "tonight" | "today" }): string {
  const { last, when } = input;
  const first = !last ? `No sinima here has a showing ${when}.` : input.cinemas === 1 ? `${last.name}${last.name.endsWith("s") ? "'" : "'s"} last showing began at ${formatLateTime(last.at)}.` : `The last showing here began at ${formatLateTime(last.at)}, at ${last.name}.`;
  const { neighbours, neighboursWithTimes: open } = input;
  const then =
    open === 0 ? `Nothing more starts next to it ${when} either.`
    : neighbours === 1 ? `The area next to it still has times ${when}.`
    : open < neighbours ? `${open === 1 ? "One area" : `${open} areas`} next to it still ${open === 1 ? "has" : "have"} times ${when}.`
    : `The areas next to it still have times ${when}.`;
  return `${first} ${then}`;
}

/** An area page's name: its tab title and share title, "Sinimas in Lekki" (D-138). */
export const areaTitle = (area: string) => `Sinimas in ${area}`;

/** The share sheet's text for an area. */
export const areaShareText = (area: string, city: string) => `${areaTitle(area)}, ${city} · times on Sinima`;
