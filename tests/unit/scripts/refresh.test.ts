import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import registry from "../../../data/cinemas.json";
import { validateShowtimes } from "@/lib/data/validate";
import type { CreditsInfo, ShowtimesFile } from "@/lib/data/types";
import { clock24 as clock, eveningDayKey, lagosDayKey } from "@/lib/time/lagos";
import { freshness } from "@/lib/wording/freshness";
import { buildShowtimes, filmIdFromTitle, titleFormat, toSampleDays } from "../../../scripts/pipeline";
import { DATA_FILE_LIMIT_KB, main, overBudget, pageLoads, refreshFromFixtures, writeFiles } from "../../../scripts/refresh";
import { parseLagocineDay } from "../../../scripts/sources/lagocine";

const root = join(import.meta.dirname, "../../..");
const dayFixture = parseLagocineDay(readFileSync(join(root, "tests/fixtures/lagocine/2026-11-11-day.html"), "utf8")).showings;

// Fri 20 Nov 2026, 00:30 in Lagos: nine days after the fixtures were saved, before any showing.
const EARLY = "2026-11-19T23:30:00Z";
// The same day at 19:00 in Lagos, when the day's earlier showings have ended.
const EVENING = "2026-11-20T18:00:00Z";
// The cinema's wall clock as "19:30" (clock), so the times sort as text (the screen's 7:30 PM would not, D-114).
const times = (file: ShowtimesFile, cinemaId: string, day: string) =>
  file.showings.filter((s) => s.cinemaId === cinemaId && lagosDayKey(s.startsAt) === day).map((s) => clock(s.startsAt)).sort();

describe("filmIdFromTitle", () => {
  it.each([
    ["Spider-Man: Brand New Day", "spider-man-brand-new-day"],
    ["Arnie & Barney", "arnie-and-barney"],
    ["Maybe… Maybe Not", "maybe-maybe-not"],
    ["The Secret Lives of Baba Segi's Wives", "the-secret-lives-of-baba-segis-wives"],
    ["Alahun (The Weaver)", "alahun-the-weaver"],
    ["AGBARA NLA", "agbara-nla"],
    ["Pokémon: Détective Pikachu", "pokemon-detective-pikachu"],
    ["Ramayana (IMAX)", "ramayana"],
    ["Ramayana (IMAX 2D)", "ramayana"],
    ["Avatar 3 [3D]", "avatar-3"],
    ["  Whalefall  ", "whalefall"],
  ])("%s -> %s", (title, id) => {
    expect(filmIdFromTitle(title)).toBe(id);
  });

  it("refuses a title with nothing to make an id from", () => {
    expect(() => filmIdFromTitle("???")).toThrow('Cannot make a film id from the title "???"');
  });
});

