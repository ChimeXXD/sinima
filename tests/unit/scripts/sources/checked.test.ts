import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseChecked, readChecked } from "../../../../scripts/sources/checked.ts";

// Filmhouse's times read by hand on its own site (D-200): Filmhouse's ticket system turns our bot
// away, so a person reads each film's day pages and writes what they show into
// data/filmhouse-checked.json. The reader turns that file into rows; it never touches the network.

const NOW = "2026-11-25T12:30:00Z"; // 13:30 in Lagos, Wednesday 25 November
const CHECKED_AT = "2026-11-25T12:02:00Z";

const file = (films: unknown, extra: Record<string, unknown> = {}) => ({
  about: "test",
  checkedAt: CHECKED_AT,
  locations: { "filmhouse-lekki-imax": "lekki", "filmhouse-landmark": "landmark" },
  films,
  ...extra,
});

const doomsday = {
  title: "AVENGERS: DOOMSDAY",
  page: "avengersdoomsday-2026",
  days: {
    "2026-12-18": { "filmhouse-lekki-imax": ["12:30 Closed", "15:45 Closed"], "filmhouse-landmark": ["19:30 Closed", "22:45"] },
    "2026-12-19": { "filmhouse-lekki-imax": ["00:45", "12:30"] },
  },
};

describe("parseChecked (D-200)", () => {
  it("gives each time as a row in UTC, on the cinema's day page, with the day's own address and the read time", () => {
    const page = parseChecked(file([doomsday]), NOW);
    expect(page.readAt).toBe(CHECKED_AT);
    expect(page.builtAt).toBeNull();
    expect(page.showings).toEqual([
      { cinemaId: "filmhouse-lekki-imax", filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt: "2026-12-18T11:30:00Z", format: null, bookingUrl: "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-18?location=lekki", closed: true },
      { cinemaId: "filmhouse-lekki-imax", filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt: "2026-12-18T14:45:00Z", format: null, bookingUrl: "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-18?location=lekki", closed: true },
      { cinemaId: "filmhouse-landmark", filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt: "2026-12-18T18:30:00Z", format: null, bookingUrl: "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-18?location=landmark", closed: true },
      { cinemaId: "filmhouse-landmark", filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt: "2026-12-18T21:45:00Z", format: null, bookingUrl: "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-18?location=landmark" },
      // 12:45 AM on the 19 Dec page is 00:45 on 19 Dec, the Friday night's late show.
      { cinemaId: "filmhouse-lekki-imax", filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt: "2026-12-18T23:45:00Z", format: null, bookingUrl: "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-19?location=lekki" },
      { cinemaId: "filmhouse-lekki-imax", filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt: "2026-12-19T11:30:00Z", format: null, bookingUrl: "https://www.filmhouseng.com/movies/avengersdoomsday-2026/showtimes/2026-12-19?location=lekki" },
    ]);
  });

  it("leaves out the days before today in Lagos, and says so", () => {
    const page = parseChecked(file([{ ...doomsday, days: { "2026-11-24": { "filmhouse-landmark": ["19:30"] }, "2026-11-25": { "filmhouse-landmark": ["19:30"] } } }]), NOW);
    expect(page.showings.map((row) => row.startsAt)).toEqual(["2026-11-25T18:30:00Z"]);
    expect(page.notes).toEqual(["left out 1 time on days before today"]);
  });

  it("refuses a file it cannot read exactly, rather than guess", () => {
    expect(() => parseChecked(file([{ ...doomsday, days: { "2026-12-18": { "filmhouse-landmark": ["7:30PM"] } } }]), NOW)).toThrow('"7:30PM" at filmhouse-landmark on 2026-12-18 is not "HH:MM" or "HH:MM Closed"');
    expect(() => parseChecked(file([{ ...doomsday, days: { "2026-12-18": { "filmhouse-ikota": ["19:30"] } } }]), NOW)).toThrow('filmhouse-ikota has no Filmhouse location in "locations"');
    expect(() => parseChecked(file([{ ...doomsday, days: { "18 Dec": { "filmhouse-landmark": ["19:30"] } } }]), NOW)).toThrow('"18 Dec" is not a date (yyyy-mm-dd)');
    expect(() => parseChecked(file([doomsday], { checkedAt: "this morning" }), NOW)).toThrow("checkedAt must be a UTC time");
    // A check dated after the run would outrank the other sources for ever.
    expect(() => parseChecked(file([doomsday], { checkedAt: "2026-11-26T09:00:00Z" }), NOW)).toThrow("checkedAt 2026-11-26T09:00:00Z is after now");
    // A time on a day already past is still read exactly, not skipped unread.
    expect(() => parseChecked(file([{ ...doomsday, days: { "2026-11-24": { "filmhouse-landmark": ["7:30PM"] } } }]), NOW)).toThrow('"7:30PM" at filmhouse-landmark on 2026-11-24');
    expect(() => parseChecked(file([{ ...doomsday, page: "../../evil" }]), NOW)).toThrow('"../../evil" is not a Filmhouse film page name');
  });
});

describe("readChecked (D-200)", () => {
  it("reads data/filmhouse-checked.json under the run's root and asks the network for nothing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sinima-checked-"));
    mkdirSync(join(dir, "data"));
    writeFileSync(join(dir, "data/filmhouse-checked.json"), JSON.stringify(file([doomsday])));
    const nothing = async (url: string) => {
      throw new Error(`asked for ${url}`);
    };
    const pages = await readChecked({ now: NOW, days: 5, root: dir, fetchText: nothing, renderText: nothing, pages: {} });
    expect(pages).toHaveLength(1);
    expect(pages[0]!.showings).toHaveLength(6);
  });

  it("the committed file reads cleanly", () => {
    const root = join(import.meta.dirname, "../../../..");
    const page = parseChecked(JSON.parse(readFileSync(join(root, "data/filmhouse-checked.json"), "utf8")), "2026-11-25T12:30:00Z");
    expect(page.showings.length).toBeGreaterThan(0);
  });
});
