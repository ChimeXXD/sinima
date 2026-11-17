import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBluePictures, readBluePictures } from "../../../../scripts/sources/bluepictures";

// Blue Pictures' home page (D-122), saved once on 17 Nov 2026 (01:15 in Lagos) and cut down
// (D-24). Its "Movies Now Showing" list gives each film's times with no date ("4:20pm & 6:20pm"),
// so they are read as today's only: tomorrow's are not on the page (rule 8).
const html = readFileSync(join(import.meta.dirname, "../../../fixtures/bluepictures/2026-11-17-home.html"), "utf8");
const NOW = "2026-11-17T00:20:00Z"; // 01:20 on 17 Nov in Lagos
const parse = (page = html, now = NOW) => parseBluePictures(page, { cinemaId: "blue-pictures-onikan", now }).showings;

describe("parseBluePictures", () => {
  it("reads the 7 times of the 6 films now showing, as today's", () => {
    const rows = parse();
    expect(rows.map((s) => [s.filmTitle, s.startsAt])).toEqual([
      ["Isakaba Return", "2026-11-17T15:20:00Z"],
      ["Isakaba Return", "2026-11-17T17:20:00Z"],
      ["The Beacon Man", "2026-11-17T15:20:00Z"],
      ["Loving Itohan", "2026-11-17T13:30:00Z"],
      ["Wire Transfer", "2026-11-17T11:00:00Z"],
      ["Maybe… Maybe Not", "2026-11-17T11:40:00Z"],
      ["The Cleaner", "2026-11-17T13:10:00Z"],
    ]);
    expect(rows[0]).toEqual({ cinemaId: "blue-pictures-onikan", filmTitle: "Isakaba Return", rating: null, startsAt: "2026-11-17T15:20:00Z", format: null, bookingUrl: null });
  });

  it("puts a show after midnight on the night it is listed under", () => {
    expect(parse(html.replace("12:00pm", "12:30am")).find((s) => s.filmTitle === "Wire Transfer")?.startsAt).toBe("2026-11-17T23:30:00Z");
  });

  it("fails loudly on a changed layout or times it can't read", () => {
    expect(() => parse("<html></html>")).toThrow('Blue Pictures page: no "Movies Now Showing" list found. Has the page layout changed?');
    expect(() => parse(html.replace("12:00pm", "noon"))).toThrow('Blue Pictures page: cannot read the times "noon" for "Wire Transfer"');
  });
});

describe("readBluePictures", () => {
  it("reads the one home page and nothing else", async () => {
    const asked: string[] = [];
    const fetchText = async (url: string) => (asked.push(url), html);
    const renderText = Object.assign(async () => "", { close: async () => {} });
    const pages = await readBluePictures({ now: NOW, days: 2, fetchText, renderText, pages: { "blue-pictures-onikan": "https://bluepicturesng.com/" } });
    expect(asked).toEqual(["https://bluepicturesng.com/"]);
    expect(pages.flatMap((p) => p.showings)).toHaveLength(7);
  });
});
