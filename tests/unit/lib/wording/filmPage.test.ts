import { describe, expect, it } from "vitest";
import { formatLabel } from "@/lib/data/format";
import { areaTag, bookOption, calendarLine, earlierLine, filmFacts, heroNote, nextPlace, noTimes, shareText, shortAddress, showingSubtitle, startedNotice, timesSubtitle } from "@/lib/wording/filmPage";

// Words on a film's page and its showing sheet (Figma Film 185:3558), taken from the frames.

describe("filmFacts", () => {
  it("reads runtime, rating, formats and where it is on, as Figma's line", () => {
    expect(filmFacts({ runtimeMin: 145, rating: "12A" }, [], { cinemas: 4, city: "Lagos", on: "today" })).toEqual(["2 h 25 min", "12A", "at 4 sinimas in Lagos today"]);
    expect(filmFacts({ runtimeMin: 201, rating: null }, ["IMAX", "MX4D"], { cinemas: 16, city: "Lagos", on: "today" })).toEqual(["3 h 21 min", "IMAX", "MX4D", "at 16 sinimas in Lagos today"]);
  });
  it("says one cinema, and leaves the place out when it is on nowhere that day", () => {
    expect(filmFacts({ runtimeMin: null, rating: null }, [], { cinemas: 1, city: "Lagos", on: "on 13 Nov" })).toEqual(["at 1 sinima in Lagos on 13 Nov"]);
    expect(filmFacts({ runtimeMin: null, rating: null }, [], { cinemas: 0, city: "Lagos", on: "today" })).toEqual(["Runtime not listed"]);
  });
});

describe("heroNote", () => {
  it("says stay put! for a credits scene, in IMAX! otherwise when it shows in IMAX, else nothing", () => {
    expect(heroNote("stay", ["IMAX"])).toBe("stay put!");
    expect(heroNote("unknown", ["IMAX", "4D"])).toBe("in IMAX!");
    expect(heroNote("unknown", ["4D"])).toBeNull();
    expect(heroNote("go", [])).toBeNull();
  });
});

describe("format labels", () => {
  it("names a showing's format as the cinema does, and says nothing for 2D or none", () => {
    expect(["IMAX 2D", "MX4D", "4DX", "3D", "2D", null].map(formatLabel)).toEqual(["IMAX", "MX4D", "4DX", "3D", null, null]);
  });
});

describe("the times heading", () => {
  it("dates the list and says how it is ordered", () => {
    expect(timesSubtitle("2026-11-13T16:30:00Z", true)).toBe("Friday 13 November · your area first");
    expect(timesSubtitle("2026-11-13T16:30:00Z", false)).toBe("Friday 13 November · soonest first");
  });
  it("tags your area and the areas next to it", () => {
    expect(areaTag("home", "Lekki")).toBe("your area");
    expect(areaTag("next", "Lekki")).toBe("next to Lekki");
    expect(areaTag(null, "Lekki")).toBeNull();
  });
});

describe("earlierLine", () => {
  it("names the cinemas that started earlier, then tomorrow's count, as Figma's box", () => {
    const started = [
      { name: "EbonyLife Cinemas", at: "2026-11-13T10:10:00Z" },
      { name: "Sky Cinemas Sangotedo", at: "2026-11-13T12:00:00Z" },
    ];
    expect(earlierLine(started, { showings: 7, cinemas: 4 })).toBe("Started earlier today: EbonyLife Cinemas at 11:10\u00a0AM and Sky Cinemas Sangotedo at 1:00\u00a0PM. Tomorrow: 7 showings at 4 sinimas.");
    expect(earlierLine([started[0]!], { showings: 1, cinemas: 1 })).toBe("Started earlier today: EbonyLife Cinemas at 11:10\u00a0AM. Tomorrow: 1 showing at 1 sinima.");
    expect(earlierLine([], { showings: 0, cinemas: 0 })).toBeNull();
    expect(earlierLine(started, { showings: 0, cinemas: 0 })).toBe("Started earlier today: EbonyLife Cinemas at 11:10\u00a0AM and Sky Cinemas Sangotedo at 1:00\u00a0PM.");
  });
});

