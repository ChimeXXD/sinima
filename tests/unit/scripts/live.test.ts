import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIVE_DIR, liveBuildFiles, READERS, refreshLive } from "../../../scripts/live.ts";
import { PageError } from "../../../scripts/sources/polite.ts";
import type { ShowtimesFile } from "@/lib/data/types";

// Live data (D-116): the cleared sources that have a reader, read today, written to data/live/ for
// the scheduled job to commit. The day page saved on 11 Nov stands in for Lagocine here.
const root = join(import.meta.dirname, "../../..");
const dayPage = readFileSync(join(root, "tests/fixtures/lagocine/2026-11-11-day.html"), "utf8");
const NOW = "2026-11-11T07:00:00Z"; // 08:00 in Lagos
// Only Lagocine's reader, so these tests read nothing but the saved day page (the other readers are
// tested on their own pages in tests/unit/scripts/sources/).
const LAGOCINE_ONLY = { lagocine: READERS.lagocine! };

// Lagocine's cinemas as on 17 Nov (D-122), before the script-built sites got their own readers
// (D-125). The tests of how a run treats a source keep these, so the saved day page still has
// plenty of their showings as each cinema leaves Lagocine for its own reader.
const LAGOCINE_ON_17_NOV = [
  "filmhouse-lekki-imax", "filmhouse-surulere", "filmhouse-circle-mall", "filmhouse-ikota", "filmhouse-palms-lekki", "filmhouse-oniru", "filmhouse-landmark",
  "ebonylife-vi", "filmworld-idimu", "magnificent-ikorodu-road", "ozone-yaba", "sky-sangotedo", "thc-agege", "viva-ikeja",
];

