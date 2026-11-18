import type { ListData, ListFresh } from "@/lib/data/select";
import type { ListFeatured } from "@/lib/data/featured";
import type { CreditsInfo, ShowtimesFile } from "@/lib/data/types";
import { creditsWording } from "@/lib/wording/credits";

// A data file as the list data a page sends to the browser (select.ts holds its shape). Build time,
// and a later day's file when a visitor picks it (D-147): kept apart from select.ts so a page's own
// script doesn't carry it (the page budget, D-21).

const UNKNOWN_CREDITS: CreditsInfo = { during: "unknown", after: "unknown", confidence: "unknown", sources: [], count: null };

/** A data file as list rows in start-time order. `filmId` keeps one film's showings only. */
export function toListData(file: ShowtimesFile, only: { filmId?: string; cinemaId?: string } = {}): ListData {
  const showings = file.showings
    .filter((showing) => only.filmId === undefined || showing.filmId === only.filmId)
    .filter((showing) => only.cinemaId === undefined || showing.cinemaId === only.cinemaId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));
  const films = file.films.filter((film) => showings.some((showing) => showing.filmId === film.id));
  const filmAt = new Map(films.map((film, i) => [film.id, i]));
  const cinemaAt = new Map(file.cinemas.map((cinema, i) => [cinema.id, i]));
  const sourceById = new Map(file.sources.map((source) => [source.id, source]));

  const fresh: ListFresh[] = [];
  const freshAt = new Map<string, number>();
  const rows = showings.map((showing) => {
    const key = JSON.stringify([showing.sourceId, showing.fetchedAt, showing.via ?? null]);
    if (!freshAt.has(key)) {
      const source = sourceById.get(showing.sourceId);
      if (!source) throw new Error(`Showing ${showing.id} names a source that is not in the file`);
      freshAt.set(key, fresh.length);
      fresh.push({ source: source.name, method: source.method, url: source.url, fetchedAt: showing.fetchedAt, ...(showing.via ? { via: showing.via } : {}) });
    }
    const film = filmAt.get(showing.filmId);
    const cinema = cinemaAt.get(showing.cinemaId);
    if (film === undefined || cinema === undefined) throw new Error(`Showing ${showing.id} names a film or cinema that is not in the file`);
    return {
      at: showing.startsAt,
      film,
      cinema,
      format: showing.format,
      book: showing.bookingUrl,
      fresh: freshAt.get(key) as number,
    };
  });
  // Real times win: the list goes only to cinemas with no showing in the whole file, not just in this cut.
  const timed = new Set(file.showings.map((showing) => showing.cinemaId));
  // A film's page never shows the line, so it is not sent there (page weight, rule 9).
  const featured = (only.filmId === undefined ? (file.featured ?? []) : [])
    .map((entry): ListFeatured => ({ cinemas: entry.cinemaIds.filter((id) => !timed.has(id) && cinemaAt.has(id)).map((id) => cinemaAt.get(id) as number), day: entry.day, films: entry.films.map((film) => film.title) }))
    .filter((entry) => entry.cinemas.length > 0 && entry.films.length > 0);
  return {
    ...(featured.length > 0 ? { featured } : {}),
    sample: file.sample,
    at: file.generatedAt,
    films: films.map((film) => {
      const { verdict, chip, detail } = creditsWording(film.credits ?? UNKNOWN_CREDITS);
      return { id: film.id, title: film.title, poster: film.posterPath ?? null, trailer: film.trailerKey ?? null, rating: film.rating, runtimeMin: film.runtimeMin, stay: { verdict, chip, detail } };
    }),
    cinemas: file.cinemas.map(({ id, name, area, chain, address, website, bookingHost }) => ({ id, name, area, chain, online: Boolean(bookingHost), address, website })),
    fresh,
    rows,
  };
}
