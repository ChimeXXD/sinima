import { describe, expect, it } from "vitest";
import { offlineLine } from "@/lib/wording/offline";

// The offline banner (Figma 208:9731): when the times on screen were saved, in words.

const NOW = "2026-11-13T16:30:00Z"; // 17:30 in Lagos

describe("offlineLine", () => {
  it("Figma's words: the time saved and how long ago", () => {
    expect(offlineLine("2026-11-13T16:05:00Z", NOW)).toBe("You're offline. These are the times saved on this phone at 17:05, 25 min ago. Booking needs a connection.");
  });
  it("hours, then the day", () => {
    expect(offlineLine("2026-11-13T14:30:00Z", NOW)).toBe("You're offline. These are the times saved on this phone at 15:30, 2 hours ago. Booking needs a connection.");
    expect(offlineLine("2026-11-13T15:20:00Z", NOW)).toBe("You're offline. These are the times saved on this phone at 16:20, 1 hour ago. Booking needs a connection.");
    expect(offlineLine("2026-11-12T10:00:00Z", NOW)).toBe("You're offline. These are the times saved on this phone on Thu 12 Nov at 11:00. Booking needs a connection.");
  });
  it("just now", () => {
    expect(offlineLine("2026-11-13T16:29:40Z", NOW)).toBe("You're offline. These are the times saved on this phone at 17:29, just now. Booking needs a connection.");
  });
  it("without a saved time", () => {
    expect(offlineLine(null, NOW)).toBe("You're offline. These are the times saved on this phone. Booking needs a connection.");
  });
});
