import { describe, expect, it } from "vitest";
import { chipAreas, keptRows, soonPage } from "@/lib/data/soonPage";
import type { ListRow } from "@/lib/data/select";

// Starting soon (Figma 204:7192, 204:7931): in the chosen place, what starts in the next 2 hours,
// then the rest of tonight. With nothing in the next 2 hours, the page says what else there is:
// later here, soon next door, what is left in the city, or tomorrow here.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
// Cinemas 0, 1 in Lekki · 2 in Victoria Island · 3 in Sangotedo · 4 in Idimu
const AREAS = ["lekki", "lekki", "victoria-island", "sangotedo", "idimu"];
const areaOf = (cinema: number) => AREAS[cinema]!;
const LEKKI = { slug: "lekki", neighbours: ["victoria-island", "sangotedo"] };
const row = (cinema: number, at: string, film = 0): ListRow => ({ at, film, cinema, format: null, book: null, fresh: 0 });
const ats = (rows: ListRow[]) => rows.map((r) => r.at);

const ROWS: ListRow[] = [
  row(0, "2026-11-13T16:00:00Z"), // 17:00, started
  row(0, "2026-11-13T17:00:00Z"), // 18:00
  row(1, "2026-11-13T18:30:00Z"), // 19:30, exactly 2 hours: soon
  row(1, "2026-11-13T18:31:00Z"), // 19:31: later
  row(0, "2026-11-13T21:45:00Z"), // 22:45
  row(2, "2026-11-13T17:15:00Z"), // VI 18:15
  row(4, "2026-11-13T22:40:00Z"), // Idimu 23:40
  row(0, "2026-11-14T09:00:00Z", 1), // Lekki tomorrow 10:00
  row(0, "2026-11-14T12:00:00Z"),
];
const page = (input: Partial<Parameters<typeof soonPage>[0]>) => soonPage({ rows: ROWS, areaOf, place: LEKKI, now: NOW, live: true, ...input });

describe("soonPage", () => {
  it("splits the place's showings into the next 2 hours and the rest of tonight, soonest first (Figma Default)", () => {
    const result = page({});
    expect(ats(result.soon)).toEqual(["2026-11-13T17:00:00Z", "2026-11-13T18:30:00Z"]);
    expect(ats(result.later)).toEqual(["2026-11-13T18:31:00Z", "2026-11-13T21:45:00Z"]);
    expect(result.quiet).toBeNull();
  });

  it("leaves a showing out from the second it starts (D-05)", () => {
    expect(ats(page({ now: "2026-11-13T17:00:00Z" }).soon)).toEqual(["2026-11-13T18:30:00Z", "2026-11-13T18:31:00Z"]);
  });

  it("all of the city takes every area", () => {
    const result = page({ place: null });
    expect(ats(result.soon)).toEqual(["2026-11-13T17:00:00Z", "2026-11-13T17:15:00Z", "2026-11-13T18:30:00Z"]);
    expect(result.later).toHaveLength(3);
  });

  it("before the time is known, lists the place's whole day and calls nothing soon (rule 3)", () => {
    const result = page({ live: false, place: null });
    expect(result.soon).toEqual([]);
    expect(result.later).toEqual([]);
    expect(ats(result.day)).toEqual(ats(ROWS.slice(0, 7)).sort());
    expect(result.quiet).toBeNull();
  });

  it("nothing soon but more later here: the next one, and the later list stays", () => {
    const result = page({ now: "2026-11-13T13:30:00Z" }); // 14:30: the 17:00 is 2 h 30 min away
    expect(result.soon).toEqual([]);
    expect(result.later).toHaveLength(5);
    expect(result.quiet).toMatchObject({ kind: "later", next: { at: "2026-11-13T16:00:00Z" } });
  });

  it("nothing left here but soon next door: the areas next to it with times in the next 2 hours", () => {
    const rows = ROWS.filter((r) => !(areaOf(r.cinema) === "lekki" && r.at < "2026-11-14"));
    const result = page({ rows });
    expect(result.quiet).toMatchObject({ kind: "nearby", areas: ["victoria-island"] });
    expect(ats((result.quiet as { rows: ListRow[] }).rows)).toEqual(["2026-11-13T17:15:00Z"]);
  });

  it("nothing here or next door: what is left in the city tonight, and the place's first showing tomorrow (Figma Nothing in 2 hours)", () => {
    const result = page({ now: "2026-11-13T21:50:00Z" }); // 22:50
    expect(result.soon).toEqual([]);
    expect(result.later).toEqual([]);
    expect(result.quiet).toMatchObject({ kind: "city", areas: ["victoria-island", "sangotedo"], tomorrow: { at: "2026-11-14T09:00:00Z", film: 1 } });
    expect(ats((result.quiet as { rows: ListRow[] }).rows)).toEqual(["2026-11-13T22:40:00Z"]);
  });

  it("all of the city with nothing left tonight: no rows, tomorrow's first", () => {
    const result = page({ place: null, now: "2026-11-13T22:50:00Z" });
    expect(result.quiet).toMatchObject({ kind: "city", areas: [], rows: [], tomorrow: { at: "2026-11-14T09:00:00Z" } });
  });

  it("nothing tomorrow yet: no tomorrow", () => {
    const result = page({ rows: ROWS.filter((r) => r.at < "2026-11-14"), now: "2026-11-13T21:50:00Z" });
    expect(result.quiet).toMatchObject({ kind: "city", tomorrow: null });
  });

  it("after midnight the evening goes on: a 00:30 show is still tonight", () => {
    const rows = [row(0, "2026-11-13T23:30:00Z"), row(0, "2026-11-14T09:00:00Z")]; // 00:30 Sat, 10:00 Sat
    const result = page({ rows, now: "2026-11-13T22:00:00Z" }); // 23:00 Fri
    expect(ats(result.soon)).toEqual(["2026-11-13T23:30:00Z"]);
    expect(result.later).toEqual([]);
  });
});

