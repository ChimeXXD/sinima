import { featuredAt, type ListFeatured } from "@/lib/data/featured";
import { formatDate } from "@/lib/time/lagos";
import { list } from "@/lib/wording/credits";

// The line on a chain's cinema whose times we can't read (D-131): the films the chain's own home
// page features today. Every film it features, never "and N more", and never "everything it shows":
// the page's banner is a promotion, not the programme.

/**
 * "Filmhouse's home page features Ghost Soldier and Dear Ajayi today." `today` is null before the
 * page knows the time (the date instead, rule 3); false (another day) or no films says nothing.
 */
export function featuredLine(input: { chain: string; films: string[]; day: string; today: boolean | null }): string | null {
  if (input.films.length === 0 || input.today === false) return null;
  const when = input.today ? "today" : `on ${formatDate(`${input.day}T11:00:00Z`)}`;
  return `${input.chain}'s home page features ${list(input.films)} ${when}.`;
}

/** One cinema's line (a position in ListData), or null: its chain's featured films, on their day only. */
export function featuredFor(data: { featured?: ListFeatured[]; cinemas: { chain: string }[] }, cinema: number, now: string | null): string | null {
  const found = featuredAt(data, cinema, now);
  return found && featuredLine({ chain: data.cinemas[cinema]!.chain, ...found });
}

/** After it on the cinema's page, beside the button to its site. */
export const featuredTimes = (chain: string) => `All times are on ${chain}'s site.`;
