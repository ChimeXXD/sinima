import { describe, expect, it } from "vitest";
import { properTitle } from "../../../scripts/titles.ts";

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
