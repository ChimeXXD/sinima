import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseThc, readThc, thcDaySelector } from "../../../../scripts/sources/thc";
import { fakeTabs } from "./tabbed";

// Cinemax THC's home page (D-125), built by script: its "Now Showing" section has a tab per day
// ("Nov 18th") and each film's times ("01:40 PM"). Rendered on 17 Nov 2026 (02:44 in Lagos)
// through politeBrowser after clicking "Nov 17th", then "Nov 18th", and cut down (D-24). The site
// says "Online booking not available", so there are no booking links.
const fixture = (name: string) => readFileSync(join(import.meta.dirname, `../../../fixtures/thc/${name}`), "utf8");
const TODAY = fixture("2026-11-17-home-nov-17th.html");
const TOMORROW = fixture("2026-11-17-home-nov-18th.html");
const PAGE = "https://cinemaxthc.ng/";
const nov17 = { year: 2026, month: 11, day: 17 };
const nov18 = { year: 2026, month: 11, day: 18 };
const parse = (html: string, day = nov17) => parseThc(html, { cinemaId: "thc-agege", day, origin: "https://cinemaxthc.ng" });

describe("parseThc", () => {
  it("reads the day's 11 times into UTC, with no booking link", () => {
    const rows = parse(TODAY);
    expect(rows).toHaveLength(11);
    expect(rows[0]).toEqual({ cinemaId: "thc-agege", filmTitle: "Street Fighter", rating: null, startsAt: "2026-11-17T12:40:00Z", format: null, bookingUrl: null });
    expect(rows.filter((r) => r.filmTitle === "Five Figurines").map((r) => r.startsAt)).toEqual(["2026-11-17T17:10:00Z", "2026-11-17T19:30:00Z"]);
    expect(parse(TOMORROW, nov18).map((r) => r.startsAt.slice(0, 10))).toEqual(Array(11).fill("2026-11-18"));
  });

  it("refuses a page showing another day's tab, and reads a day with no tab as no showings", () => {
    expect(() => parse(TODAY, nov18)).toThrow('THC page for thc-agege: the page shows "Nov 17th", not "Nov 18th".');
    expect(parse(TODAY, { year: 2026, month: 11, day: 25 })).toEqual([]);
  });

  it("fails loudly on a changed layout or a time it can't read", () => {
    expect(() => parse("<section><h2>Now Showing</h2></section>")).toThrow("THC page for thc-agege: no date tabs found. Has the page layout changed?");
    expect(() => parse(TODAY.replace(">01:40 PM<", ">1.40pm<"))).toThrow('THC page for thc-agege: cannot read the time "1.40pm"');
  });
});

describe("readThc", () => {
  it("names the tab a visitor taps, and renders the page once per day: two page loads", async () => {
    expect(thcDaySelector(nov18)).toBe("span:text-is('Nov 18th')");
    const net = fakeTabs({ [`${PAGE} span:text-is('Nov 17th')`]: TODAY, [`${PAGE} span:text-is('Nov 18th')`]: TOMORROW });
    const pages = await readThc({ now: "2026-11-17T01:44:00Z", days: 2, ...net, pages: { "thc-agege": PAGE } });
    expect(net.asked).toHaveLength(2);
    expect(pages.flatMap((page) => page.showings)).toHaveLength(22);
  });
});
