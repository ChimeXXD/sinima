import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { POSTER_SIZES, posterSrc, posterSrcSet, TMDB_IMAGES } from "@/lib/data/posters";

// Posters come through Sinima's own address on Vercel (D-113): some networks can't reach TMDB's
// image server, and a phone on one showed Safari's broken-image icon on every card.
const vercel = JSON.parse(readFileSync(join(import.meta.dirname, "../../../../vercel.json"), "utf8")) as { rewrites: { source: string; destination: string }[] };

describe("poster addresses (D-113)", () => {
  it("builds a poster's address from a base, a size and TMDB's path", () => {
    expect(posterSrc("w342", "/ea2IOcZnkRJfwZUmTJBqbvgQAgF.jpg", "/poster/")).toBe("/poster/w342/ea2IOcZnkRJfwZUmTJBqbvgQAgF.jpg");
    expect(posterSrc("w154", "/a.jpg", TMDB_IMAGES)).toBe("https://image.tmdb.org/t/p/w154/a.jpg");
  });

  it("builds a 1x and 2x srcSet", () => {
    expect(posterSrcSet("w154", "w342", "/a.jpg", "/poster/")).toBe("/poster/w154/a.jpg 1x, /poster/w342/a.jpg 2x");
  });

  it("goes to TMDB directly off Vercel (dev, tests), where there is no rewrite", () => {
    expect(posterSrc("w500", "/a.jpg")).toBe("https://image.tmdb.org/t/p/w500/a.jpg");
  });

  it("has a Vercel rewrite from /poster/ to TMDB for every size the app asks for, and no other", () => {
    const rule = vercel.rewrites.find((r) => r.source.startsWith("/poster/"));
    expect(rule?.destination).toBe("https://image.tmdb.org/t/p/:size/:file");
    expect(rule?.source).toBe(`/poster/:size(${POSTER_SIZES.join("|")})/:file`);
  });
});
