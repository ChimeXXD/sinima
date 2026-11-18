import { describe, expect, it } from "vitest";
import { inCity } from "@/lib/data/cities";
import { featuredAt } from "@/lib/data/featured";
import { toListData } from "@/lib/data/listData";
import type { Featured, ShowtimesFile } from "@/lib/data/types";
import { validateShowtimes } from "@/lib/data/validate";

// Films a chain's own page features for a day, without times (D-131): kept apart from showings,
// shown only on that chain's cinemas that have no times, and only on the day they are for.

const NOW = "2026-11-17T11:00:00Z"; // noon in Lagos
const cinema = (id: string, area: string) => ({ id, name: id, chain: "Filmhouse", area, address: null, geo: null, website: "https://filmhouseng.com/", bookingHost: "filmhouseng.com", sourceIds: [] });
const source = (id: string) => ({ id, name: id, url: `https://${id}.example/`, method: "public-page" as const, status: "cleared" as const, fetchedAt: NOW, lastOkAt: NOW, health: "ok" as const });
const FEATURED: Featured = {
  sourceId: "filmhouse-home",
  cinemaIds: ["filmhouse-oniru", "filmhouse-surulere", "filmhouse-lekki-imax"],
  day: "2026-11-17",
  fetchedAt: NOW,
  films: [{ id: "ghost-soldier", title: "Ghost Soldier" }, { id: "dear-ajayi", title: "Dear Ajayi" }],
};
const file: ShowtimesFile = {
  schemaVersion: 1, generatedAt: NOW, timeZone: "Africa/Lagos", sample: false,
  sources: [source("lagocine"), source("filmhouse-home")],
  cinemas: [cinema("filmhouse-oniru", "victoria-island"), cinema("filmhouse-surulere", "surulere"), cinema("filmhouse-lekki-imax", "lekki"), cinema("silverbird-jabi", "jabi")],
  films: [{ id: "whalefall", title: "Whalefall", runtimeMin: null, rating: null, origin: null, tmdbId: null }],
  // Lagocine has real times for Lekki IMAX only.
  showings: [{ id: "filmhouse-lekki-imax_whalefall_2026-11-17T18:00:00Z", filmId: "whalefall", cinemaId: "filmhouse-lekki-imax", screenId: null, startsAt: "2026-11-17T18:00:00Z", format: null, language: null, price: null, bookingUrl: null, sourceId: "lagocine", fetchedAt: NOW }],
  featured: [FEATURED],
};

describe("validateShowtimes: featured films (D-131)", () => {
  it("keeps a sound list as it is, and adds no showing", () => {
    const checked = validateShowtimes(file);
    expect(checked.ok && checked.file.featured).toEqual([FEATURED]);
    expect(checked.ok && checked.file.showings).toHaveLength(1);
  });

  it("refuses a list whose day, read time or films are not sound", () => {
    const bad = (change: Partial<Featured>) => validateShowtimes({ ...file, featured: [{ ...FEATURED, ...change }] });
    expect(bad({ day: "17 Nov" })).toEqual({ ok: false, errors: ['featured[0].day must be a Lagos date like 2026-11-17, got "17 Nov"'] });
    expect(bad({ fetchedAt: "2026-11-17 11:00" })).toEqual({ ok: false, errors: ['featured[0].fetchedAt must be a UTC time like 2026-11-06T18:30:00Z, got "2026-11-17 11:00"'] });
    expect(bad({ films: [{ id: "", title: "Ghost Soldier" }] })).toEqual({ ok: false, errors: ['featured[0].films must be a list of { id, title }, got [{"id":"","title":"Ghost Soldier"}]'] });
    expect(validateShowtimes({ ...file, featured: {} })).toEqual({ ok: false, errors: ["featured must be a list"] });
  });

  it("drops cinemas the file does not have, and a list from a source it does not have", () => {
    const strays = validateShowtimes({ ...file, featured: [{ ...FEATURED, cinemaIds: ["filmhouse-oniru", "filmhouse-nowhere"] }, { ...FEATURED, sourceId: "nobody" }] });
    expect(strays.ok && strays.file.featured).toEqual([{ ...FEATURED, cinemaIds: ["filmhouse-oniru"] }]);
    expect(strays.ok && strays.log).toEqual([
      'Featured films from filmhouse-home: dropped the cinema "filmhouse-nowhere", which is not in the file',
      'Dropped the featured films from "nobody": its source is not in the file',
    ]);
  });

  it("leaves a file without the list as it was", () => {
    const without: Partial<ShowtimesFile> = { ...file };
    delete without.featured;
    const checked = validateShowtimes(without);
    expect(checked.ok && "featured" in checked.file).toBe(false);
  });
});

describe("inCity with featured films", () => {
  const cityOf = (slug: string) => (slug === "jabi" ? "abuja" : "lagos");
  it("keeps the list for the city's own cinemas, with its source", () => {
    const lagos = inCity(file, "lagos", cityOf);
    expect(lagos.featured).toEqual([FEATURED]);
    expect(lagos.sources.map((s) => s.id)).toEqual(["lagocine", "filmhouse-home"]);
  });
  it("leaves it out of a city with none of its cinemas", () => {
    const abuja = inCity(file, "abuja", cityOf);
    expect("featured" in abuja).toBe(false);
    expect(abuja.sources).toEqual([]);
  });
});

describe("toListData and featuredAt", () => {
  const data = toListData(file);
  const at = (id: string) => data.cinemas.findIndex((c) => c.id === id);

  it("sends the list only for the cinemas with no times: real times win", () => {
    expect(data.featured).toEqual([{ cinemas: [at("filmhouse-oniru"), at("filmhouse-surulere")], day: "2026-11-17", films: ["Ghost Soldier", "Dear Ajayi"] }]);
    // A cinema's own page is built from the same city file, so the list still knows it has no times.
    expect(toListData(file, { cinemaId: "filmhouse-oniru" }).featured).toEqual(data.featured);
    expect(toListData({ ...file, featured: undefined }).featured).toBeUndefined();
  });

  it("gives a cinema's featured films on their own day, the date alone before the time is known, and nothing on another day", () => {
    expect(featuredAt(data, at("filmhouse-oniru"), NOW)).toEqual({ films: ["Ghost Soldier", "Dear Ajayi"], day: "2026-11-17", today: true });
    expect(featuredAt(data, at("filmhouse-oniru"), "2026-11-16T23:00:00Z")).toMatchObject({ today: true }); // 00:00 on the 17th in Lagos
    expect(featuredAt(data, at("filmhouse-oniru"), null)).toEqual({ films: ["Ghost Soldier", "Dear Ajayi"], day: "2026-11-17", today: null });
    expect(featuredAt(data, at("filmhouse-oniru"), "2026-11-17T23:00:00Z")).toBeNull(); // the 18th
    expect(featuredAt(data, at("filmhouse-lekki-imax"), NOW)).toBeNull();
    expect(featuredAt(data, at("silverbird-jabi"), NOW)).toBeNull();
  });
});
