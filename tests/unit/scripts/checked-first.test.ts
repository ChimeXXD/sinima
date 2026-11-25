import { describe, expect, it } from "vitest";
import { buildShowtimes } from "../../../scripts/pipeline.ts";

// A hand check of Filmhouse's own site outranks Lagocine for each film's evening it covers, at every
// cinema its source feeds (a cinema it found nothing at had no times), while it is under two Lagos
// days old (D-200): Lagocine had times Filmhouse no longer lists and no "Closed" marks. Older than
// that, it gives way to a source that read the cinema since. Where both list the same start,
// Lagocine's format stays (Filmhouse's page names none).

const NOW = "2026-11-25T12:30:00Z"; // 13:30 in Lagos, Wednesday 25 November
const CHECKED = "2026-11-25T11:15:00Z";
const source = (id: string, fetchedAt: string) => ({ id, name: id, url: "https://example.com/", method: "public-page" as const, status: "cleared" as const, fetchedAt, lastOkAt: fetchedAt, health: "ok" as const });
const cinema = (id: string, sourceIds = ["lagocine", "filmhouse-checked"]) => ({ id, name: id, chain: "Filmhouse", area: "lekki", address: null, geo: null, website: "https://www.filmhouseng.com/", sourceIds });
const row = (cinemaId: string, startsAt: string, extra: Record<string, unknown> = {}) => ({ cinemaId, filmTitle: "AVENGERS: DOOMSDAY", rating: null, startsAt, format: null, bookingUrl: null, ...extra });

function build(now: string, checkedAt = CHECKED, lagocineAt = now) {
  return buildShowtimes({
    generatedAt: now,
    sources: [source("lagocine", lagocineAt), source("filmhouse-checked", checkedAt), source("filmhouse-home", now)],
    cinemas: [cinema("filmhouse-palms-lekki"), cinema("filmhouse-landmark"), cinema("genesis-lekki", ["lagocine"])],
    batches: [
      {
        sourceId: "lagocine", fetchedAt: lagocineAt, builtAt: null, through: false,
        showings: [
          row("filmhouse-palms-lekki", "2026-12-18T16:45:00Z", { format: "2D" }), // 17:45, gone from Filmhouse's page
          row("filmhouse-palms-lekki", "2026-12-18T19:40:00Z", { format: "2D" }), // 20:40, on both
          row("filmhouse-landmark", "2026-12-18T18:30:00Z", { format: "MX4D" }), // a Filmhouse the check found nothing at that evening
          row("genesis-lekki", "2026-12-18T18:00:00Z"), // a cinema the check does not cover
        ],
      },
      {
        sourceId: "filmhouse-checked", fetchedAt: checkedAt, builtAt: null, through: false, checked: true,
        showings: [
          row("filmhouse-palms-lekki", "2026-12-18T19:40:00Z", { closed: true }),
          row("filmhouse-palms-lekki", "2026-12-19T20:00:00Z"), // a day only the check has
        ],
      },
      { sourceId: "filmhouse-home", fetchedAt: now, builtAt: null, through: false, showings: [], coming: { cinemaIds: ["filmhouse-palms-lekki", "filmhouse-landmark", "genesis-lekki"], films: [{ title: "AVENGERS: DOOMSDAY", firstDay: "2026-12-18", rating: null }] } },
    ],
  });
}

const brief = (rows: { cinemaId: string; startsAt: string; sourceId: string; format: string | null; closed?: true }[]) =>
  rows.map((s) => [s.cinemaId, s.startsAt, s.sourceId, s.format, s.closed ?? false]);

describe("a hand check outranks the other sources for what it covers (D-200)", () => {
  it("replaces another source's times for the film's evening at every cinema it feeds, keeping that source's format at the same start", () => {
    const { file, log } = build(NOW);
    expect(brief(file.presales ?? [])).toEqual([
      ["genesis-lekki", "2026-12-18T18:00:00Z", "lagocine", null, false],
      ["filmhouse-palms-lekki", "2026-12-18T19:40:00Z", "filmhouse-checked", "2D", true],
      ["filmhouse-palms-lekki", "2026-12-19T20:00:00Z", "filmhouse-checked", null, false],
    ]);
    // Palms Lekki's two and Landmark's one: the check read Landmark's page and it had no times.
    expect(log).toContain("filmhouse-checked: replaced 3 showings from other sources on the days it was checked for");
  });

  it("still leads the day after it was checked, as its times say \"yesterday\"", () => {
    const { file } = build("2026-11-26T20:00:00Z");
    expect((file.presales ?? []).filter((s) => s.cinemaId === "filmhouse-palms-lekki").map((s) => s.sourceId)).toEqual(["filmhouse-checked", "filmhouse-checked"]);
  });

  it("gives way once it is two Lagos days old to a source that read the cinema since", () => {
    const { file, log } = build("2026-11-27T08:00:00Z");
    expect(brief(file.presales ?? [])).toEqual([
      ["filmhouse-palms-lekki", "2026-12-18T16:45:00Z", "lagocine", "2D", false],
      ["genesis-lekki", "2026-12-18T18:00:00Z", "lagocine", null, false],
      ["filmhouse-landmark", "2026-12-18T18:30:00Z", "lagocine", "MX4D", false],
      ["filmhouse-palms-lekki", "2026-12-18T19:40:00Z", "lagocine", "2D", false],
      ["filmhouse-palms-lekki", "2026-12-19T20:00:00Z", "filmhouse-checked", null, false],
    ]);
    expect(log).toContain("filmhouse-checked: set aside 1 showing where another source read the cinema since; checked 2 days ago");
  });

  it("still leads when old if the other source's times are older still (its reads kept from a failing run)", () => {
    const { file } = build("2026-11-28T08:00:00Z", CHECKED, "2026-11-24T05:00:00Z");
    expect((file.presales ?? []).filter((s) => s.cinemaId.startsWith("filmhouse")).map((s) => [s.cinemaId, s.startsAt, s.sourceId])).toEqual([
      ["filmhouse-palms-lekki", "2026-12-18T19:40:00Z", "filmhouse-checked"],
      ["filmhouse-palms-lekki", "2026-12-19T20:00:00Z", "filmhouse-checked"],
    ]);
  });
});
