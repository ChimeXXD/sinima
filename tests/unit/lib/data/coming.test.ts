import { describe, expect, it } from "vitest";
import example from "../../../../docs/examples/showtimes-v1.example.json";
import { inCity } from "@/lib/data/cities";
import { comingList, cutComing, filmsWithShowings, withComing } from "@/lib/data/coming";
import type { ShowtimesFile } from "@/lib/data/types";
import { validateShowtimes } from "@/lib/data/validate";

// Coming films (D-144, D-151): films a sinima lists as coming, with the first date the sinima gives
// (a Lagos date), or null when it gives none ("Date not announced"). Optional in schema v1.

type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const FETCHED = "2026-11-06T15:00:00Z";
const DOOMSDAY = { id: "avengers-doomsday", title: "AVENGERS: DOOMSDAY", runtimeMin: null, rating: "PG-13", origin: null, tmdbId: null };
const entry = (over: Loose = {}) => ({ sourceId: "filmhouse", filmId: "avengers-doomsday", firstDay: "2026-12-18", cinemaIds: ["filmhouse-lekki-imax"], fetchedAt: FETCHED, ...over });
/** The DATA.md example (generated 6 Nov 2026) with a coming film added. */
const withEntries = (...coming: Loose[]): Loose => {
  const copy = structuredClone(example) as Loose;
  copy.films.push(DOOMSDAY);
  copy.coming = coming;
  return copy;
};
const accepted = (input: unknown) => {
  const result = validateShowtimes(input);
  if (!result.ok) throw new Error(`expected the file to be accepted:\n${result.errors.join("\n")}`);
  return result;
};
const refused = (input: unknown) => {
  const result = validateShowtimes(input);
  if (result.ok) throw new Error("expected the file to be refused");
  return result.errors.join("\n");
};

describe("validateShowtimes: coming", () => {
  it("accepts a coming list whose references resolve, unchanged, and a film with no date (date not announced)", () => {
    const input = withEntries(entry(), entry({ filmId: "spider-man-brand-new-day", firstDay: null }));
    const result = accepted(input);
    expect(result.log).toEqual([]);
    expect(result.file.coming).toEqual(input.coming);
  });

  it("refuses a malformed list or entry", () => {
    expect(refused({ ...withEntries(), coming: {} })).toContain("coming must be a list");
    expect(refused(withEntries(entry({ firstDay: "18 Dec" })))).toContain('coming[0].firstDay must be a Lagos date like 2026-12-18 or null, got "18 Dec"');
    expect(refused(withEntries(entry({ firstDay: "2026-02-30" })))).toContain("coming[0].firstDay must be a Lagos date");
    expect(refused(withEntries(entry({ filmId: "" })))).toContain("coming[0].filmId must be a non-empty string");
    expect(refused(withEntries(entry({ cinemaIds: "filmhouse-lekki-imax" })))).toContain("coming[0].cinemaIds must be a list of cinema ids");
    expect(refused(withEntries(entry({ fetchedAt: "6 Nov" })))).toContain("coming[0].fetchedAt must be a UTC time");
  });

  it("drops an entry whose film or source is not in the file, and a cinema that is not; says so", () => {
    const result = accepted(withEntries(entry({ filmId: "ghost" }), entry({ sourceId: "nobody" }), entry({ cinemaIds: ["filmhouse-lekki-imax", "nowhere"] })));
    expect(result.file.coming).toEqual([entry()]);
    expect(result.log).toEqual([
      'Dropped the coming film "ghost" from filmhouse: the film is not in the file',
      'Dropped the coming film "avengers-doomsday" from "nobody": its source is not in the file',
      'Coming film "avengers-doomsday" from filmhouse: dropped the cinema "nowhere", which is not in the file',
    ]);
  });

  it("drops a film whose first date is the file's Lagos day or earlier (it is on now, not coming) and leaves the key out when none is left", () => {
    // Generated 16:05 UTC on 6 Nov: 17:05 on 6 Nov in Lagos.
    const result = accepted(withEntries(entry({ firstDay: "2026-11-06" }), entry({ firstDay: "2026-11-01" })));
    expect("coming" in result.file).toBe(false);
    expect(result.log).toEqual([
      'Dropped the coming film "avengers-doomsday" from filmhouse: its first date 2026-11-06 is not after 2026-11-06',
      'Dropped the coming film "avengers-doomsday" from filmhouse: its first date 2026-11-01 is not after 2026-11-06',
    ]);
    expect(accepted(withEntries(entry({ firstDay: "2026-11-07" }))).file.coming).toHaveLength(1);
  });
});