/** A copy of data/ in which Lagocine feeds `cinemaIds`. */
function rootWithLagocine(cinemaIds = LAGOCINE_ON_17_NOV): string {
  const dir = mkdtempSync(join(tmpdir(), "sinima-feeds-"));
  mkdirSync(join(dir, "data"));
  for (const name of ["cinemas.json", "credits.json", "credits-manual.json", "film-aliases.json"]) writeFileSync(join(dir, "data", name), readFileSync(join(root, "data", name)));
  const registry = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8")) as { sources: { id: string; cinemaIds: string[] }[] };
  registry.sources.find((s) => s.id === "lagocine")!.cinemaIds = cinemaIds;
  writeFileSync(join(dir, "data/sources.json"), JSON.stringify(registry));
  return dir;
}

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
  it("reads Lagocine's day pages for five days in Lagos, today first, nothing else (D-142)", async () => {
    const net = fakeLagocine();
    await refreshLive({ now: NOW, root, fetchText: net.fetchText, readers: LAGOCINE_ONLY });
    expect(net.asked).toEqual(["11", "12", "13", "14", "15"].map((d) => `https://lagocine.com/day/2026-11-${d}/`));
  });

  it("keeps the days Lagocine has published when a later day's page isn't there yet, and stops asking", async () => {
    const asked: string[] = [];
    const fetchText = async (url: string) => {
      asked.push(url);
      if (url.endsWith("/2026-11-14/")) throw new PageError(url, 404);
      return dayPage;
    };
    const pages = await READERS.lagocine!({ now: NOW, days: 5, fetchText, renderText: async () => "", pages: {} });
    expect(pages).toHaveLength(3);
    expect(asked).toHaveLength(4); // Sun 15 is not asked for once Sat 14 is missing
    expect(pages.flatMap((page) => page.notes ?? [])).toContainEqual(expect.stringMatching(/no day page for 2026-11-14 yet/));
  });

  it("treats a later Lagocine day page with no films yet as not published, not as a changed layout", async () => {
    const empty = "<html><body><main><p>No showtimes yet.</p></main></body></html>";
    const fetchText = async (url: string) => (url.endsWith("/2026-11-13/") ? empty : dayPage);
    const pages = await READERS.lagocine!({ now: NOW, days: 5, fetchText, renderText: async () => "", pages: {} });
    expect(pages).toHaveLength(2);
    await expect(READERS.lagocine!({ now: NOW, days: 5, fetchText: async () => empty, renderText: async () => "", pages: {} })).rejects.toThrow(/no film cards/);
  });

  it("still fails when today's Lagocine page is missing, or a later page refuses us", async () => {
    const missingToday = async (url: string) => {
      throw new PageError(url, 404);
    };
    await expect(READERS.lagocine!({ now: NOW, days: 5, fetchText: missingToday, renderText: async () => "", pages: {} })).rejects.toThrow(/404/);
    const refusedLater = async (url: string) => {
      if (url.endsWith("/2026-11-12/")) throw new PageError(url, 403);
      return dayPage;
    };
    await expect(READERS.lagocine!({ now: NOW, days: 5, fetchText: refusedLater, renderText: async () => "", pages: {} })).rejects.toThrow(/403/);
  });

  it("writes real data: not sample, read from a public page now, with the cinemas' own booking links", async () => {
    const { files } = await refreshLive({ now: NOW, root: rootWithLagocine(), fetchText: fakeLagocine().fetchText, readers: LAGOCINE_ONLY });
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
    const dir = rootWithLagocine(LAGOCINE_ON_17_NOV.filter((id) => id !== "ebonylife-vi"));

    const before = (await refreshLive({ now: NOW, root: rootWithLagocine(), fetchText: fakeLagocine().fetchText, readers: LAGOCINE_ONLY })).files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
    expect(before.showings.some((s) => s.cinemaId === "ebonylife-vi")).toBe(true); // the page lists EbonyLife
    const { files, log } = await refreshLive({ now: NOW, root: dir, fetchText: fakeLagocine().fetchText, readers: LAGOCINE_ONLY });
    const after = files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
    expect(after.showings.some((s) => s.cinemaId === "ebonylife-vi")).toBe(false);
    expect(log).toContainEqual(expect.stringMatching(/^lagocine: left out \d+ showings at cinemas it does not feed$/));
  });

  it("writes the page files too: all of the city and one per area", async () => {
    const { files } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: LAGOCINE_ONLY });
    expect(files.has(`${LIVE_DIR}/all.json`)).toBe(true);
    expect(files.has(`${LIVE_DIR}/area/lekki.json`)).toBe(true);
  });

  it("fails as a whole when a page can't be read, so the last good data stays", async () => {
    const failing = async () => {
      throw new Error("lagocine.com answered 503");
    };
    await expect(refreshLive({ now: NOW, root, fetchText: failing, readers: LAGOCINE_ONLY })).rejects.toThrow(/503/);
  });
});

