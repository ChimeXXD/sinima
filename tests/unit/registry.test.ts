import { describe, expect, it } from "vitest";
import cinemas from "../../data/cinemas.json";
import sources from "../../data/sources.json";

describe("data registries", () => {
  it("places every cinema in a listed area", () => {
    const areas = new Set(cinemas.areas.map((a) => a.slug));
    const orphans = cinemas.cinemas.filter((c) => !areas.has(c.area)).map((c) => c.id);
    expect(orphans).toEqual([]);
  });

  it("reads past robots.txt only where the owner said yes in writing, and only Lagocine so far (D-198)", () => {
    type Entry = { id: string; permission?: { repliedAt?: string | null; overridesRobots?: boolean } };
    const overriding = (sources.sources as Entry[]).filter((source) => source.permission?.overridesRobots === true);
    expect(overriding.map((source) => source.id)).toEqual(["lagocine"]);
    for (const source of overriding) expect(source.permission?.repliedAt, source.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("gives every cinema a unique id", () => {
    const ids = cinemas.cinemas.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every area neighbours that are other listed areas (D-46)", () => {
    const areas = new Set(cinemas.areas.map((a) => a.slug));
    for (const area of cinemas.areas) {
      expect(area.neighbours.length, area.slug).toBeGreaterThan(0);
      expect(area.neighbours.filter((n) => !areas.has(n) || n === area.slug), area.slug).toEqual([]);
    }
  });

  it("only names cinemas that exist in the registry", () => {
    const ids = new Set(cinemas.cinemas.map((c) => c.id));
    const unknown = sources.sources.flatMap((s) => s.cinemaIds.filter((id) => !ids.has(id)));
    expect(unknown).toEqual([]);
  });

  it("gives a cinema's own page only for the cinemas its source feeds, each an https address (D-122)", () => {
    for (const source of sources.sources as { id: string; cinemaIds: string[]; cinemaPages?: Record<string, string> }[]) {
      const pages = Object.entries(source.cinemaPages ?? {});
      expect(pages.filter(([id]) => !source.cinemaIds.includes(id)).map(([id]) => id), source.id).toEqual([]);
      for (const [id, url] of pages) expect(new URL(url).protocol, `${source.id} ${id}`).toBe("https:");
    }
  });

  it("names a cinema in its source's booking links (bookingSites) or pages (pageNames) only for a cinema the source feeds, each name once (D-124, D-125)", () => {
    for (const source of sources.sources as { id: string; cinemaIds: string[]; bookingSites?: Record<string, string>; pageNames?: Record<string, string> }[]) {
      for (const [field, map] of [["bookingSites", source.bookingSites], ["pageNames", source.pageNames]] as const) {
        const names = Object.entries(map ?? {});
        expect(names.filter(([id]) => !source.cinemaIds.includes(id)).map(([id]) => id), `${source.id} ${field}`).toEqual([]);
        expect(new Set(names.map(([, name]) => name)).size, `${source.id} ${field}`).toBe(names.length);
      }
    }
  });
});

describe("one cinema, one entry (D-56)", () => {
  it("lists Leisure Mall's cinema once, as Filmhouse Surulere", () => {
    expect(cinemas.cinemas.map((c) => c.id)).not.toContain("leisure-mall-surulere");
    const surulere = cinemas.cinemas.find((c) => c.id === "filmhouse-surulere")!;
    expect(surulere.address).toBe("Leisure Mall, Surulere, Lagos");
  });
});

// Two cities (D-62, D-120): every area belongs to Lagos or Abuja, and Abuja's areas and cinemas are
// those of the 15 Nov audit (docs/RESEARCH.md §Abuja audit, D-79).
describe("two cities (D-120)", () => {
  const cityOf = new Map(cinemas.areas.map((a) => [a.slug, (a as { city?: string }).city]));
  const abuja = cinemas.cinemas.filter((c) => cityOf.get(c.area) === "abuja");

  it("gives every area a city, Lagos or Abuja", () => {
    for (const area of cinemas.areas) expect(["lagos", "abuja"], area.slug).toContain((area as { city?: string }).city);
  });

  it("keeps an area's neighbours in its own city", () => {
    for (const area of cinemas.areas) {
      expect(area.neighbours.filter((n) => cityOf.get(n) !== cityOf.get(area.slug)), area.slug).toEqual([]);
    }
  });

  it("has Abuja's four areas with the drafted neighbours: CBD–Jabi, CBD–Lugbe, Lugbe–Kuje", () => {
    const abujaAreas = Object.fromEntries(cinemas.areas.filter((a) => cityOf.get(a.slug) === "abuja").map((a) => [a.slug, [a.name, [...a.neighbours].sort()]]));
    expect(abujaAreas).toEqual({
      "central-business-district": ["Central Business District", ["jabi", "lugbe"]],
      jabi: ["Jabi", ["central-business-district"]],
      lugbe: ["Lugbe", ["central-business-district", "kuje"]],
      kuje: ["Kuje", ["lugbe"]],
    });
  });

  it("lists Abuja's five cinemas in their areas, and nothing else in Abuja", () => {
    expect(Object.fromEntries(abuja.map((c) => [c.id, c.area]))).toEqual({
      "silverbird-sec": "central-business-district",
      "silverbird-jabi": "jabi",
      "genesis-ceddi-plaza": "central-business-district",
      "nova-abuja": "lugbe",
      "jays-kuje": "kuje",
    });
    expect(cinemas.cinemas.filter((c) => cityOf.get(c.area) === "lagos")).toHaveLength(22);
  });

  it("gives an Abuja cinema an address only where its own page confirmed one (rule 8)", () => {
    const address = Object.fromEntries(abuja.map((c) => [c.id, c.address]));
    expect(address).toEqual({
      "silverbird-sec": null,
      "silverbird-jabi": null,
      "genesis-ceddi-plaza": null,
      "nova-abuja": "Novare Gateway Mall, Musa Yar'Adua Expressway (Airport Road), Lugbe District, Abuja",
      "jays-kuje": "Union Home Estate Road, Kuchiyako, Kuje, Abuja",
    });
  });

  it("reads Abuja's cinemas from their own sites, never through Lagocine (Lagos only)", () => {
    const feeds = (id: string) => sources.sources.filter((s) => (s.cinemaIds as string[]).includes(id)).map((s) => s.id);
    expect(Object.fromEntries(abuja.map((c) => [c.id, feeds(c.id)]))).toEqual({
      "silverbird-sec": ["silverbird"],
      "silverbird-jabi": ["silverbird"],
      "genesis-ceddi-plaza": ["genesis"],
      "nova-abuja": ["nova"],
      "jays-kuje": [],
    });
  });
});
