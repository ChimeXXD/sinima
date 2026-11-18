import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pickComingMatch } from "../../../scripts/credits";
import { main, type CreditsFile, type Deps } from "../../../scripts/tmdb";

// Coming films (D-151) get a TMDB poster only on a sure match: the same title, released within a
// year of the sinima's first date (TMDB's release dates differ from Nigeria's), and one such film.

const result = (id: number, title: string, release_date: string) => ({ id, title, original_title: title, release_date });

describe("pickComingMatch", () => {
  it("takes the one film with the same title released within a year of the first date", () => {
    // TMDB has Doomsday on 16 Dec; Filmhouse opens it on 18 Dec.
    expect(pickComingMatch("AVENGERS: DOOMSDAY", [result(1, "Avengers: Doomsday", "2026-12-16")], "2026-12-18")).toBe(1);
    expect(pickComingMatch("DUNE : PART THREE", [result(2, "Dune: Part Three", "2026-12-16")], "2026-12-18")).toBe(2);
    // Further ahead than the showing films' window (four months from today) still matches.
    expect(pickComingMatch("Far Off", [result(3, "Far Off", "2027-06-01")], "2027-06-05")).toBe(3);
    expect(pickComingMatch("Late", [result(4, "Late", "2025-01-02")], "2026-12-30")).toBe(4); // the year before
  });

  it("refuses another film's title: The Four's search finds The Fantastic 4", () => {
    expect(pickComingMatch("THE FOUR", [result(617126, "The Fantastic 4: First Steps", "2025-07-23")], "2026-12-11")).toBeNull();
  });

  it("refuses a namesake from another year, and two films that fit", () => {
    expect(pickComingMatch("THE FOUR", [result(5, "The Four", "2012-07-12")], "2026-12-11")).toBeNull();
    expect(pickComingMatch("Twin", [result(6, "Twin", "2026-03-01"), result(7, "Twin", "2027-02-01")], "2026-12-11")).toBeNull();
    expect(pickComingMatch("Undated", [{ id: 8, title: "Undated" }], "2026-12-11")).toBeNull();
  });
});

describe("scripts/tmdb.ts with coming films", () => {
  const NOW = "2026-11-18T07:00:00Z";
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  afterEach(() => vi.clearAllMocks());
  const answers: Record<string, unknown> = {
    "/search/movie?query=AVENGERS%3A%20DOOMSDAY&include_adult=false": { results: [result(1003596, "Avengers: Doomsday", "2026-12-16")] },
    "/search/movie?query=THE%20FOUR&include_adult=false": { results: [result(617126, "The Fantastic 4: First Steps", "2025-07-23")] },
    "/search/movie?query=FAR%20OFF&include_adult=false": { results: [result(3, "Far Off", "2027-06-01")] },
    "/movie/1003596?append_to_response=keywords,videos": { title: "Avengers: Doomsday", runtime: null, poster_path: "/doom.jpg", keywords: { keywords: [] }, videos: { results: [] } },
    "/movie/3?append_to_response=keywords,videos": { title: "Far Off", runtime: 100, poster_path: "/far.jpg", keywords: { keywords: [] }, videos: { results: [] } },
  };
  const fakeTmdb = vi.fn((url: string) => {
    // The short API key rides in the address; it must be there, and is cut before the lookup.
    if (!url.includes("api_key=0123456789abcdef0123456789abcdef")) return Promise.resolve(new Response("{}", { status: 401 }));
    const path = url.replace("https://api.themoviedb.org/3", "").replace(/[?&]api_key=[^&]*/, "");
    return Promise.resolve(Object.hasOwn(answers, path) ? Response.json(answers[path]) : new Response("{}", { status: 404 }));
  });

  it("looks the coming films up with their own rule: a poster for Doomsday and the far-off film, none for The Four", async () => {
    const root = mkdtempSync(join(tmpdir(), "sinima-tmdb-coming-"));
    mkdirSync(join(root, "data"));
    const film = (id: string, title: string) => ({ id, title, runtimeMin: null, rating: null, origin: null, tmdbId: null });
    const coming = (filmId: string, firstDay: string) => ({ sourceId: "filmhouse-home", filmId, firstDay, cinemaIds: ["filmhouse-oniru"], fetchedAt: NOW });
    const files: Record<string, unknown> = {
      "data/showtimes.json": {
        films: [film("avengers-doomsday", "AVENGERS: DOOMSDAY"), film("the-four", "THE FOUR"), film("far-off", "FAR OFF")],
        showings: [],
        coming: [coming("avengers-doomsday", "2026-12-18"), coming("the-four", "2026-12-11"), coming("far-off", "2027-06-05")],
      },
      "data/tmdb-overrides.json": { films: {} },
      "data/credits-manual.json": { films: {} },
    };
    for (const [path, content] of Object.entries(files)) writeFileSync(join(root, path), JSON.stringify(content));
    const deps: Deps = { root, env: { TMDB_READ_TOKEN: "0123456789abcdef0123456789abcdef" }, fetchFn: fakeTmdb as unknown as typeof fetch, now: NOW, wait: () => Promise.resolve() };
    expect(await main([], deps)).toBe(0);
    const written = JSON.parse(readFileSync(join(root, "data/credits.json"), "utf8")) as CreditsFile;
    expect(Object.keys(written.tmdb).sort()).toEqual(["avengers-doomsday", "far-off"]);
    expect(written.tmdb["avengers-doomsday"]).toMatchObject({ tmdbId: 1003596, posterPath: "/doom.jpg" });
    const printed = log.mock.calls.map((call) => String(call[0])).join("\n");
    expect(printed).toContain('no sure match for "THE FOUR"');
    expect(printed).not.toContain("0123456789abcdef");
  });
});
