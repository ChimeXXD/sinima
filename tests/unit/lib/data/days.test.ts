import { describe, expect, it } from "vitest";
import { cityDays } from "@/lib/data/cityDays";
import { cinemaFilms } from "@/lib/data/cinemaPage";
import { cinemaSections } from "@/lib/data/cinemas";
import { dayHref, listedCount, shownDays, type DayInfo } from "@/lib/data/days";
import { areaGroups } from "@/lib/data/filmPage";
import { filmSections } from "@/lib/data/films";
import { anchorFor, showingOn } from "@/lib/data/programme";
import { laterDayData } from "@/lib/data/laterDay";
import { toListData } from "@/lib/data/listData";
import { type ListRow } from "@/lib/data/select";
import type { Cinema, Film, ShowtimesFile } from "@/lib/data/types";

// Five days (D-142, D-146, D-147): today and tomorrow are in the page, days three to five are a file
// each; the page carries only which days exist and which sinimas list each.

// Wed 18 Nov 2026, 08:00 in Lagos.
const NOW = "2026-11-18T07:00:00Z";
const cinema = (id: string): Cinema => ({ id, name: id, chain: "Silverbird", area: "jabi", address: null, geo: null, website: null, sourceIds: ["s"] });
const film = (id: string): Film => ({ id, title: id, runtimeMin: null, rating: null, origin: null, tmdbId: null });
const showing = (cinemaId: string, filmId: string, startsAt: string) => ({ id: `${cinemaId}_${filmId}_${startsAt}`, filmId, cinemaId, screenId: null, startsAt, format: null, language: null, price: null, bookingUrl: null, sourceId: "s", fetchedAt: NOW });
const file = (showings: ReturnType<typeof showing>[], cinemas = ["a", "b", "c"], films = ["x", "y"]): ShowtimesFile => ({
  schemaVersion: 1,
  generatedAt: NOW,
  timeZone: "Africa/Lagos",
  sources: [{ id: "s", name: "Silverbird's site", url: "https://example.com", method: "public-page", status: "cleared", fetchedAt: NOW, lastOkAt: NOW, health: "ok" }],
  cinemas: cinemas.map(cinema),
  films: films.map(film),
  showings,
  sample: false,
}) as ShowtimesFile;

describe("cityDays: the days a city's page knows about (build time)", () => {
  const page = file([showing("a", "x", "2026-11-18T18:00:00Z"), showing("b", "x", "2026-11-18T19:00:00Z"), showing("a", "y", "2026-11-19T18:00:00Z"), showing("c", "y", "2026-11-19T23:30:00Z")]);

  it("lists today's and tomorrow's sinimas from the page, as positions in its cinemas", () => {
    expect(cityDays(page, [])).toEqual([
      { date: "2026-11-18", cinemas: [0, 1] },
      { date: "2026-11-19", cinemas: [0, 2] },
    ]);
  });

  it("adds each later day's file, marked as its own file (D-147)", () => {
    const sat = file([showing("b", "x", "2026-11-21T18:00:00Z")]);
    const fri = file([showing("c", "y", "2026-11-20T18:00:00Z"), showing("a", "y", "2026-11-20T20:00:00Z")]);
    expect(cityDays(page, [{ date: "2026-11-21", file: sat }, { date: "2026-11-20", file: fri }]).slice(2)).toEqual([
      { date: "2026-11-20", cinemas: [0, 2], later: true },
      { date: "2026-11-21", cinemas: [1], later: true },
    ]);
  });

  it("ignores a day file outside today to today + 4, or one for a day the page holds", () => {
    const old = file([showing("a", "x", "2026-11-17T18:00:00Z")]);
    const far = file([showing("a", "x", "2026-11-23T18:00:00Z")]);
    const tomorrow = file([showing("b", "x", "2026-11-19T18:00:00Z")]);
    expect(cityDays(page, [{ date: "2026-11-17", file: old }, { date: "2026-11-23", file: far }, { date: "2026-11-19", file: tomorrow }]).map((day) => day.date)).toEqual(["2026-11-18", "2026-11-19"]);
  });
});

describe("shownDays: the tiles on the page (in the browser)", () => {
  const rows: ListRow[] = [{ at: "2026-11-18T18:00:00Z", film: 0, cinema: 0, format: null, book: null, fresh: 0 }];
  const days: DayInfo[] = [
    { date: "2026-11-18", cinemas: [0, 1, 2] },
    { date: "2026-11-19", cinemas: [0, 1] },
    { date: "2026-11-21", cinemas: [1], later: true },
    { date: "2026-11-22", cinemas: [3], later: true },
  ];

  it("always shows today and tomorrow, then only the later days that have a file", () => {
    expect(shownDays(rows, days, NOW).map(({ day, key, later }) => [day, key, later])).toEqual([
      [0, "2026-11-18", false],
      [1, "2026-11-19", false],
      [3, "2026-11-21", true],
      [4, "2026-11-22", true],
    ]);
  });

  it("puts each tile on its own date", () => {
    expect(shownDays(rows, days, NOW).map((day) => day.date.slice(0, 10))).toEqual(["2026-11-18", "2026-11-19", "2026-11-21", "2026-11-22"]);
  });

  it("read on a later day, yesterday's days drop off and a day the page didn't hold comes from its file", () => {
    // Thu 19 Nov, 10:00: today is Thursday (in the page); Friday has no file; Saturday and Sunday do.
    expect(shownDays([], days, "2026-11-19T09:00:00Z").map(({ day, key, later }) => [day, key, later])).toEqual([
      [0, "2026-11-19", false],
      [1, "2026-11-20", false],
      [2, "2026-11-21", true],
      [3, "2026-11-22", true],
    ]);
  });

  it("with no list (an older page), shows today and tomorrow", () => {
    expect(shownDays(rows, undefined, NOW).map((day) => day.key)).toEqual(["2026-11-18", "2026-11-19"]);
  });

  it("counts a day's sinimas out of every sinima listing any shown day", () => {
    const shown = shownDays(rows, days, NOW);
    expect(listedCount(shown, 0)).toEqual({ listed: 3, total: 4 });
    expect(listedCount(shown, 3)).toEqual({ listed: 1, total: 4 });
    expect(listedCount(shown, 2)).toEqual({ listed: 0, total: 4 });
  });
});

