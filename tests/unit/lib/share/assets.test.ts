import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fontCodePoints, missingGlyphs, posterImage } from "@/lib/share/assets";

// What the share cards are drawn with (build time). A card never makes the build fetch a font, and a
// build that can't reach TMDB still finishes, with the no-poster face (D-149).

const font = (name: string) => readFileSync(join(import.meta.dirname, "../../../../assets/fonts", name));

describe("fontCodePoints reads a TrueType cmap", () => {
  it("finds every letter Urbanist has (491, as fontTools counts them)", () => {
    const points = fontCodePoints(font("Urbanist-Bold.ttf"));
    expect(points.size).toBe(491);
    for (const char of "AZaz09 :&'…éñ") expect(points.has(char.codePointAt(0)!)).toBe(true);
    expect(points.has("Ł".codePointAt(0)!)).toBe(false); // U+0141: not in Urbanist
  });

  it("reads Story Script too", () => {
    const points = fontCodePoints(font("StoryScript-Regular.ttf"));
    for (const char of "who's coming?tonight!") expect(points.has(char.codePointAt(0)!)).toBe(true);
  });
});

describe("missingGlyphs: the letters of a title the card font can't draw", () => {
  it("none for the titles showing (sample)", () => {
    for (const title of ["Ghost Soldier", "Maybe… Maybe Not", "Agbara Nla: The Return", "Alahun (The Weaver)", "Tele X Zikora", "Spider-Man: Brand New Day"]) expect(missingGlyphs(title)).toEqual([]);
  });

  it("names each missing letter once; spaces don't count", () => {
    expect(missingGlyphs("Łódź Łódź 🍿")).toEqual(["Ł", "🍿"]);
  });
});

describe("posterImage", () => {
  afterEach(() => vi.unstubAllGlobals());

  // Each test uses its own poster path: a path's answer is kept for the rest of the build.
  it("reads TMDB's w342 poster into a data URL, once for both cities' cards", async () => {
    const asked: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (asked.push(url), new Response(new Uint8Array([0xff, 0xd8, 0xff]), { headers: { "content-type": "image/jpeg" } }))));
    expect(await posterImage("/abc.jpg", "lagos/ghost-soldier")).toBe("data:image/jpeg;base64,/9j/");
    expect(await posterImage("/abc.jpg", "abuja/ghost-soldier")).toBe("data:image/jpeg;base64,/9j/");
    expect(asked).toEqual(["https://image.tmdb.org/t/p/w342/abc.jpg"]);
  });

  it("gives null, and says so in the log, when TMDB can't be reached or answers badly", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await posterImage("/unreachable.jpg", "lagos/ghost-soldier")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Not found", { status: 404, headers: { "content-type": "text/html" } })));
    expect(await posterImage("/missing.jpg", "lagos/ghost-soldier")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/share card: lagos\/ghost-soldier: TMDB poster not read \(fetch failed\)/);
    warn.mockRestore();
  });

  it("asks nothing for a film without a poster", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await posterImage(null, "lagos/loving-itohan")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
