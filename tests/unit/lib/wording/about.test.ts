import { describe, expect, it } from "vitest";
import { ABOUT, STEPS, cityReadingLine, sourceStatus } from "@/lib/wording/about";

// Words on About (Figma 208:9122).

describe("sourceStatus", () => {
  it("says it as Figma does", () => {
    expect(sourceStatus({ kind: "asked", on: "2026-11-11" })).toBe("Permission asked 11 Nov");
    expect(sourceStatus({ kind: "unused" })).toBe("Not used yet");
    expect(sourceStatus({ kind: "used" })).toBe("In use");
  });
});

describe("fixed words", () => {
  it("the three steps", () => {
    expect(STEPS.map((step) => step.title)).toEqual(["We read each sinima's public listings", "Old times say so", "You book on the sinima's own site"]);
  });
  it("the title, the note and the footer", () => {
    expect(ABOUT.title).toBe("About Sinima");
    expect(ABOUT.note).toBe("made in Lagos");
    expect(ABOUT.footer).toBe("Sinima is free and has no ads, accounts or tracking. Your city and area are kept on your phone.");
  });
});

// How each city's times are read, from the data the site is built on (D-122): from the cinema's
// own site, through Lagocine, or not online yet.
describe("cityReadingLine", () => {
  it("says how many cinemas are read from their own sites and how many through Lagocine", () => {
    expect(cityReadingLine("lagos", { own: 9, through: 14, none: 0 })).toBe("In Lagos, 9 sinimas are read from their own sites and 14 through Lagocine.");
    expect(cityReadingLine("abuja", { own: 4, through: 0, none: 1 })).toBe("In Abuja, 4 sinimas are read from their own sites. 1 has no times online yet.");
  });
  it("says one cinema in the singular", () => {
    expect(cityReadingLine("lagos", { own: 1, through: 1, none: 2 })).toBe("In Lagos, 1 sinima is read from its own site and 1 through Lagocine. 2 have no times online yet.");
    expect(cityReadingLine("lagos", { own: 0, through: 1, none: 0 })).toBe("In Lagos, 1 sinima is read through Lagocine.");
  });
  it("says when a city has no times at all", () => {
    expect(cityReadingLine("abuja", { own: 0, through: 0, none: 5 })).toBe("Abuja's times aren't online yet.");
  });
  it("no longer says Abuja is being researched", () => {
    expect(JSON.stringify(ABOUT)).not.toMatch(/researched|sample pages/);
  });
});
