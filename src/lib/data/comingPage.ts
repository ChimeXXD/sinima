import type { City } from "@/lib/city";
import type { ComingFilm } from "@/lib/data/coming";
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

/** The opening day's times on a coming film's page (D-194): its line, its one day tile and its showings. */
export type Opening = { subtitle: string; tile: { weekday: string; date: string; label: string }; data: ListData };

/** What a coming film's page shows in place of the times, or, with tickets on sale, beside them. */
export type ComingPage = { leaf: Leaf | null; chip: string; note: string; calendar: { label: string; href: string } | null; opening?: Opening };

/**
 * Who sells each film on sale, by "<film id> <day>" (its evening, a Lagos date): "6 Filmhouses" (D-194).
 * `file`: a city's presales as its showings. Keyed by day, so a card shows the sticker only for the
 * first date it gives, the day its page lists.
 */
export function soldBy(file: ShowtimesFile): Map<string, string> {
  const cinemas = new Map(file.cinemas.map((cinema) => [cinema.id, cinema]));
  const byKey = new Map<string, Set<string>>();
  for (const showing of file.showings) {
    const key = `${showing.filmId} ${eveningDayKey(showing.startsAt)}`;
    byKey.set(key, (byKey.get(key) ?? new Set()).add(showing.cinemaId));
  }
  return new Map([...byKey].map(([key, ids]) => [key, onSaleLine([...ids].map((id) => cinemas.get(id)!))]));
}

/** One film's presales on its first date in a city as list data, soonest first, or null when none are on sale that day. */
export function presaleData(file: ShowtimesFile, filmId: string, firstDay: string): ListData | null {
  const data = toListData({ ...file, showings: file.showings.filter((showing) => eveningDayKey(showing.startsAt) === firstDay) }, { filmId });
  return data.rows.length > 0 ? data : null;
}

export const comingCards = (entries: ComingFilm[], sold: Map<string, string> = new Map()): ComingCard[] =>
  entries.map(({ film, firstDay, sinimas }): ComingCard => {
    const seller = firstDay ? sold.get(`${film.id} ${firstDay}`) : undefined;
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
  return { ...dated, chip: opensOnSaleChip(firstDay), opening: { subtitle: openingSubtitle(firstDay), tile: openingTile(firstDay), data: presale } };
}
