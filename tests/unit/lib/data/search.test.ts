import { describe, expect, it } from "vitest";
import { enterTarget, matchesTitle, searchFilms, type City, type Scope, type SearchIndex } from "@/lib/data/search";
import { searchIndex } from "@/lib/data/searchIndex";
import type { ShowtimesFile } from "@/lib/data/types";

// Search and city (Figma 192:7519). Times are UTC; Lagos is UTC+1.

const index: SearchIndex = {
  sample: false,
  fresh: [],
  films: [
    { id: "spider", title: "Spider-Man: Brand New Day", poster: "/s.jpg", rating: "12A", runtimeMin: 145 },
    { id: "spec", title: "The Perfect Spec", poster: null, rating: null, runtimeMin: null },
    { id: "rama", title: "Ramayana: Rise of a Legend", poster: null, rating: null, runtimeMin: 201 },
  ],
  cinemas: [
    { name: "Grand Cinemas Lekki", city: "lagos" },
    { name: "Sky Cinemas Sangotedo", city: "lagos" },
    { name: "Silverbird Jabi", city: "abuja" },
  ],
  rows: [
    ["2026-11-13T16:30:00Z", 0, 0, null], // spider 17:30 Lagos, started by 16:45Z
    ["2026-11-13T17:00:00Z", 0, 0, "IMAX"], // spider 18:00
    ["2026-11-13T19:00:00Z", 0, 1, null],
    ["2026-11-13T17:40:00Z", 1, 1, null], // spec 18:40
    ["2026-11-14T13:00:00Z", 2, 1, null], // rama tomorrow 14:00 only, in Lagos
    ["2026-11-13T17:20:00Z", 2, 2, null], // rama 18:20 in Abuja
  ],
};
const NOW = "2026-11-13T16:45:00Z"; // 17:45 in Lagos

describe("matchesTitle", () => {
  it("ignores case, spaces at the ends, accents and punctuation", () => {
    expect(matchesTitle("Spider-Man: Brand New Day", "  SPIDER ")).toBe(true);
    expect(matchesTitle("Spider-Man: Brand New Day", "spiderman")).toBe(true);
    expect(matchesTitle("Spider-Man: Brand New Day", "spider man")).toBe(true);
    expect(matchesTitle("Pokémon", "pokemon")).toBe(true);
    expect(matchesTitle("The Perfect Spec", "zzz")).toBe(false);
  });
  it("an empty query matches nothing", () => {
    expect(matchesTitle("Anything", "  ")).toBe(false);
    expect(matchesTitle("Anything", "-")).toBe(false);
  });
});

