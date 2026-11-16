import { describe, expect, it } from "vitest";
import { ABOUT, STEPS, sourceStatus } from "@/lib/wording/about";

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
    expect(STEPS.map((step) => step.title)).toEqual(["We read each cinema's public listings", "Old times say so", "You book on the cinema's own site"]);
  });
  it("the title, the note and the footer", () => {
    expect(ABOUT.title).toBe("About Sinima");
    expect(ABOUT.note).toBe("made in Lagos");
    expect(ABOUT.footer).toBe("Sinima is free and has no ads, accounts or tracking. Your city and area are kept on your phone.");
  });
});
