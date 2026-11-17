import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { creditsLookup } from "../../../scripts/assemble.ts";
import { buildShowtimes, matchFilms } from "../../../scripts/pipeline.ts";

// One film, however each source writes its title (D-119): Veezi's "AGBARA NLA" and Lagocine's
// "Agbara Nla: The Return" are the same film, "Ikenga" and "Ikenga 2" are not.
const ids = (titles: string[], aliases: Record<string, string> = {}) => Object.fromEntries([...matchFilms(titles, aliases).films].map(([title, film]) => [title, film.id]));
const shown = (titles: string[], aliases: Record<string, string> = {}) => Object.fromEntries([...matchFilms(titles, aliases).films].map(([title, film]) => [title, film.title]));

describe("matchFilms", () => {
  it("merges titles that differ only in case, punctuation or white space", () => {
    expect(new Set(Object.values(ids(["Arnie & Barney", "ARNIE AND BARNEY", "Arnie  &  Barney "])))).toEqual(new Set(["arnie-and-barney"]));
  });

  it("merges a short title into the longer one that is it plus a subtitle, and shows the longer", () => {
    expect(ids(["AGBARA NLA", "Agbara Nla: The Return"])).toEqual({ "AGBARA NLA": "agbara-nla-the-return", "Agbara Nla: The Return": "agbara-nla-the-return" });
    expect(shown(["AGBARA NLA", "Agbara Nla: The Return"])["AGBARA NLA"]).toBe("Agbara Nla: The Return");
    expect(ids(["Ramayana", "Ramayana: Rise of a Legend"])).toEqual({ Ramayana: "ramayana-rise-of-a-legend", "Ramayana: Rise of a Legend": "ramayana-rise-of-a-legend" });
    expect(ids(["Spider-Man", "Spider-Man: Brand New Day"])).toEqual({ "Spider-Man": "spider-man-brand-new-day", "Spider-Man: Brand New Day": "spider-man-brand-new-day" });
  });

  it.each([" - ", " – ", " — "])("takes %j as a subtitle separator too", (separator) => {
    expect(ids(["Oloture", `Oloture${separator}The Journey`]).Oloture).toBe("oloture-the-journey");
  });

  it("never merges on a bare prefix", () => {
    expect(ids(["Ikenga", "Ikenga 2"])).toEqual({ Ikenga: "ikenga", "Ikenga 2": "ikenga-2" });
    expect(ids(["Spider", "Spider-Man: Brand New Day"]).Spider).toBe("spider");
    expect(ids(["The Cleaner", "The Cleaners: Reloaded"])["The Cleaner"]).toBe("the-cleaner");
  });

  it("finds the subtitle after any separator, and ignores a format at the end", () => {
    expect(ids(["Mission: Impossible", "Mission: Impossible - The Final Reckoning"])["Mission: Impossible"]).toBe("mission-impossible-the-final-reckoning");
    expect(ids(["Ramayana (IMAX)", "Ramayana: Rise of a Legend"])["Ramayana (IMAX)"]).toBe("ramayana-rise-of-a-legend");
  });

  it("leaves a short title alone when two different longer films start with it, and says so", () => {
    const { films, log } = matchFilms(["Avatar", "Avatar: Fire and Ash", "Avatar: The Way of Water"], {});
    expect(films.get("Avatar")?.id).toBe("avatar");
    expect(log).toEqual([expect.stringContaining('"Avatar"')]);
  });

  it("shows a title written in capitals only when no source writes it any other way", () => {
    expect(shown(["AGBARA NLA: THE RETURN", "Agbara Nla: The Return"])["AGBARA NLA: THE RETURN"]).toBe("Agbara Nla: The Return");
    expect(shown(["AGBARA NLA: THE RETURN", "Agbara Nla"])["Agbara Nla"]).toBe("AGBARA NLA: THE RETURN");
  });

  it("follows data/film-aliases.json, by the source's title or by the id it would make", () => {
    const aliases = { "Maybe Or Maybe Not": "maybe-maybe-not", "the-return-of-agbara": "agbara-nla-the-return" };
    const titles = ["Maybe… Maybe Not", "Maybe Or Maybe Not", "The Return of Agbara", "Agbara Nla: The Return"];
    expect(ids(titles, aliases)).toEqual({
      "Maybe… Maybe Not": "maybe-maybe-not", "Maybe Or Maybe Not": "maybe-maybe-not",
      "The Return of Agbara": "agbara-nla-the-return", "Agbara Nla: The Return": "agbara-nla-the-return",
    });
    // The shown title is the one whose own id is the alias's, when there is one.
    expect(shown(titles, aliases)["Maybe Or Maybe Not"]).toBe("Maybe… Maybe Not");
    expect(shown(titles, aliases)["The Return of Agbara"]).toBe("Agbara Nla: The Return");
  });

  it("keeps Ramayana at /film/ramayana through data/film-aliases.json, both spellings one film", () => {
    const file = JSON.parse(readFileSync(join(import.meta.dirname, "../../../data/film-aliases.json"), "utf8")) as { about: string; aliases: Record<string, string> };
    expect(file.about).toMatch(/D-119/);
    // D-122 adds the spellings cinemas' own sites use for two films Lagocine already lists.
    expect(file.aliases).toEqual({
      "ramayana-rise-of-a-legend": "ramayana",
      "issakaba-returns": "isakaba-the-returns",
      "issakaba-return": "isakaba-the-returns",
      "isakaba-return": "isakaba-the-returns",
      "tele-and-zikora": "tele-x-zikora",
    });
    const { films } = matchFilms(["Ramayana", "Ramayana: Rise of a Legend"], file.aliases);
    expect([...films.values()]).toEqual([{ id: "ramayana", title: "Ramayana" }, { id: "ramayana", title: "Ramayana" }]);
  });

  it("makes Genesis's, Veezi's, Blue Pictures' and Lagocine's spellings of Isakaba one film, and Tele & Zikora one (D-122)", () => {
    const file = JSON.parse(readFileSync(join(import.meta.dirname, "../../../data/film-aliases.json"), "utf8")) as { aliases: Record<string, string> };
    const { films } = matchFilms(["ISSAKABA RETURNS", "Issakaba Return", "Isakaba Return", "Isakaba: The Returns", "TELE & ZIKORA", "Tele X Zikora"], file.aliases);
    expect(new Set([...films.values()].map((film) => `${film.id} ${film.title}`))).toEqual(new Set(["isakaba-the-returns Isakaba: The Returns", "tele-x-zikora Tele X Zikora"]));
  });
});

