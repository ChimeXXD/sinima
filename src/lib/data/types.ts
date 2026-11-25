// Schema v1: the shapes shared by the data files and the UI. Must match docs/DATA.md and
// docs/SPEC.md §2. Unknown values are null, never guessed.

export type SourceMethod = "permission-feed" | "public-page" | "api" | "fixture";
export type SourceStatus = "cleared" | "pending" | "refused" | "do-not-use";
export type SourceHealth = "ok" | "suspect" | "failing";

export type CreditsAnswer = "yes" | "no" | "unknown";
export type CreditsConfidence = "confirmed" | "likely" | "unknown";
export type CreditsSource = { name: string; url: string; checkedAt: string };

export type CreditsInfo = {
  during: CreditsAnswer;
  after: CreditsAnswer;
  confidence: CreditsConfidence;
  sources: CreditsSource[];
  count?: number | null;
};

/** When a showing reached us through another listing: the original site and when it was read. */
export type Via = { name: string; url?: string; fetchedAt: string };

export type Source = {
  id: string;
  /** As it reads in a sentence: "Filmhouse's site". */
  name: string;
  url: string;
  method: SourceMethod;
  status: SourceStatus;
  /** Null until the source has been read once. */
  fetchedAt: string | null;
  lastOkAt: string | null;
  health: SourceHealth;
};

export type Cinema = {
  id: string;
  name: string;
  chain: string;
  /** An area slug from data/cinemas.json. */
  area: string;
  address: string | null;
  geo: { lat: number; lng: number } | null;
  website: string | null;
  /** The host its booking links live on, when that is not the website's. */
  bookingHost?: string | null;
  sourceIds: string[];
};

export type FilmOrigin = "nollywood" | "hollywood" | "other";

export type Film = {
  /** A slug made from the title. */
  id: string;
  title: string;
  runtimeMin: number | null;
  /** The rating text the source gives ("18", "PG"). */
  rating: string | null;
  origin: FilmOrigin | null;
  tmdbId: number | null;
  /** TMDB's image path ("/abc.jpg") for the poster; left out or null when there is none. */
  posterPath?: string | null;
  /** The trailer's YouTube video id (D-117); left out or null when there is none. */
  trailerKey?: string | null;
  credits?: CreditsInfo | null;
};

export type Price = { amountNgn: number; label: string | null };

export type Showing = {
  /** `<cinemaId>_<filmId>_<startsAt>` */
  id: string;
  filmId: string;
  cinemaId: string;
  screenId: string | null;
  /** UTC, ending in Z. */
  startsAt: string;
  format: string | null;
  language: string | null;
  price: Price | null;
  /** Null when the cinema has no booking page: "Tickets at the cinema". */
  bookingUrl: string | null;
  sourceId: string;
  via?: Via | null;
  fetchedAt: string;
  /** The cinema's own page marks the time closed to sales ("Closed" on Filmhouse's, D-200); left out otherwise. */
  closed?: true;
};

/**
 * Films a chain's own public page features for one day, with no times (D-131): Filmhouse's home
 * page, whose times we can't read. Never a showing; shown only on its cinemas with no times.
 */
export type Featured = {
  sourceId: string;
  /** The cinemas the page speaks for: the whole chain's, cut to the file's. */
  cinemaIds: string[];
  /** The Lagos date the page features them for ("2026-11-17"). */
  day: string;
  fetchedAt: string;
  /** In the page's order, each matched to the showings' films (D-119). */
  films: { id: string; title: string }[];
};

/**
 * A film a sinima lists as coming (D-144, D-151): Filmhouse's home page, a banner film whose first
 * showing date is after today. The film is also in `films`; never a showing.
 */
export type Coming = {
  sourceId: string;
  filmId: string;
  /** The sinima's first date for it, a Lagos date ("2026-12-18"), never TMDB's; null when the sinima gives none ("Date not announced"). */
  firstDay: string | null;
  /** The cinemas the page speaks for: the whole chain's, cut to the file's. */
  cinemaIds: string[];
  fetchedAt: string;
};

export type ShowtimesFile = {
  schemaVersion: 1;
  generatedAt: string;
  timeZone: "Africa/Lagos";
  /** True when any showing comes from a fixture; every page then says "Sample data". */
  sample: boolean;
  sources: Source[];
  cinemas: Cinema[];
  films: Film[];
  showings: Showing[];
  /** Left out when no chain's page features any film (D-131). */
  featured?: Featured[];
  /** Left out when no sinima lists a film as coming (D-151). By first date, undated last. */
  coming?: Coming[];
  /**
   * Showings already on sale on a coming film's first date, after the shown days (D-194): kept in
   * the whole file and "all" (build time) only, never in a file a page loads. Left out when none.
   */
  presales?: Showing[];
};
