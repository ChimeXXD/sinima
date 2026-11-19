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

/**
 * A film's proper title (D-159): Chime's hand-kept one in data/film-titles.json first (a film TMDB
 * can't match yet, like Funke Akindele's "THE FOUR"), then TMDB's. Like TMDB's, it replaces only a
 * title the sinima writes in capitals (`properTitle`), and the film's id and address stay as they are.
 */
export function titleLookup(root: string): (filmId: string) => string | undefined {
  const path = join(root, "data/film-titles.json");
  const manual = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as { titles?: unknown }).titles ?? {} : {};
  if (typeof manual !== "object" || manual === null || Array.isArray(manual)) throw new Error("data/film-titles.json: \"titles\" must be an object of film id to title");
  for (const [id, title] of Object.entries(manual)) {
    if (typeof title !== "string" || title.trim() === "") throw new Error(`data/film-titles.json: the title for "${id}" must be a non-empty string`);
  }
  const titles = manual as Record<string, string>;
  const tmdb = tmdbTitles(root);
  return (filmId) => (Object.hasOwn(titles, filmId) ? titles[filmId] : tmdb(filmId));
}
