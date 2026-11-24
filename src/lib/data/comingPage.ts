import type { City } from "@/lib/city";
import { presaleDays, type ComingFilm } from "@/lib/data/coming";
import { toListData } from "@/lib/data/listData";
import type { ListData } from "@/lib/data/select";
import type { ShowtimesFile } from "@/lib/data/types";
import { comingCal } from "@/lib/ics/calHref";
import { eveningDayKey } from "@/lib/time/lagos";
import { calendarAction, leafWords, onSaleLine, openingSubtitle, openingTile, opensChip, opensLine, opensOnSaleChip, timesNotUp } from "@/lib/wording/coming";
import { list } from "@/lib/wording/list";

// Build time: Coming soon's cards and a coming film's page as the words the pages send (D-151). Every
// word is a date the sinima gave, never relative to now (rule 3), so it is made here once and the
// pages' scripts carry no date or calendar wording (the page budget, D-153).

/** The calendar leaf on a poster: "Dec" over "18". */
export type Leaf = { month: string; day: string };

/**
 * One card under Coming soon on Films, as a tuple (the page carries it, and Films holds the budget's
 * last kilobyte, D-153): the film's id, title and TMDB poster path, "Opens Fri 18 Dec" (or "Date not
 * announced"), the sinimas listing it, and the leaf's month and day when it has a date. A film with
 * tickets on sale (D-194) names who sells them in place of the sinimas, and ends with 1: its sticker.
 */
export type ComingCard = [id: string, title: string, poster: string | null, opens: string, sinimas: string, month?: string, day?: string, sale?: 1];

/** One day on sale on a coming film's page: its line, its tile, and how many of the rows are its own. */
export type OpeningDay = { count: number; subtitle: string; tile: { weekday: string; date: string; label: string } };

/**
 * The times on sale on a coming film's page (D-194), each of its first five days that has any (D-199):
 * the days in order, and every day's showings in `data`, soonest first, so each day's `count` rows follow
 * the day before's and the page cuts them apart with no date code.
 */
export type Opening = { days: OpeningDay[]; data: ListData };

/** What a coming film's page shows in place of the times, or, with tickets on sale, beside them. */
export type ComingPage = { leaf: Leaf | null; chip: string; note: string; calendar: { label: string; href: string } | null; opening?: Opening };

/**
 * Who sells each film on sale, by film id: "6 Filmhouses" (D-194), counted over every day on sale
 * (D-199). `file`: a city's presales as its showings. With `coming` (the city's coming films), only the
 * first five days from each film's first date there count: the days its page lists, so a card never
 * carries the sticker for a page with no times (the pipeline keeps the days from any sinima's date).
 */
export function soldBy(file: ShowtimesFile, coming?: ComingFilm[]): Map<string, string> {
  const cinemas = new Map(file.cinemas.map((cinema) => [cinema.id, cinema]));
  const windows = coming && new Map(coming.flatMap(({ film, firstDay }) => (firstDay ? [[film.id, new Set(presaleDays(firstDay))] as const] : [])));
  const byKey = new Map<string, Set<string>>();
  for (const showing of file.showings) {
    if (windows && !windows.get(showing.filmId)?.has(eveningDayKey(showing.startsAt))) continue;
    byKey.set(showing.filmId, (byKey.get(showing.filmId) ?? new Set()).add(showing.cinemaId));
  }
  return new Map([...byKey].map(([key, ids]) => [key, onSaleLine([...ids].map((id) => cinemas.get(id)!))]));
}

/** One film's presales on its first five days in a city as list data, soonest first, or null when none are on sale. */
export function presaleData(file: ShowtimesFile, filmId: string, firstDay: string): ListData | null {
  const window = new Set(presaleDays(firstDay));
  const data = toListData({ ...file, showings: file.showings.filter((showing) => window.has(eveningDayKey(showing.startsAt))) }, { filmId });
  return data.rows.length > 0 ? data : null;
}

/** Each day on sale, in order, with its line, tile and number of rows. */
function openingDays(data: ListData, firstDay: string): OpeningDay[] {
  const counts = new Map<string, number>();
  for (const row of data.rows) counts.set(eveningDayKey(row.at), (counts.get(eveningDayKey(row.at)) ?? 0) + 1);
  return presaleDays(firstDay).flatMap((day) => (counts.has(day) ? [{ count: counts.get(day)!, subtitle: openingSubtitle(day, firstDay), tile: openingTile(day, firstDay) }] : []));
}

export const comingCards = (entries: ComingFilm[], sold: Map<string, string> = new Map()): ComingCard[] =>
  entries.map(({ film, firstDay, sinimas }): ComingCard => {
    const seller = firstDay ? sold.get(film.id) : undefined;
    const words = [film.id, film.title, film.posterPath ?? null, opensLine(firstDay), seller ?? list(sinimas)] as const;
    if (!firstDay) return [...words];
    const { month, day } = leafWords(firstDay);
    return seller ? [...words, month, day, 1] : [...words, month, day];
  });

export function comingPage({ film, firstDay, sinimas }: ComingFilm, city: City, presale: ListData | null = null): ComingPage {
  const page = { chip: opensChip(firstDay, sinimas), note: timesNotUp(film.title, sinimas, firstDay) };
  if (!firstDay) return { ...page, leaf: null, calendar: null };
  const dated = { ...page, leaf: leafWords(firstDay), calendar: { label: calendarAction(firstDay), href: comingCal(city, film.id, firstDay) } };
  if (!presale) return dated;
  return { ...dated, chip: opensOnSaleChip(firstDay), opening: { days: openingDays(presale, firstDay), data: presale } };
}
