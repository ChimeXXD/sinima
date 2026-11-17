import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import cinemasRegistry from "../../../data/cinemas.json";
import sourcesRegistry from "../../../data/sources.json";
import type { ShowtimesFile } from "@/lib/data/types";
import { lagosDayKey } from "@/lib/time/lagos";
import { LIVE_DIR, READERS, refreshLive } from "../../../scripts/live.ts";
import { refreshFromFixtures } from "../../../scripts/refresh.ts";
import type { ParsedPage } from "../../../scripts/sources/raw.ts";

// Filmhouse's home page as a source of featured films, never of showings (D-131): its own entry in
// data/sources.json (`filmhouse-home`, cleared: a public page, no CINEsync call), feeding no cinema's
// times, only the films featured for Filmhouse's 7. The Filmhouse source itself stays pending.

const root = join(import.meta.dirname, "../../..");
const dayPage = readFileSync(join(root, "tests/fixtures/lagocine/2026-11-11-day.html"), "utf8");
const NOW = "2026-11-11T07:00:00Z"; // 08:00 in Lagos
const LATER = "2026-11-11T15:00:00Z";
const NEXT_DAY = "2026-11-12T07:00:00Z";
const FILMHOUSE = sourcesRegistry.sources.find((s) => s.id === "filmhouse")!.cinemaIds;
const fetchText = async (url: string) => {
  if (url.startsWith("https://lagocine.com/day/")) return dayPage;
  throw new Error(`unexpected request ${url}`);
};
const featuredPage = (day: string): ParsedPage[] => [{ showings: [], builtAt: null, featured: { day, films: [{ title: "GHOST SOLDIER", runtimeMin: 90, rating: "PG 12" }, { title: "DEAR AJAYI", runtimeMin: 115, rating: "15" }] } }];
const readers = (home: () => Promise<ParsedPage[]>) => ({ lagocine: READERS.lagocine!, "filmhouse-home": home });
const main = (files: Map<string, ShowtimesFile>) => files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;

/** A copy of data/ to write live files into. */
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "sinima-featured-"));
  mkdirSync(join(dir, "data"));
  for (const name of ["cinemas.json", "sources.json", "credits.json", "credits-manual.json", "film-aliases.json"]) writeFileSync(join(dir, "data", name), readFileSync(join(root, "data", name)));
  return dir;
}

