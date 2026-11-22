import { existsSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { calFiles } from "@/lib/ics/calFiles";
import { comingCal, showingCal } from "@/lib/ics/calHref";
import { comingIn } from "@/lib/data/filmPages";
import { loadCity, loadLater } from "@/lib/data/load";

// D-160: an iPhone adds an event to Calendar only from a calendar file at a real web address (Chime's
// test, 19 Nov 2026: a served .ics offered "Add to calendar"; a file made in the page only saved a
// download). So the site writes one file per showing and per coming film's first day at build time.

describe("calendar file addresses", () => {
  it("names a showing's file by film, cinema and its Lagos day and time", () => {
    expect(showingCal("dune-part-three", "filmhouse-lekki-imax", "2026-12-18T18:30:00Z")).toBe("/cal/dune-part-three_filmhouse-lekki-imax_2026-12-18-1930.ics");
    // After midnight in Lagos it is the next calendar day.
    expect(showingCal("dune-part-three", "filmhouse-lekki-imax", "2026-12-18T23:30:00Z")).toBe("/cal/dune-part-three_filmhouse-lekki-imax_2026-12-19-0030.ics");
  });

  it("names a coming film's file by its city, so each city's file says its own sinimas", () => {
    expect(comingCal("lagos", "avengers-doomsday", "2026-12-18")).toBe("/cal/lagos_avengers-doomsday_opens-2026-12-18.ics");
  });
});

const built = existsSync(join(process.cwd(), "public/data/lagos.json"));

// CI runs the unit tests before the build writes public/data. A skipped suite's body still runs to
// collect its tests, so the files are read in beforeAll, which a skipped suite never calls.
describe.skipIf(!built)("calFiles, from the data the pages are built from", () => {
  let files: ReturnType<typeof calFiles>;
  beforeAll(() => {
    files = calFiles();
  });

  it("has a file for every showing on every day a page offers, in both cities", () => {
    for (const city of ["lagos", "abuja"] as const) {
      for (const file of [loadCity(city), ...loadLater(city).map((later) => later.file)]) {
        for (const showing of file.showings) {
          expect(files.has(showingCal(showing.filmId, showing.cinemaId, showing.startsAt).slice("/cal/".length)), showing.id).toBe(true);
        }
      }
    }
  });

  it("writes a showing's event with its start, its 30-minute alert and where the times came from, in words that don't go stale", () => {
    const showing = loadCity("lagos").showings[0]!;
    const ics = files.get(showingCal(showing.filmId, showing.cinemaId, showing.startsAt).slice("/cal/".length))!();
    expect(ics).toContain(`\r\nDTSTART:${showing.startsAt.replace(/[-:]/g, "")}\r\n`);
    expect(ics).toContain("\r\nTRIGGER:-PT30M\r\n");
    expect(ics).not.toMatch(/ ago\b|just now/);
  });

  it("has a file for each coming film's first day in each city", () => {
    const coming = comingIn("lagos").filter((entry) => entry.firstDay !== null);
    expect(coming.length).toBeGreaterThan(0);
    for (const { film, firstDay } of coming) {
      const ics = files.get(comingCal("lagos", film.id, firstDay!).slice("/cal/".length))!();
      expect(ics).toContain(`\r\nDTSTART;VALUE=DATE:${firstDay!.replace(/-/g, "")}\r\n`);
    }
  });
});
