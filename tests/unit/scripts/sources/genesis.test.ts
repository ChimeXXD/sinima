import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { genesisReader, genesisTitle, parseGenesisFilm, parseGenesisLocation } from "../../../../scripts/sources/genesis";

// Genesis's own site (D-122), saved once on 17 Nov 2026 (01:16-01:18 in Lagos) and cut down
// (D-24). A location page (/freedom-way-lekki/) holds today's programme there, dated in a hidden
// field and on a 24-hour clock; a film page (/<site>/film/<id>/<slug>) holds that film's times at
// every Genesis location for three days, dated "Tuesday, November 17th" with no year.
const fixture = (name: string) => readFileSync(join(import.meta.dirname, `../../../fixtures/genesis/${name}`), "utf8");
const LOCATIONS = {
  "genesis-purple-lekki": { url: "https://genesiscinemas.com/freedom-way-lekki/", file: "2026-11-17-lekki-purple.html" },
  "genesis-festac": { url: "https://genesiscinemas.com/festival-mall-festac-lagos/", file: "2026-11-17-festac.html" },
  "genesis-maryland": { url: "https://genesiscinemas.com/maryland-mall-maryland/", file: "2026-11-17-maryland.html" },
  "genesis-ceddi-plaza": { url: "https://genesiscinemas.com/ceddi-plaza-abuja/", file: "2026-11-17-ceddi-plaza.html" },
};
const STREET_FIGHTER = "https://genesiscinemas.com/lekki-purple/film/2854/street-fighter";
const SPIDER_MAN = "https://genesiscinemas.com/ceddi-plaza-abuja/film/2769/spiderman-brand-new-day";
const SITES = { "lekki-purple": "genesis-purple-lekki", "festival-mall-festac": "genesis-festac", "maryland-mall-maryland": "genesis-maryland", "ceddi-plaza-abuja": "genesis-ceddi-plaza" };
const nov17 = { year: 2026, month: 11, day: 17 };

describe("genesisTitle", () => {
  it("takes VIP out of the title as the format, however Genesis writes it", () => {
    expect(genesisTitle("SPIDER-MAN:VIP BRAND NEW DAY ")).toEqual({ title: "SPIDER-MAN: BRAND NEW DAY", format: "VIP" });
    expect(genesisTitle("FIVE FIGURINES(VIP)")).toEqual({ title: "FIVE FIGURINES", format: "VIP" });
    expect(genesisTitle("GHOST SOLDIER VIP")).toEqual({ title: "GHOST SOLDIER", format: "VIP" });
    expect(genesisTitle("TELE & ZIKORA")).toEqual({ title: "TELE & ZIKORA", format: null });
  });
});

describe("parseGenesisLocation", () => {
  const lekki = parseGenesisLocation(fixture("2026-11-17-lekki-purple.html"), { cinemaId: "genesis-purple-lekki" });

  it("reads the page's date, its site in the booking links, and every film with its link", () => {
    expect(lekki.date).toEqual(nov17);
    expect(lekki.site).toBe("lekki-purple");
    expect(lekki.films).toHaveLength(16);
    expect(lekki.films[2]).toEqual({ title: "STREET FIGHTER", url: STREET_FIGHTER });
  });

  it("reads today's 17 times on the 24-hour clock into UTC, with VIP as the format", () => {
    expect(lekki.showings).toHaveLength(17);
    expect(lekki.showings[0]).toEqual({
      cinemaId: "genesis-purple-lekki", filmTitle: "THE CAT IN THE HAT", rating: "G", startsAt: "2026-11-17T09:00:00Z", format: null,
      bookingUrl: "https://genesiscinemas.com/lekki-purple/booknow/15423",
    });
    expect(lekki.showings[1]).toMatchObject({ filmTitle: "SPIDER-MAN: BRAND NEW DAY", rating: "12A", startsAt: "2026-11-17T10:20:00Z", format: "VIP" });
  });

  it("reads each location's count of times", () => {
    const count = (id: keyof typeof LOCATIONS) => parseGenesisLocation(fixture(LOCATIONS[id].file), { cinemaId: id }).showings.length;
    expect([count("genesis-festac"), count("genesis-maryland"), count("genesis-ceddi-plaza")]).toEqual([15, 19, 21]);
  });

  it("puts a show after midnight on the night it is listed under", () => {
    const late = fixture("2026-11-17-lekki-purple.html").replace(">22:20  <", ">00:20  <");
    const clayface = parseGenesisLocation(late, { cinemaId: "genesis-purple-lekki" }).showings.find((s) => s.filmTitle === "CLAYFACE");
    expect(clayface?.startsAt).toBe("2026-11-17T23:20:00Z"); // 00:20 on the 18th in Lagos
  });

  it("fails loudly on a changed layout, a time it can't read, or another location's booking link", () => {
    expect(() => parseGenesisLocation("<html></html>", { cinemaId: "genesis-festac" })).toThrow("Genesis location page: no date or no programme found. Has the page layout changed?");
    expect(() => parseGenesisLocation(fixture("2026-11-17-lekki-purple.html").replace(">10:00  <", ">10.00<"), { cinemaId: "genesis-purple-lekki" })).toThrow('Genesis page: cannot read the time "10.00"');
    const mixed = fixture("2026-11-17-lekki-purple.html").replace("lekki-purple/booknow/15424", "benin-city/booknow/15424");
    expect(() => parseGenesisLocation(mixed, { cinemaId: "genesis-purple-lekki" })).toThrow("Genesis location page for genesis-purple-lekki: booking links for more than one location (lekki-purple, benin-city)");
  });
});

