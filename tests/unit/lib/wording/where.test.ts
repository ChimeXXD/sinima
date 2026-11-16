import { describe, expect, it } from "vitest";
import { WHERE, areasLine, continueLabel, foundNote } from "@/lib/wording/where";

// Words on Where are you watching? (Figma 162:215 Asking, 162:262 Found you in Abuja, 162:302 Elsewhere).

describe("where", () => {
  it("Lagos's line names five areas and counts the rest (Figma)", () => {
    expect(areasLine(["Lekki", "Victoria Island", "Ikeja", "Surulere", "Yaba", "Lagos Island", "Festac", "Maryland", "Agege", "Sangotedo", "Ikorodu Road", "Idimu"])).toBe("Lekki, Victoria Island, Ikeja, Surulere, Yaba and 7 more areas");
    expect(areasLine(["Lekki", "Yaba"])).toBe("Lekki and Yaba");
    expect(areasLine(["Lekki", "Victoria Island", "Ikeja", "Surulere", "Yaba", "Idimu"])).toBe("Lekki, Victoria Island, Ikeja, Surulere, Yaba and 1 more area");
  });
  it("the button says where it goes once a city is picked", () => {
    expect(continueLabel(null)).toBe("Continue");
    expect(continueLabel("abuja")).toBe("Continue with Abuja");
  });
  it("the handwritten note", () => {
    expect(foundNote("abuja")).toBe("found you in Abuja!");
    expect(foundNote("lagos")).toBe("found you in Lagos!");
    expect(WHERE.asking).toBe("finding your city…");
  });
  it("the fixed words", () => {
    expect(WHERE.title).toBe("Where are you watching?");
    expect(WHERE.fallback).toBe("We couldn't place you in Lagos or Abuja, so here's Lagos. Switch any time in the search bar.");
    expect(WHERE.abuja).toBe("Wuse, Maitama, Jabi, Garki, Central Area and more");
  });
});
