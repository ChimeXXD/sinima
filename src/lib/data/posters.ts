// Where a film's TMDB poster is loaded from (D-113). On Vercel it is Sinima's own /poster/, which
// vercel.json hands on to TMDB: some networks can't reach image.tmdb.org (a phone on 5G in Lagos
// showed a broken image on every card), but anything that opens the site can reach its own address.
// Off Vercel (dev, the e2e run on out/) there is no rewrite, so the address is TMDB's own.

export const TMDB_IMAGES = "https://image.tmdb.org/t/p/";

/** Every size the app asks for; the rewrite in vercel.json passes these and no others. */
export const POSTER_SIZES = ["w154", "w342", "w500"] as const;
export type PosterSize = (typeof POSTER_SIZES)[number];

// Set by next.config.ts at build time.
const BASE = process.env.POSTER_BASE || TMDB_IMAGES;

/** `path` is TMDB's `poster_path`, with its leading slash. */
export function posterSrc(size: PosterSize, path: string, base: string = BASE): string {
  return `${base}${size}${path}`;
}

/** A poster's `srcSet`: `one` for a 1x screen, `two` for a 2x one. */
export function posterSrcSet(one: PosterSize, two: PosterSize, path: string, base: string = BASE): string {
  return `${posterSrc(one, path, base)} 1x, ${posterSrc(two, path, base)} 2x`;
}