describe("buildShowtimes: one film across sources", () => {
  const NOW = "2026-11-20T08:00:00Z";
  const source = (id: string) => ({ id, name: id, url: "https://example.com/", method: "fixture" as const, status: "cleared" as const, fetchedAt: NOW, lastOkAt: NOW, health: "ok" as const });
  const cinema = (id: string, sourceId: string) => ({ id, name: id, chain: id, area: "lekki", address: null, geo: null, website: null, sourceIds: [sourceId] });
  const row = (cinemaId: string, filmTitle: string, rating: string | null = null) => ({ cinemaId, filmTitle, rating, startsAt: "2026-11-20T18:30:00Z", format: null, bookingUrl: null });

  it("gives the Veezi and Lagocine rows of one film one id, the longer title's, with its credits", () => {
    const asked: string[] = [];
    const { file } = buildShowtimes({
      generatedAt: NOW, sources: [source("veezi"), source("lagocine")], cinemas: [cinema("a", "veezi"), cinema("b", "lagocine")],
      batches: [
        { sourceId: "veezi", fetchedAt: NOW, builtAt: null, through: false, showings: [row("a", "AGBARA NLA", "18")] },
        { sourceId: "lagocine", fetchedAt: NOW, builtAt: null, through: false, showings: [row("b", "Agbara Nla: The Return")] },
      ],
      creditsFor: (filmId) => (asked.push(filmId), filmId === "agbara-nla-the-return" ? { tmdbId: 7, runtimeMin: 120 } : undefined),
    });
    expect(file.films).toEqual([expect.objectContaining({ id: "agbara-nla-the-return", title: "Agbara Nla: The Return", rating: "18", tmdbId: 7 })]);
    expect(file.showings.map((s) => s.filmId)).toEqual(["agbara-nla-the-return", "agbara-nla-the-return"]);
    expect(asked).toEqual(["agbara-nla-the-return"]);
  });

  it("asks for credits under the film's id first, then under each spelling's own id", () => {
    const asked: string[][] = [];
    buildShowtimes({
      generatedAt: NOW, sources: [source("veezi"), source("lagocine")], cinemas: [cinema("a", "veezi"), cinema("b", "lagocine")],
      batches: [
        { sourceId: "veezi", fetchedAt: NOW, builtAt: null, through: false, showings: [row("a", "AGBARA NLA"), row("a", "Whalefall")] },
        { sourceId: "lagocine", fetchedAt: NOW, builtAt: null, through: false, showings: [row("b", "Agbara Nla: The Return")] },
      ],
      creditsFor: (filmId, spellings) => (asked.push([filmId, ...(spellings ?? [])]), undefined),
    });
    expect(asked).toEqual([["agbara-nla-the-return", "agbara-nla"], ["whalefall"]]);
  });

  it("uses the aliases it is given", () => {
    const { file } = buildShowtimes({
      generatedAt: NOW, sources: [source("s")], cinemas: [cinema("a", "s")], aliases: { "Maybe Or Maybe Not": "maybe-maybe-not" },
      batches: [{ sourceId: "s", fetchedAt: NOW, builtAt: null, through: false, showings: [row("a", "Maybe Or Maybe Not")] }],
    });
    expect(file.films.map((f) => [f.id, f.title])).toEqual([["maybe-maybe-not", "Maybe Or Maybe Not"]]);
  });
});