describe("titleFormat", () => {
  it.each([
    ["Ramayana (IMAX)", "IMAX"],
    ["Ramayana (imax 2d)", "IMAX 2D"],
    ["Avatar 3 [3D]", "3D"],
    ["Alahun (The Weaver)", null],
    ["Whalefall", null],
  ])("%s -> %s", (title, format) => {
    expect(titleFormat(title)).toBe(format);
  });

  it("keeps the format a title carried when the row gives none", () => {
    const cinema = { id: "a", name: "A", chain: "A", area: "lekki", address: null, geo: null, website: null, sourceIds: ["s"] };
    const source = { id: "s", name: "S", url: "https://example.com/", method: "fixture" as const, status: "pending" as const, fetchedAt: EARLY, lastOkAt: EARLY, health: "ok" as const };
    const row = (filmTitle: string, format: string | null) => ({ cinemaId: "a", filmTitle, rating: null, startsAt: EVENING, format, bookingUrl: null });
    const batch = { sourceId: "s", fetchedAt: EARLY, builtAt: null, through: false, showings: [row("Ramayana (IMAX)", null), row("Whalefall [3D]", "MX4D")] };
    const { file } = buildShowtimes({ generatedAt: EARLY, sources: [source], cinemas: [cinema], batches: [batch] });
    expect(file.showings.map((s) => [s.filmId, s.format])).toEqual([["ramayana", "IMAX"], ["whalefall", "MX4D"]]);
  });

  it("names the cinema's site only when one is on record, for a showing read through another listing", () => {
    const source = { id: "s", name: "S", url: "https://example.com/", method: "fixture" as const, status: "pending" as const, fetchedAt: EARLY, lastOkAt: EARLY, health: "ok" as const };
    const cinema = (id: string, website: string | null) => ({ id, name: id, chain: id.toUpperCase(), area: "lekki", address: null, geo: null, website, sourceIds: ["s"] });
    const row = (cinemaId: string) => ({ cinemaId, filmTitle: "Whalefall", rating: null, startsAt: EVENING, format: null, bookingUrl: null });
    const batch = { sourceId: "s", fetchedAt: EARLY, builtAt: null, through: true, showings: [row("a"), row("b")] };
    const { file } = buildShowtimes({ generatedAt: EARLY, sources: [source], cinemas: [cinema("a", "https://a.example/"), cinema("b", null)], batches: [batch] });
    expect(file.showings.find((s) => s.cinemaId === "a")).toMatchObject({ via: { name: "A's site", url: "https://a.example/" } });
    expect(file.showings.find((s) => s.cinemaId === "b")).not.toHaveProperty("via");
  });
});

describe("toSampleDays (D-20)", () => {
  const row = (cinemaId: string, startsAt: string) => ({ cinemaId, filmTitle: "Whalefall", rating: null, startsAt, format: null, bookingUrl: "https://example.com/book" });

  it("moves the saved day onto today and the day after onto tomorrow, keeping the wall-clock time", () => {
    const moved = toSampleDays([row("a", "2026-11-11T18:30:00Z"), row("a", "2026-11-12T09:40:00Z")], "2026-11-11", EVENING);
    expect(moved.map((r) => r.startsAt)).toEqual(["2026-11-20T18:30:00Z", "2026-11-21T09:40:00Z"]);
  });

  it("decides today in Lagos, not in UTC", () => {
    // 23:30 UTC on the 19th is already the 20th in Lagos.
    expect(toSampleDays([row("a", "2026-11-11T18:30:00Z")], "2026-11-11", EARLY)[0]?.startsAt).toBe("2026-11-20T18:30:00Z");
  });

  it("keeps the saved day and the next four on today and the next four (D-142), dropping later days and days before the saved day", () => {
    const moved = toSampleDays([row("a", "2026-12-04T17:00:00Z"), row("a", "2026-11-10T17:00:00Z"), row("a", "2026-11-11T17:00:00Z"), row("a", "2026-11-12T17:00:00Z"), row("a", "2026-11-14T17:00:00Z"), row("a", "2026-11-15T17:00:00Z"), row("a", "2026-11-16T17:00:00Z")], "2026-11-11", EVENING);
    expect(moved.map((r) => r.startsAt.slice(0, 10))).toEqual(["2026-11-20", "2026-11-21", "2026-11-23", "2026-11-24"]);
  });

  it("keeps the last day's shows after midnight with its evening (SPEC §3)", () => {
    // 00:30 in Lagos on the sixth saved day belongs to the fifth day's evening; 04:30 does not.
    const moved = toSampleDays([row("a", "2026-11-12T17:00:00Z"), row("a", "2026-11-15T23:30:00Z"), row("a", "2026-11-16T03:30:00Z")], "2026-11-11", EVENING);
    expect(moved.map((r) => r.startsAt)).toEqual(["2026-11-21T17:00:00Z", "2026-11-24T23:30:00Z"]);
  });

  it("repeats a cinema's saved day tomorrow only when the fixtures hold no tomorrow for it", () => {
    const moved = toSampleDays(
      [row("only-today", "2026-11-11T17:00:00Z"), row("both-days", "2026-11-11T17:00:00Z"), row("both-days", "2026-11-12T19:00:00Z")],
      "2026-11-11",
      EVENING,
    );
    const starts = (id: string) => moved.filter((r) => r.cinemaId === id).map((r) => r.startsAt);
    expect(starts("only-today")).toEqual(["2026-11-20T17:00:00Z", "2026-11-21T17:00:00Z"]);
    expect(starts("both-days")).toEqual(["2026-11-20T17:00:00Z", "2026-11-21T19:00:00Z"]);
  });

  it("does not take a show after midnight on the saved day's page for a saved tomorrow", () => {
    // 00:30 on the 12th is the end of the 11th's evening, so the cinema still needs its day repeated.
    const moved = toSampleDays([row("late", "2026-11-11T17:00:00Z"), row("late", "2026-11-11T23:30:00Z")], "2026-11-11", EVENING);
    expect(moved.map((r) => r.startsAt).sort()).toEqual(["2026-11-20T17:00:00Z", "2026-11-20T23:30:00Z", "2026-11-21T17:00:00Z"]);
  });

  it("removes booking links: they point at a session on the day the page was saved", () => {
    expect(toSampleDays([row("a", "2026-11-11T18:30:00Z")], "2026-11-11", EVENING).every((r) => r.bookingUrl === null)).toBe(true);
  });
});

