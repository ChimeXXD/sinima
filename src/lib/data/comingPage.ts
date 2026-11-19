import type { City } from "@/lib/city";
import type { ComingFilm } from "@/lib/data/coming";
import type { IcsDay } from "@/lib/ics/ics";
import { SITE_URL } from "@/lib/share/meta";
import { calendarAction, comingCalendar, leafWords, opensChip, opensLine, timesNotUp } from "@/lib/wording/coming";
import { list } from "@/lib/wording/list";

// Build time: Coming soon's cards and a coming film's page as the words the pages send (D-151). Every
// word is a date the sinima gave, never relative to now (rule 3), so it is made here once and the
// pages' scripts carry no date or calendar wording (the page budget, D-153).

/** The calendar leaf on a poster: "Dec" over "18". */
export type Leaf = { month: string; day: string };

/**
 * One card under Coming soon on Films, as a tuple (the page carries it, and Films holds the budget's
 * last kilobyte, D-153): the film's id, title and TMDB poster path, "Opens Fri 18 Dec" (or "Date not
 * announced"), the sinimas listing it, and the leaf's month and day when it has a date.
 */
export type ComingCard = [id: string, title: string, poster: string | null, opens: string, sinimas: string, month?: string, day?: string];

/** What a coming film's page shows in place of the times. */
export type ComingPage = { leaf: Leaf | null; chip: string; note: string; calendar: { label: string; event: IcsDay; fileName: string } | null };

export const comingCards = (entries: ComingFilm[]): ComingCard[] =>
  entries.map(({ film, firstDay, sinimas }): ComingCard => {
    const words = [film.id, film.title, film.posterPath ?? null, opensLine(firstDay), list(sinimas)] as const;
    if (!firstDay) return [...words];
    const { month, day } = leafWords(firstDay);
    return [...words, month, day];
  });

export function comingPage({ film, firstDay, sinimas }: ComingFilm, city: City): ComingPage {
  const page = { chip: opensChip(firstDay, sinimas), note: timesNotUp(film.title, sinimas, firstDay) };
  if (!firstDay) return { ...page, leaf: null, calendar: null };
  const { fileName, ...event } = comingCalendar({ film: film.title, filmId: film.id, sinimas, firstDay, city, url: `${SITE_URL}/${city}/film/${film.id}` });
  return { ...page, leaf: leafWords(firstDay), calendar: { label: calendarAction(firstDay), event, fileName } };
}
