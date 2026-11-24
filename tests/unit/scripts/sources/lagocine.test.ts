import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseLagocineCinema, parseLagocineDay, publicBookingPage } from "../../../../scripts/sources/lagocine";

// Real pages saved on 11 Nov 2026 and cut down (D-24). Counts were taken from the saved pages
// with a separate script, not from the parser.
const fixture = (name: string) => readFileSync(join(import.meta.dirname, "../../../fixtures/lagocine", name), "utf8");
const day = fixture("2026-11-11-day.html");
const cinema = fixture("2026-11-11-cinema-silverbird-ikeja.html");
const count = <T>(items: T[]) => {
  const tally: Record<string, number> = {};
  for (const item of items) tally[String(item)] = (tally[String(item)] ?? 0) + 1;
  return tally;
};

describe("parseLagocineDay", () => {
  const page = parseLagocineDay(day);

  it("reads every showing in Lagos that day: 353 across 31 films and 20 cinemas", () => {
    expect(page.showings).toHaveLength(353);
    expect(new Set(page.showings.map((s) => s.filmTitle)).size).toBe(31);
    expect(count(page.showings.map((s) => s.cinemaId))).toEqual({
      "genesis-festac": 39, "genesis-maryland": 38, "magnificent-ikorodu-road": 36, "silverbird-ikeja": 28,
      "ebonylife-vi": 27, "genesis-purple-lekki": 23, "filmworld-idimu": 22, "sky-sangotedo": 20, "ozone-yaba": 19,
      "viva-ikeja": 19, "grand-lekki": 12, "thc-agege": 11, "filmhouse-circle-mall": 10, "filmhouse-surulere": 10,
      "filmhouse-lekki-imax": 9, "filmhouse-ikota": 9, "blue-pictures-onikan": 7, "filmhouse-landmark": 7,
      "filmhouse-oniru": 5, "filmhouse-palms-lekki": 2,
    });
  });

  it("converts Lagos time to UTC: the 10:00 showing of Verity is 09:00Z", () => {
    expect(page.showings[0]).toEqual({
      cinemaId: "magnificent-ikorodu-road",
      filmTitle: "Verity",
      rating: "18",
      startsAt: "2026-11-11T09:00:00Z",
      format: null,
      bookingUrl: null,
    });
    expect(page.showings.every((s) => s.startsAt.startsWith("2026-11-11T") && s.startsAt.endsWith(":00Z"))).toBe(true);
  });

  it("keeps the booking link and format when the page gives them", () => {
    expect(page.showings.find((s) => s.format === "IMAX 2D")).toEqual({
      cinemaId: "filmhouse-circle-mall",
      filmTitle: "Ramayana",
      rating: null, // the page marks Ramayana "NR"
      startsAt: "2026-11-11T09:00:00Z",
      format: "IMAX 2D",
      // Lagocine links into Filmhouse's checkout (".../circlemall/select-tickets?showtime=…"); since D-194 the
      // link is cut back to the film's public showtimes page for the day (rule 5).
      bookingUrl: "https://www.filmhouseng.com/movies/ramayana-2026/showtimes/2026-11-11",
    });
    expect(count(page.showings.map((s) => s.format))).toEqual({ null: 301, "2D": 43, "IMAX 2D": 7, MX4D: 2 });
    expect(page.showings.filter((s) => s.bookingUrl !== null)).toHaveLength(207);
  });

  it("decodes titles and links, and reads Lagocine's NR as no rating", () => {
    const titles = new Set(page.showings.map((s) => s.filmTitle));
    expect(titles).toContain("Arnie & Barney");
    expect(titles).toContain("Maybe… Maybe Not");
    expect(page.showings.find((s) => s.cinemaId === "ebonylife-vi")?.bookingUrl).toMatch(/\?showTimeId=[\w-]+&showtimeDate=2026-11-11$/);
    expect(count(page.showings.map((s) => s.rating))).not.toHaveProperty("NR");
    expect(page.showings.some((s) => s.rating === null)).toBe(true);
  });

  it("reads the page's build stamp as UTC", () => {
    expect(page.builtAt).toBe("2026-11-10T23:05:05Z");
  });

  it("fails loudly when the page no longer looks like a day page", () => {
    expect(() => parseLagocineDay("<html><body><p>Down for maintenance</p></body></html>")).toThrow(
      "Lagocine day page: no film cards found. Has the page layout changed?",
    );
  });

  it("refuses a time that is not Lagos time, rather than guessing", () => {
    expect(() => parseLagocineDay(day.replace("2026-11-11T10:00:00+01:00", "2026-11-11T10:00:00+00:00"))).toThrow(
      'Not a Lagos time (+01:00): "2026-11-11T10:00:00+00:00"',
    );
  });
});