describe("refresh --fixtures", () => {
  const early = refreshFromFixtures({ now: EARLY, root });
  const all = early.files.get("public/data/all.json") as ShowtimesFile;

  it("writes showtimes.json, all.json, one file per city and one per area, besides the later days' files (D-147)", () => {
    const expected = ["data/showtimes.json", "public/data/all.json", "public/data/lagos.json", "public/data/abuja.json", ...registry.areas.map((a) => `public/data/area/${a.slug}.json`)];
    expect([...early.files.keys()].filter((path) => !/\/\d{4}-\d{2}-\d{2}\.json$/.test(path)).sort()).toEqual(expected.sort());
    expect(registry.areas).toHaveLength(16); // 12 in Lagos, 4 in Abuja (D-120)
  });

  it("writes files that validate with nothing left to drop or repair", () => {
    for (const [path, file] of early.files) {
      const result = validateShowtimes(JSON.parse(JSON.stringify(file)));
      expect(result.ok, path).toBe(true);
      expect(result.ok && result.log, path).toEqual([]);
    }
  });

  it("marks every file as sample data from a fixture, and the rows say so", () => {
    for (const file of early.files.values()) {
      expect(file.sample).toBe(true);
      expect(file.sources.every((s) => s.method === "fixture")).toBe(true);
    }
    const showing = all.showings[0]!;
    const source = all.sources.find((s) => s.id === showing.sourceId)!;
    expect(freshness(source, showing.fetchedAt, EARLY, showing.via)).toEqual({
      band: "sample",
      text: "Sample data saved from Lagocine on 11 Nov",
      bookable: false,
    });
    expect(all.showings.every((s) => s.bookingUrl === null)).toBe(true);
  });

  it("dates every showing today or tomorrow in Lagos", () => {
    expect(new Set(all.showings.map((s) => lagosDayKey(s.startsAt)))).toEqual(new Set(["2026-11-20", "2026-11-21"]));
  });

  it("keeps each cinema's wall-clock times from the fixture (D-20)", () => {
    for (const cinemaId of new Set(dayFixture.map((s) => s.cinemaId))) {
      // Lagocine lists some Genesis showings two or three times over; each is one showing here.
      const saved = [...new Set(dayFixture.filter((s) => s.cinemaId === cinemaId).map((s) => `${s.filmTitle} ${clock(s.startsAt)}`))];
      // The sample leaves Filmhouse Palms Lekki's 2 out (tests/fixtures/index.json leaveOut, D-131).
      expect(times(all, cinemaId, "2026-11-20"), cinemaId).toEqual(cinemaId === "filmhouse-palms-lekki" ? [] : saved.map((s) => s.slice(-5)).sort());
    }
    expect(all.showings.filter((s) => s.sourceId === "lagocine" && lagosDayKey(s.startsAt) === "2026-11-20")).toHaveLength(294 - 2);
    // Lagocine writes Ramayana two ways; data/film-aliases.json keeps it one film at /film/ramayana (D-119).
    // Abuja's Veezi pages write "AGBARA NLA", Lagocine "Agbara Nla: The Return": one film (D-119, D-120).
    // 59 repeats on the day page, the same 59 again tomorrow, and Silverbird's 28 on both pages.
    expect(early.log).toEqual([
      'films: "Ramayana: Rise of a Legend" is shown as "Ramayana"',
      'films: "AGBARA NLA" is shown as "Agbara Nla: The Return"',
      "lagocine: 146 showings were listed more than once; kept one of each",
    ]);
  });

  it("uses Silverbird Ikeja's own saved tomorrow, and repeats the saved day for the other cinemas", () => {
    expect(times(all, "silverbird-ikeja", "2026-11-21")).toHaveLength(28);
    expect(times(all, "ebonylife-vi", "2026-11-21")).toEqual(times(all, "ebonylife-vi", "2026-11-20"));
    // Lagos's, then Abuja's two Silverbird pages: 30 + 30 at SEC, 27 + 24 at Jabi Lake Mall (D-120).
    // Lagocine's 294 less Palms Lekki's 2, left out of the sample (D-131).
    expect(all.showings).toHaveLength(292 + 28 + (292 - 28) + 30 + 30 + 27 + 24);
  });

  it("gives each showing its id, its film and its source through the cinema's own site", () => {
    const showing = all.showings.find((s) => s.cinemaId === "ebonylife-vi")!;
    expect(showing.id).toBe(`ebonylife-vi_${showing.filmId}_${showing.startsAt}`);
    // Each film's TMDB id and runtime come from data/credits.json, which changes weekly, so the
    // file itself is the expectation; a film it does not hold has neither.
    const credits = (JSON.parse(readFileSync(join(root, "data/credits.json"), "utf8")) as { tmdb: Record<string, { tmdbId: number; runtimeMin: number | null }> }).tmdb;
    for (const film of all.films) {
      const found = Object.hasOwn(credits, film.id) ? credits[film.id] : undefined;
      expect(film, film.id).toMatchObject({ origin: null, tmdbId: found?.tmdbId ?? null, runtimeMin: found?.runtimeMin ?? null });
    }
    expect(showing).toMatchObject({
      sourceId: "lagocine",
      fetchedAt: "2026-11-11T00:36:34Z",
      via: { name: "EbonyLife's site", url: "https://ebonylifecinemas.com/", fetchedAt: "2026-11-10T23:05:05Z" },
    });
    // Magnificent's own site has been on record since the 15 Nov audit (D-76), so Lagocine's row says it read there.
    expect(all.showings.find((s) => s.cinemaId === "magnificent-ikorodu-road")).toMatchObject({
      via: { name: "Magnificent's site", url: "https://magnificentcinemas.com/" },
    });
    // Lagos: 31 titles, 30 films: "Ramayana" and "Ramayana: Rise of a Legend" are one (D-119).
    // Abuja adds five films Lagos isn't showing (D-120).
    expect(new Set(all.showings.filter((s) => s.sourceId === "lagocine").map((s) => s.filmId)).size).toBe(30);
    expect(all.films).toHaveLength(35);
  });

  it("holds only one area's cinemas, showings, films and sources in an area file", () => {
    const ikeja = early.files.get("public/data/area/ikeja.json") as ShowtimesFile;
    expect(ikeja.cinemas.map((c) => c.id).sort()).toEqual(["silverbird-ikeja", "viva-ikeja"]);
    expect(new Set(ikeja.showings.map((s) => s.cinemaId))).toEqual(new Set(["silverbird-ikeja", "viva-ikeja"]));
    expect(ikeja.showings).toHaveLength(28 + 28 + 19 + 19);
    expect(ikeja.films.map((f) => f.id).sort()).toEqual([...new Set(ikeja.showings.map((s) => s.filmId))].sort());
    expect(ikeja.sources.map((s) => s.id)).toEqual(["lagocine"]);
    expect(ikeja.generatedAt).toBe(EARLY);
  });

  it("lists every cinema in the registry, with or without showings", () => {
    const everything = early.files.get("data/showtimes.json") as ShowtimesFile;
    expect(everything.cinemas).toHaveLength(registry.cinemas.length);
    expect(everything.cinemas.find((c) => c.id === "filmhouse-oniru")).toEqual({
      id: "filmhouse-oniru", name: "Filmhouse Oniru", chain: "Filmhouse", area: "victoria-island",
      address: registry.cinemas.find((c) => c.id === "filmhouse-oniru")?.address ?? null,
      geo: null, website: "https://filmhouseng.com/", bookingHost: "www.filmhouseng.com", sourceIds: ["lagocine"],
    });
  });

  it("leaves out showings that have ended by the time it runs", () => {
    const evening = refreshFromFixtures({ now: EVENING, root }).files.get("public/data/all.json") as ShowtimesFile;
    const today = evening.showings.filter((s) => lagosDayKey(s.startsAt) === "2026-11-20").map((s) => clock(s.startsAt)).sort();
    expect(today[0]! >= "17:30").toBe(true); // 19:00 less 90 min
    expect(evening.showings.length).toBeLessThan(588 + 111);
    expect(evening.showings.filter((s) => lagosDayKey(s.startsAt) === "2026-11-21")).toHaveLength(292 + 30 + 24); // Lagos (less Palms Lekki's 2, D-131), then Abuja (D-120)
  });

  // Abuja's sample times are Silverbird's two Veezi pages saved on 17 Nov (D-120): 30 and 27 on the
  // saved day, 30 and 24 the day after, moved onto today and tomorrow like Lagos's.
  it("holds Abuja's sample times from Silverbird's own Veezi pages, in Abuja's area files", () => {
    expect(times(all, "silverbird-sec", "2026-11-20")).toHaveLength(30);
    expect(times(all, "silverbird-sec", "2026-11-21")).toHaveLength(30);
    expect(times(all, "silverbird-jabi", "2026-11-20")).toHaveLength(27);
    expect(times(all, "silverbird-jabi", "2026-11-21")).toHaveLength(24);
    expect(times(all, "silverbird-jabi", "2026-11-20")[0]).toBe("10:05"); // Street Fighter, as saved
    const abuja = all.showings.filter((s) => s.cinemaId === "silverbird-sec" || s.cinemaId === "silverbird-jabi");
    expect(abuja.every((s) => s.sourceId === "silverbird" && s.fetchedAt === "2026-11-16T23:38:21Z" && s.bookingUrl === null && !s.via)).toBe(true);
    expect(all.sources.find((s) => s.id === "silverbird")).toMatchObject({ name: "Silverbird's Veezi page", method: "fixture" });
    const cbd = early.files.get("public/data/area/central-business-district.json") as ShowtimesFile;
    expect(new Set(cbd.showings.map((s) => s.cinemaId))).toEqual(new Set(["silverbird-sec"]));
    expect(cbd.cinemas.map((c) => c.id).sort()).toEqual(["genesis-ceddi-plaza", "silverbird-sec"]);
    expect((early.files.get("public/data/area/kuje.json") as ShowtimesFile).showings).toEqual([]);
  });

  it("keeps every file a page loads inside the data budget", () => {
    for (const [path, file] of early.files) {
      if (!pageLoads(path)) continue;
      const kb = gzipSync(JSON.stringify(file), { level: 9 }).length / 1024;
      expect(kb, path).toBeLessThanOrEqual(DATA_FILE_LIMIT_KB);
    }
    expect(overBudget(early.files)).toEqual([]);
  });

  // D-126: each city's pages are built from that city's file, so the budget is per city file;
  // all.json (both cities) is read only at build time, by About and the search index.
  it("cuts each city's file from the same days as all.json, with only that city's cinemas", () => {
    const lagos = early.files.get("public/data/lagos.json") as ShowtimesFile;
    const abuja = early.files.get("public/data/abuja.json") as ShowtimesFile;
    const areaCity = new Map(registry.areas.map((a) => [a.slug, a.city]));
    expect(lagos.cinemas.every((c) => areaCity.get(c.area) === "lagos")).toBe(true);
    expect(abuja.cinemas.every((c) => areaCity.get(c.area) === "abuja")).toBe(true);
    expect(lagos.showings.length + abuja.showings.length).toBe(all.showings.length);
    expect(abuja.showings.length).toBeGreaterThan(0);
    expect(new Set(abuja.films.map((f) => f.id))).toEqual(new Set(abuja.showings.map((s) => s.filmId)));
  });

  // D-147: days three to five are one file per city per day, fetched when a visitor picks the day.
  it("cuts each later day into its own file per city, holding only that day's showings there; none for a day nobody lists", () => {
    const dayFiles = [...early.files.keys()].filter((path) => /^public\/data\/(lagos|abuja)\/\d{4}-\d{2}-\d{2}\.json$/.test(path)).sort();
    expect(dayFiles.length).toBeGreaterThan(0);
    const later = ["2026-11-22", "2026-11-23", "2026-11-24"]; // Fri 20 is today: Sun to Tue
    for (const path of dayFiles) {
      const [, city, day] = /data\/(\w+)\/([\d-]+)\.json$/.exec(path)!;
      expect(later).toContain(day);
      const file = early.files.get(path) as ShowtimesFile;
      expect(file.showings.length, path).toBeGreaterThan(0);
      // A show after midnight stays with its evening (SPEC §3): a day runs to 04:00 the morning after.
      expect(file.showings.every((s) => eveningDayKey(s.startsAt) === day), path).toBe(true);
      const areaCity = new Map(registry.areas.map((a) => [a.slug, a.city]));
      expect(file.cinemas.every((c) => areaCity.get(c.area) === city), path).toBe(true);
      expect(file.featured ?? [], path).toEqual([]);
      expect(validateShowtimes(file).ok, path).toBe(true);
    }
    // The city files keep today and tomorrow only, as before.
    const lagos = early.files.get("public/data/lagos.json") as ShowtimesFile;
    expect(new Set(lagos.showings.map((s) => eveningDayKey(s.startsAt)))).toEqual(new Set(["2026-11-20", "2026-11-21"]));
  });

  it("budgets each file a page loads (each city's and each area's), and not all.json or showtimes.json", () => {
    expect(["public/data/lagos.json", "public/data/abuja.json", "public/data/area/lekki.json", "data/live/lagos.json", "data/live/area/jabi.json", "public/data/lagos/2026-11-22.json", "data/live/abuja/2026-11-23.json"].every(pageLoads)).toBe(true);
    expect(["public/data/all.json", "data/live/all.json", "data/showtimes.json", "data/live/showtimes.json"].some(pageLoads)).toBe(false);
    // A file too big for the budget: a city file over it stops the write; all.json over it does not.
    const big = (file: ShowtimesFile): ShowtimesFile => ({ ...file, showings: Array.from({ length: 30 }, () => file.showings).flat().map((s, i) => ({ ...s, id: `${s.id}-${i}`, bookingUrl: `https://example.com/${i}/${Math.random()}` })) });
    expect(overBudget(new Map([["public/data/lagos.json", big(all)]]))).toEqual(["public/data/lagos.json"]);
    expect(overBudget(new Map([["public/data/all.json", big(all)]]))).toEqual([]);
  });

  it("writes the files to disk, and only rewrites one whose content has changed", () => {
    const out = mkdtempSync(join(tmpdir(), "sinima-refresh-"));
    expect(writeFiles(early.files, out).written).toHaveLength(early.files.size);
    const onDisk = JSON.parse(readFileSync(join(out, "public/data/area/lekki.json"), "utf8")) as ShowtimesFile;
    expect(onDisk).toEqual(early.files.get("public/data/area/lekki.json"));
    // A minute later the showings are the same; only generatedAt differs, so nothing is rewritten.
    const later = refreshFromFixtures({ now: "2026-11-19T23:31:00Z", root });
    expect(writeFiles(later.files, out)).toEqual({ written: [], unchanged: early.files.size, removed: [] });
  });

  it("removes a later day's file once that day is no longer ahead, and nothing else in the folder", () => {
    const out = mkdtempSync(join(tmpdir(), "sinima-refresh-"));
    writeFiles(early.files, out);
    mkdirSync(join(out, "public/data/lagos"), { recursive: true });
    writeFileSync(join(out, "public/data/lagos/2026-11-01.json"), "{}");
    writeFileSync(join(out, "public/data/lagos/notes.txt"), "kept");
    expect(writeFiles(early.files, out).removed).toEqual(["public/data/lagos/2026-11-01.json"]);
    expect(existsSync(join(out, "public/data/lagos/2026-11-01.json"))).toBe(false);
    expect(existsSync(join(out, "public/data/lagos/notes.txt"))).toBe(true);
  });

  it("needs a mode: with none (--fixtures, --live or --build) it stops with an error", () => {
    expect(main([])).toBe(1);
  });

  it("refuses a --now that is missing or not a UTC time to the second, before reading anything", () => {
    expect(main(["--fixtures", "--now"])).toBe(1);
    expect(main(["--fixtures", "--now", "2026-11-20"])).toBe(1);
    expect(main(["--fixtures", "--now", "2026-11-20T18:00:00+01:00"])).toBe(1);
  });
});

