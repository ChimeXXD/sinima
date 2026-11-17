import { describe, expect, it } from "vitest";
import { featuredLine, featuredTimes } from "@/lib/wording/featured";

// The line on a Filmhouse cinema with no times (D-131): the films its home page features today,
// in the page's words and ours, never "and N more" and never the whole programme.

describe("featuredLine", () => {
  const films = ["Ghost Soldier", "How to Rob a Bank", "Five Figurines", "Dear Ajayi"];
  it("names every film and the chain's home page, as a full sentence", () => {
    expect(featuredLine({ chain: "Filmhouse", films, day: "2026-11-17", today: true })).toBe("Filmhouse's home page features Ghost Soldier, How to Rob a Bank, Five Figurines and Dear Ajayi today.");
    expect(featuredLine({ chain: "Filmhouse", films: ["Ghost Soldier"], day: "2026-11-17", today: true })).toBe("Filmhouse's home page features Ghost Soldier today.");
  });
  it("gives the date before the page knows the time (rule 3)", () => {
    expect(featuredLine({ chain: "Filmhouse", films: films.slice(0, 2), day: "2026-11-17", today: null })).toBe("Filmhouse's home page features Ghost Soldier and How to Rob a Bank on Tue 17 Nov.");
  });
  it("says nothing with no films or on another day", () => {
    expect(featuredLine({ chain: "Filmhouse", films: [], day: "2026-11-17", today: true })).toBeNull();
    expect(featuredLine({ chain: "Filmhouse", films, day: "2026-11-17", today: false })).toBeNull();
  });
  it("sends you to the chain's own site for the times", () => {
    expect(featuredTimes("Filmhouse")).toBe("All times are on Filmhouse's site.");
  });
});