describe("parseGenesisFilm", () => {
  it("reads only our locations' times, three dated days each, and leaves out Genesis's other cities", () => {
    const page = parseGenesisFilm(fixture("2026-11-17-film-street-fighter.html"), { readOn: nov17, cinemaBySite: SITES });
    expect(page.showings).toHaveLength(12);
    expect(new Set(page.showings.map((s) => s.cinemaId))).toEqual(new Set(Object.values(SITES)));
    expect(page.showings.filter((s) => s.cinemaId === "genesis-festac").map((s) => s.startsAt)).toEqual(["2026-11-17T20:50:00Z", "2026-11-18T20:50:00Z", "2026-11-19T20:50:00Z"]);
    expect(page.showings[0]).toMatchObject({ filmTitle: "STREET FIGHTER", rating: "15", format: null });
    for (const s of page.showings) expect(s.bookingUrl).toMatch(new RegExp(`^https://genesiscinemas\\.com/${Object.entries(SITES).find(([, id]) => id === s.cinemaId)![0]}/booknow/\\d+$`));
  });

  it("checks each date's weekday and fails loudly when there is nothing to read", () => {
    const wrong = fixture("2026-11-17-film-street-fighter.html").replace("Tuesday, November 17th", "Friday, November 17th");
    expect(() => parseGenesisFilm(wrong, { readOn: nov17, cinemaBySite: SITES })).toThrow("17 November is not a Friday in 2026");
    expect(() => parseGenesisFilm("<html></html>", { readOn: nov17, cinemaBySite: SITES })).toThrow("Genesis film page: no showtimes found. Has the page layout changed?");
  });
});

