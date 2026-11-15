import { describe, expect, it } from "vitest";
import { areaGroups, cinemasOn, nextNearby, startedEarlier } from "@/lib/data/filmPage";
import type { ListRow } from "@/lib/data/select";

// One film's page (Figma Film 185:3558): its cinemas by area, your area first, then the areas
// next to it, then the rest soonest first. Cinemas whose times have all started are named in one
// line under the list instead.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 Fri 13 Nov in Lagos
const row = (cinema: number, at: string, format: string | null = null): ListRow => ({ at, film: 0, cinema, format, book: null, fresh: 0 });
// Cinemas: 0 Circle Mall (lekki), 1 Ikota (lekki), 2 Oniru (victoria-island), 3 Landmark
// (victoria-island), 4 Maryland (maryland), 5 Sky (sangotedo), 6 EbonyLife (victoria-island).
const AREA = ["lekki", "lekki", "victoria-island", "victoria-island", "maryland", "sangotedo", "victoria-island"];
const areaOf = (cinema: number) => AREA[cinema]!;
const NEAR: Record<string, string[]> = { lekki: ["victoria-island", "sangotedo"], "victoria-island": ["lekki", "lagos-island"], maryland: ["ikeja"], sangotedo: ["lekki"] };
const LEKKI = { slug: "lekki", neighbours: NEAR.lekki! };

const ROWS: ListRow[] = [
  row(6, "2026-11-13T10:10:00Z"), // 11:10 EbonyLife: all started
  row(0, "2026-11-13T16:10:00Z", "IMAX 2D"), // 17:10 Circle Mall: started 20 min ago, kept struck
  row(0, "2026-11-13T17:00:00Z", "IMAX 2D"), // 18:00 Circle Mall
  row(4, "2026-11-13T17:45:00Z"), // 18:45 Maryland
  row(2, "2026-11-13T17:15:00Z"), // 18:15 Oniru
  row(1, "2026-11-13T18:00:00Z"), // 19:00 Ikota
  row(3, "2026-11-13T18:00:00Z", "MX4D"), // 19:00 Landmark
  row(5, "2026-11-13T18:40:00Z"), // 19:40 Sky
  row(0, "2026-11-13T21:00:00Z", "IMAX 2D"), // 22:00 Circle Mall
  row(4, "2026-11-14T13:00:00Z"), // 14:00 Sat: tomorrow
  row(1, "2026-11-14T15:00:00Z"), // 16:00 Sat: tomorrow
].sort((a, b) => a.at.localeCompare(b.at));

const shape = (groups: ReturnType<typeof areaGroups>) => groups.map((g) => [g.area, g.tag, g.cinemas.map((c) => c.cinema)]);

describe("areaGroups", () => {
  it("puts your area first, then the areas next to it, then the rest soonest first", () => {
    expect(shape(areaGroups(ROWS, 0, NOW, true, areaOf, LEKKI))).toEqual([
      ["lekki", "home", [0, 1]],
      ["victoria-island", "next", [2, 3]],
      ["sangotedo", "next", [5]],
      ["maryland", null, [4]],
    ]);
  });

  it("with no area saved, orders every area by its soonest showing", () => {
    expect(shape(areaGroups(ROWS, 0, NOW, true, areaOf, null))).toEqual([
      ["lekki", null, [0, 1]],
      ["victoria-island", null, [2, 3]],
      ["maryland", null, [4]],
      ["sangotedo", null, [5]],
    ]);
  });

  it("keeps a showing that started in the last 30 min as a struck time beside the cinema's next ones", () => {
    const circle = areaGroups(ROWS, 0, NOW, true, areaOf, LEKKI)[0]!.cinemas[0]!;
    expect(circle.rows.map((r) => r.at)).toEqual(["2026-11-13T16:10:00Z", "2026-11-13T17:00:00Z", "2026-11-13T21:00:00Z"]);
    // 40 min after it started, it is gone (D-05: ended).
    const later = areaGroups(ROWS, 0, "2026-11-13T16:50:00Z", true, areaOf, LEKKI)[0]!.cinemas[0]!;
    expect(later.rows.map((r) => r.at)).toEqual(["2026-11-13T17:00:00Z", "2026-11-13T21:00:00Z"]);
  });

  it("leaves out a cinema whose times have all started (it goes in the line under the list)", () => {
    const cinemas = areaGroups(ROWS, 0, NOW, true, areaOf, LEKKI).flatMap((g) => g.cinemas.map((c) => c.cinema));
    expect(cinemas).not.toContain(6);
  });

  it("shows tomorrow's times on Tomorrow", () => {
    expect(shape(areaGroups(ROWS, 1, NOW, true, areaOf, LEKKI))).toEqual([
      ["lekki", "home", [1]],
      ["maryland", null, [4]],
    ]);
  });

  it("before the page knows the time, lists the whole day, started ones too (rule 3)", () => {
    const cinemas = areaGroups(ROWS, 0, NOW, false, areaOf, null).flatMap((g) => g.cinemas.map((c) => c.cinema));
    expect(cinemas).toContain(6);
    expect(cinemas).toHaveLength(7);
  });
});

