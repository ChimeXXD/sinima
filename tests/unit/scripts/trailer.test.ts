import { describe, expect, it } from "vitest";
import { mergeCredits, pickTrailer, type TmdbVideo } from "../../../scripts/credits.ts";

// Trailers (D-117): TMDB lists each film's videos; we keep one YouTube trailer's key, at build time.
const video = (over: Partial<TmdbVideo>): TmdbVideo => ({ key: "aaaaaaaaaaa", site: "YouTube", type: "Trailer", official: true, iso_639_1: "en", published_at: "2026-10-01T12:00:00.000Z", ...over });

describe("pickTrailer", () => {
  it("takes an official YouTube trailer over a teaser, a clip or one on another site", () => {
    const videos = [
      video({ key: "teaser00001", type: "Teaser" }),
      video({ key: "vimeo000001", site: "Vimeo" }),
      video({ key: "clip0000001", type: "Clip" }),
      video({ key: "trailer0001" }),
    ];
    expect(pickTrailer(videos)).toBe("trailer0001");
  });

  it("prefers official, then English, then the newest", () => {
    expect(pickTrailer([video({ key: "fanmade0001", official: false }), video({ key: "official001" })])).toBe("official001");
    expect(pickTrailer([video({ key: "french00001", iso_639_1: "fr" }), video({ key: "english0001" })])).toBe("english0001");
    expect(pickTrailer([video({ key: "older000001", published_at: "2026-01-01T00:00:00.000Z" }), video({ key: "newer000001", published_at: "2026-09-01T00:00:00.000Z" })])).toBe("newer000001");
  });

  it("is null with no trailer, or with a key that is not a YouTube video id", () => {
    expect(pickTrailer([])).toBeNull();
    expect(pickTrailer([video({ type: "Featurette" })])).toBeNull();
    expect(pickTrailer([video({ key: "x\" onclick=1" })])).toBeNull();
  });
});

describe("mergeCredits carries the trailer", () => {
  it("gives a matched film its trailer key, and every other film null", () => {
    const tmdb = { sinners: { tmdbId: 1233413, runtimeMin: 137, posterPath: "/a.jpg", trailerKey: "bKGxHflevuk", keywordIds: [], checkedAt: "2026-11-16T22:00:00Z" } };
    const merged = mergeCredits({ filmIds: ["sinners", "unknown-film"], tmdb, manual: {} });
    expect(merged.sinners?.trailerKey).toBe("bKGxHflevuk");
    expect(merged["unknown-film"]?.trailerKey).toBeNull();
  });
});