describe("parseLagocineCinema", () => {
  const page = parseLagocineCinema(cinema, "silverbird-ikeja");

  it("reads each day's times for the one cinema: 28 on each of 11 and 12 Nov, then the December dates", () => {
    expect(page.showings).toHaveLength(70);
    expect(count(page.showings.map((s) => s.startsAt.slice(0, 10)))).toEqual({
      "2026-11-11": 28, "2026-11-12": 28, "2026-12-04": 2, "2026-12-05": 2, "2026-12-06": 2,
      "2026-12-07": 2, "2026-12-08": 2, "2026-12-09": 2, "2026-12-10": 2,
    });
    expect(new Set(page.showings.map((s) => s.cinemaId))).toEqual(new Set(["silverbird-ikeja"]));
  });

  it("does not count the NEXT label's time as a showing", () => {
    const first = page.showings.filter((s) => s.filmTitle === "Tele X Zikora").map((s) => s.startsAt);
    expect(first).toEqual(["2026-11-11T14:50:00Z", "2026-11-11T17:20:00Z", "2026-11-12T14:50:00Z", "2026-11-12T17:20:00Z"]);
  });

  it("carries the rating and the booking link", () => {
    expect(page.showings[0]).toEqual({
      cinemaId: "silverbird-ikeja",
      filmTitle: "Tele X Zikora",
      rating: "18",
      startsAt: "2026-11-11T14:50:00Z",
      format: null,
      bookingUrl: "https://ticketing.eu.veezi.com/purchase/321795?siteToken=9chn7w68550a7sxgexpdng2ndm",
    });
    expect(page.showings.find((s) => s.filmTitle === "The Secret Lives of Baba Segi's Wives")?.rating).toBeNull();
  });

  it("agrees with the day page about the same cinema on the same day", () => {
    const key = (s: { filmTitle: string; startsAt: string }) => `${s.filmTitle} ${s.startsAt}`;
    const fromDay = parseLagocineDay(day).showings.filter((s) => s.cinemaId === "silverbird-ikeja").map(key).sort();
    const fromCinema = page.showings.filter((s) => s.startsAt.startsWith("2026-11-11")).map(key).sort();
    expect(fromCinema).toEqual(fromDay);
  });

  it("fails loudly when the page no longer looks like a cinema page", () => {
    expect(() => parseLagocineCinema("<html></html>", "silverbird-ikeja")).toThrow(
      "Lagocine cinema page: no programme rows found. Has the page layout changed?",
    );
  });
});

// Tickets on sale before a film opens (D-194): Lagocine's page for Friday 18 December, saved on
// 24 Nov 2026 and cut down. Counts from the saved page with a separate script: Dune: Part Three 15
// showings at 6 Filmhouses, Avengers: Doomsday 22 at 7.
describe("an opening day sold ahead", () => {
  const page = parseLagocineDay(fixture("2026-11-24-day-2026-12-18.html"));
  const of = (title: RegExp) => page.showings.filter((row) => title.test(row.filmTitle));

  it("reads both films' opening-day showings and the Filmhouses selling them", () => {
    expect(of(/DUNE/)).toHaveLength(15);
    expect(new Set(of(/DUNE/).map((row) => row.cinemaId)).size).toBe(6);
    expect(of(/DOOMSDAY/)).toHaveLength(22);
    expect(new Set(of(/DOOMSDAY/).map((row) => row.cinemaId)).size).toBe(7);
    expect(of(/DUNE/).find((row) => row.cinemaId === "filmhouse-circle-mall")).toMatchObject({ startsAt: "2026-12-18T09:30:00Z", format: "IMAX 2D" });
  });

  it("cuts each Filmhouse checkout link back to the film's public showtimes page for that day (rule 5)", () => {
    const links = new Set(page.showings.map((row) => row.bookingUrl));
    expect([...links].sort()).toEqual([
      "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-18",
      "https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18",
    ]);
  });
});

describe("publicBookingPage", () => {
  it("cuts a Filmhouse checkout or seat-plan link to the showtimes page, keeping the day", () => {
    expect(publicBookingPage("https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18/circlemall/select-tickets?showtime=QWpz")).toBe("https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18");
    expect(publicBookingPage("https://www.filmhouseng.com/movies/x/showtimes/2026-12-18/lekki/seat-plan")).toBe("https://www.filmhouseng.com/movies/x/showtimes/2026-12-18");
  });
  it("cuts any spelling of Filmhouse's host, and drops a checkout link it can't make a page from", () => {
    expect(publicBookingPage("https://filmhouseng.com/movies/x/showtimes/2026-12-18/lekki/select-tickets?showtime=1")).toBe("https://www.filmhouseng.com/movies/x/showtimes/2026-12-18");
    expect(publicBookingPage("https://www.filmhouseng.com/lekki/select-tickets?showtime=1")).toBeNull();
  });
  it("leaves every other link as it is, and nothing as nothing", () => {
    expect(publicBookingPage("https://ticketing.eu.veezi.com/purchase/123?siteToken=abc")).toBe("https://ticketing.eu.veezi.com/purchase/123?siteToken=abc");
    expect(publicBookingPage("https://www.filmhouseng.com/movies/x/showtimes/2026-12-18")).toBe("https://www.filmhouseng.com/movies/x/showtimes/2026-12-18");
    expect(publicBookingPage(null)).toBeNull();
  });
});
