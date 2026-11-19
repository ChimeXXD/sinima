import { CITIES } from "@/lib/city";
import { comingIn } from "@/lib/data/filmPages";
import { loadCity, loadLater } from "@/lib/data/load";
import type { ShowtimesFile } from "@/lib/data/types";
import { buildAllDayIcs, buildIcs } from "@/lib/ics/ics";
import { comingCal, showingCal } from "@/lib/ics/calHref";
import { SITE_URL } from "@/lib/share/meta";
import { comingCalendar } from "@/lib/wording/coming";
import { readOn } from "@/lib/wording/freshness";

// Build time: every calendar file the site offers (D-160), by file name under /cal/: one per showing
// on each day a page lists, in both cities, and one per coming film's first day in each city. Each
// is made only when its file is written. Stamped with the data file's own time, so a build with the
// same data writes the same files.

let memo: Map<string, () => string> | null = null;

export function calFiles(): Map<string, () => string> {
  if (memo) return memo;
  const files = new Map<string, () => string>();
  // What each name was made for: the same showing in two of a city's files is one file, not a clash.
  const owners = new Map<string, string>();
  const add = (href: string, owner: string, make: () => string) => {
    const name = href.slice("/cal/".length);
    const was = owners.get(name);
    if (was === owner) return;
    if (was !== undefined) throw new Error(`Two calendar files would be called ${name}: ${was} and ${owner}`);
    owners.set(name, owner);
    files.set(name, make);
  };
  const showings = (file: ShowtimesFile) => {
    const films = new Map(file.films.map((film) => [film.id, film]));
    const cinemas = new Map(file.cinemas.map((cinema) => [cinema.id, cinema]));
    const sources = new Map(file.sources.map((source) => [source.id, source]));
    for (const showing of file.showings) {
      const film = films.get(showing.filmId);
      const cinema = cinemas.get(showing.cinemaId);
      const source = sources.get(showing.sourceId);
      if (!film || !cinema || !source) throw new Error(`Showing ${showing.id} names a film, cinema or source that is not in its file`);
      add(showingCal(film.id, cinema.id, showing.startsAt), showing.id, () =>
        buildIcs(
          {
            id: showing.id,
            film: film.title,
            cinema: cinema.name,
            address: cinema.address,
            startsAt: showing.startsAt,
            runtimeMin: film.runtimeMin,
            bookingUrl: showing.bookingUrl,
            sourceLine: readOn(source, showing.fetchedAt, showing.via),
          },
          file.generatedAt,
        ),
      );
    }
  };
  for (const city of CITIES) {
    const today = loadCity(city);
    for (const file of [today, ...loadLater(city).map((later) => later.file)]) showings(file);
    for (const { film, firstDay, sinimas } of comingIn(city)) {
      if (!firstDay) continue;
      const href = comingCal(city, film.id, firstDay);
      add(href, href, () => {
        const event = comingCalendar({ film: film.title, filmId: film.id, sinimas, firstDay, city, url: `${SITE_URL}/${city}/film/${film.id}` });
        return buildAllDayIcs(event, today.generatedAt);
      });
    }
  }
  memo = files;
  return files;
}
