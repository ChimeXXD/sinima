import { describe, expect, it } from "vitest";
import { comingCards, comingPage, presaleData, soldBy } from "@/lib/data/comingPage";
import type { ComingFilm } from "@/lib/data/coming";
import type { ShowtimesFile } from "@/lib/data/types";

// Tickets on sale before a film opens (D-194, mockup/presales/ card A and page 1; D-199, D-200: each of its first
// seven days), as the build makes them: the card's sticker and who sells, the page's chip, a tile for each
// day on sale and the times as list data.

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
// The same with the day after on sale too, its late show at 00:30 on the 20th (Saturday's evening), and one
// past the seven days (left out, D-199, D-200).
const days = {
  ...sold,
  cinemas: [cinema("circle-mall"), cinema("surulere", "surulere"), { ...cinema("genesis-lekki"), name: "Genesis Lekki", chain: "Genesis" }, cinema("oniru")],
  showings: [
    showing("circle-mall", "2026-12-18T09:30:00Z"), showing("surulere", "2026-12-18T14:45:00Z"),
    showing("genesis-lekki", "2026-12-19T12:00:00Z"), showing("circle-mall", "2026-12-19T23:30:00Z"),
    // Past the seven days, at a cinema selling nothing in them: counted only without the window.
    showing("oniru", "2026-12-25T12:00:00Z"),
  ],
} as unknown as ShowtimesFile;
const entry: ComingFilm = { film, firstDay: "2026-12-18", sinimas: ["Filmhouse"] } as unknown as ComingFilm;

describe("tickets on sale at build time (D-194)", () => {
  it("names who sells each film on sale, on any of its days", () => {
    expect(soldBy(sold)).toEqual(new Map([["dune-part-three", "2 Filmhouses"]]));
    expect(soldBy(days)).toEqual(new Map([["dune-part-three", "4 sinimas"]]));
    // With the city's coming films, only the days its page lists count: none on sale in them, no seller.
    expect(soldBy(days, [entry])).toEqual(new Map([["dune-part-three", "3 sinimas"]]));
    expect(soldBy(days, [{ ...entry, firstDay: "2026-12-10" } as ComingFilm])).toEqual(new Map());
  });

  it("a card on sale carries the sticker's flag and who sells it in place of the chain", () => {
    expect(comingCards([entry], soldBy(sold))).toEqual([["dune-part-three", "Dune: Part Three", null, "Opens Fri 18 Dec", "2 Filmhouses", "Dec", "18", 1]]);
    expect(comingCards([entry])).toEqual([["dune-part-three", "Dune: Part Three", null, "Opens Fri 18 Dec", "Filmhouse", "Dec", "18"]]);
    // On sale the day after the city's first date (another sinima opens it a day earlier): its page lists
    // that day, so the card has the sticker too (D-199).
    const earlier = { ...entry, firstDay: "2026-12-17" } as ComingFilm;
    expect(comingCards([earlier], soldBy(sold))[0]).toEqual(["dune-part-three", "Dune: Part Three", null, "Opens Thu 17 Dec", "2 Filmhouses", "Dec", "17", 1]);
  });

  it("the page: the chip says so, and the opening day's times come as list data, soonest first", () => {
    const page = comingPage(entry, "lagos", presaleData(sold, film.id, "2026-12-18"));
    expect(page.chip).toBe("Opens Fri 18 Dec · tickets on sale");
    expect(page.opening!.days).toEqual([{ count: 3, subtitle: "Friday 18 December · opening day · tickets on sale", tile: { weekday: "Opens", date: "Fri 18", label: "Opening day, Friday 18 December" } }]);
    expect(page.opening!.data.rows.map((row) => row.at)).toEqual(["2026-12-18T09:30:00Z", "2026-12-18T14:45:00Z", "2026-12-18T18:45:00Z"]);
    expect(page.opening!.data.rows[0]!.book).toBe("https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18");
    expect(page.calendar).not.toBeNull();
  });

  it("a tile for each day on sale, the opening day first; a day's late show stays on its evening (D-199)", () => {
    const page = comingPage(entry, "lagos", presaleData(days, film.id, "2026-12-18"));
    expect(page.opening!.days).toEqual([
      { count: 2, subtitle: "Friday 18 December · opening day · tickets on sale", tile: { weekday: "Opens", date: "Fri 18", label: "Opening day, Friday 18 December" } },
      { count: 2, subtitle: "Saturday 19 December · tickets on sale", tile: { weekday: "Sat", date: "19", label: "Saturday 19 December" } },
    ]);
    // Soonest first, so each day's rows follow the one before's: the tiles' counts cut them apart.
    expect(page.opening!.data.rows.map((row) => row.at)).toEqual(["2026-12-18T09:30:00Z", "2026-12-18T14:45:00Z", "2026-12-19T12:00:00Z", "2026-12-19T23:30:00Z"]);
    // Opening day not on sale yet, the day after is: the first tile is that day's, without "Opens".
    const later = comingPage({ ...entry, firstDay: "2026-12-17" } as ComingFilm, "lagos", presaleData(days, film.id, "2026-12-17"));
    expect(later.opening!.days.map((day) => [day.tile.weekday, day.tile.date, day.count])).toEqual([["Fri", "18", 2], ["Sat", "19", 2]]);
  });

  it("with nothing on sale the page is as before: no opening, the chip names the sinima", () => {
    expect(presaleData(sold, "another-film", "2026-12-18")).toBeNull();
    // Only the first seven days' rows (D-200): earlier or later ones are not this page's.
    expect(presaleData(sold, film.id, "2026-12-19")).toBeNull();
    expect(presaleData(sold, film.id, "2026-12-11")).toBeNull();
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
