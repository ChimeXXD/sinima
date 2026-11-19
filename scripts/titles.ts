// A film's title (D-152c): a sinima that writes it in capitals (Filmhouse's "AVENGERS: DOOMSDAY")
// gets TMDB's spelling once TMDB has matched the film. A title in mixed case is the sinima's own
// choice and stays. Pure, beside the reader of data/credits.json's saved TMDB titles.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** `title`, or `tmdbTitle` when `title` has capital letters and no small ones. */
export function properTitle(title: string, tmdbTitle: string | undefined): string {
  return tmdbTitle && /\p{Lu}/u.test(title) && !/\p{Ll}/u.test(title) ? tmdbTitle : title;
}

/** TMDB's title for each matched film id in data/credits.json. */
export function tmdbTitles(root: string): (filmId: string) => string | undefined {
  const path = join(root, "data/credits.json");
  const tmdb = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as { tmdb: Record<string, { tmdbTitle?: string }> }).tmdb : {};
  return (filmId) => (Object.hasOwn(tmdb, filmId) ? tmdb[filmId]!.tmdbTitle : undefined);
}
