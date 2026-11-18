import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sourcesRegistry from "../../../data/sources.json";
import type { ShowtimesFile } from "@/lib/data/types";
import { sampleDay } from "../../../scripts/coming.ts";
import { LIVE_DIR, READERS, refreshLive } from "../../../scripts/live.ts";
import { laterDays, splitByArea } from "../../../scripts/pipeline.ts";
import { refreshFromFixtures } from "../../../scripts/refresh.ts";
import type { ComingFilm, ParsedPage } from "../../../scripts/sources/raw.ts";

// Coming films (D-144, D-151) from Filmhouse's home page, carried by the pipeline beside the
// showings: one entry per film with the sinima's first date, for the cinemas the page speaks for.

const root = join(import.meta.dirname, "../../..");
const dayPage = readFileSync(join(root, "tests/fixtures/lagocine/2026-11-11-day.html"), "utf8");
const NOW = "2026-11-11T07:00:00Z"; // 08:00 in Lagos
const LATER = "2026-11-11T15:00:00Z";
const NEXT_DAY = "2026-11-12T07:00:00Z";
const FILMHOUSE = sourcesRegistry.sources.find((s) => s.id === "filmhouse-home")!.featuredFor!;
const fetchText = async (url: string) => {
  if (url.startsWith("https://lagocine.com/day/")) return dayPage;
  throw new Error(`unexpected request ${url}`);
};
const COMING: ComingFilm[] = [
  { title: "AVENGERS: DOOMSDAY", firstDay: "2026-12-18", rating: "PG-13" },
  { title: "THE FOUR", firstDay: null, rating: null },
  { title: "DUNE : PART THREE", firstDay: "2026-12-18", rating: null },
  { title: "Tomorrow's Film", firstDay: "2026-11-12", rating: null },
];
const homePage = (coming = COMING): ParsedPage[] => [{ showings: [], builtAt: null, featured: { day: "2026-11-11", films: [] }, coming }];
const readers = (home: () => Promise<ParsedPage[]>) => ({ lagocine: READERS.lagocine!, "filmhouse-home": home });
const main = (files: Map<string, ShowtimesFile>) => files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
const entry = (filmId: string, firstDay: string | null, fetchedAt = NOW, cinemaIds = FILMHOUSE) => ({ sourceId: "filmhouse-home", filmId, firstDay, cinemaIds, fetchedAt });

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "sinima-coming-"));
  mkdirSync(join(dir, "data"));
  for (const name of ["cinemas.json", "sources.json", "credits.json", "credits-manual.json", "film-aliases.json"]) writeFileSync(join(dir, "data", name), readFileSync(join(root, "data", name)));
  return dir;
}

