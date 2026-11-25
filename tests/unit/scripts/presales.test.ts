import { describe, expect, it } from "vitest";
import { validateShowtimes } from "@/lib/data/validate";
import { inCity } from "@/lib/data/cities";
import { buildShowtimes, splitByArea } from "../../../scripts/pipeline.ts";

// Tickets on sale before a film opens (D-194, D-199, D-200): a showing after the five shown days, on a coming
// film's first date or one of the six days after it, is kept apart as a presale; any other showing that
// far ahead is dropped. Presales stay in
// the whole file and "all" (build time) and never reach a city, area or day file a page carries.

const NOW = "2026-11-24T07:00:00Z"; // 08:00 in Lagos, Tuesday 24 November
const source = (id: string) => ({ id, name: id, url: "https://example.com/", method: "fixture" as const, status: "cleared" as const, fetchedAt: NOW, lastOkAt: NOW, health: "ok" as const });
const cinema = (id: string, area = "lekki") => ({ id, name: id, chain: "Filmhouse", area, address: null, geo: null, website: "https://www.filmhouseng.com/", sourceIds: ["lagocine"] });
const row = (cinemaId: string, filmTitle: string, startsAt: string) => ({ cinemaId, filmTitle, rating: null, startsAt, format: null, bookingUrl: "https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18" });

function build() {
  return buildShowtimes({
    generatedAt: NOW,
    sources: [source("lagocine"), source("filmhouse-home")],
    cinemas: [cinema("filmhouse-circle-mall"), cinema("filmhouse-surulere", "surulere")],
    batches: [
      {
        sourceId: "lagocine", fetchedAt: NOW, builtAt: null, through: false,
        showings: [
          row("filmhouse-circle-mall", "Agbara Nla", "2026-11-24T18:00:00Z"), // today
          row("filmhouse-circle-mall", "DUNE : PART THREE", "2026-12-18T09:30:00Z"), // its opening day
          row("filmhouse-surulere", "DUNE : PART THREE", "2026-12-18T14:45:00Z"),
          row("filmhouse-surulere", "DUNE : PART THREE", "2026-12-19T14:45:00Z"), // the day after: on sale too (D-199)
          row("filmhouse-surulere", "DUNE : PART THREE", "2026-12-24T19:30:00Z"), // its seventh day, the last kept (D-200)
          row("filmhouse-surulere", "DUNE : PART THREE", "2026-12-25T09:30:00Z"), // its eighth day: dropped
          row("filmhouse-surulere", "Some Other Film", "2026-12-18T15:00:00Z"), // not coming
        ],
      },
      { sourceId: "filmhouse-home", fetchedAt: NOW, builtAt: null, through: false, showings: [], coming: { cinemaIds: ["filmhouse-circle-mall", "filmhouse-surulere"], films: [{ title: "DUNE : PART THREE", firstDay: "2026-12-18", rating: null }] } },
    ],
  });
}

describe("presales in the pipeline (D-194)", () => {
  it("keeps a coming film's showings on its first seven days apart, and only those (D-199, D-200)", () => {
    const { file, log } = build();
    expect(file.showings.map((s) => s.filmId)).toEqual(["agbara-nla"]);
    expect(file.presales?.map((s) => [s.filmId, s.cinemaId, s.startsAt])).toEqual([
      ["dune-part-three", "filmhouse-circle-mall", "2026-12-18T09:30:00Z"],
      ["dune-part-three", "filmhouse-surulere", "2026-12-18T14:45:00Z"],
      ["dune-part-three", "filmhouse-surulere", "2026-12-19T14:45:00Z"],
      ["dune-part-three", "filmhouse-surulere", "2026-12-24T19:30:00Z"],
    ]);
    expect(log).toContain("lagocine: dropped 2 showings after the shown days that are not in a coming film's first 7 days");
    // Dune is still coming: its presales don't make it a film that is showing.
    expect(file.coming?.map((entry) => entry.filmId)).toEqual(["dune-part-three"]);
  });

  it("leaves the field out when nothing is on sale", () => {
    const { file } = buildShowtimes({ generatedAt: NOW, sources: [source("lagocine")], cinemas: [cinema("filmhouse-circle-mall")], batches: [{ sourceId: "lagocine", fetchedAt: NOW, builtAt: null, through: false, showings: [row("filmhouse-circle-mall", "Agbara Nla", "2026-11-24T18:00:00Z")] }] });
    expect("presales" in file).toBe(false);
  });

  it("keeps presales in 'all' (build time only) and out of every area and city file a page loads", () => {
    const { file } = build();
    const parts = splitByArea(file, ["lekki", "surulere"], NOW);
    expect(parts.get("all")!.presales).toHaveLength(4);
    expect(parts.get("lekki")!.presales).toBeUndefined();
    expect(parts.get("surulere")!.presales).toBeUndefined();
    expect(inCity(parts.get("all")!, "lagos", () => "lagos").presales).toBeUndefined();
  });

  it("cuts a Filmhouse checkout link in any row, old or new, showing or presale (rule 5)", () => {
    const { file } = build();
    const old = structuredClone(file);
    old.showings[0]!.bookingUrl = "https://www.filmhouseng.com/movies/agbara-2026/showtimes/2026-11-24/circlemall/select-tickets?showtime=Q";
    old.presales![0]!.bookingUrl = "https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18/circlemall/select-tickets?showtime=Q";
    const checked = validateShowtimes(old);
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(checked.file.showings[0]!.bookingUrl).toBe("https://www.filmhouseng.com/movies/agbara-2026/showtimes/2026-11-24");
    expect(checked.file.presales![0]!.bookingUrl).toBe("https://www.filmhouseng.com/movies/dunepartthree-2026/showtimes/2026-12-18");
  });

  it("checks each presale as it checks a showing: a link off the cinema's own site is removed", () => {
    const { file } = build();
    const bad = structuredClone(file);
    bad.presales![0]!.bookingUrl = "https://tickets.example.com/x";
    const checked = validateShowtimes(bad);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.file.presales![0]!.bookingUrl).toBeNull();
    const broken = structuredClone(file);
    (broken.presales![0] as { startsAt: string }).startsAt = "18 Dec 10:30";
    const refused = validateShowtimes(broken);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.errors.join("\n")).toMatch(/presales/);
  });
});
