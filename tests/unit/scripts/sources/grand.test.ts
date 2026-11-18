import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseGrand, readGrand } from "../../../../scripts/sources/grand";

// Grand Cinemas' home page (D-122), saved once on 17 Nov 2026 (01:14 in Lagos) and cut down
// (D-24). It lists the week by weekday tabs (Mon to Sun), with no dates, on a 12-hour clock
// ("3:00 pm"); tickets are sold at the cinema, so there are no booking links.
const html = readFileSync(join(import.meta.dirname, "../../../fixtures/grand/2026-11-17-home.html"), "utf8");
const TUESDAY = "2026-11-17T00:20:00Z"; // 01:20 on Tuesday 17 Nov in Lagos
const parse = (page = html, now = TUESDAY, days = 2) => parseGrand(page, { cinemaId: "grand-lekki", now, days }).showings;
const perDay = (rows: { startsAt: string }[]) => {
  const out: Record<string, number> = {};
  for (const s of rows) out[s.startsAt.slice(0, 10)] = (out[s.startsAt.slice(0, 10)] ?? 0) + 1;
  return out;
};

describe("parseGrand", () => {
  it("reads today's tab and tomorrow's, 12 times each across 7 films, on today's and tomorrow's dates", () => {
    const rows = parse();
    expect(perDay(rows)).toEqual({ "2026-11-17": 12, "2026-11-18": 12 });
    expect(new Set(rows.map((s) => s.filmTitle)).size).toBe(7);
  });

  it("turns '12:00 pm' into UTC through Lagos time, with the rating and no booking link", () => {
    const fighter = parse().filter((s) => s.filmTitle === "Street Fighter" && s.startsAt.startsWith("2026-11-17"));
    expect(fighter).toEqual([
      { cinemaId: "grand-lekki", filmTitle: "Street Fighter", rating: "15", startsAt: "2026-11-17T11:00:00Z", format: null, bookingUrl: null },
      { cinemaId: "grand-lekki", filmTitle: "Street Fighter", rating: "15", startsAt: "2026-11-17T19:30:00Z", format: null, bookingUrl: null },
    ]);
    expect(parse().find((s) => s.filmTitle === "Ghost Soldier")?.rating).toBeNull(); // "TBC"
  });

  it("a Monday with nothing on its tab gives no Monday times (read on Monday, Tuesday's still count)", () => {
    expect(perDay(parse(html, "2026-11-16T10:00:00Z"))).toEqual({ "2026-11-17": 12 });
  });

  // The tabs are this week's, Monday to Sunday (D-123 c): a later day past Sunday is next week, which
  // the page doesn't show, so the read stops there rather than give it last week's times (rule 8).
  it("never reads past Sunday's tab: five days from Thursday are Thursday to Sunday, from Sunday only Sunday", () => {
    expect(Object.keys(perDay(parse(html, "2026-11-19T10:00:00Z", 5)))).toEqual(["2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
    expect(Object.keys(perDay(parse(html, "2026-11-22T10:00:00Z", 5)))).toEqual(["2026-11-22"]);
    expect(Object.keys(perDay(parse(html, TUESDAY, 5)))).toEqual(["2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"]);
  });

  // Every tab repeats each film's times for every weekday; the reader takes the day's own times from the day's own tab.
  it("puts a show after midnight on the night it is listed under", () => {
    const late = html.replace(/(id="Tue"[\s\S]*?<div class="tue-time time-wrap">[\s\S]*?)8:40 pm/, "$112:40 am");
    expect(parse(late).filter((s) => s.filmTitle === "Spider-Man: Brand New Day").map((s) => s.startsAt)).toContain("2026-11-17T23:40:00Z");
  });

  it("fails loudly on a changed layout or a time it can't read", () => {
    expect(() => parse("<html></html>")).toThrow("Grand page: no weekday tabs found. Has the page layout changed?");
    expect(() => parse(html.replace('id="Wed"', 'id="Wednesday"'))).toThrow('Grand page: no "Wed" tab. Has the page layout changed?');
    expect(() => parse(html.replace(/(id="Tue"[\s\S]*?<div class="tue-time time-wrap">\s*<span class="time ">\s*)3:00 pm/, "$1TBA"))).toThrow('Grand page: cannot read the time "TBA"');
  });
});

describe("readGrand", () => {
  it("reads the one home page and nothing else", async () => {
    const asked: string[] = [];
    const fetchText = async (url: string) => (asked.push(url), html);
    const renderText = Object.assign(async () => "", { close: async () => {} });
    const pages = await readGrand({ now: TUESDAY, days: 2, fetchText, renderText, pages: { "grand-lekki": "https://grandcinemas.com.ng/" } });
    expect(asked).toEqual(["https://grandcinemas.com.ng/"]);
    expect(pages.flatMap((p) => p.showings)).toHaveLength(24);
  });
});
