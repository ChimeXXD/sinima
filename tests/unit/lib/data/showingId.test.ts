import { describe, expect, it } from "vitest";
import { showingId, withoutShowingIds, withShowingIds } from "@/lib/data/showingId";
import type { Showing, ShowtimesFile } from "@/lib/data/types";

// D-156: page files leave out a showing's id when it is the usual `<cinemaId>_<filmId>_<startsAt>`,
// and every reader puts it back, so a page file weighs less and nothing downstream changes.

const row = (over: Partial<Showing> = {}): Showing => ({
  id: "filmhouse-lekki-imax_one-gidi-night_2026-11-20T18:30:00Z",
  filmId: "one-gidi-night",
  cinemaId: "filmhouse-lekki-imax",
  screenId: null,
  startsAt: "2026-11-20T18:30:00Z",
  format: null,
  language: null,
  price: null,
  bookingUrl: null,
  sourceId: "lagocine",
  fetchedAt: "2026-11-20T06:00:00Z",
  ...over,
});
const file = (showings: Showing[]) => ({ schemaVersion: 1, showings }) as unknown as ShowtimesFile;

describe("showingId", () => {
  it("is the cinema, the film and the start time, joined by underscores", () => {
    expect(showingId({ cinemaId: "ebonylife-vi", filmId: "ghost-soldier", startsAt: "2026-11-20T19:15:00Z" })).toBe("ebonylife-vi_ghost-soldier_2026-11-20T19:15:00Z");
  });
});

describe("withoutShowingIds and withShowingIds (D-156)", () => {
  it("leaves out an id that is the usual one, and puts the same id back, first among the keys", () => {
    const packed = withoutShowingIds(file([row()]));
    expect(packed.showings[0]).not.toHaveProperty("id");
    const back = withShowingIds(packed);
    expect(back.showings[0]).toEqual(row());
    expect(Object.keys(back.showings[0]!)[0]).toBe("id");
  });

  it("keeps an id that is not the usual one, so nothing is lost", () => {
    const odd = row({ id: "hand-made-id" });
    expect(withoutShowingIds(file([odd])).showings[0]).toEqual(odd);
    expect(withShowingIds(withoutShowingIds(file([odd]))).showings[0]).toEqual(odd);
  });

  it("changes nothing else in the file, and leaves the file it was given alone", () => {
    const original = { ...file([row()]), generatedAt: "2026-11-20T06:00:00Z", films: [] } as unknown as ShowtimesFile;
    const copy = JSON.parse(JSON.stringify(original)) as ShowtimesFile;
    const packed = withoutShowingIds(original);
    expect({ ...packed, showings: [] }).toEqual({ ...original, showings: [] });
    expect(original).toEqual(copy);
    expect(withShowingIds(packed)).toEqual(original);
  });

  it("returns a file that already has every id as it is", () => {
    const full = file([row()]);
    expect(withShowingIds(full)).toEqual(full);
  });
});