describe("each cinema's own reader (D-76, D-122)", () => {
  it("reads Silverbird's Veezi pages, Genesis, Grand, Blue Pictures and the script-built sites from their own sites, beside Lagocine; and Filmhouse's home page for its featured films (D-131)", () => {
    expect(Object.keys(READERS).sort()).toEqual(["bluepictures", "ebonylife", "filmhouse-home", "genesis", "grand", "lagocine", "magnificent", "nova", "reachcinema", "silverbird", "thc", "viva"]);
  });

  it("gives the Reach Cinema readers each cinema's name on its page, from data/sources.json pageNames (D-125)", async () => {
    const given: Record<string, Record<string, string> | undefined> = {};
    const spy = (id: string) => async (input: { names?: Record<string, string> }) => {
      given[id] = input.names;
      return [{ showings: [{ cinemaId: "viva-ikeja", filmTitle: "Whalefall", rating: null, startsAt: "2026-11-11T18:30:00Z", format: null, bookingUrl: null }], builtAt: null }];
    };
    await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: { reachcinema: spy("reachcinema"), viva: spy("viva"), nova: spy("nova") } });
    // Ozone and Sky's own source feeds no cinema since Ozone refused us (D-127), so it is not run.
    expect(given).toEqual({
      viva: { "viva-ikeja": "Viva Ikeja" },
      nova: { "nova-lagos": "Nova Lagos", "nova-abuja": "Nova Abuja" },
    });
  });

  it("gives each reader its source's own pages for the cinemas it feeds, from data/sources.json", async () => {
    const given: Record<string, Record<string, string>> = {};
    const spy = (id: string) => async (input: { pages: Record<string, string> }) => {
      given[id] = input.pages;
      return [{ showings: id === "grand" ? [{ cinemaId: "grand-lekki", filmTitle: "Whalefall", rating: null, startsAt: "2026-11-11T18:30:00Z", format: null, bookingUrl: null }] : [], builtAt: null }];
    };
    await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: { silverbird: spy("silverbird"), grand: spy("grand") } });
    expect(given.grand).toEqual({ "grand-lekki": "https://grandcinemas.com.ng/" });
    expect(Object.keys(given.silverbird!)).toEqual(["silverbird-ikeja", "silverbird-galleria", "silverbird-sec", "silverbird-jabi"]);
    expect(given.silverbird!["silverbird-sec"]).toBe("https://ticketing.eu.veezi.com/sessions/?siteToken=ntfpkgyc0phrmzxb2ctk828vd4");
  });

  it("gives Genesis's reader each cinema's name in its booking links, from data/sources.json bookingSites (D-124)", async () => {
    let sites: Record<string, string> | undefined;
    const genesis = async (input: { sites?: Record<string, string> }) => {
      sites = input.sites;
      return [{ showings: [{ cinemaId: "genesis-festac", filmTitle: "Whalefall", rating: null, startsAt: "2026-11-11T18:30:00Z", format: null, bookingUrl: null }], builtAt: null }];
    };
    await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: { genesis } });
    expect(sites).toEqual({ "genesis-purple-lekki": "lekki-purple", "genesis-festac": "festival-mall-festac", "genesis-maryland": "maryland-mall-maryland", "genesis-ceddi-plaza": "ceddi-plaza-abuja" });
  });

  it("does not run a reader whose source feeds no cinema (Ozone and Sky back on Lagocine, D-127)", async () => {
    const ran: string[] = [];
    const spy = (id: string) => async () => {
      ran.push(id);
      return [{ showings: id === "grand" ? [{ cinemaId: "grand-lekki", filmTitle: "Whalefall", rating: null, startsAt: "2026-11-11T18:30:00Z", format: null, bookingUrl: null }] : [], builtAt: null }];
    };
    const { log } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: { reachcinema: spy("reachcinema"), grand: spy("grand") } });
    expect(ran).toEqual(["grand"]);
    expect(log.join("\n")).not.toMatch(/reachcinema: could not be read/);
  });

  it("puts what a reader left out in the run's log, under its source", async () => {
    const row = { cinemaId: "grand-lekki", filmTitle: "Whalefall", rating: null, startsAt: "2026-11-11T18:30:00Z", format: null, bookingUrl: null };
    const grand = async () => [{ showings: [row], builtAt: null, notes: ["https://example.test/film showed no times; that film has today's times only"] }];
    const { log } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: { grand } });
    expect(log).toContain("grand: https://example.test/film showed no times; that film has today's times only");
  });

  it("every cinema a reader feeds has its own page in the source's cinemaPages (Lagocine reads its day pages instead)", () => {
    const registry = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8")) as { sources: { id: string; cinemaIds: string[]; cinemaPages?: Record<string, string> }[] };
    for (const source of registry.sources.filter((s) => s.id !== "lagocine" && Object.hasOwn(READERS, s.id))) {
      expect(Object.keys(source.cinemaPages ?? {}), source.id).toEqual(source.cinemaIds);
    }
  });

  it("no cinema is fed by Lagocine and by its own reader at once, so no showing is listed twice", () => {
    const registry = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8")) as { sources: { id: string; status: string; cinemaIds: string[] }[] };
    const lagocine = new Set(registry.sources.find((s) => s.id === "lagocine")!.cinemaIds);
    const own = registry.sources.filter((s) => s.id !== "lagocine" && s.status === "cleared" && Object.hasOwn(READERS, s.id)).flatMap((s) => s.cinemaIds);
    expect(own.filter((id) => lagocine.has(id))).toEqual([]);
  });
});

