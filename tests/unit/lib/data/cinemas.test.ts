import { describe, expect, it } from "vitest";
import { cinemaSections } from "@/lib/data/cinemas";
import type { ListRow } from "@/lib/data/select";

// The Cinemas tab's groups (Figma Cinemas 200:6415): your area, the areas next to it, then the
// rest; every cinema listed, soonest first, the ones with nothing left after them.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
const row = (cinema: number, at: string, format: string | null = null, film = 0): ListRow => ({ at, film, cinema, format, book: null, fresh: 0 });
// 0 Lekki, 1 Lekki, 2 Victoria Island, 3 Ikeja, 4 Victoria Island (no times at all), 5 Lekki (only earlier today)
const AREAS = ["lekki", "lekki", "victoria-island", "ikeja", "victoria-island", "lekki"];
const areaOf = (cinema: number) => AREAS[cinema]!;
const CINEMAS = AREAS.length;
const ROWS: ListRow[] = [
  row(3, "2026-11-13T16:35:00Z"), // 17:35 Ikeja, the city's soonest
  row(1, "2026-11-13T17:00:00Z", "IMAX 2D"), // 18:00
  row(1, "2026-11-13T18:00:00Z", null, 1),
  row(0, "2026-11-13T17:15:00Z"), // 18:15
  row(2, "2026-11-13T16:40:00Z"), // 17:40
  row(5, "2026-11-13T15:00:00Z"), // 16:00, started
  row(0, "2026-11-14T13:00:00Z"), // 14:00 Sat: tomorrow
];
const LEKKI = { slug: "lekki", neighbours: ["victoria-island"] };
const base = { rows: ROWS, cinemas: CINEMAS, areaOf, now: NOW, live: true, format: null, home: null } as const;

const ids = (sections: ReturnType<typeof cinemaSections>) => sections.map((s) => [s.key, s.cinemas.map((c) => c.cinema)]);

describe("cinemaSections", () => {
  it("with no area kept, lists every cinema soonest first, then those with nothing left, then those with no times", () => {
    expect(ids(cinemaSections({ ...base, day: 0 }))).toEqual([["all", [3, 2, 1, 0, 5, 4]]]);
  });

  it("puts your area first, then the areas next to it, then the rest", () => {
    expect(ids(cinemaSections({ ...base, day: 0, home: LEKKI }))).toEqual([
      ["area", [1, 0, 5]],
      ["next", [2, 4]],
      ["rest", [3]],
    ]);
  });

  it("gives each cinema its rows still to start today, and says whether it has times at all", () => {
    const [all] = cinemaSections({ ...base, day: 0 });
    const by = (cinema: number) => all!.cinemas.find((c) => c.cinema === cinema)!;
    expect(by(1).rows.map((r) => r.at)).toEqual(["2026-11-13T17:00:00Z", "2026-11-13T18:00:00Z"]);
    expect(by(5)).toMatchObject({ rows: [], listed: true }); // started at 16:00: nothing more today
    expect(by(4)).toMatchObject({ rows: [], listed: false }); // Times not available yet
  });

  it("before the page knows the time, keeps the whole day (the page's own HTML)", () => {
    const [all] = cinemaSections({ ...base, day: 0, live: false });
    expect(all!.cinemas.find((c) => c.cinema === 5)!.rows).toHaveLength(1);
  });

  it("lists tomorrow's times for tomorrow", () => {
    const [all] = cinemaSections({ ...base, day: 1 });
    expect(all!.cinemas[0]).toMatchObject({ cinema: 0, rows: [{ at: "2026-11-14T13:00:00Z" }] });
    expect(all!.cinemas.slice(1).every((c) => c.rows.length === 0)).toBe(true);
  });

  it("with a format, keeps only the cinemas showing in it, and drops empty groups", () => {
    expect(ids(cinemaSections({ ...base, day: 0, format: "IMAX", home: LEKKI }))).toEqual([["area", [1]]]);
    expect(ids(cinemaSections({ ...base, day: 1, format: "IMAX" }))).toEqual([]);
  });

  it("drops a neighbour group with no cinemas", () => {
    const sections = cinemaSections({ ...base, day: 0, home: { slug: "ikeja", neighbours: ["surulere"] } });
    expect(sections.map((s) => s.key)).toEqual(["area", "rest"]);
  });
});

describe("a later day (D-146)", () => {
  // Sunday's file: only cinema 1 lists it. Cinemas 0, 2, 3 and 5 have times in the page, 4 none at all.
  const SUN = [row(1, "2026-11-15T14:00:00Z")];

  it("a sinima with times on other days is listed, not 'times not available'", () => {
    const sections = cinemaSections({ ...base, rows: SUN, known: [...ROWS, ...SUN], day: 2 });
    const entries = sections.flatMap((s) => s.cinemas);
    expect(entries.map((e) => [e.cinema, e.rows.length, e.listed])).toEqual([[1, 1, true], [0, 0, true], [2, 0, true], [3, 0, true], [5, 0, true], [4, 0, false]]);
  });
});

describe("a sinima that has listed only a later day (D-146)", () => {
  it("is listed on today too: it has times, just not today", () => {
    const entry = (sections: ReturnType<typeof cinemaSections>) => sections.flatMap((s) => s.cinemas).find((e) => e.cinema === 4)!;
    expect(entry(cinemaSections({ ...base, day: 0 })).listed).toBe(false);
    expect(entry(cinemaSections({ ...base, day: 0, alsoListed: [4] })).listed).toBe(true);
  });
});