describe("searchFilms", () => {
  it("lists the films that match in a city, soonest first, from the next showing that has not started", () => {
    const [lagos] = searchFilms(index, "sp", "lagos", NOW);
    expect(lagos!.city).toBe("lagos");
    expect(lagos!.results.map((r) => [r.film.id, r.next.at, r.next.cinema, r.cinemas, r.day])).toEqual([
      ["spider", "2026-11-13T17:00:00Z", "Grand Cinemas Lekki", 2, 0],
      ["spec", "2026-11-13T17:40:00Z", "Sky Cinemas Sangotedo", 1, 0],
    ]);
    expect(lagos!.results[0]!.formats).toEqual(["IMAX"]);
  });

  it("a film with nothing left today shows its first time tomorrow", () => {
    const [lagos] = searchFilms(index, "rama", "lagos", NOW);
    expect(lagos!.results.map((r) => [r.film.id, r.day, r.next.at])).toEqual([["rama", 1, "2026-11-14T13:00:00Z"]]);
  });

  it("both cities: one group per city, Lagos first, each with its own times", () => {
    const groups = searchFilms(index, "rama", "both", NOW);
    expect(groups.map((g) => [g.city, g.results.map((r) => [r.next.cinema, r.day])])).toEqual([
      ["lagos", [["Sky Cinemas Sangotedo", 1]]],
      ["abuja", [["Silverbird Jabi", 0]]],
    ]);
  });

  it("a showing leaves the results the second it starts (D-05)", () => {
    const [atStart] = searchFilms(index, "spec", "lagos", "2026-11-13T17:40:00Z");
    expect(atStart!.results).toEqual([]);
    const [before] = searchFilms(index, "spec", "lagos", "2026-11-13T17:39:59Z");
    expect(before!.results).toHaveLength(1);
  });

  it("after midnight a film reads the same whatever else matches: today is worked out from every time in the city", () => {
    const late: SearchIndex = {
      ...index,
      films: [
        { id: "xmen", title: "Xmen", poster: null, rating: null, runtimeMin: null },
        { id: "xylo", title: "Xylo", poster: null, rating: null, runtimeMin: null },
      ],
      rows: [
        ["2026-11-14T00:30:00Z", 1, 0, null], // Xylo 01:30 Sat, last night's late show
        ["2026-11-14T13:00:00Z", 0, 0, null], // Xmen 14:00 Sat
        ["2026-11-14T13:00:00Z", 1, 0, null],
      ],
    };
    const at = "2026-11-14T00:00:00Z"; // 01:00 Sat
    const xmen = (query: string) => searchFilms(late, query, "lagos", at)[0]!.results.find((r) => r.film.id === "xmen")!;
    expect(xmen("xmen").day).toBe(1);
    expect(xmen("x").day).toBe(1);
  });

  it("no match gives empty groups", () => {
    expect(searchFilms(index, "zzz", "both", NOW).map((g) => g.results.length)).toEqual([0, 0]);
  });

  // A coming film (D-151) has no times, so it is found by its Coming soon entry, in its own city,
  // apart from the films that have times there, with the opening words the sinima's date gives.
  it("finds a coming film in its own city, apart from the films with times, saying when it opens", () => {
    const withComing: SearchIndex = {
      ...index,
      films: [...index.films, { id: "spirit", title: "Spirited Away Again", poster: "/sa.jpg", rating: null, runtimeMin: null }],
      coming: [[3, "lagos", "Opens Fri 18 Dec at Filmhouse"]],
    };
    const [lagos, abuja] = searchFilms(withComing, "spi", "both", NOW);
    expect(lagos!.results.map((r) => r.film.id)).toEqual(["spider"]);
    expect(lagos!.coming).toEqual([{ film: withComing.films[3], opens: "Opens Fri 18 Dec at Filmhouse" }]);
    expect(abuja!.coming).toEqual([]);
    expect(searchFilms(withComing, "zzz", "lagos", NOW)[0]!.coming).toEqual([]);
    // An index without coming films (one read before D-151) finds none.
    expect(searchFilms(index, "spi", "lagos", NOW)[0]!.coming).toEqual([]);
  });

  // Five days (D-142): a film whose first showing is on the third to fifth day is found on that day.
  it("finds a film showing only on a later day, at its first time that day", () => {
    const later: SearchIndex = {
      ...index,
      films: [...index.films, { id: "wicked", title: "Wicked: For Good", poster: null, rating: null, runtimeMin: null }],
      rows: [...index.rows, ["2026-11-15T18:00:00Z", 3, 0, null], ["2026-11-15T15:00:00Z", 3, 1, null], ["2026-11-17T15:00:00Z", 3, 0, null]],
    };
    const [lagos] = searchFilms(later, "wicked", "lagos", NOW);
    expect(lagos!.results.map((r) => [r.film.id, r.day, r.next.at, r.next.cinema, r.cinemas])).toEqual([["wicked", 2, "2026-11-15T15:00:00Z", "Sky Cinemas Sangotedo", 2]]);
    // Past the fifth day it is not found: the site shows five days.
    const tooFar: SearchIndex = { ...later, rows: [...index.rows, ["2026-11-18T18:00:00Z", 3, 0, null]] };
    expect(searchFilms(tooFar, "wicked", "lagos", NOW)[0]!.results).toEqual([]);
  });
});

