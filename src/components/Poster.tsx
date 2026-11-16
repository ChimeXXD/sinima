import type { ListFilm } from "@/lib/data/select";
import { posterSrc, posterSrcSet, type PosterSize } from "@/lib/data/posters";

// A film's TMDB poster. A film with none shows `NoPoster` (components/ui/Cards) in its place, so
// every caller checks `film.poster` first; this draws nothing without one. Fetched with CORS (TMDB
// allows it), so the service worker can keep it for offline at its real size. Loaded through
// Sinima's own /poster/ on Vercel (lib/data/posters, D-113).

/** `small` is for a folder, a row or a sticker; the default is a poster card. */
export function Poster({ film, small = false, eager = false }: { film: ListFilm; small?: boolean; /** Above the fold (a film page's hero): load at once. */ eager?: boolean }) {
  if (!film.poster) return null;
  const [one, two]: [PosterSize, PosterSize] = small ? ["w154", "w342"] : ["w342", "w500"];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser; TMDB serves sized files
    <img src={posterSrc(one, film.poster)} srcSet={posterSrcSet(one, two, film.poster)} alt="" crossOrigin="anonymous" loading={eager ? "eager" : "lazy"} decoding="async" width={342} height={513} />
  );
}
