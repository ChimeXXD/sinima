// Films from pages without times, featured (D-131) and coming (D-151), matched to the showings'
// films (D-119) without changing them. Pure.
import type { Featured, Film } from "../src/lib/data/types.ts";
import { comingTitle } from "./coming.ts";
import type { Batch } from "./pipeline.ts";

type Named = { id: string; title: string };

/** Every title the batches' featured and coming lists give, to be matched with the showings' titles. */
export const listedTitles = (batches: Batch[]) => batches.flatMap((batch) => [...(batch.featured?.titles ?? []), ...(batch.coming?.films ?? []).map((film) => comingTitle(film.title))]);

/**
 * A listed title's film: `listed` is the showings' and the lists' titles matched together, so a
 * listed film that is one of the showings' takes that film's id and title (`showingFilms`), and
 * one already in `films` keeps its title there.
 */
export function listMatcher(listed: Map<string, Named>, showingTitles: string[], showingFilms: Map<string, Named>, films: Map<string, Film>): (title: string) => Named {
  const toShowing = new Map(showingTitles.map((title) => [listed.get(title)!.id, showingFilms.get(title)!.id]));
  return (title) => {
    const matched = listed.get(title);
    if (!matched) throw new Error(`"${title}" was not matched with the other titles`);
    const id = toShowing.get(matched.id) ?? matched.id;
    return { id, title: films.get(id)?.title ?? matched.title };
  };
}

/** Each batch's featured films (D-131), matched by `match`. A film twice in one list is listed once. */
export function featuredFilms(batches: Batch[], match: (title: string) => Named): Featured[] {
  return batches.filter((batch) => batch.featured).map((batch) => {
    const picked = new Map<string, string>();
    for (const title of batch.featured!.titles) {
      const { id, title: shown } = match(title);
      if (!picked.has(id)) picked.set(id, shown);
    }
    return { sourceId: batch.sourceId, cinemaIds: batch.featured!.cinemaIds, day: batch.featured!.day, fetchedAt: batch.fetchedAt, films: [...picked].map(([id, title]) => ({ id, title })) };
  });
}