describe("the filmhouse-home source (D-131)", () => {
  it("is cleared, feeds no cinema's times and features films for Filmhouse's 7; Filmhouse's own source stays pending", () => {
    const home = sourcesRegistry.sources.find((s) => s.id === "filmhouse-home") as { status: string; method: string; homepage: string; cinemaIds: string[]; featuredFor?: string[] };
    expect(home).toMatchObject({ status: "cleared", method: "public-page", homepage: "https://www.filmhouseng.com/", cinemaIds: [] });
    expect(home.featuredFor).toEqual(FILMHOUSE);
    expect(sourcesRegistry.sources.find((s) => s.id === "filmhouse")!.status).toBe("pending");
    const ids = new Set(cinemasRegistry.cinemas.map((c) => c.id));
    expect(home.featuredFor!.filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe("refreshLive with Filmhouse's featured films", () => {
  it("writes the films beside the showings and makes no showing of them; a film no showing has keeps the page's title", async () => {
    const { files } = await refreshLive({ now: NOW, root: scratch(), fetchText, readers: readers(async () => featuredPage("2026-11-11")) });
    const file = main(files);
    // Lagocine's cinemas (Filmhouse's 7 and Filmworld) had neither film on 11 Nov, so the titles stay Filmhouse's own.
    expect(file.featured).toEqual([
      { sourceId: "filmhouse-home", cinemaIds: FILMHOUSE, day: "2026-11-11", fetchedAt: NOW, films: [{ id: "ghost-soldier", title: "GHOST SOLDIER" }, { id: "dear-ajayi", title: "DEAR AJAYI" }] },
    ]);
    expect(file.showings.some((s) => s.sourceId === "filmhouse-home")).toBe(false);
    expect(file.sources.find((s) => s.id === "filmhouse-home")).toMatchObject({ method: "public-page", status: "cleared", health: "ok", fetchedAt: NOW });
    // Each city's and area's file holds it for its own Filmhouse cinemas only.
    expect(files.get(`${LIVE_DIR}/lagos.json`)!.featured![0]!.cinemaIds).toEqual(FILMHOUSE);
    expect(files.get(`${LIVE_DIR}/area/surulere.json`)!.featured![0]!.cinemaIds).toEqual(["filmhouse-surulere"]);
    expect("featured" in files.get(`${LIVE_DIR}/abuja.json`)!).toBe(false);
    expect("featured" in files.get(`${LIVE_DIR}/area/ikeja.json`)!).toBe(false);
  });

  it("keeps the last good list for the rest of its day when the page can't be read (D-119), and lets it go the next day", async () => {
    const dir = scratch();
    const save = (file: ShowtimesFile) => (mkdirSync(join(dir, LIVE_DIR), { recursive: true }), writeFileSync(join(dir, LIVE_DIR, "showtimes.json"), JSON.stringify(file)));
    save(main((await refreshLive({ now: NOW, root: dir, fetchText, readers: readers(async () => featuredPage("2026-11-11")) })).files));
    const broken = readers(async () => {
      throw new Error("www.filmhouseng.com answered 503");
    });
    const later = await refreshLive({ now: LATER, root: dir, fetchText, readers: broken });
    expect(later.log).toContain(`filmhouse-home: could not be read (www.filmhouseng.com answered 503); kept its last good featured films from ${NOW}`);
    expect(main(later.files).featured).toEqual([expect.objectContaining({ day: "2026-11-11", fetchedAt: NOW, films: [{ id: "ghost-soldier", title: "GHOST SOLDIER" }, { id: "dear-ajayi", title: "DEAR AJAYI" }] })]);
    expect(main(later.files).sources.find((s) => s.id === "filmhouse-home")).toMatchObject({ health: "failing", fetchedAt: NOW, lastOkAt: NOW });

    save(main(later.files));
    const next = await refreshLive({ now: NEXT_DAY, root: dir, fetchText, readers: broken });
    expect(next.log).toContain("filmhouse-home: could not be read (www.filmhouseng.com answered 503); no earlier showings to keep");
    expect("featured" in main(next.files)).toBe(false);
  });
});

describe("refresh --fixtures with Filmhouse's saved home page", () => {
  const now = "2026-11-19T23:30:00Z"; // 00:30 on Fri 20 Nov in Lagos
  const { files } = refreshFromFixtures({ now, root });
  const lagos = files.get("public/data/lagos.json") as ShowtimesFile;

  it("features the films the page had on for the day it was saved, moved onto today (D-20), matched to the showings' films and titles (D-119)", () => {
    expect(lagos.featured).toEqual([
      {
        sourceId: "filmhouse-home", cinemaIds: FILMHOUSE, day: lagosDayKey(now), fetchedAt: "2026-11-17T15:59:08Z",
        films: [{ id: "ghost-soldier", title: "Ghost Soldier" }, { id: "how-to-rob-a-bank", title: "How to Rob a Bank" }, { id: "five-figurines", title: "Five Figurines" }, { id: "dear-ajayi", title: "Dear Ajayi" }],
      },
    ]);
    expect(lagos.sources.find((s) => s.id === "filmhouse-home")).toMatchObject({ method: "fixture" });
  });

  it("leaves Filmhouse Palms Lekki out of the 11 Nov Lagocine sample, so the sample has a Filmhouse cinema with no times, as all 7 had live on 17 Nov", () => {
    const timed = new Set(lagos.showings.map((s) => s.cinemaId));
    expect(FILMHOUSE.filter((id) => !timed.has(id))).toEqual(["filmhouse-palms-lekki"]);
  });
});
