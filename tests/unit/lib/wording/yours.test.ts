import { describe, expect, it } from "vitest";
import { ADD, EMPTY, FOOTER, folderLine, savedCount } from "@/lib/wording/yours";

// Words on Your cinemas (Figma 206:8570 Default, 206:8921 None saved).

describe("savedCount", () => {
  it("how many are saved on this phone (Figma)", () => {
    expect(savedCount(4)).toBe("4 saved on this phone");
    expect(savedCount(1)).toBe("1 saved on this phone");
    expect(savedCount(0)).toBe("None saved yet");
  });
});

describe("folderLine", () => {
  it("the area and the next time (Figma: Yaba · next 17:35)", () => {
    expect(folderLine({ area: "Yaba", next: "2026-11-13T16:35:00Z", listed: true })).toBe("Yaba · next 17:35");
    expect(folderLine({ area: "Yaba", next: "2026-11-13T23:30:00Z", listed: true })).toBe("Yaba · next 00:30 (Sat)");
  });
  it("nothing more today, or times we can't read, in words (D-61, D-91)", () => {
    expect(folderLine({ area: "Lekki", next: null, listed: true })).toBe("Lekki · nothing more today");
    expect(folderLine({ area: "Lekki", next: null, listed: false })).toBe("Lekki · times not available yet");
  });
});

describe("fixed words", () => {
  it("Figma's empty state, add card and footer", () => {
    expect(EMPTY("Lagos")).toEqual({
      title: "Keep your usual cinemas here",
      body: "Tap the heart on any cinema's page. Its next times show up here first, and the tab bar counts them.",
      action: "Browse cinemas in Lagos",
      note: "Saved on this phone only. Nothing is sent anywhere.",
    });
    expect(ADD).toEqual({ title: "Save a cinema to see its times first", body: "Tap the heart on any cinema page." });
    expect(FOOTER).toBe("Saved on this phone only, soonest first. Nothing is sent anywhere, and there's no account.");
  });
});
