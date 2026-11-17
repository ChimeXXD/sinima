import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { magnificentDaySelector, parseMagnificent, readMagnificent } from "../../../../scripts/sources/magnificent";
import { fakeTabs } from "./tabbed";

// Magnificent's "Movies and showtimes" page (review.html, D-125), built by script: a tab per day
// (data-d="2026-11-18"), the day's name ("Wednesday 18 November") and each film's times with
// their cinema. Rendered on 17 Nov 2026 (02:45 in Lagos) through politeBrowser after clicking the
// 17th, then the 18th, and cut down (D-24). Its "Book" buttons are not links, so none is kept.
const fixture = (name: string) => readFileSync(join(import.meta.dirname, `../../../fixtures/magnificent/${name}`), "utf8");
const TODAY = fixture("2026-11-17-review-17.html");
const TOMORROW = fixture("2026-11-17-review-18.html");
const PAGE = "https://magnificentcinemas.com/review.html";
const nov17 = { year: 2026, month: 11, day: 17 };
const nov18 = { year: 2026, month: 11, day: 18 };
const parse = (html: string, day = nov17) => parseMagnificent(html, { cinemaId: "magnificent-ikorodu-road", day, origin: "https://magnificentcinemas.com" });

describe("parseMagnificent", () => {
  it("reads the day's 34 times into UTC, with no booking link", () => {
    const rows = parse(TODAY);
    expect(rows).toHaveLength(34);
    expect(rows[0]).toEqual({ cinemaId: "magnificent-ikorodu-road", filmTitle: "TELE X ZIKORA", rating: null, startsAt: "2026-11-17T09:00:00Z", format: null, bookingUrl: null });
    expect(rows.filter((r) => r.filmTitle === "Dear Ajayi").map((r) => r.startsAt)).toEqual(["2026-11-17T14:00:00Z", "2026-11-17T16:00:00Z", "2026-11-17T19:00:00Z"]);
    expect(parse(TOMORROW, nov18)).toHaveLength(34);
  });

  it("refuses a page showing another day, and reads a day with no tab as no showings", () => {
    expect(() => parse(TODAY, nov18)).toThrow("Magnificent page for magnificent-ikorodu-road: the page shows 2026-11-17 (Tuesday 17 November), not 2026-11-18.");
    expect(parse(TODAY, { year: 2026, month: 12, day: 25 })).toEqual([]);
  });

  it("fails loudly on a changed layout or a time it can't read", () => {
    expect(() => parse("<main class=\"wrap\"></main>")).toThrow("Magnificent page for magnificent-ikorodu-road: no day tabs found. Has the page layout changed?");
    expect(() => parse(TODAY.replace('data-t="10:00"', 'data-t="10am"'))).toThrow('Magnificent page for magnificent-ikorodu-road: cannot read the time "10am"');
  });
});

describe("readMagnificent", () => {
  it("names the tab a visitor taps, and renders the page once per day: two page loads", async () => {
    expect(magnificentDaySelector(nov18)).toBe("button.daytab[data-d='2026-11-18']");
    const net = fakeTabs({ [`${PAGE} button.daytab[data-d='2026-11-17']`]: TODAY, [`${PAGE} button.daytab[data-d='2026-11-18']`]: TOMORROW });
    const pages = await readMagnificent({ now: "2026-11-17T01:44:00Z", days: 2, ...net, pages: { "magnificent-ikorodu-road": PAGE } });
    expect(net.asked).toHaveLength(2);
    expect(pages.flatMap((page) => page.showings)).toHaveLength(68);
  });
});
