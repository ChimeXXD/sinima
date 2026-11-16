import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIVE_DIR, liveBuildFiles, refreshLive } from "../../../scripts/live.ts";
import type { ShowtimesFile } from "@/lib/data/types";

// Live data (D-116): the cleared sources that have a reader, read today, written to data/live/ for
// the scheduled job to commit. The day page saved on 11 Nov stands in for Lagocine here.
const root = join(import.meta.dirname, "../../..");
const dayPage = readFileSync(join(root, "tests/fixtures/lagocine/2026-11-11-day.html"), "utf8");
const NOW = "2026-11-11T07:00:00Z"; // 08:00 in Lagos

function fakeLagocine() {
  const asked: string[] = [];
  const fetchText = async (url: string) => {
    asked.push(url);
    if (url.startsWith("https://lagocine.com/day/")) return dayPage;
    throw new Error(`unexpected request ${url}`);
  };
  return { asked, fetchText };
}

describe("refreshLive", () => {
  it("reads Lagocine's day pages for today and tomorrow in Lagos, nothing else", async () => {
    const net = fakeLagocine();
    await refreshLive({ now: NOW, root, fetchText: net.fetchText });
    expect(net.asked).toEqual(["https://lagocine.com/day/2026-11-11/", "https://lagocine.com/day/2026-11-12/"]);
  });

  it("writes real data: not sample, read from a public page now, with the cinemas' own booking links", async () => {
    const { files } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText });
    const all = files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
    expect(all.sample).toBe(false);
    expect(all.sources).toEqual([expect.objectContaining({ id: "lagocine", method: "public-page", fetchedAt: NOW, health: "ok" })]);
    expect(all.showings.length).toBeGreaterThan(100);
    const links = all.showings.map((s) => s.bookingUrl).filter((url): url is string => url !== null);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(new URL(link).host).not.toMatch(/lagocine/);
  });

  it("keeps only the cinemas data/sources.json gives Lagocine", async () => {
    // A copy of the registry in which Lagocine no longer feeds EbonyLife (as when its own reader is built).
    const dir = mkdtempSync(join(tmpdir(), "sinima-feeds-"));
    mkdirSync(join(dir, "data"));
    for (const name of ["cinemas.json", "credits.json", "credits-manual.json"]) writeFileSync(join(dir, "data", name), readFileSync(join(root, "data", name)));
    const registry = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8")) as { sources: { id: string; cinemaIds: string[] }[] };
    const lagocine = registry.sources.find((s) => s.id === "lagocine")!;
    lagocine.cinemaIds = lagocine.cinemaIds.filter((id) => id !== "ebonylife-vi");
    writeFileSync(join(dir, "data/sources.json"), JSON.stringify(registry));

    const before = (await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText })).files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
    expect(before.showings.some((s) => s.cinemaId === "ebonylife-vi")).toBe(true); // the page lists EbonyLife
    const { files, log } = await refreshLive({ now: NOW, root: dir, fetchText: fakeLagocine().fetchText });
    const after = files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
    expect(after.showings.some((s) => s.cinemaId === "ebonylife-vi")).toBe(false);
    expect(log).toContainEqual(expect.stringMatching(/^lagocine: left out \d+ showings at cinemas it does not feed$/));
  });

  it("writes the page files too: all of the city and one per area", async () => {
    const { files } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText });
    expect(files.has(`${LIVE_DIR}/all.json`)).toBe(true);
    expect(files.has(`${LIVE_DIR}/area/lekki.json`)).toBe(true);
  });

  it("fails as a whole when a page can't be read, so the last good data stays", async () => {
    const failing = async () => {
      throw new Error("lagocine.com answered 503");
    };
    await expect(refreshLive({ now: NOW, root, fetchText: failing })).rejects.toThrow(/503/);
  });
});

describe("liveBuildFiles (the build step)", () => {
  // A live set read before "abuja-wuse" was added to data/cinemas.json.
  const live = async (dir: string) => {
    const { files } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText });
    mkdirSync(join(dir, LIVE_DIR), { recursive: true });
    writeFileSync(join(dir, LIVE_DIR, "showtimes.json"), JSON.stringify(files.get(`${LIVE_DIR}/showtimes.json`)));
    const registry = JSON.parse(readFileSync(join(root, "data/cinemas.json"), "utf8")) as { areas: { slug: string }[] };
    mkdirSync(join(dir, "data"), { recursive: true });
    writeFileSync(join(dir, "data/cinemas.json"), JSON.stringify({ ...registry, areas: [...registry.areas, { slug: "abuja-wuse" }] }));
  };

  it("gives the build the committed live set and a page file for every area in today's registry", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sinima-live-"));
    await live(dir);
    const files = liveBuildFiles(dir, NOW);
    const main = files?.get("data/showtimes.json") as ShowtimesFile;
    expect(main.sample).toBe(false);
    expect((files?.get("public/data/all.json") as ShowtimesFile).showings.length).toBe(main.showings.length);
    expect((files?.get("public/data/area/lekki.json") as ShowtimesFile).showings.length).toBeGreaterThan(0);
    expect((files?.get("public/data/area/abuja-wuse.json") as ShowtimesFile).showings).toEqual([]);
  });

  it("puts today's credits.json on the live films, so a new poster or trailer shows without reading the site again (D-117)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sinima-live-"));
    await live(dir);
    const film = ((JSON.parse(readFileSync(join(dir, LIVE_DIR, "showtimes.json"), "utf8")) as ShowtimesFile).films[0])!;
    writeFileSync(join(dir, "data/credits-manual.json"), JSON.stringify({ films: {} }));
    writeFileSync(join(dir, "data/credits.json"), JSON.stringify({ tmdb: { [film.id]: { tmdbId: 42, runtimeMin: 101, posterPath: "/new.jpg", trailerKey: "newTrailer1", keywordIds: [], checkedAt: NOW } } }));
    const built = (liveBuildFiles(dir, NOW)?.get("data/showtimes.json") as ShowtimesFile).films.find((f) => f.id === film.id);
    expect(built).toMatchObject({ tmdbId: 42, runtimeMin: 101, posterPath: "/new.jpg", trailerKey: "newTrailer1" });
  });

  it("gives nothing when there is no live data, so the caller makes sample data", () => {
    const dir = mkdtempSync(join(tmpdir(), "sinima-live-"));
    expect(liveBuildFiles(dir, NOW)).toBeNull();
  });
});
