import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { properTitle, titleLookup } from "../../../scripts/titles.ts";

// A film's title (D-152c): TMDB's spelling replaces a sinima's all-capitals one once TMDB has matched the film.
describe("properTitle", () => {
  it("takes TMDB's title when the sinima's is all capitals", () => {
    expect(properTitle("AVENGERS: DOOMSDAY", "Avengers: Doomsday")).toBe("Avengers: Doomsday");
    expect(properTitle("DUNE: PART THREE", "Dune: Part Three")).toBe("Dune: Part Three");
  });

  it("keeps the sinima's title when it is already written in mixed case, or TMDB has no match", () => {
    expect(properTitle("Agbara Nla: The Return", "Agbara Nla - The Return")).toBe("Agbara Nla: The Return");
    expect(properTitle("THE FOUR", undefined)).toBe("THE FOUR");
  });

  it("keeps a title with no letters to judge (digits only)", () => {
    expect(properTitle("1917", "1917: Remastered")).toBe("1917");
  });
});

// D-159: a film TMDB can't match yet (Funke Akindele's "THE FOUR") gets its proper title by hand,
// from data/film-titles.json, ahead of TMDB's.
describe("titleLookup", () => {
  const root = mkdtempSync(join(tmpdir(), "sinima-titles-"));
  mkdirSync(join(root, "data"));
  writeFileSync(join(root, "data/credits.json"), JSON.stringify({ tmdb: { "dune-part-three": { tmdbTitle: "Dune: Part Three" }, "the-four": { tmdbTitle: "The Four (2026 TV)" } } }));
  writeFileSync(join(root, "data/film-titles.json"), JSON.stringify({ about: "test", titles: { "the-four": "The Four" } }));
  const titleFor = titleLookup(root);
  const made = [root];
  afterAll(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

  it("gives the hand-kept title first, then TMDB's, then none", () => {
    expect(titleFor("the-four")).toBe("The Four");
    expect(titleFor("dune-part-three")).toBe("Dune: Part Three");
    expect(titleFor("unknown")).toBeUndefined();
    expect(properTitle("THE FOUR", titleFor("the-four"))).toBe("The Four");
  });

  it("works with no hand-kept file", () => {
    const bare = mkdtempSync(join(tmpdir(), "sinima-titles-"));
    made.push(bare);
    expect(titleLookup(bare)("the-four")).toBeUndefined();
  });

  it("refuses a hand-kept title that is not a non-empty string", () => {
    const bad = mkdtempSync(join(tmpdir(), "sinima-titles-"));
    made.push(bad);
    mkdirSync(join(bad, "data"));
    writeFileSync(join(bad, "data/film-titles.json"), JSON.stringify({ titles: { "the-four": "" } }));
    expect(() => titleLookup(bad)).toThrow(/the-four/);
  });

  it("holds The Four in the repo's own file", () => {
    expect(titleLookup(join(import.meta.dirname, "../../.."))("the-four")).toBe("The Four");
  });
});
