import { describe, expect, it } from "vitest";
import { cityReading, sourceRows } from "@/lib/data/about";

// About › Where the times come from (Figma 208:9122): each source we may read, how many cinemas it
// covers and its real status, from data/sources.json and the times the site is built from.

const src = (id: string, cinemas: number, status = "cleared", askedAt: string | null = null, repliedAt: string | null = null) => ({ id, name: `${id}'s site`, status, cinemaIds: Array.from({ length: cinemas }, (_, i) => `${id}-${i}`), permission: askedAt ? { askedAt, repliedAt } : undefined });

describe("sourceRows", () => {
  const registry = [src("genesis", 3), src("lagocine", 20, "cleared", "2026-11-11"), src("syticks", 0, "pending"), src("showtimes", 4, "do-not-use"), src("filmhouse", 7, "pending", "2026-11-11"), src("ebonylife", 1)];

  it("lists the sources with cinemas, most cinemas first, and leaves out those we won't use", () => {
    expect(sourceRows(registry, []).map((row) => [row.name, row.cinemas])).toEqual([
      ["lagocine's site", 20],
      ["filmhouse's site", 7],
      ["genesis's site", 3],
      ["ebonylife's site", 1],
    ]);
  });

  it("asked and not answered; not used yet; in use once the site reads it (not a saved sample)", () => {
    const rows = sourceRows(registry, [{ id: "lagocine", method: "fixture" }, { id: "genesis", method: "public-page" }]);
    expect(Object.fromEntries(rows.map((row) => [row.id, row.status]))).toEqual({
      lagocine: { kind: "asked", on: "2026-11-11" },
      filmhouse: { kind: "asked", on: "2026-11-11" },
      genesis: { kind: "used" },
      ebonylife: { kind: "unused" },
    });
  });

  it("an answered request is no longer 'asked'", () => {
    expect(sourceRows([src("filmhouse", 7, "cleared", "2026-11-11", "2026-11-20")], [])[0]!.status).toEqual({ kind: "unused" });
  });
});

// Each city's cinemas by how the built times read them (D-122): a cinema with a showing from its
// own source is read from its own site; one whose showings all come through Lagocine is read
// through it; one with none has no times yet.
describe("cityReading", () => {
  const file = {
    cinemas: [{ id: "g", area: "lekki" }, { id: "f", area: "lekki" }, { id: "x", area: "lekki" }, { id: "s", area: "jabi" }, { id: "j", area: "kuje" }],
    showings: [{ cinemaId: "g", sourceId: "genesis" }, { cinemaId: "f", sourceId: "lagocine" }, { cinemaId: "f", sourceId: "lagocine" }, { cinemaId: "s", sourceId: "silverbird" }],
  };
  const cityOf = (area: string) => (area === "lekki" ? "lagos" : "abuja") as "lagos" | "abuja";
  it("counts each city's cinemas read from their own sites, through Lagocine, and with no times", () => {
    expect(cityReading(file, cityOf)).toEqual({ lagos: { own: 1, through: 1, none: 1 }, abuja: { own: 1, through: 0, none: 1 } });
  });
});
