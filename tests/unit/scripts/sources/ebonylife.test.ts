import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ebonyLifeDaySelector, parseEbonyLife, readEbonyLife } from "../../../../scripts/sources/ebonylife";
import { fakeTabs } from "./tabbed";

// EbonyLife's /movies page (D-125), built by script: rendered on 17 Nov 2026 (02:44 in Lagos)
// through politeBrowser after clicking "17 Nov", then "18 Nov", and cut down (D-24). Each time
// links to its own booking page, which carries the date (showtimeDate=2026-11-17).
const fixture = (name: string) => readFileSync(join(import.meta.dirname, `../../../fixtures/ebonylife/${name}`), "utf8");
const TODAY = fixture("2026-11-17-movies-17-nov.html");
const TOMORROW = fixture("2026-11-17-movies-18-nov.html");
const PAGE = "https://ebonylifecinemas.com/movies";
const nov17 = { year: 2026, month: 11, day: 17 };
const nov18 = { year: 2026, month: 11, day: 18 };
const parse = (html: string, day = nov17) => parseEbonyLife(html, { cinemaId: "ebonylife-vi", day, origin: "https://ebonylifecinemas.com" });

describe("parseEbonyLife", () => {
  it("reads 17 Nov's 28 times into UTC, each with its own booking page on EbonyLife's site", () => {
    const rows = parse(TODAY);
    expect(rows).toHaveLength(28);
    expect(rows[0]).toEqual({
      cinemaId: "ebonylife-vi", filmTitle: "Arnie & Barney", rating: null, startsAt: "2026-11-17T09:40:00Z", format: null,
      bookingUrl: "https://ebonylifecinemas.com/movies/086be6bb-ddca-4d5e-9b15-d2ca3110489a?showTimeId=90fbe96e-2f11-48a3-8b15-8a4e0986af79&showtimeDate=2026-11-17",
    });
    expect(rows.filter((r) => r.filmTitle === "Dear Ajayi").map((r) => r.startsAt)).toEqual(["2026-11-17T10:00:00Z", "2026-11-17T13:25:00Z"]);
  });

  it("reads 18 Nov's 10 times, all in the evening, as the site lists them", () => {
    const rows = parse(TOMORROW, nov18);
    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatchObject({ filmTitle: "Clayface", startsAt: "2026-11-18T17:50:00Z" });
    for (const row of rows) expect(row.bookingUrl).toMatch(/showtimeDate=2026-11-18$/);
  });

  it("refuses a page whose times are for another day (the date was not clicked)", () => {
    expect(() => parse(TODAY, nov18)).toThrow("EbonyLife page for ebonylife-vi: a time is for 2026-11-17, not 2026-11-18. Was the date clicked?");
  });

  it("reads a day the date picker does not offer as no showings", () => {
    expect(parse(TODAY, { year: 2026, month: 11, day: 25 })).toEqual([]);
  });

  it("fails loudly on a changed layout, a time it can't read, or a booking link that is not EbonyLife's", () => {
    expect(() => parse("<div><article>x</article></div>")).toThrow("EbonyLife page for ebonylife-vi: no date picker found. Has the page layout changed?");
    expect(() => parse(TODAY.replace(">10:40 AM<", ">10h40<"))).toThrow('EbonyLife page for ebonylife-vi: cannot read the time "10h40"');
    const offsite = TODAY.replace('href="/movies/086be6bb-ddca-4d5e-9b15-d2ca3110489a?showTimeId=', 'href="https://pay.example/x?showTimeId=');
    expect(() => parse(offsite)).toThrow(/EbonyLife page for ebonylife-vi: "https:\/\/pay\.example\/x\?showTimeId=.*" is not a booking page on EbonyLife's site\./);
  });
});

describe("readEbonyLife", () => {
  const SELECT_17 = "button:has(p:text-is('17 Nov'))";
  const SELECT_18 = "button:has(p:text-is('18 Nov'))";

  it("names the date a visitor taps", () => {
    expect(ebonyLifeDaySelector(nov18)).toBe(SELECT_18);
    expect(ebonyLifeDaySelector({ year: 2026, month: 12, day: 4 })).toBe("button:has(p:text-is('4 Dec'))");
  });

  it("renders the page once per day, clicking that day's date: two page loads", async () => {
    const net = fakeTabs({ [`${PAGE} ${SELECT_17}`]: TODAY, [`${PAGE} ${SELECT_18}`]: TOMORROW });
    const pages = await readEbonyLife({ now: "2026-11-17T01:44:00Z", days: 2, ...net, pages: { "ebonylife-vi": PAGE } });
    expect(net.asked).toEqual([`${PAGE} ${SELECT_17}`, `${PAGE} ${SELECT_18}`]);
    expect(pages.flatMap((page) => page.showings)).toHaveLength(38);
  });

  it("fails when nothing is on any day read, rather than emptying the cinema silently", async () => {
    const empty = TODAY.replace(/<article[\s\S]*<\/article>/, "");
    const net = fakeTabs({ [`${PAGE} ${SELECT_17}`]: empty, [`${PAGE} ${SELECT_18}`]: empty });
    await expect(readEbonyLife({ now: "2026-11-17T01:44:00Z", days: 2, ...net, pages: { "ebonylife-vi": PAGE } })).rejects.toThrow("EbonyLife page for ebonylife-vi: no times on any day read. Has the page layout changed?");
  });
});