describe("buildShowtimes: credits", () => {
  const source = { id: "lagocine", name: "Lagocine", url: "https://lagocine.com/", method: "fixture", status: "pending", fetchedAt: EARLY, lastOkAt: EARLY, health: "ok" } as const;
  const cinema = { id: "a", name: "A", chain: "A", area: "lekki", address: null, geo: null, website: null, sourceIds: ["lagocine"] };
  const row = (filmTitle: string) => ({ cinemaId: "a", filmTitle, rating: null, startsAt: "2026-11-20T18:30:00Z", format: null, bookingUrl: null });
  const stay: CreditsInfo = { during: "unknown", after: "yes", confidence: "confirmed", sources: [{ name: "TMDB", url: "https://www.themoviedb.org/movie/11", checkedAt: EARLY }], count: null };

  it("puts the TMDB id, runtime and credits answer on a film that has them, and leaves the rest unknown", () => {
    const { file } = buildShowtimes({
      generatedAt: EARLY, sources: [source], cinemas: [cinema],
      batches: [{ sourceId: "lagocine", fetchedAt: EARLY, builtAt: null, through: false, showings: [row("Whalefall"), row("Clayface")] }],
      creditsFor: (filmId) => (filmId === "whalefall" ? { tmdbId: 11, runtimeMin: 107, credits: stay } : undefined),
    });
    expect(file.films.find((f) => f.id === "whalefall")).toMatchObject({ tmdbId: 11, runtimeMin: 107, credits: stay });
    expect(file.films.find((f) => f.id === "clayface")).toMatchObject({ tmdbId: null, runtimeMin: null, credits: { after: "unknown", sources: [] } });
  });
});
