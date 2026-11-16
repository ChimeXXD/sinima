import { describe, expect, it } from "vitest";
import type { ListRow } from "@/lib/data/select";
import { folderTint, yourCinemas } from "@/lib/data/yours";

// Your cinemas (Figma 206:8570): the cinemas saved on this phone, soonest first, each folder with
// its showings still to start tonight and the films they are.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
const row = (cinema: number, at: string, film = 0): ListRow => ({ at, film, cinema, format: null, book: null, fresh: 0 });
const ats = (rows: ListRow[] | null) => rows?.map((r) => r.at);

const ROWS: ListRow[] = [
  row(0, "2026-11-13T15:00:00Z", 9), // 16:00, started
  row(0, "2026-11-13T18:00:00Z", 1),
  row(0, "2026-11-13T17:30:00Z", 2),
  row(0, "2026-11-13T19:00:00Z", 1),
  row(0, "2026-11-13T20:00:00Z", 3),
  row(0, "2026-11-13T21:00:00Z", 4),
  row(1, "2026-11-13T16:40:00Z", 5),
  row(2, "2026-11-13T14:00:00Z", 6), // cinema 2: all started today
  row(2, "2026-11-14T14:00:00Z", 7), // and tomorrow
  row(4, "2026-11-14T14:00:00Z", 8), // cinema 4: only tomorrow
];
const pick = (saved: number[]) => yourCinemas({ rows: ROWS, saved, now: NOW });

describe("yourCinemas", () => {
  it("soonest first; a saved cinema with nothing left today comes after, then one we can't read (Figma Default)", () => {
    expect(pick([3, 2, 0, 1]).map((c) => c.cinema)).toEqual([1, 0, 2, 3]);
  });

  it("counts the showings still to start tonight and names the next", () => {
    const [first, second] = pick([0, 1]);
    expect(first).toMatchObject({ cinema: 1, tonight: 1, next: { at: "2026-11-13T16:40:00Z" }, listed: true });
    expect(second).toMatchObject({ cinema: 0, tonight: 5, next: { at: "2026-11-13T17:30:00Z" } });
  });

  it("the folder's films are the ones still on tonight, soonest first, each once, three at most", () => {
    expect(pick([0])[0]!.films).toEqual([2, 1, 3]);
  });

  it("with nothing left today: no next, no count, and the films it showed today", () => {
    expect(pick([2])[0]).toEqual({ cinema: 2, next: null, tonight: 0, films: [6], listed: true });
  });

  it("with nothing today at all, tomorrow's films", () => {
    expect(pick([4])[0]).toMatchObject({ next: null, tonight: 0, films: [8], listed: true });
  });

  it("a cinema whose times we can't read is listed, and says so", () => {
    expect(pick([3])[0]).toEqual({ cinema: 3, next: null, tonight: 0, films: [], listed: false });
  });

  it("before the time is known, nothing is listed (rule 3)", () => {
    expect(yourCinemas({ rows: ROWS, saved: [0], now: null })).toEqual([]);
  });

  it("keeps the saved order among equals", () => {
    expect(pick([4, 2]).map((c) => c.cinema)).toEqual([4, 2]);
    expect(ats(pick([0]).map((c) => c.next!))).toEqual(["2026-11-13T17:30:00Z"]);
  });
});

describe("folderTint", () => {
  it("the chains Figma draws keep their colours", () => {
    expect([folderTint("Ozone"), folderTint("EbonyLife"), folderTint("Genesis"), folderTint("Filmhouse")]).toEqual(["green", "blue", "pink", "violet"]);
  });
  it("any other chain gets one of the four, the same each time", () => {
    expect(["blue", "violet", "pink", "green"]).toContain(folderTint("Silverbird"));
    expect(folderTint("Silverbird")).toBe(folderTint("Silverbird"));
  });
});