describe("laterDayData: a later day's file as the page's list data", () => {
  const page = toListData(file([showing("a", "x", "2026-11-18T18:00:00Z")], ["a", "b", "c"], ["x"]));
  // The day file lists its cinemas in another order, and a film the page doesn't have.
  const fri = file([showing("c", "z", "2026-11-20T18:00:00Z"), showing("a", "x", "2026-11-20T20:00:00Z")], ["c", "a", "b"], ["x", "z"]);

  it("keeps the page's cinemas, so a cinema is the same position on every day", () => {
    const data = laterDayData(fri, page);
    expect(data.cinemas).toBe(page.cinemas);
    expect(data.rows.map((row) => [data.cinemas[row.cinema]!.id, data.films[row.film]!.id, row.at])).toEqual([
      ["c", "z", "2026-11-20T18:00:00Z"],
      ["a", "x", "2026-11-20T20:00:00Z"],
    ]);
  });

  it("keeps one film's or one cinema's rows, as the page does", () => {
    expect(laterDayData(fri, page, { filmId: "z" }).rows).toHaveLength(1);
    expect(laterDayData(fri, page, { cinemaId: "a" }).rows.map((row) => row.at)).toEqual(["2026-11-20T20:00:00Z"]);
  });

  it("drops a row for a cinema the page doesn't know", () => {
    const stray = file([showing("d", "x", "2026-11-20T18:00:00Z")], ["d"], ["x"]);
    expect(laterDayData(stray, page).rows).toEqual([]);
  });
});

describe("a later day's rows sit on their own tile after midnight (D-146)", () => {
  const at = (iso: string): ListRow => ({ at: iso, film: 0, cinema: 0, format: null, book: null, fresh: 0 });
  // The page: Wednesday evening with a 01:30 Thursday late show, then Thursday evening. Saturday is a file.
  const page = [at("2026-11-18T18:00:00Z"), at("2026-11-19T00:30:00Z"), at("2026-11-19T18:00:00Z")];
  const days: DayInfo[] = [
    { date: "2026-11-18", cinemas: [0] },
    { date: "2026-11-19", cinemas: [0] },
    { date: "2026-11-21", cinemas: [0], later: true },
  ];
  const sat = [at("2026-11-21T18:00:00Z")];

  it.each([
    ["00:10 on Thursday, Wednesday's late show still to start", "2026-11-18T23:10:00Z"],
    ["10:00 on Wednesday", "2026-11-18T09:00:00Z"],
  ])("%s: Saturday's file lists its showing under Saturday's tile", (_, now) => {
    const tile = shownDays(page, days, now).find((day) => day.key === "2026-11-21")!;
    const anchor = anchorFor(page, now);
    expect(showingOn(sat, tile.day, now, null, false, anchor)).toHaveLength(1);
    expect(filmSections(sat, tile.day, now, true, null, anchor).map((section) => section.films.length)).toEqual([1]);
    expect(areaGroups(sat, tile.day, now, true, () => "jabi", null, anchor)).toHaveLength(1);
    expect(cinemaFilms({ rows: sat, day: tile.day, now, live: true, anchor }).total).toBe(1);
    expect(cinemaSections({ rows: sat, cinemas: 1, areaOf: () => "jabi", day: tile.day, now, live: true, format: null, home: null, anchor })[0]!.cinemas[0]!.rows).toHaveLength(1);
  });
});

describe("dayHref: a film's page opened on the day picked", () => {
  const shown = (day: 0 | 1 | 2, later: boolean) => ({ day, key: "2026-11-20", date: "2026-11-20T03:00:00Z", later, cinemas: [0] });

  it("names a later day, and a day whose times come from its own file (a page a day old)", () => {
    expect(dayHref("/film/x", shown(2, true))).toBe("/film/x?day=2026-11-20");
    expect(dayHref("/film/x", shown(1, true))).toBe("/film/x?day=2026-11-20");
  });

  it("leaves today and tomorrow from the page as they were", () => {
    expect(dayHref("/film/x", shown(0, false))).toBe("/film/x");
    expect(dayHref("/film/x", shown(1, false))).toBe("/film/x");
  });
});
