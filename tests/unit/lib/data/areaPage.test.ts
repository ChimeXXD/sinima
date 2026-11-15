import { describe, expect, it } from "vitest";
import { areaPage, soonest } from "@/lib/data/areaPage";
import type { ListRow } from "@/lib/data/select";

// An area's page (Figma Area 200:6420): the cinemas kept on this phone first, then the area's
// other cinemas soonest first, then the areas next to it. With nothing left tonight, the areas
// next to it lead.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
const row = (cinema: number, at: string, film = 0): ListRow => ({ at, film, cinema, format: null, book: null, fresh: 0 });
// 0 Lekki, 1 Lekki, 2 Victoria Island, 3 Sangotedo, 4 Victoria Island (no times at all), 5 Lekki (only earlier today), 6 Ikeja, 7 Victoria Island
const AREAS = ["lekki", "lekki", "victoria-island", "sangotedo", "victoria-island", "lekki", "ikeja", "victoria-island"];
const CHAINS = ["Filmhouse", "Grand", "EbonyLife", "Sky", "Silverbird", "Genesis", "Viva", "EbonyLife"];
const areaOf = (cinema: number) => AREAS[cinema]!;
const chainOf = (cinema: number) => CHAINS[cinema]!;
const ROWS: ListRow[] = [
  row(1, "2026-11-13T17:00:00Z"), // 18:00 Lekki
  row(1, "2026-11-13T19:00:00Z", 1),
  row(0, "2026-11-13T18:00:00Z"), // 19:00 Lekki
  row(2, "2026-11-13T16:40:00Z"), // 17:40 VI
  row(7, "2026-11-13T18:30:00Z"), // 19:30 VI
  row(3, "2026-11-13T17:10:00Z"), // 18:10 Sangotedo
  row(5, "2026-11-13T15:00:00Z"), // 16:00 Lekki, started
  row(6, "2026-11-13T16:35:00Z"), // 17:35 Ikeja: not next to Lekki
  row(0, "2026-11-14T11:00:00Z"), // 12:00 Sat: tomorrow
  row(0, "2026-11-14T13:00:00Z", 1),
];
const LEKKI = { slug: "lekki", neighbours: ["victoria-island", "sangotedo"] };
const base = { rows: ROWS, cinemas: AREAS.length, areaOf, chainOf, home: LEKKI, saved: () => false, now: NOW, live: true };

describe("areaPage", () => {
  it("lists the area's cinemas soonest first, then those with nothing left", () => {
    const page = areaPage(base);
    expect(page.saved).toEqual([]);
    expect(page.others.map((c) => c.cinema)).toEqual([1, 0, 5]);
    expect(page.quiet).toBe(false);
  });

  it("puts the cinemas kept on this phone in their own group, in the same order", () => {
    const page = areaPage({ ...base, saved: (cinema) => cinema === 0 || cinema === 5 || cinema === 2 });
    expect(page.saved.map((c) => c.cinema)).toEqual([0, 5]); // a kept cinema in another area is not here
    expect(page.others.map((c) => c.cinema)).toEqual([1]);
  });

  it("gives each neighbour its cinema count, its soonest time and up to three logos, soonest area first", () => {
    const { next } = areaPage(base);
    expect(next.map((area) => area.slug)).toEqual(["victoria-island", "sangotedo"]);
    expect(next[0]).toMatchObject({ cinemas: 3, next: { cinema: 2, at: "2026-11-13T16:40:00Z" }, chains: ["EbonyLife", "Silverbird"], listed: true });
    expect(next[1]).toMatchObject({ cinemas: 1, next: { cinema: 3 }, chains: ["Sky"] });
  });

  it("puts a neighbour with nothing left after the others, and leaves out one with no cinemas", () => {
    const page = areaPage({ ...base, rows: ROWS.filter((r) => r.cinema !== 2 && r.cinema !== 7), home: { slug: "lekki", neighbours: ["victoria-island", "agege", "sangotedo"] } });
    expect(page.next.map((area) => [area.slug, area.next?.cinema ?? null])).toEqual([
      ["sangotedo", 3],
      ["victoria-island", null],
    ]);
  });

  it("is quiet once nothing more starts in the area tonight, and names the last showing that began", () => {
    const late = "2026-11-13T19:30:00Z"; // 20:30: Lekki's last began at 20:00
    const page = areaPage({ ...base, now: late });
    expect(page.quiet).toBe(true);
    expect(page.last).toMatchObject({ cinema: 1, at: "2026-11-13T19:00:00Z" });
    expect(page.others.find((c) => c.cinema === 0)!.tomorrow.map((r) => r.at)).toEqual(["2026-11-14T11:00:00Z", "2026-11-14T13:00:00Z"]);
  });

  it("is never quiet before the page knows the time, and keeps the whole day (the page's own HTML)", () => {
    const page = areaPage({ ...base, now: "2026-11-13T22:00:00Z", live: false });
    expect(page.quiet).toBe(false);
    expect(page.others.find((c) => c.cinema === 5)!.rows).toHaveLength(1);
  });

  it("is not quiet when no cinema in the area has times we can read", () => {
    const page = areaPage({ ...base, rows: ROWS.filter((r) => areaOf(r.cinema) !== "lekki") });
    expect(page.quiet).toBe(false);
    expect(page.others.every((c) => !c.listed)).toBe(true);
  });
});

describe("soonest", () => {
  it("marks every time at the first start, when it is within the hour", () => {
    const rows = [row(0, "2026-11-13T17:00:00Z"), row(0, "2026-11-13T17:00:00Z", 1), row(0, "2026-11-13T18:15:00Z")];
    expect(rows.map((r) => soonest(rows, NOW).has(r))).toEqual([true, true, false]);
  });
  it("marks nothing when the first start is more than an hour away, or before the time is known", () => {
    const rows = [row(0, "2026-11-13T18:00:00Z")]; // 19:00, 90 min away
    expect(soonest(rows, NOW).size).toBe(0);
    expect(soonest([row(0, "2026-11-13T17:00:00Z")], null).size).toBe(0);
  });
});