describe("searchIndex", () => {
  // Each cinema's city is its area's (D-120), so Abuja's films are found under Abuja.
  it("keeps only what a result shows, each cinema with its area's city", () => {
    const file = {
      generatedAt: NOW,
      sample: true,
      films: [{ id: "spider", title: "Spider-Man", posterPath: "/s.jpg", rating: "12A", runtimeMin: 145 }],
      cinemas: [
        { id: "grand-lekki", name: "Grand Cinemas Lekki", area: "lekki", chain: "grand" },
        { id: "silverbird-jabi", name: "Silverbird Cinemas Jabi Lake Mall", area: "jabi", chain: "Silverbird" },
      ],
      showings: [
        { id: "a", cinemaId: "grand-lekki", filmId: "spider", startsAt: "2026-11-13T17:00:00Z", format: "IMAX", bookingUrl: "https://x", sourceId: "s", fetchedAt: NOW },
        { id: "b", cinemaId: "silverbird-jabi", filmId: "spider", startsAt: "2026-11-13T18:00:00Z", format: null, bookingUrl: null, sourceId: "s", fetchedAt: NOW },
      ],
      sources: [{ id: "s", name: "S", method: "html", url: "https://s" }],
    } as unknown as ShowtimesFile;
    const built = searchIndex(file, (area) => (area === "jabi" ? "abuja" : "lagos"));
    expect(built).toEqual({
      sample: true,
      fresh: [{ source: "S", method: "html", url: "https://s", fetchedAt: NOW }],
      films: [{ id: "spider", title: "Spider-Man", poster: "/s.jpg", rating: "12A", runtimeMin: 145 }],
      cinemas: [
        { name: "Grand Cinemas Lekki", city: "lagos" },
        { name: "Silverbird Cinemas Jabi Lake Mall", city: "abuja" },
      ],
      rows: [
        ["2026-11-13T17:00:00Z", 0, 0, "IMAX"],
        ["2026-11-13T18:00:00Z", 0, 1, null],
      ],
    });
    const abuja = searchFilms(built, "spider", "abuja", NOW)[0]!;
    expect(abuja.results.map((r) => r.next)).toEqual([{ at: "2026-11-13T18:00:00Z", cinema: "Silverbird Cinemas Jabi Lake Mall" }]);
  });

  // D-151: each city's Coming soon list, as Films shows it, so search finds those films too.
  it("adds each city's coming films after the films with times, with the words saying when each opens", () => {
    const file = {
      generatedAt: NOW,
      sample: false,
      films: [
        { id: "spider", title: "Spider-Man", posterPath: null, rating: null, runtimeMin: null },
        { id: "dune", title: "Dune: Part Three", posterPath: "/d.jpg", rating: "12A", runtimeMin: null },
      ],
      cinemas: [{ id: "grand-lekki", name: "Grand Cinemas Lekki", area: "lekki", chain: "grand" }],
      showings: [{ id: "a", cinemaId: "grand-lekki", filmId: "spider", startsAt: "2026-11-13T17:00:00Z", format: null, bookingUrl: null, sourceId: "s", fetchedAt: NOW }],
      sources: [{ id: "s", name: "S", method: "html", url: "https://s" }],
    } as unknown as ShowtimesFile;
    const dune = file.films[1]!;
    const built = searchIndex(file, () => "lagos", { lagos: [{ film: dune, firstDay: "2026-12-18", sinimas: ["Filmhouse"] }], abuja: [] });
    expect(built.films.map((f) => f.id)).toEqual(["spider", "dune"]);
    expect(built.films[1]).toEqual({ id: "dune", title: "Dune: Part Three", poster: "/d.jpg", rating: "12A", runtimeMin: null });
    expect(built.coming).toEqual([[1, "lagos", "Opens Fri 18 Dec at Filmhouse"]]);
    // A film coming in both cities is in the index once.
    const both = searchIndex(file, () => "lagos", { lagos: [{ film: dune, firstDay: "2026-12-18", sinimas: ["Filmhouse"] }], abuja: [{ film: dune, firstDay: null, sinimas: ["Silverbird"] }] });
    expect(both.films).toHaveLength(2);
    expect(both.coming).toEqual([[1, "lagos", "Opens Fri 18 Dec at Filmhouse"], [1, "abuja", "Coming to Silverbird, date not announced"]]);
  });

  // D-147: days three to five are files of their own; search reads them too, so a film on only
  // Saturday is found. A later file's films and sources join the index once each.
  it("adds the later days' files: their showings, and films only they have", () => {
    const cinemas = [{ id: "grand-lekki", name: "Grand Cinemas Lekki", area: "lekki", chain: "grand" }];
    const sources = [{ id: "s", name: "S", method: "html", url: "https://s" }];
    const spider = { id: "spider", title: "Spider-Man", posterPath: null, rating: null, runtimeMin: null };
    const show = (id: string, filmId: string, startsAt: string) => ({ id, cinemaId: "grand-lekki", filmId, startsAt, format: null, bookingUrl: null, sourceId: "s", fetchedAt: NOW });
    const file = { generatedAt: NOW, sample: false, films: [spider], cinemas, sources, showings: [show("a", "spider", "2026-11-13T17:00:00Z")] } as unknown as ShowtimesFile;
    const saturday = { generatedAt: NOW, sample: false, films: [spider, { id: "wicked", title: "Wicked: For Good", posterPath: "/w.jpg", rating: "PG", runtimeMin: 137 }], cinemas, sources, showings: [show("b", "spider", "2026-11-15T17:00:00Z"), show("c", "wicked", "2026-11-15T18:00:00Z")] } as unknown as ShowtimesFile;
    const built = searchIndex(file, () => "lagos", {}, [saturday]);
    expect(built.films.map((f) => f.id)).toEqual(["spider", "wicked"]);
    expect(built.fresh).toHaveLength(1);
    expect(built.rows).toEqual([
      ["2026-11-13T17:00:00Z", 0, 0, null],
      ["2026-11-15T17:00:00Z", 0, 0, null],
      ["2026-11-15T18:00:00Z", 1, 0, null],
    ]);
    expect(searchFilms(built, "wicked", "lagos", NOW)[0]!.results.map((r) => [r.film.id, r.day])).toEqual([["wicked", 2]]);
  });

  it("refuses a cinema whose area has no city, rather than guess one", () => {
    const file = { generatedAt: NOW, sample: false, films: [], cinemas: [{ id: "x", name: "X", area: "nowhere", chain: "X" }], showings: [], sources: [] } as unknown as ShowtimesFile;
    expect(() => searchIndex(file, () => undefined)).toThrow('No city for the area "nowhere"');
  });
});

