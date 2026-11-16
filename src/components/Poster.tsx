import type { ListFilm } from "@/lib/data/select";

// A film's TMDB poster. A film with none shows `NoPoster` (components/ui/Cards) in its place, so
// every caller checks `film.poster` first; this draws nothing without one.

const TMDB_IMAGES = "https://image.tmdb.org/t/p/";

/** `small` is for a folder, a row or a sticker; the default is a poster card. */
export function Poster({ film, small = false, eager = false }: { film: ListFilm; small?: boolean; /** Above the fold (a film page's hero): load at once. */ eager?: boolean }) {
  if (!film.poster) return null;
  const [one, two] = small ? ["w154", "w342"] : ["w342", "w500"];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser; TMDB serves sized files
    <img src={`${TMDB_IMAGES}${one}${film.poster}`} srcSet={`${TMDB_IMAGES}${one}${film.poster} 1x, ${TMDB_IMAGES}${two}${film.poster} 2x`} alt="" loading={eager ? "eager" : "lazy"} decoding="async" width={342} height={513} />
  );
}