describe("refreshLive when one source fails (D-119)", () => {
  // Two sources, as when each cinema has its own reader: Lagocine (no longer feeding Genesis) and
  // Genesis's own site, faked here with one showing at Festac.
  const GENESIS_ROW = { cinemaId: "genesis-festac", filmTitle: "Whalefall", rating: null, startsAt: "2026-11-11T18:30:00Z", format: null, bookingUrl: null };
  const readers = { ...LAGOCINE_ONLY, genesis: async () => [{ showings: [GENESIS_ROW], builtAt: null }] };
  const failing = async (url: string) => {
    throw new Error(`${new URL(url).host} answered 503`);
  };
  const setup = () => rootWithLagocine();
  const save = (dir: string, file: ShowtimesFile) => {
    mkdirSync(join(dir, LIVE_DIR), { recursive: true });
    writeFileSync(join(dir, LIVE_DIR, "showtimes.json"), JSON.stringify(file));
  };
  const main = (files: Map<string, ShowtimesFile>) => files.get(`${LIVE_DIR}/showtimes.json`) as ShowtimesFile;
  const LATER = "2026-11-11T15:00:00Z"; // 16:00 in Lagos, the same day

  it("keeps the failing source's last good showings, with the time they were read, beside the others' new ones", async () => {
    const dir = setup();
    const before = main((await refreshLive({ now: NOW, root: dir, fetchText: fakeLagocine().fetchText, readers })).files);
    save(dir, before);
    const { files, log } = await refreshLive({ now: LATER, root: dir, fetchText: failing, readers });
    const after = main(files);
    expect(log).toContain(`lagocine: could not be read (lagocine.com answered 503); kept its last good showings from ${NOW}`);
    // The same showings a good read at this hour would give (the validator drops the ones that have ended).
    const fresh = main((await refreshLive({ now: LATER, root: dir, fetchText: fakeLagocine().fetchText, readers })).files);
    const kept = after.showings.filter((s) => s.sourceId === "lagocine");
    expect(kept.length).toBeGreaterThan(100);
    expect(kept.map((s) => s.id)).toEqual(fresh.showings.filter((s) => s.sourceId === "lagocine").map((s) => s.id));
    expect(kept.every((s) => s.fetchedAt === NOW)).toBe(true);
    const viaBefore = new Map(before.showings.map((s) => [s.id, s.via]));
    expect(kept.every((s) => s.via === undefined || s.via?.fetchedAt === viaBefore.get(s.id)?.fetchedAt)).toBe(true);
    expect(kept.some((s) => s.via)).toBe(true);
    expect(after.sources.find((s) => s.id === "lagocine")).toMatchObject({ health: "failing", fetchedAt: NOW, lastOkAt: NOW });
    expect(after.sources.find((s) => s.id === "genesis")).toMatchObject({ health: "ok", fetchedAt: LATER });
    expect(after.showings.find((s) => s.sourceId === "genesis")).toMatchObject({ cinemaId: "genesis-festac", fetchedAt: LATER });

    // Failing again keeps the same showings and still says when they were read.
    save(dir, after);
    const EVEN_LATER = "2026-11-11T17:00:00Z";
    const again = main((await refreshLive({ now: EVEN_LATER, root: dir, fetchText: failing, readers })).files);
    const freshAgain = main((await refreshLive({ now: EVEN_LATER, root: setup(), fetchText: fakeLagocine().fetchText, readers })).files);
    const keptAgain = again.showings.filter((s) => s.sourceId === "lagocine");
    expect(keptAgain.map((s) => s.id)).toEqual(freshAgain.showings.filter((s) => s.sourceId === "lagocine").map((s) => s.id));
    expect(keptAgain.every((s) => s.fetchedAt === NOW)).toBe(true);
    expect(again.sources.find((s) => s.id === "lagocine")).toMatchObject({ health: "failing", fetchedAt: NOW, lastOkAt: NOW });
  });

  it("keeps only the cinemas the source still feeds, and drops days that are over", async () => {
    const dir = setup();
    save(dir, main((await refreshLive({ now: NOW, root: dir, fetchText: fakeLagocine().fetchText, readers })).files));
    const registry = JSON.parse(readFileSync(join(dir, "data/sources.json"), "utf8")) as { sources: { id: string; cinemaIds: string[] }[] };
    registry.sources.find((s) => s.id === "lagocine")!.cinemaIds = ["ebonylife-vi"];
    writeFileSync(join(dir, "data/sources.json"), JSON.stringify(registry));
    const same = main((await refreshLive({ now: LATER, root: dir, fetchText: failing, readers })).files);
    expect(new Set(same.showings.filter((s) => s.sourceId === "lagocine").map((s) => s.cinemaId))).toEqual(new Set(["ebonylife-vi"]));
    // Two days on, the saved day page's showings have all started: nothing of Lagocine's is left.
    const { files, log } = await refreshLive({ now: "2026-11-13T07:00:00Z", root: dir, fetchText: failing, readers });
    expect(main(files).showings.some((s) => s.sourceId === "lagocine")).toBe(false);
    expect(log).toContain("lagocine: could not be read (lagocine.com answered 503); no earlier showings to keep");
  });

  it("gives a failing source's cinemas no showings when there is no earlier data, and still writes the rest", async () => {
    const dir = setup();
    const { files, log } = await refreshLive({ now: LATER, root: dir, fetchText: failing, readers });
    expect(main(files).showings.map((s) => s.sourceId)).toEqual(["genesis"]);
    expect(log).toContain("lagocine: could not be read (lagocine.com answered 503); no earlier showings to keep");
  });

  it("fails as a whole when every source fails, even with earlier data to keep", async () => {
    const dir = setup();
    save(dir, main((await refreshLive({ now: NOW, root: dir, fetchText: fakeLagocine().fetchText, readers })).files));
    const broken = { ...readers, genesis: async () => failing("https://genesiscinemas.com/") };
    await expect(refreshLive({ now: LATER, root: dir, fetchText: failing, readers: broken })).rejects.toThrow(/lagocine\.com answered 503.*genesiscinemas\.com answered 503/s);
  });
});

