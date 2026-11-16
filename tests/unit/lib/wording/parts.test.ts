import { describe, expect, it } from "vitest";
import { countdownShare, countdown } from "@/lib/time/countdown";
import { filmNextLine } from "@/lib/wording/film";
import { lateDay } from "@/lib/time/lagos";
import { cinemaNextLine, countdownParts, showingsTonight, spokenCountdown, spokenTime } from "@/lib/wording/showing";

// The words the shared components (D-82, build unit 2) split over two type styles.

const START = "2026-11-06T18:30:00Z"; // 7:30 PM in Lagos

describe("countdownParts: the countdown in two pieces, for the pill and the badge", () => {
  it.each([
    ["2026-11-06T18:25:00Z", "Starts in", "5 min"],
    ["2026-11-06T17:10:00Z", "Starts in", "1 h 20 min"],
    ["2026-11-06T16:30:00Z", "Starts in", "2 h"],
    ["2026-11-06T18:29:30Z", "Starting", "now"],
    ["2026-11-06T18:30:00Z", "Started", "just now"], // the boundary second: started, never bookable (D-05)
    ["2026-11-06T18:33:00Z", "Started", "3 min ago"],
  ])("at %s: %s / %s", (now, lead, value) => {
    expect(countdownParts(START, now)).toEqual({ lead, value });
  });

  it("joins back into the one-line countdown, so the two never disagree", () => {
    for (const now of ["2026-11-06T18:25:00Z", "2026-11-06T17:10:00Z", "2026-11-06T18:29:30Z", "2026-11-06T18:33:00Z"]) {
      const parts = countdownParts(START, now)!;
      expect(`${parts.lead} ${parts.value}`).toBe(countdown(START, now));
    }
  });

  it("is null once the showing has ended", () => {
    expect(countdownParts(START, "2026-11-06T19:00:01Z")).toBeNull();
  });
});

describe("countdownShare: how much of the ring is filled (Figma 11.2: the share of 120 min)", () => {
  it.each([
    ["2026-11-06T16:00:00Z", 0], // more than 2 h away: empty
    ["2026-11-06T16:30:00Z", 0],
    ["2026-11-06T17:30:00Z", 0.5],
    ["2026-11-06T18:20:00Z", 11 / 12], // 10 min left: Figma's ring (-90° to 240°)
    ["2026-11-06T18:30:00Z", 1],
    ["2026-11-06T18:40:00Z", 1],
  ])("at %s -> %s", (now, share) => {
    expect(countdownShare(START, now)).toBeCloseTo(share, 6);
  });
});

describe("spokenCountdown: units spelled out for screen readers", () => {
  it.each([
    ["2026-11-06T18:25:00Z", "starts in 5 minutes"],
    ["2026-11-06T17:29:00Z", "starts in 1 hour 1 minute"],
    ["2026-11-06T18:33:00Z", "started 3 minutes ago"],
  ])("at %s: %s", (now, text) => {
    expect(spokenCountdown(START, now)).toBe(text);
  });
});

describe("filmNextLine: the stats line under a film card (Figma 10.1)", () => {
  it("names the next time and how many cinemas", () => {
    expect(filmNextLine(START, 4)).toEqual({ next: "Next 7:30\u00a0PM", where: "4 cinemas" });
  });
  it("says one cinema, not one cinemas", () => {
    expect(filmNextLine(START, 1)).toEqual({ next: "Next 7:30\u00a0PM", where: "1 cinema" });
  });
  it("marks a showing after midnight with its day", () => {
    expect(filmNextLine("2026-11-06T23:30:00Z", 2).next).toBe("Next 12:30\u00a0AM (Sat)");
  });
  it("says From in the page's own HTML, which cannot tell whether the showing has started (rule 3)", () => {
    expect(filmNextLine(START, 4, "From").next).toBe("From 7:30\u00a0PM");
  });
});

describe("cinema folder lines (Figma 10.3)", () => {
  it("counts tonight's showings", () => {
    expect(showingsTonight(7)).toBe("7 tonight");
  });
  it("puts the area beside the next time", () => {
    expect(cinemaNextLine("Lekki", START)).toBe("Lekki · next 7:30\u00a0PM");
  });
  it("leaves the time out when there is none", () => {
    expect(cinemaNextLine("Lekki", null)).toBe("Lekki");
  });
});

describe("after midnight: the small day beside a time (TimePill, TimeChip)", () => {
  it("names the day for a showing between 12:00\u00a0AM and 3:59\u00a0AM, listed under the evening before", () => {
    expect(lateDay("2026-11-06T23:30:00Z")).toBe("Sat"); // 12:30 AM Saturday
    expect(lateDay("2026-11-07T02:59:00Z")).toBe("Sat"); // 3:59 AM
  });
  it("is null for any other time", () => {
    expect(lateDay("2026-11-06T18:30:00Z")).toBeNull(); // 7:30 PM
    expect(lateDay("2026-11-07T03:00:00Z")).toBeNull(); // 04:00: a morning showing, not the evening before
  });
  it("is spoken in full", () => {
    expect(spokenTime("2026-11-06T23:30:00Z")).toBe("12:30\u00a0AM on Saturday");
    expect(spokenTime("2026-11-06T18:30:00Z")).toBe("7:30\u00a0PM");
  });
});
