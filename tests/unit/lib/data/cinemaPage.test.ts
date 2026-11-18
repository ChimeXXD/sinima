import { describe, expect, it } from "vitest";
import { cinemaFilms } from "@/lib/data/cinemaPage";
import type { ListRow } from "@/lib/data/select";

// A cinema's page (Figma Cinema 202:7192): its films, the soonest next time first; a film whose
// times have all started today comes last, with when it started and tomorrow's times.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
const row = (film: number, at: string, format: string | null = null): ListRow => ({ at, film, cinema: 0, format, book: null, fresh: 0 });
// 0 Street Fighter 19:00, 21:30 · 1 Ramayana 12:30 (started), 19:10 IMAX · 2 Clayface 19:15, 21:30 · 3 Agbara Nla 14:00, 16:50 (both started)
const ROWS: ListRow[] = [
  row(3, "2026-11-13T13:00:00Z"),
  row(1, "2026-11-13T11:30:00Z", "IMAX 2D"),
  row(3, "2026-11-13T15:50:00Z"),
  row(0, "2026-11-13T18:00:00Z"),
  row(1, "2026-11-13T18:10:00Z", "IMAX 2D"),
  row(2, "2026-11-13T18:15:00Z"),
  row(0, "2026-11-13T20:30:00Z"),
  row(2, "2026-11-13T20:30:00Z"),
  row(3, "2026-11-14T13:00:00Z"), // Sat
  row(3, "2026-11-14T15:50:00Z"),
  row(0, "2026-11-14T18:00:00Z"),
];
const ats = (rows: ListRow[]) => rows.map((r) => r.at);

describe("cinemaFilms", () => {
  it("lists today's films soonest first, a film with every time started last (Figma Default)", () => {
    const page = cinemaFilms({ rows: ROWS, day: 0, now: NOW, live: true });
    expect(page.films.map((f) => f.film)).toEqual([0, 1, 2, 3]);
    expect(page).toMatchObject({ total: 4, left: 3, tomorrow: true });
  });

  it("gives each film only its times still to start; one with none left keeps when it started and tomorrow's", () => {
    const { films } = cinemaFilms({ rows: ROWS, day: 0, now: NOW, live: true });
    expect(ats(films[1]!.rows)).toEqual(["2026-11-13T18:10:00Z"]); // Ramayana's 12:30 has started: not listed
    expect(films[1]!.earlier).toEqual([]);
    expect(films[3]).toMatchObject({ film: 3, rows: [] });
    expect(ats(films[3]!.earlier)).toEqual(["2026-11-13T13:00:00Z", "2026-11-13T15:50:00Z"]);
    expect(ats(films[3]!.next)).toEqual(["2026-11-14T13:00:00Z", "2026-11-14T15:50:00Z"]);
  });

  it("says when nothing is listed for tomorrow", () => {
    expect(cinemaFilms({ rows: ROWS.filter((r) => r.at < "2026-11-14"), day: 0, now: NOW, live: true }).tomorrow).toBe(false);
  });

  it("lists tomorrow's films with all their times", () => {
    const page = cinemaFilms({ rows: ROWS, day: 1, now: NOW, live: true });
    expect(page.films.map((f) => [f.film, ats(f.rows)])).toEqual([
      [3, ["2026-11-14T13:00:00Z", "2026-11-14T15:50:00Z"]],
      [0, ["2026-11-14T18:00:00Z"]],
    ]);
    expect(page.films.every((f) => f.earlier.length === 0)).toBe(true);
  });

  it("before the page knows the time, keeps the whole day (the page's own HTML)", () => {
    const page = cinemaFilms({ rows: ROWS, day: 0, now: "2026-11-13T07:00:00Z", live: false });
    expect(page.films.map((f) => f.film)).toEqual([1, 3, 0, 2]);
    expect(ats(page.films[0]!.rows)).toEqual(["2026-11-13T11:30:00Z", "2026-11-13T18:10:00Z"]);
    expect(page.films.every((f) => f.earlier.length === 0)).toBe(true);
  });

  it("with nothing left today, every film comes with when it started", () => {
    const page = cinemaFilms({ rows: ROWS, day: 0, now: "2026-11-13T22:00:00Z", live: true });
    expect(page).toMatchObject({ total: 4, left: 0 });
    expect(page.films.map((f) => f.film)).toEqual([1, 3, 0, 2]); // by when each first started
  });
});

describe("a later day (D-142)", () => {
  it("lists every film with all its times, nothing struck as started", () => {
    const sun = [row(1, "2026-11-15T18:00:00Z"), row(0, "2026-11-15T13:00:00Z"), row(0, "2026-11-15T16:00:00Z")];
    const films = cinemaFilms({ rows: sun, day: 2, now: NOW, live: true });
    expect(films.films.map((f) => [f.film, ats(f.rows), f.earlier.length])).toEqual([
      [0, ["2026-11-15T13:00:00Z", "2026-11-15T16:00:00Z"], 0],
      [1, ["2026-11-15T18:00:00Z"], 0],
    ]);
    expect([films.total, films.left]).toEqual([2, 2]);
  });
});