describe("creditsLookup across spellings (D-119)", () => {
  const tmdb = (tmdbId: number) => ({ tmdbId, runtimeMin: 155, posterPath: `/p${tmdbId}.jpg`, trailerKey: "abcdefghijk", keywordIds: [], checkedAt: "2026-11-16T00:00:00Z" });
  const project = (credits: Record<string, unknown>, manual: Record<string, unknown> = {}) => {
    const root = mkdtempSync(join(tmpdir(), "sinima-spell-"));
    mkdirSync(join(root, "data"));
    writeFileSync(join(root, "data/credits.json"), JSON.stringify({ tmdb: credits }));
    writeFileSync(join(root, "data/credits-manual.json"), JSON.stringify({ films: manual }));
    return root;
  };

  it("finds a poster saved under a spelling's id when the merged film has none of its own", () => {
    const lookup = creditsLookup(project({ "agbara-nla": tmdb(1792115) }));
    expect(lookup("agbara-nla-the-return", ["agbara-nla"])).toMatchObject({ tmdbId: 1792115, posterPath: "/p1792115.jpg", trailerKey: "abcdefghijk" });
    expect(lookup("agbara-nla-the-return")).toMatchObject({ tmdbId: null, posterPath: null });
  });

  it("prefers the merged film's own entry, and takes Chime's own credits entry under a spelling too", () => {
    const manual = { "agbara-nla": { during: "no", after: "yes", source: { name: "Seen in the cinema", url: "https://example.com/", checkedAt: "2026-11-16T09:00:00Z" } } };
    const lookup = creditsLookup(project({ "agbara-nla-the-return": tmdb(1), "agbara-nla": tmdb(2) }, manual));
    expect(lookup("agbara-nla-the-return", ["agbara-nla"])).toMatchObject({ tmdbId: 1 });
    expect(creditsLookup(project({}, manual))("agbara-nla-the-return", ["agbara-nla"])?.credits).toMatchObject({ after: "yes" });
  });

  it("keeps Chime's own entry under a spelling when TMDB's answer is under the merged film's id", () => {
    const manual = { "agbara-nla": { during: "no", after: "yes", source: { name: "Seen in the cinema", url: "https://example.com/", checkedAt: "2026-11-16T09:00:00Z" } } };
    const found = creditsLookup(project({ "agbara-nla-the-return": tmdb(1) }, manual))("agbara-nla-the-return", ["agbara-nla"]);
    expect(found).toMatchObject({ tmdbId: 1, posterPath: "/p1.jpg" });
    expect(found?.credits).toMatchObject({ after: "yes" });
  });

  it("with savedOnly, gives nothing for a film with nothing saved under any of its ids", () => {
    expect(creditsLookup(project({}), { savedOnly: true })("agbara-nla-the-return")).toBeUndefined();
    expect(creditsLookup(project({ "agbara-nla-the-return": tmdb(1) }), { savedOnly: true })("agbara-nla-the-return")).toMatchObject({ tmdbId: 1 });
  });
});
