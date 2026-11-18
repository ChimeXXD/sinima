import { describe, expect, it } from "vitest";
import { filmSections, formatCoverage, lastStart } from "@/lib/data/films";
import type { ListRow } from "@/lib/data/select";

// The Films screen's sections (Figma 175:3480): within 2 hours, then later tonight; one list for
// another day, a chosen format, or before the page knows the time.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
const row = (film: number, cinema: number, at: string, format: string | null = null): ListRow => ({ at, film, cinema, format, book: null, fresh: 0 });
const ROWS: ListRow[] = [
  row(0, 0, "2026-11-13T16:35:00Z"), // 17:35, soon
  row(0, 1, "2026-11-13T19:00:00Z"), // same film later: it stays in Now showing, counted at 2 cinemas
  row(1, 0, "2026-11-13T16:40:00Z", "IMAX 2D"), // 17:40, soon, IMAX
  row(2, 2, "2026-11-13T19:40:00Z"), // 20:40, later tonight
  row(3, 2, "2026-11-13T16:00:00Z"), // 17:00, already started: gone
  row(4, 1, "2026-11-14T09:00:00Z"), // 10:00 Sat: tomorrow
];

describe("filmSections", () => {
  it("splits today into the next 2 hours and later tonight, soonest first, once the time is known", () => {
    const sections = filmSections(ROWS, 0, NOW, true, null);
    expect(sections.map((s) => s.key)).toEqual(["soon", "later"]);
    expect(sections[0]!.films.map((f) => [f.film, f.next, f.cinemas])).toEqual([
      [0, "2026-11-13T16:35:00Z", 2],
      [1, "2026-11-13T16:40:00Z", 1],
    ]);
    expect(sections[1]!.films.map((f) => f.film)).toEqual([2]);
  });

  it("leaves a started showing out (D-05) and never shows tomorrow's films today", () => {
    const films = filmSections(ROWS, 0, NOW, true, null).flatMap((s) => s.films.map((f) => f.film));
    expect(films).not.toContain(3);
    expect(films).not.toContain(4);
  });

  it("gives one list for tomorrow", () => {
    const sections = filmSections(ROWS, 1, NOW, true, null);
    expect(sections.map((s) => s.key)).toEqual(["day"]);
    expect(sections[0]!.films.map((f) => f.film)).toEqual([4]);
  });

  it("gives one list for a chosen format, today's films in it only", () => {
    const sections = filmSections(ROWS, 0, NOW, true, "IMAX");
    expect(sections.map((s) => s.key)).toEqual(["format"]);
    expect(sections[0]!.films.map((f) => f.film)).toEqual([1]);
  });

  it("before the page knows the time, lists the whole day, started ones too (rule 3)", () => {
    const sections = filmSections(ROWS, 0, NOW, false, null);
    expect(sections.map((s) => s.key)).toEqual(["day"]);
    expect(sections[0]!.films.map((f) => f.film)).toEqual([3, 0, 1, 2]);
  });

  it("has no sections when nothing is left tonight (22:00; after 04:00 today rolls over, D-54)", () => {
    expect(filmSections(ROWS, 0, "2026-11-13T21:00:00Z", true, null)).toEqual([]);
  });
});

describe("formatCoverage: who says which format a showing is in", () => {
  const chains = ["Filmhouse", "Genesis", "Ozone"];
  it("names the chains that give formats and counts the cinemas that give none", () => {
    expect(formatCoverage(ROWS, 0, NOW, true, (cinema) => chains[cinema]!)).toEqual({ chains: ["Filmhouse"], silent: 2 });
  });
});

describe("lastStart", () => {
  it("is today's last start time, or null when there were none", () => {
    expect(lastStart(ROWS, NOW)).toBe("2026-11-13T19:40:00Z");
    expect(lastStart([], NOW)).toBeNull();
  });
});

describe("a later day (D-142)", () => {
  const SUN = [row(0, 0, "2026-11-15T14:00:00Z"), row(1, 1, "2026-11-15T19:00:00Z"), row(0, 1, "2026-11-15T16:00:00Z")];

  it("is one list of the whole day, soonest film first, even once the time is known", () => {
    expect(filmSections(SUN, 2, NOW, true, null).map((s) => [s.key, s.films.map((f) => [f.film, f.cinemas])])).toEqual([["day", [[0, 2], [1, 1]]]]);
  });
});