describe("liveBuildFiles (the build step)", () => {
  // A live set read before "abuja-wuse" was added to data/cinemas.json.
  const live = async (dir: string) => {
    const { files } = await refreshLive({ now: NOW, root, fetchText: fakeLagocine().fetchText, readers: LAGOCINE_ONLY });
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
    // Each city's own file, the one its pages are built from (D-126).
    expect((files?.get("public/data/lagos.json") as ShowtimesFile).showings.length).toBe(main.showings.length);
    expect(files?.has("public/data/abuja.json")).toBe(true);
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

  it("keeps the credits a live film was read with when nothing is saved under its id (D-119)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sinima-live-"));
    await live(dir);
    const path = join(dir, LIVE_DIR, "showtimes.json");
    const read = JSON.parse(readFileSync(path, "utf8")) as ShowtimesFile;
    const film = read.films[0]!;
    writeFileSync(path, JSON.stringify({ ...read, films: read.films.map((f) => (f.id === film.id ? { ...f, tmdbId: 7, posterPath: "/kept.jpg" } : f)) }));
    writeFileSync(join(dir, "data/credits-manual.json"), JSON.stringify({ films: {} }));
    writeFileSync(join(dir, "data/credits.json"), JSON.stringify({ tmdb: {} }));
    const built = (liveBuildFiles(dir, NOW)?.get("data/showtimes.json") as ShowtimesFile).films.find((f) => f.id === film.id);
    expect(built).toMatchObject({ tmdbId: 7, posterPath: "/kept.jpg" });
  });

  it("gives nothing when there is no live data, so the caller makes sample data", () => {
    const dir = mkdtempSync(join(tmpdir(), "sinima-live-"));
    expect(liveBuildFiles(dir, NOW)).toBeNull();
  });
});