describe("cutComing and inCity", () => {
  const cinema = (id: string, area: string) => ({ id, name: id, chain: "C", area, address: null, geo: null, website: null, bookingHost: null, sourceIds: [] });
  const source = (id: string) => ({ id, name: id, url: `https://${id}`, method: "fixture" as const, status: "cleared" as const, fetchedAt: FETCHED, lastOkAt: FETCHED, health: "ok" as const });
  const file: ShowtimesFile = {
    schemaVersion: 1, generatedAt: FETCHED, timeZone: "Africa/Lagos", sample: true,
    sources: [source("filmhouse-home")],
    cinemas: [cinema("filmhouse-oniru", "victoria-island"), cinema("filmhouse-surulere", "surulere"), cinema("silverbird-jabi", "jabi")],
    films: [DOOMSDAY],
    showings: [],
    coming: [{ sourceId: "filmhouse-home", filmId: "avengers-doomsday", firstDay: "2026-12-18", cinemaIds: ["filmhouse-oniru", "filmhouse-surulere"], fetchedAt: FETCHED }],
  };
  const cityOf = (slug: string) => (slug === "jabi" ? "abuja" : "lagos");

  it("keeps only the given cinemas, and an entry left with none goes", () => {
    expect(cutComing(file, new Set(["filmhouse-surulere"]))).toEqual([{ ...file.coming![0], cinemaIds: ["filmhouse-surulere"] }]);
    expect(cutComing(file, new Set(["silverbird-jabi"]))).toEqual([]);
    expect("coming" in withComing(file, [])).toBe(false);
  });

  it("gives each city its own sinimas' coming films, with the films and sources they use", () => {
    const lagos = inCity(file, "lagos", cityOf);
    expect(lagos.coming).toEqual(file.coming);
    expect(lagos.films.map((film) => film.id)).toEqual(["avengers-doomsday"]);
    expect(lagos.sources.map((s) => s.id)).toEqual(["filmhouse-home"]);
    const abuja = inCity(file, "abuja", cityOf);
    expect("coming" in abuja).toBe(false);
    expect(abuja.films).toEqual([]);
    expect(abuja.sources).toEqual([]);
  });
});

describe("filmsWithShowings: which films get a film page today", () => {
  it("leaves out a coming-only film, which is in `films` but has no showing (its page comes with the Coming soon UI, D-151)", () => {
    const file = withEntries(entry()) as ShowtimesFile;
    expect(filmsWithShowings(file).map((film) => film.id)).toEqual(["spider-man-brand-new-day", "one-gidi-night"]);
  });
});

describe("comingList: the films under Coming soon in a city, and which get a coming film's page (D-151, D-154)", () => {
  const cinema = (id: string, chain: string) => ({ id, name: id, chain, area: "lekki", address: null, geo: null, website: null, bookingHost: null, sourceIds: [] });
  const film = (id: string, title: string) => ({ id, title, runtimeMin: null, rating: null, origin: null, tmdbId: null });
  const coming = (filmId: string, firstDay: string | null, cinemaIds = ["filmhouse-oniru", "filmhouse-surulere"], sourceId = "filmhouse-home") => ({ sourceId, filmId, firstDay, cinemaIds, fetchedAt: FETCHED });
  // Generated 6 Nov at 16:00 UTC: 17:00 on 6 Nov in Lagos.
  const file = {
    generatedAt: FETCHED,
    cinemas: [cinema("filmhouse-oniru", "Filmhouse"), cinema("filmhouse-surulere", "Filmhouse"), cinema("genesis-lekki", "Genesis")],
    films: [film("avengers-doomsday", "Avengers: Doomsday"), film("dune-part-three", "Dune: Part Three"), film("the-four", "The Four"), film("hunger-games", "The Hunger Games")],
    coming: [coming("avengers-doomsday", "2026-12-18"), coming("the-four", null), coming("dune-part-three", "2026-12-11"), coming("hunger-games", "2026-11-20")],
  };
  const ids = (list: ReturnType<typeof comingList>) => list.map((entry) => entry.film.id);

  it("lists each film once, by its first date, undated last, with the sinimas that list it", () => {
    const list = comingList(file, new Set());
    expect(ids(list)).toEqual(["hunger-games", "dune-part-three", "avengers-doomsday", "the-four"]);
    expect(list[2]).toEqual({ film: file.films[0], firstDay: "2026-12-18", sinimas: ["Filmhouse"] });
    expect(list[3]!.firstDay).toBeNull();
  });

  it("leaves out a film with any showing in the city's shown days: it is on now, not coming (D-154)", () => {
    expect(ids(comingList(file, new Set(["hunger-games"])))).toEqual(["dune-part-three", "avengers-doomsday", "the-four"]);
  });

  it("leaves out a film whose first date is not after the file's Lagos day", () => {
    const today = { ...file, coming: [coming("avengers-doomsday", "2026-11-06"), coming("dune-part-three", "2026-11-07")] };
    expect(ids(comingList(today, new Set()))).toEqual(["dune-part-three"]);
  });

  it("takes a film's earliest date when two sinimas list it, with the sinimas giving that date", () => {
    const two = { ...file, coming: [coming("avengers-doomsday", "2026-12-18"), coming("avengers-doomsday", "2026-12-16", ["genesis-lekki"], "genesis"), coming("dune-part-three", "2026-12-11", ["genesis-lekki"], "genesis"), coming("dune-part-three", "2026-12-11")] };
    const list = comingList(two, new Set());
    expect(list.map(({ film: f, firstDay, sinimas }) => [f.id, firstDay, sinimas])).toEqual([
      ["dune-part-three", "2026-12-11", ["Genesis", "Filmhouse"]],
      ["avengers-doomsday", "2026-12-16", ["Genesis"]],
    ]);
  });

  it("never lets an entry naming no sinima in the file take the date from one that does", () => {
    const stray = { ...file, coming: [coming("avengers-doomsday", "2026-12-18"), coming("avengers-doomsday", "2026-12-16", ["gone-cinema"], "gone")] };
    expect(comingList(stray, new Set())).toEqual([{ film: file.films[0], firstDay: "2026-12-18", sinimas: ["Filmhouse"] }]);
  });

  it("is empty when no sinima lists a film as coming (Abuja today)", () => {
    expect(comingList({ ...file, coming: undefined }, new Set())).toEqual([]);
  });
});
