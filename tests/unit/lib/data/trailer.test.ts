import { describe, expect, it } from "vitest";
import example from "../../../../docs/examples/showtimes-v1.example.json";
import type { ShowtimesFile } from "@/lib/data/types";
import { toListData } from "@/lib/data/listData";
import { validateShowtimes } from "@/lib/data/validate";
import { trailerLink } from "@/lib/wording/filmPage";

// Trailers (D-117): a YouTube key on a film becomes a "Watch the trailer" link on its page.
const withTrailer = (key: unknown) => {
  const file = structuredClone(example) as unknown as ShowtimesFile;
  (file.films[0] as Record<string, unknown>).trailerKey = key;
  return file;
};

describe("the validator and trailer keys", () => {
  it("keeps a YouTube video id", () => {
    const result = validateShowtimes(withTrailer("bKGxHflevuk"));
    expect(result.ok && result.file.films[0]?.trailerKey).toBe("bKGxHflevuk");
  });

  it("drops anything else to null and says so, because the key becomes part of a link", () => {
    const result = validateShowtimes(withTrailer("https://evil.example/x"));
    expect(result.ok && result.file.films[0]?.trailerKey).toBeNull();
    expect(result.ok && result.log.join("\n")).toMatch(/trailer/i);
  });
});

describe("toListData", () => {
  it("gives each film its trailer key, or null", () => {
    const data = toListData(validateShowtimesOk(withTrailer("bKGxHflevuk")));
    expect(data.films[0]?.trailer).toBe("bKGxHflevuk");
    expect(data.films.slice(1).every((film) => film.trailer === null)).toBe(true);
  });
});

describe("trailerLink", () => {
  it("opens the video on YouTube and names the film for screen readers", () => {
    expect(trailerLink("Sinners", "bKGxHflevuk")).toEqual({
      href: "https://www.youtube.com/watch?v=bKGxHflevuk",
      text: "Watch the trailer",
      more: " for Sinners on YouTube",
      label: "Watch the trailer for Sinners on YouTube",
    });
  });
});

function validateShowtimesOk(file: ShowtimesFile): ShowtimesFile {
  const result = validateShowtimes(file);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return result.file;
}