// Enter lists today's matches on Films; when Films would list none of them, it opens the top result
// instead of a Films page where nothing matches (HANDOFF 19 Nov, search leftovers).
describe("enterTarget", () => {
  const withComing: SearchIndex = {
    ...index,
    films: [...index.films, { id: "dune", title: "Dune: Part Three", poster: null, rating: null, runtimeMin: null }],
    coming: [[3, "lagos", "Opens Fri 18 Dec at Filmhouse"]],
  };
  /** Enter's target on a page in `home`, with `scope` shown. */
  const enter = (at: SearchIndex, query: string, scope: Scope, home: City) => enterTarget(searchFilms(at, query, scope, NOW), searchFilms(at, query, home, NOW)[0]);

  it("lists the matches on Films when the page's Films has some today, counting only those", () => {
    expect(enter(index, "sp", "lagos", "lagos")).toEqual({ films: 2 });
    // Ramayana is on today in Abuja: an Abuja page's Films lists it.
    expect(enter(index, "rama", "both", "abuja")).toEqual({ films: 1 });
    // Whatever cities are shown: on a Lagos page with only Abuja shown, Lagos's Films still lists Spider-Man.
    expect(enter(index, "spider", "abuja", "lagos")).toEqual({ films: 1 });
  });

  it("opens the top result shown when Films would list nothing: a coming film, or one only on a later day", () => {
    expect(enter(withComing, "dune", "lagos", "lagos")).toEqual({ film: withComing.films[3], city: "lagos" });
    expect(enter(index, "rama", "lagos", "lagos")).toEqual({ film: index.films[2], city: "lagos" });
    // Searching both cities, the top result is the first city's that has one.
    expect(enter(index, "rama", "both", "lagos")).toEqual({ film: index.films[2], city: "lagos" });
  });

  it("does nothing when nothing matches", () => {
    expect(enter(index, "zzz", "both", "lagos")).toBeNull();
  });
});