describe("refreshLive with Filmhouse's coming films", () => {
  it("lists each coming film once, by first date (no date last), for Filmhouse's 7, and puts each film in `films` with its id matched (D-119)", async () => {
    const file = main((await refreshLive({ now: NOW, root: scratch(), fetchText, readers: readers(async () => homePage()) })).files);
    expect(file.coming).toEqual([
      entry("tomorrows-film", "2026-11-12"),
      entry("avengers-doomsday", "2026-12-18"),
      entry("dune-part-three", "2026-12-18"),
      entry("the-four", null),
    ]);
    const films = new Map(file.films.map((film) => [film.id, film]));
    // The sinima's rating; the title as the page writes it, without the space before a colon.
    expect(films.get("avengers-doomsday")).toMatchObject({ title: "AVENGERS: DOOMSDAY", rating: "PG-13", runtimeMin: null, origin: null });
    expect(films.get("dune-part-three")).toMatchObject({ title: "DUNE: PART THREE", rating: null });
    expect(file.showings.some((s) => s.sourceId === "filmhouse-home")).toBe(false);
  });

  it("joins a coming film to the showings' film of the same title, keeping its id and title", async () => {
    const shown = main((await refreshLive({ now: NOW, root: scratch(), fetchText, readers: readers(async () => homePage([])) })).files).films[0]!;
    const shouting = { title: shown.title.toUpperCase(), firstDay: "2026-12-01", rating: null };
    const file = main((await refreshLive({ now: NOW, root: scratch(), fetchText, readers: readers(async () => homePage([shouting])) })).files);
    expect(file.coming).toEqual([entry(shown.id, "2026-12-01")]);
    expect(file.films.find((film) => film.id === shown.id)!.title).toBe(shown.title);
  });

  it("cuts the list per city and per area like featured films, and leaves it out of the later day files", async () => {
    const { files } = await refreshLive({ now: NOW, root: scratch(), fetchText, readers: readers(async () => homePage()) });
    expect(files.get(`${LIVE_DIR}/lagos.json`)!.coming).toHaveLength(4);
    expect(files.get(`${LIVE_DIR}/area/surulere.json`)!.coming!.map((c) => c.cinemaIds)).toEqual([["filmhouse-surulere"], ["filmhouse-surulere"], ["filmhouse-surulere"], ["filmhouse-surulere"]]);
    expect(files.get(`${LIVE_DIR}/area/surulere.json`)!.films.map((f) => f.id)).toEqual(expect.arrayContaining(["avengers-doomsday", "the-four"]));
    for (const path of [`${LIVE_DIR}/abuja.json`, `${LIVE_DIR}/area/ikeja.json`]) expect("coming" in files.get(path)!).toBe(false);
    expect(files.get(`${LIVE_DIR}/abuja.json`)!.films.map((f) => f.id)).not.toContain("avengers-doomsday");
    // The 11 Nov page holds one day, so a showing is copied onto the 13th to make a later day.
    const whole = main(files);
    const later = laterDays({ ...whole, showings: [...whole.showings, { ...whole.showings[0]!, id: "copy", startsAt: "2026-11-13T18:00:00Z" }] }, NOW);
    expect(later.size).toBeGreaterThan(0);
    for (const day of later.values()) {
      expect("coming" in day).toBe(false);
      expect(day.films.map((f) => f.id)).not.toContain("avengers-doomsday");
    }
  });

  it("drops from the page files a film whose first date has come by the build's today", async () => {
    const file = main((await refreshLive({ now: NOW, root: scratch(), fetchText, readers: readers(async () => homePage()) })).files);
    const all = splitByArea(file, [], NEXT_DAY).get("all")!;
    expect(all.coming!.map((c) => c.filmId)).toEqual(["avengers-doomsday", "dune-part-three", "the-four"]);
    expect(all.films.map((f) => f.id)).not.toContain("tomorrows-film");
  });

  it("keeps the last good list when the page can't be read (D-119), each film only while its date is still ahead", async () => {
    const dir = scratch();
    const save = (file: ShowtimesFile) => (mkdirSync(join(dir, LIVE_DIR), { recursive: true }), writeFileSync(join(dir, LIVE_DIR, "showtimes.json"), JSON.stringify(file)));
    save(main((await refreshLive({ now: NOW, root: dir, fetchText, readers: readers(async () => homePage()) })).files));
    const broken = readers(async () => {
      throw new Error("www.filmhouseng.com answered 503");
    });
    const later = await refreshLive({ now: LATER, root: dir, fetchText, readers: broken });
    expect(main(later.files).coming).toEqual([entry("tomorrows-film", "2026-11-12"), entry("avengers-doomsday", "2026-12-18"), entry("dune-part-three", "2026-12-18"), entry("the-four", null)]);
    expect(main(later.files).films.find((f) => f.id === "dune-part-three")).toMatchObject({ title: "DUNE: PART THREE" });
    expect(main(later.files).sources.find((s) => s.id === "filmhouse-home")).toMatchObject({ health: "failing", fetchedAt: NOW });

    save(main(later.files));
    const next = await refreshLive({ now: NEXT_DAY, root: dir, fetchText, readers: broken });
    expect(next.log).toContain(`filmhouse-home: could not be read (www.filmhouseng.com answered 503); kept its last good coming films from ${NOW}`);
    expect(main(next.files).coming!.map((c) => c.filmId)).toEqual(["avengers-doomsday", "dune-part-three", "the-four"]);
  });
});

describe("sampleDay: a coming film's date in sample data (D-20)", () => {
  it("keeps its distance from the day the page was saved, counted from today in Lagos", () => {
    expect(sampleDay("2026-12-18", "2026-11-17", "2026-11-18T07:00:00Z")).toBe("2026-12-19"); // 31 days after the sample's today
    expect(sampleDay("2026-11-20", "2026-11-17", "2026-11-18T07:00:00Z")).toBe("2026-11-21");
    expect(sampleDay("2026-12-25", "2026-11-17", "2026-12-30T23:30:00Z")).toBe("2027-02-07"); // 00:30 on 31 Dec in Lagos
    expect(sampleDay(null, "2026-11-17", "2026-11-18T07:00:00Z")).toBeNull();
  });
});

describe("refresh --fixtures with Filmhouse's saved home page", () => {
  const now = "2026-11-18T07:00:00Z";
  const { files } = refreshFromFixtures({ now, root });
  const lagos = files.get("public/data/lagos.json") as ShowtimesFile;

  it("lists the five banner films dated after the save day, each moved to keep its distance from it, and Abuja none", () => {
    const saved = "2026-11-17T15:59:08Z";
    expect(lagos.coming).toEqual([
      entry("the-hunger-games-sunrise-on-the-reaping", "2026-11-21", saved),
      entry("the-four", "2026-12-12", saved),
      entry("dune-part-three", "2026-12-19", saved),
      entry("avengers-doomsday", "2026-12-19", saved),
      entry("jumanji-open-world", "2026-12-26", saved),
    ]);
    expect(lagos.films.find((f) => f.id === "dune-part-three")!.title).toBe("DUNE: PART THREE");
    expect("coming" in (files.get("public/data/abuja.json") as ShowtimesFile)).toBe(false);
  });
});
