import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FILMHOUSE_HOME, parseFilmhouseHome, readFilmhouseHome, runtimeMinutes } from "../../../../scripts/sources/filmhouse";

// Filmhouse's home page (D-131), saved once on 17 Nov 2026 (16:59 in Lagos) and cut down to the
// banner's data (D-24). Its "Now Showing" list is empty in the HTML (the browser fills it from
// CINEsync, which refuses our bot), so the only films the page itself gives are the banner's, each
// with the nearest date it has showtimes. A film counts as on today only when that date is today.
const html = readFileSync(join(import.meta.dirname, "../../../fixtures/filmhouse/2026-11-17-home.html"), "utf8");
const NOW = "2026-11-17T15:59:08Z"; // 16:59 on 17 Nov in Lagos
const featured = (page = html, now = NOW) => parseFilmhouseHome(page, { now }).featured!;

describe("parseFilmhouseHome", () => {
  it("gives the 4 banner films with showtimes today, with runtime and rating, and no showings", () => {
    const page = parseFilmhouseHome(html, { now: NOW });
    expect(page.showings).toEqual([]);
    expect(page.featured).toEqual({
      day: "2026-11-17",
      films: [
        { title: "GHOST SOLDIER", runtimeMin: 90, rating: "PG 12" },
        { title: "How to Rob a Bank", runtimeMin: 122, rating: "PG 18" },
        { title: "FIVE FIGURINES", runtimeMin: 120, rating: null },
        { title: "DEAR AJAYI", runtimeMin: 115, rating: "15" },
      ],
    });
  });

  it("leaves out the banner films whose nearest showtimes are on a later day (the page's own coming-soon flag says false for all 9)", () => {
    const titles = featured().films.map((film) => film.title);
    for (const later of ["The Hunger Games: Sunrise on the Reaping", "THE FOUR", "DUNE : PART THREE", "AVENGERS: DOOMSDAY", "JUMANJI: OPEN WORLD"]) expect(titles).not.toContain(later);
    expect(featured(html, "2026-11-20T10:00:00Z").films.map((film) => film.title)).toEqual(["The Hunger Games: Sunrise on the Reaping"]);
  });

  it("takes today in Lagos, not UTC", () => {
    expect(featured(html, "2026-11-16T22:59:59Z")).toEqual({ day: "2026-11-16", films: [] }); // 23:59 on the 16th
    expect(featured(html, "2026-11-16T23:00:00Z").films).toHaveLength(4); // 00:00 on the 17th
  });

  it("fails loudly on a changed layout", () => {
    expect(() => featured("<html></html>")).toThrow("Filmhouse home page: no banner data found. Has the page layout changed?");
    expect(() => featured(html.replace('\\"movie_name\\":\\"GHOST SOLDIER\\"', '\\"movie_name\\":\\"\\"'))).toThrow("Filmhouse home page: a banner film has no title. Has the page layout changed?");
    expect(() => featured(html.replace('\\"nearest_show_times_date\\":\\"2026-11-17\\"', '\\"nearest_show_times_date\\":\\"17 Nov\\"'))).toThrow('Filmhouse home page: "GHOST SOLDIER" has the showtimes date "17 Nov", not yyyy-mm-dd');
    // A banner for one location would make "Filmhouse" (the whole chain) untrue.
    expect(() => featured(html.replace('\\"cinema_location_name\\":\\"All\\"', '\\"cinema_location_name\\":\\"Oniru\\"'))).toThrow('Filmhouse home page: the banner is for "Oniru", not every location');
    expect(() => featured(html.replace(/\\"list\\":\[.*?\}\]/, '\\"list\\":[]'))).toThrow("Filmhouse home page: the banner has no films. Has the page layout changed?");
  });
});

describe("parseFilmhouseHome: coming films (D-144, D-151)", () => {
  it("lists the banner films whose nearest showtimes are after today, with that Lagos date and the rating, in the page's order", () => {
    expect(parseFilmhouseHome(html, { now: NOW }).coming).toEqual([
      { title: "The Hunger Games: Sunrise on the Reaping", firstDay: "2026-11-20", rating: "PG 12" },
      { title: "THE FOUR", firstDay: "2026-12-11", rating: null },
      { title: "DUNE : PART THREE", firstDay: "2026-12-18", rating: null },
      { title: "AVENGERS: DOOMSDAY", firstDay: "2026-12-18", rating: "PG-13" },
      { title: "JUMANJI: OPEN WORLD", firstDay: "2026-12-25", rating: "PG 12" },
    ]);
  });

  it("drops a film once its date is today (it is featured then) and takes today in Lagos", () => {
    expect(parseFilmhouseHome(html, { now: "2026-11-20T10:00:00Z" }).coming!.map((film) => film.title)).not.toContain("The Hunger Games: Sunrise on the Reaping");
    expect(parseFilmhouseHome(html, { now: "2026-11-19T22:59:59Z" }).coming!.map((film) => film.title)).toContain("The Hunger Games: Sunrise on the Reaping"); // 23:59 on the 19th
    expect(parseFilmhouseHome(html, { now: "2026-11-19T23:00:00Z" }).coming!.map((film) => film.title)).not.toContain("The Hunger Games: Sunrise on the Reaping"); // 00:00 on the 20th
  });

  it("counts a film the page flags as coming soon with no date as coming, date not announced; the flag alone never makes a dated film today coming", () => {
    const flagged = html
      .replace('is_coming_soon\\":false,\\"nearest_show_times_date\\":\\"2026-12-11\\"', 'is_coming_soon\\":true,\\"nearest_show_times_date\\":null')
      .replace('is_coming_soon\\":false,\\"nearest_show_times_date\\":\\"2026-11-17\\"', 'is_coming_soon\\":true,\\"nearest_show_times_date\\":\\"2026-11-17\\"');
    const page = parseFilmhouseHome(flagged, { now: NOW });
    expect(page.coming).toContainEqual({ title: "THE FOUR", firstDay: null, rating: null });
    expect(page.coming!.map((film) => film.title)).not.toContain("GHOST SOLDIER");
    expect(page.featured!.films.map((film) => film.title)).toContain("GHOST SOLDIER");
  });

  it("leaves out a film with no date that the page does not flag as coming soon", () => {
    const undated = html.replace('is_coming_soon\\":false,\\"nearest_show_times_date\\":\\"2026-12-11\\"', 'is_coming_soon\\":false,\\"nearest_show_times_date\\":null');
    expect(parseFilmhouseHome(undated, { now: NOW }).coming!.map((film) => film.title)).not.toContain("THE FOUR");
  });
});

describe("runtimeMinutes", () => {
  it("reads Filmhouse's runtimes, and nothing it can't read", () => {
    expect([runtimeMinutes("1h 30m"), runtimeMinutes("2h 0m"), runtimeMinutes("45m"), runtimeMinutes("2h"), runtimeMinutes(""), runtimeMinutes(null), runtimeMinutes("TBC")]).toEqual([90, 120, 45, 120, null, null, null]);
  });
});

describe("readFilmhouseHome", () => {
  it("reads the one home page and nothing else: no CINEsync call, no film page", async () => {
    const asked: string[] = [];
    const fetchText = async (url: string) => (asked.push(url), html);
    const renderText = Object.assign(async () => "", { close: async () => {} });
    const pages = await readFilmhouseHome({ now: NOW, days: 2, fetchText, renderText, pages: {} });
    expect(asked).toEqual([FILMHOUSE_HOME]);
    expect(FILMHOUSE_HOME).toBe("https://www.filmhouseng.com/");
    expect(pages.flatMap((page) => page.featured?.films ?? [])).toHaveLength(4);
  });
});
