import { describe, expect, it } from "vitest";
import { comingCards, comingPage, presaleData, soldBy } from "@/lib/data/comingPage";
import type { ComingFilm } from "@/lib/data/coming";
import type { ShowtimesFile } from "@/lib/data/types";

// Tickets on sale before a film opens (D-194, mockup/presales/ card A and page 1), as the build makes
// them: the card's sticker and who sells, the page's chip, one day tile and its times as list data.

const AT = "2026-11-24T07:00:00Z";
const film = { id: "dune-part-three", title: "Dune: Part Three", runtimeMin: 150, rating: null, origin: null, tmdbId: 1, credits: { during: "unknown", after: "unknown", confidence: "unknown", sources: [], count: null } } as const;
const cinema = (id: string, area = "lekki") => ({ id, name: `Filmhouse ${id}`, chain: "Filmhouse", area, address: null, geo: null, website: "https://www.filmhouseng.com/", sourceIds: ["lagocine"] });
const showing = (cinemaId: string, startsAt: string) => ({ id: `${cinemaId}-${startsAt}`, filmId: film.id, cinemaId, screenId: null, startsAt, format: "IMAX 2D", language: null, price: null, bookingUrl: "https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18", sourceId: "lagocine", fetchedAt: AT });
// A city's presales as `inCity` cuts them: the showings are the presales.
const sold = {
  schemaVersion: 1, generatedAt: AT, timeZone: "Africa/Lagos", sample: false,
  sources: [{ id: "lagocine", name: "Lagocine", url: "https://lagocine.com/", method: "public-page", status: "cleared", fetchedAt: AT, lastOkAt: AT, health: "ok" }],
  cinemas: [cinema("circle-mall"), cinema("surulere", "surulere")],
  films: [film],
  showings: [showing("circle-mall", "2026-12-18T09:30:00Z"), showing("surulere", "2026-12-18T14:45:00Z"), showing("circle-mall", "2026-12-18T18:45:00Z")],
} as unknown as ShowtimesFile;
const entry: ComingFilm = { film, firstDay: "2026-12-18", sinimas: ["Filmhouse"] } as unknown as ComingFilm;

describe("tickets on sale at build time (D-194)", () => {
  it("names who sells each film on sale", () => {
    expect(soldBy(sold)).toEqual(new Map([["dune-part-three 2026-12-18", "2 Filmhouses"]]));
  });

  it("a card on sale carries the sticker's flag and who sells it in place of the chain", () => {
    expect(comingCards([entry], soldBy(sold))).toEqual([["dune-part-three", "Dune: Part Three", null, "Opens Fri 18 Dec", "2 Filmhouses", "Dec", "18", 1]]);
    expect(comingCards([entry])).toEqual([["dune-part-three", "Dune: Part Three", null, "Opens Fri 18 Dec", "Filmhouse", "Dec", "18"]]);
    // On sale only on another day than the city's first date (another sinima opens it earlier): no sticker,
    // as the page then has no opening day's times either.
    const earlier = { ...entry, firstDay: "2026-12-17" } as ComingFilm;
    expect(comingCards([earlier], soldBy(sold))[0]).toEqual(["dune-part-three", "Dune: Part Three", null, "Opens Thu 17 Dec", "Filmhouse", "Dec", "17"]);
  });

  it("the page: the chip says so, and the opening day's times come as list data, soonest first", () => {
    const page = comingPage(entry, "lagos", presaleData(sold, film.id, "2026-12-18"));
    expect(page.chip).toBe("Opens Fri 18 Dec · tickets on sale");
    expect(page.opening).toMatchObject({ subtitle: "Friday 18 December · opening day · tickets on sale", tile: { weekday: "Opens", date: "Fri 18" } });
    expect(page.opening!.data.rows.map((row) => row.at)).toEqual(["2026-12-18T09:30:00Z", "2026-12-18T14:45:00Z", "2026-12-18T18:45:00Z"]);
    expect(page.opening!.data.rows[0]!.book).toBe("https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18");
    expect(page.calendar).not.toBeNull();
  });

  it("with nothing on sale the page is as before: no opening, the chip names the sinima", () => {
    expect(presaleData(sold, "another-film", "2026-12-18")).toBeNull();
    // Only the first date's rows: another day's (a second sinima's later date) is not this page's.
    expect(presaleData(sold, film.id, "2026-12-17")).toBeNull();
    const page = comingPage(entry, "lagos", null);
    expect(page.opening).toBeUndefined();
    expect(page.chip).toBe("Opens Fri 18 Dec at Filmhouse");
  });
});

describe("the opening day's areas (D-194)", () => {
  it("groups the cinemas by area as any film's day: soonest first, your area and the areas next to it first", async () => {
    const { openingGroups } = await import("@/lib/data/filmPage");
    const data = presaleData(sold, film.id, "2026-12-18")!;
    const areaOf = (i: number) => data.cinemas[i]!.area;
    expect(openingGroups(data.rows, areaOf, null).map((g) => [g.area, g.cinemas.map((c) => c.rows.length)])).toEqual([["lekki", [2]], ["surulere", [1]]]);
    expect(openingGroups(data.rows, areaOf, { slug: "surulere", neighbours: [] }).map((g) => [g.area, g.tag])).toEqual([["surulere", "home"], ["lekki", null]]);
  });
});
