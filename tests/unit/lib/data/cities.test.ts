import { describe, expect, it } from "vitest";
import registry from "../../../../data/cinemas.json";
import { inCity } from "@/lib/data/cities";
import { areas, areasIn, cityOfArea } from "@/lib/data/load";
import type { ShowtimesFile } from "@/lib/data/types";

// The city layer (D-98, D-120): each city's pages hold only its own areas, cinemas, films and
// showings. A cinema's city is its area's, from data/cinemas.json.

const NOW = "2026-11-17T11:00:00Z";
const cinema = (id: string, area: string) => ({ id, name: id, chain: "C", area, address: null, geo: null, website: null, bookingHost: null, sourceIds: [] });
const film = (id: string) => ({ id, title: id, runtimeMin: null, rating: null, origin: null, tmdbId: null });
const showing = (cinemaId: string, filmId: string, sourceId: string) => ({
  id: `${cinemaId}_${filmId}`, filmId, cinemaId, screenId: null, startsAt: "2026-11-17T18:00:00Z", format: null, language: null, price: null, bookingUrl: null, sourceId, fetchedAt: NOW,
});
const source = (id: string) => ({ id, name: id, url: `https://${id}`, method: "fixture" as const, status: "cleared" as const, fetchedAt: NOW, lastOkAt: NOW, health: "ok" as const });

const file: ShowtimesFile = {
  schemaVersion: 1, generatedAt: NOW, timeZone: "Africa/Lagos", sample: true,
  sources: [source("lagocine"), source("silverbird")],
  cinemas: [cinema("grand-lekki", "lekki"), cinema("silverbird-jabi", "jabi"), cinema("jays-kuje", "kuje")],
  films: [film("both"), film("lagos-only"), film("abuja-only")],
  showings: [
    showing("grand-lekki", "both", "lagocine"),
    showing("grand-lekki", "lagos-only", "lagocine"),
    showing("silverbird-jabi", "both", "silverbird"),
    showing("silverbird-jabi", "abuja-only", "silverbird"),
  ],
};
const cityOf = (slug: string) => (slug === "lekki" ? "lagos" : slug === "jabi" || slug === "kuje" ? "abuja" : undefined);

describe("inCity", () => {
  it("keeps Abuja's cinemas (with or without times), their showings and only the films and sources they use", () => {
    const abuja = inCity(file, "abuja", cityOf);
    expect(abuja.cinemas.map((c) => c.id)).toEqual(["silverbird-jabi", "jays-kuje"]);
    expect(abuja.showings.map((s) => s.id)).toEqual(["silverbird-jabi_both", "silverbird-jabi_abuja-only"]);
    expect(abuja.films.map((f) => f.id)).toEqual(["both", "abuja-only"]);
    expect(abuja.sources.map((s) => s.id)).toEqual(["silverbird"]);
    expect(abuja).toMatchObject({ generatedAt: NOW, sample: true, timeZone: "Africa/Lagos" });
  });

  it("gives Lagos no Abuja cinema, film or showing", () => {
    const lagos = inCity(file, "lagos", cityOf);
    expect(lagos.cinemas.map((c) => c.id)).toEqual(["grand-lekki"]);
    expect(lagos.films.map((f) => f.id)).toEqual(["both", "lagos-only"]);
    expect(lagos.sources.map((s) => s.id)).toEqual(["lagocine"]);
  });

  it("refuses a cinema whose area has no city, rather than guess one", () => {
    expect(() => inCity({ ...file, cinemas: [cinema("x", "nowhere")] }, "lagos", cityOf)).toThrow('No city for the area "nowhere"');
  });
});

describe("the areas of each city (data/cinemas.json)", () => {
  it("splits the registry's areas between Lagos (12) and Abuja (4), in the registry's order", () => {
    expect(areasIn("lagos")).toHaveLength(12);
    expect(areasIn("abuja").map((a) => a.slug)).toEqual(["central-business-district", "jabi", "lugbe", "kuje"]);
    expect(areasIn("lagos").length + areasIn("abuja").length).toBe(registry.areas.length);
  });

  it("counts each area's cinemas and names its city", () => {
    expect(areas.find((a) => a.slug === "central-business-district")).toEqual({
      slug: "central-business-district", name: "Central Business District", city: "abuja", neighbours: ["jabi", "lugbe"], cinemas: 2,
    });
    expect(cityOfArea("lekki")).toBe("lagos");
    expect(cityOfArea("kuje")).toBe("abuja");
    expect(cityOfArea("nowhere")).toBeUndefined();
  });
});

describe("the words that name the page's city (D-120)", () => {
  it("say Abuja on Abuja's pages and Lagos on Lagos's", async () => {
    const { cityWords, sectionTitle } = await import("@/lib/wording/city");
    expect(cityWords("abuja")).toEqual({ allCinemas: "All cinemas in Abuja", allFilms: "All films in Abuja", times: "Times in Abuja" });
    expect(cityWords("lagos").times).toBe("Times in Lagos");
    expect(sectionTitle("films", "abuja")).toBe("What's on in Abuja");
    expect(sectionTitle("cinemas", "lagos")).toBe("Cinemas in Lagos");
  });
});
