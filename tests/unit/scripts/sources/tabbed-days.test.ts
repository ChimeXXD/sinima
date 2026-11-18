import { describe, expect, it } from "vitest";
import type { Day } from "../../../../scripts/sources/dates";
import { PageError } from "../../../../scripts/sources/polite";
import { readEachDay } from "../../../../scripts/sources/tabbed";

// Five days (D-142, D-147): a page-per-day reader keeps the days a site has published. A later day
// that is missing or too slow ends that cinema's read with the days before it; today's page failing,
// or a refusal on any day, still fails the source (D-77, D-119).
const NOW = "2026-11-19T10:00:00Z"; // Thursday 19 Nov, 11:00 in Lagos
const row = (day: Day) => ({ cinemaId: "viva-ikeja", filmTitle: "Whalefall", rating: null, startsAt: `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}T18:30:00Z`, format: null, bookingUrl: null });
const timedOut = () => Object.assign(new Error("The page was still loading 30 s after the click. Not read."), { name: "TimeoutError" });

describe("readEachDay", () => {
  it("keeps the days read before a later day times out, and asks for no more days", async () => {
    const asked: number[] = [];
    const pages = await readEachDay("Viva", { now: NOW, days: 5, pages: { "viva-ikeja": "https://example.test/viva" } }, async (_id, _page, day) => {
      asked.push(day.day);
      if (day.day === 21) throw timedOut();
      return [row(day)];
    });
    expect(asked).toEqual([19, 20, 21]);
    expect(pages[0]!.showings.map((s) => s.startsAt.slice(0, 10))).toEqual(["2026-11-19", "2026-11-20"]);
    expect(pages[0]!.notes).toContainEqual(expect.stringMatching(/viva-ikeja: stopped at 2026-11-21/));
  });

  it("still fails when today's page times out, or a later day refuses us", async () => {
    const input = { now: NOW, days: 5, pages: { "viva-ikeja": "https://example.test/viva" } };
    await expect(readEachDay("Viva", input, async () => { throw timedOut(); })).rejects.toThrow(/still loading/);
    await expect(readEachDay("Viva", input, async (_id, _page, day) => {
      if (day.day === 20) throw new PageError("https://example.test/viva", 403);
      return [row(day)];
    })).rejects.toThrow(/403/);
  });
});