describe("startedEarlier", () => {
  it("names each cinema whose times today have all started, with its last start, in time order", () => {
    expect(startedEarlier(ROWS, NOW)).toEqual([{ cinema: 6, at: "2026-11-13T10:10:00Z" }]);
    // 19:30: Oniru (18:15), Maryland (18:45), Ikota and Landmark (19:00) are done too.
    expect(startedEarlier(ROWS, "2026-11-13T18:30:00Z").map((s) => s.cinema)).toEqual([6, 2, 4, 1, 3]);
  });
});

describe("cinemasOn", () => {
  it("counts the cinemas showing it on a day and their showings, started ones too", () => {
    expect(cinemasOn(ROWS, 0, NOW)).toEqual({ cinemas: 7, showings: 9 });
    expect(cinemasOn(ROWS, 1, NOW)).toEqual({ cinemas: 2, showings: 2 });
  });
});

describe("nextNearby: after a showing has started, the next times near it", () => {
  const picked = ROWS.find((r) => r.at === "2026-11-13T17:00:00Z")!; // Circle Mall 18:00
  const at = "2026-11-13T17:05:00Z"; // 18:05

  it("gives the soonest at other cinemas in its area and the areas next to it, one each, and this cinema's next", () => {
    const next = nextNearby(ROWS, picked, at, areaOf, (area) => NEAR[area] ?? []);
    // Oniru 18:15; Ikota 19:00 before Landmark 19:00 (same area first); Circle Mall's own 22:00.
    expect(next.rows.map((r) => [r.cinema, r.at])).toEqual([
      [2, "2026-11-13T17:15:00Z"],
      [1, "2026-11-13T18:00:00Z"],
      [0, "2026-11-13T21:00:00Z"],
    ]);
    expect(next.near).toBe(true);
  });

  it("looks across the city when nothing is left nearby", () => {
    const lonely = [row(4, "2026-11-13T17:00:00Z"), row(0, "2026-11-13T19:00:00Z")];
    const next = nextNearby(lonely, lonely[0]!, at, areaOf, (area) => NEAR[area] ?? []);
    expect(next.rows.map((r) => r.cinema)).toEqual([0]);
    expect(next.near).toBe(false);
  });

  it("after midnight, keeps to the picked showing's evening, never a later day", () => {
    const late = row(0, "2026-11-13T23:30:00Z"); // 00:30 Sat, Friday's evening
    const rows = [late, row(2, "2026-11-14T17:00:00Z"), row(2, "2026-11-16T17:00:00Z")]; // Sat 18:00, Mon 18:00
    expect(nextNearby(rows, late, "2026-11-13T23:40:00Z", areaOf, (area) => NEAR[area] ?? []).rows).toEqual([]);
  });

  it("is empty when nothing else starts today", () => {
    expect(nextNearby([picked], picked, at, areaOf, () => []).rows).toEqual([]);
  });
});
