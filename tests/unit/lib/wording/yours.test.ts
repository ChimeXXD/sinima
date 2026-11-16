import { describe, expect, it } from "vitest";
import { ADD, EMPTY, FOOTER, PICK, addLabel, folderLine, savedCount } from "@/lib/wording/yours";

// Words on Your cinemas (Figma 206:8570 Default, 206:8921 None saved).

describe("savedCount", () => {
  it("how many are saved on this phone (Figma)", () => {
    expect(savedCount(4)).toBe("4 saved on this phone");
    expect(savedCount(1)).toBe("1 saved on this phone");
    expect(savedCount(0)).toBe("None saved yet");
  });
});

describe("folderLine", () => {
  it("the area and the next time (Figma: Yaba · next 5:35\u00a0PM)", () => {
    expect(folderLine({ area: "Yaba", next: "2026-11-13T16:35:00Z", listed: true })).toBe("Yaba · next 5:35\u00a0PM");
    expect(folderLine({ area: "Yaba", next: "2026-11-13T23:30:00Z", listed: true })).toBe("Yaba · next 12:30\u00a0AM (Sat)");
  });
  it("nothing more today, or times we can't read, in words (D-61, D-91)", () => {
    expect(folderLine({ area: "Lekki", next: null, listed: true })).toBe("Lekki · nothing more today");
    expect(folderLine({ area: "Lekki", next: null, listed: false })).toBe("Lekki · times not available yet");
  });
});

describe("fixed words", () => {
  it("Figma's empty state, add card and footer", () => {
    expect(EMPTY).toEqual({
      title: "Keep your usual cinemas here",
      body: "Tick the ones you go to, or tap the heart on any cinema. Their next times show up here first, and the tab bar counts them.",
      action: "Pick your cinemas",
      note: "Saved on this phone only. Nothing is sent anywhere.",
    });
    expect(ADD).toEqual({ title: "Add your cinemas", body: "Tick them from a list, or tap a heart." });
    expect(addLabel("Lagos")).toBe("Add cinemas in Lagos");
    expect(PICK("Lagos")).toEqual({ title: "Add your cinemas", subtitle: "Tick the cinemas you go to in Lagos. Saved on this phone only.", done: "Done" });
    expect(FOOTER).toBe("Saved on this phone only, soonest first. Nothing is sent anywhere, and there's no account.");
  });
});