describe("chipAreas", () => {
  const all = [{ slug: "lekki", neighbours: ["victoria-island", "sangotedo"] }, { slug: "victoria-island", neighbours: [] }, { slug: "sangotedo", neighbours: [] }, { slug: "idimu", neighbours: [] }];
  it("the kept area, then the areas next to it (Figma: Lekki, Victoria Island, Sangotedo)", () => {
    expect(chipAreas(all, "lekki")).toEqual(["lekki", "victoria-island", "sangotedo"]);
  });
  it("with no area kept, every area", () => {
    expect(chipAreas(all, null)).toEqual(["lekki", "victoria-island", "sangotedo", "idimu"]);
    expect(chipAreas(all, "gone")).toEqual(["lekki", "victoria-island", "sangotedo", "idimu"]);
  });
});

describe("keptRows", () => {
  const films = ["clayface", "ramayana"];
  const cinemas = ["filmhouse-oniru", "genesis-lekki", "ebonylife-vi"];
  const lookup = { film: (i: number) => films[i]!, cinema: (i: number) => cinemas[i]! };
  it("finds each kept showing still to start, soonest first, wherever it is", () => {
    const ids = ["clayface|ebonylife-vi|2026-11-13T17:15:00Z", "clayface|filmhouse-oniru|2026-11-13T17:00:00Z"];
    expect(ats(keptRows(ROWS, ids, lookup, NOW))).toEqual(["2026-11-13T17:00:00Z", "2026-11-13T17:15:00Z"]);
  });
  it("skips an id that isn't one (storage edited by hand) instead of failing", () => {
    const ids = ["x", "clayface|filmhouse-oniru|tomorrow", "clayface|filmhouse-oniru|2026-11-13T17:00:00Z"];
    expect(ats(keptRows(ROWS, ids, lookup, NOW))).toEqual(["2026-11-13T17:00:00Z"]);
  });
  it("drops one that has started, and one no longer listed", () => {
    const ids = ["clayface|filmhouse-oniru|2026-11-13T16:00:00Z", "clayface|filmhouse-oniru|2026-11-13T19:00:00Z", "nope|x|2026-11-13T19:00:00Z"];
    expect(keptRows(ROWS, ids, lookup, NOW)).toEqual([]);
  });
});