describe("genesisReader", () => {
  // The location pages cut to Street Fighter (at all four) and Spider-Man (Ceddi Plaza only), the
  // two films whose pages were saved.
  const only = (html: string, titles: string[]) => {
    const $ = cheerio.load(html);
    $(".movie-tabs").filter((_, row) => !titles.includes($(row).find("h3").text().trim())).remove();
    return $.html();
  };
  const served: Record<string, string> = {
    [LOCATIONS["genesis-purple-lekki"].url]: only(fixture(LOCATIONS["genesis-purple-lekki"].file), ["STREET FIGHTER"]),
    [LOCATIONS["genesis-festac"].url]: only(fixture(LOCATIONS["genesis-festac"].file), ["STREET FIGHTER"]),
    [LOCATIONS["genesis-maryland"].url]: only(fixture(LOCATIONS["genesis-maryland"].file), ["STREET FIGHTER"]),
    [LOCATIONS["genesis-ceddi-plaza"].url]: only(fixture(LOCATIONS["genesis-ceddi-plaza"].file), ["STREET FIGHTER", "SPIDER-MAN: BRAND NEW DAY"]),
    [STREET_FIGHTER]: fixture("2026-11-17-film-street-fighter.html"),
    [SPIDER_MAN]: fixture("2026-11-17-film-spiderman-brand-new-day.html"),
  };
  const pages = Object.fromEntries(Object.entries(LOCATIONS).map(([id, { url }]) => [id, url]));
  const run = (maxFilmPages: number, swap: Record<string, string> = {}) => {
    const asked: string[] = [];
    const fetchText = async (url: string) => {
      asked.push(url);
      const page = swap[url] ?? served[url];
      if (page === undefined) throw new Error(`unexpected request ${url}`);
      return page;
    };
    const renderText = Object.assign(async () => "", { close: async () => {} });
    return { asked, read: genesisReader(maxFilmPages)({ now: "2026-11-17T00:20:00Z", days: 2, fetchText, renderText, pages }) };
  };
  const byCinemaDay = (rows: { cinemaId: string; filmTitle: string; startsAt: string }[]) => rows.map((s) => `${s.cinemaId} ${s.filmTitle} ${s.startsAt}`).sort();

  it("reads each location page, then one page per film (not per location), and keeps today and tomorrow", async () => {
    const { asked, read } = run(30);
    const rows = (await read).flatMap((page) => page.showings);
    expect(asked).toEqual([...Object.values(pages), STREET_FIGHTER, SPIDER_MAN]);
    expect(byCinemaDay(rows)).toEqual([
      "genesis-ceddi-plaza SPIDER-MAN: BRAND NEW DAY 2026-11-17T08:15:00Z",
      "genesis-ceddi-plaza SPIDER-MAN: BRAND NEW DAY 2026-11-18T08:15:00Z",
      "genesis-ceddi-plaza STREET FIGHTER 2026-11-17T13:00:00Z",
      "genesis-ceddi-plaza STREET FIGHTER 2026-11-18T13:00:00Z",
      "genesis-festac STREET FIGHTER 2026-11-17T20:50:00Z",
      "genesis-festac STREET FIGHTER 2026-11-18T20:50:00Z",
      "genesis-maryland STREET FIGHTER 2026-11-17T11:00:00Z",
      "genesis-maryland STREET FIGHTER 2026-11-18T11:00:00Z",
      "genesis-purple-lekki STREET FIGHTER 2026-11-17T11:05:00Z",
      "genesis-purple-lekki STREET FIGHTER 2026-11-18T11:05:00Z",
    ]);
  });

  it("past the cap on film pages, a film still has today's times from its location page", async () => {
    const { asked, read } = run(1);
    const rows = (await read).flatMap((page) => page.showings);
    expect(asked).toEqual([...Object.values(pages), STREET_FIGHTER]);
    expect(byCinemaDay(rows).filter((row) => row.includes("SPIDER-MAN"))).toEqual(["genesis-ceddi-plaza SPIDER-MAN: BRAND NEW DAY 2026-11-17T08:15:00Z"]);
    expect(rows).toHaveLength(9);
  });

  // The first live run (17 Nov, 00:53 UTC) failed on one film page that showed no times; one
  // such page must not cost every Genesis cinema its times.
  it("skips a film page that shows no times, says so in the run's log, and keeps that film's times from its location page", async () => {
    const { read } = run(30, { [SPIDER_MAN]: "<html><body><p>No showtimes</p></body></html>" });
    const pagesRead = await read;
    const rows = pagesRead.flatMap((page) => page.showings);
    expect(byCinemaDay(rows).filter((row) => row.includes("SPIDER-MAN"))).toEqual(["genesis-ceddi-plaza SPIDER-MAN: BRAND NEW DAY 2026-11-17T08:15:00Z"]);
    expect(pagesRead.flatMap((page) => page.notes ?? [])).toEqual([`${SPIDER_MAN} showed no times; that film has today's times only`]);
  });

  it("still fails loudly when no film page shows any times (the layout has changed)", async () => {
    const empty = "<html></html>";
    await expect(run(30, { [STREET_FIGHTER]: empty, [SPIDER_MAN]: empty }).read).rejects.toThrow("Genesis film page: no showtimes found. Has the page layout changed?");
  });
});