describe("the showing sheet", () => {
  const at = "2026-11-13T17:00:00Z"; // 6:00 PM
  it("subtitles the showing with the film, its format and the area", () => {
    expect(showingSubtitle("Ramayana: Rise of a Legend", "IMAX", "Lekki")).toBe("Ramayana: Rise of a Legend · IMAX · Lekki");
    expect(showingSubtitle("Spider-Man: Brand New Day", null, "Lekki")).toBe("Spider-Man: Brand New Day · Lekki");
  });
  it("says when the calendar event runs, and the alert", () => {
    expect(calendarLine(at, 201)).toBe("6:00\u00a0PM to 9:21\u00a0PM, with an alert 30 min before.");
    expect(calendarLine(at, null)).toBe("6:00\u00a0PM, with an alert 30 min before.");
  });
  it("offers booking only on the cinema's own site, and says why when it can't", () => {
    expect(bookOption({ kind: "book", chain: "Filmhouse" })).toEqual({ title: "Book on Filmhouse's site", desc: "Opens their booking page. We never sell tickets." });
    expect(bookOption({ kind: "sample", chain: "Filmhouse" }).title).toBe("Sample only");
    expect(bookOption({ kind: "old", chain: "Filmhouse", site: true }).title).toBe("Check on Filmhouse's site");
    expect(bookOption({ kind: "old", chain: "Filmhouse", site: false }).title).toBe("Check with the sinima");
    expect(bookOption({ kind: "door", chain: "Grand", address: "Lekki" })).toEqual({ title: "Tickets at the sinima", desc: "Lekki" });
  });
  it("explains a started showing and points to the next times", () => {
    expect(startedNotice(at, "near")).toBe("This showing started at 6:00\u00a0PM, so it can't be booked here. The next times nearby:");
    expect(startedNotice(at, "city", "Lagos")).toBe("This showing started at 6:00\u00a0PM, so it can't be booked here. The next times in Lagos:");
    expect(startedNotice(at, "none")).toBe("This showing started at 6:00\u00a0PM, so it can't be booked here. Nothing else starts today.");
  });
  it("places each next time: another cinema's area, or this cinema and its format", () => {
    expect(nextPlace({ same: false, area: "Victoria Island", format: null })).toBe("Victoria Island");
    expect(nextPlace({ same: true, area: "Lekki", format: "IMAX" })).toBe("This sinima, in IMAX");
    expect(nextPlace({ same: true, area: "Lekki", format: null })).toBe("This sinima");
  });
  it("shares as the brief's line", () => {
    expect(shareText({ film: "Sinners", cinema: "Filmhouse Lekki", at: "2026-11-13T18:30:00Z" })).toBe("Sinners · Filmhouse Lekki · Fri 7:30 PM"); // a plain space: shared text gets pasted and searched
    expect(shareText({ film: "Sinners", city: "Lagos" })).toBe("Sinners · times in Lagos");
  });
});

describe("noTimes", () => {
  it("says nothing more starts today, or that a day has no times yet", () => {
    expect(noTimes("Ramayana", "today", true)).toBe("Nothing more starts today.");
    expect(noTimes("Ramayana", "tomorrow", false)).toBe("No times for Ramayana are listed tomorrow yet.");
  });
});

describe("shortAddress", () => {
  it("drops the city and any note left in the registry", () => {
    expect(shortAddress("The Rock Drive, off Bisola Durosinmi Etti Drive, Lekki Phase 1, Lagos")).toBe("The Rock Drive, off Bisola Durosinmi Etti Drive, Lekki Phase 1");
    expect(shortAddress("Maryland Mall, Maryland, Lagos (no street address found)")).toBe("Maryland Mall, Maryland");
    expect(shortAddress("Leisure Mall, Surulere")).toBe("Leisure Mall, Surulere");
  });
});
