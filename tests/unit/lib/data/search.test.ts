import { describe, expect, it } from "vitest";
import { matchesTitle, searchFilms, searchIndex, type SearchIndex } from "@/lib/data/search";
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
});

describe("searchIndex", () => {
  it("keeps only what a result shows, every cinema in Lagos until the city layer adds Abuja's", () => {
    const file = {
      generatedAt: NOW,
      sample: true,
      films: [{ id: "spider", title: "Spider-Man", posterPath: "/s.jpg", rating: "12A", runtimeMin: 145 }],
      cinemas: [{ id: "grand-lekki", name: "Grand Cinemas Lekki", area: "lekki", chain: "grand" }],
      showings: [{ id: "a", cinemaId: "grand-lekki", filmId: "spider", startsAt: "2026-11-13T17:00:00Z", format: "IMAX", bookingUrl: "https://x", sourceId: "s", fetchedAt: NOW }],
      sources: [{ id: "s", name: "S", method: "html", url: "https://s" }],
    } as unknown as ShowtimesFile;
    expect(searchIndex(file)).toEqual({
      sample: true,
      fresh: [{ source: "S", method: "html", url: "https://s", fetchedAt: NOW }],
      films: [{ id: "spider", title: "Spider-Man", poster: "/s.jpg", rating: "12A", runtimeMin: 145 }],
      cinemas: [{ name: "Grand Cinemas Lekki", city: "lagos" }],
      rows: [["2026-11-13T17:00:00Z", 0, 0, "IMAX"]],
    });
  });
});
