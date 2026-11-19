import { toListData } from "@/lib/data/listData";
import { type ListData } from "@/lib/data/select";
import { withShowingIds } from "@/lib/data/showingId";
import type { ShowtimesFile } from "@/lib/data/types";

// A later day's file (D-147) as the list data the screens already use. Loaded only when a visitor
// picks that day, so a page that never opens one doesn't carry this code (the page budget, D-21).

/**
 * The day's rows on the page's own cinemas, so a sinima is the same position on every day; the
 * films are the day's own (one may be showing only that day). `only` keeps one film's or one
 * sinima's rows, as the page does.
 */
export function laterDayData(file: ShowtimesFile, page: ListData, only: { filmId?: string; cinemaId?: string } = {}): ListData {
  const day = toListData(file, only);
  const at = new Map(page.cinemas.map((cinema, i) => [cinema.id, i]));
  const rows = day.rows.flatMap((row) => {
    const cinema = at.get(day.cinemas[row.cinema]!.id);
    return cinema === undefined ? [] : [{ ...row, cinema }];
  });
  return { sample: day.sample, at: day.at, films: day.films, cinemas: page.cinemas, fresh: day.fresh, rows };
}

const files = new Map<string, Promise<ShowtimesFile>>();

/** Fetches a later day's file once a visit; a failed fetch is forgotten, so it can be tried again. */
export function fetchDay(url: string): Promise<ShowtimesFile> {
  let got = files.get(url);
  if (!got) {
    got = fetch(url)
      .then((response) => (response.ok ? (response.json() as Promise<ShowtimesFile>) : Promise.reject(new Error(`${url}: ${response.status}`))))
      // The file leaves out each showing's usual id (D-156).
      .then((file) => (file?.schemaVersion === 1 && Array.isArray(file.showings) ? withShowingIds(file) : Promise.reject(new Error(`${url} is not a showtimes file`))));
    got.catch(() => files.delete(url));
    files.set(url, got);
  }
  return got;
}
