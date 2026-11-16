import { describe, expect, it } from "vitest";
import { CITY_SHEET, cityLine, enterHint, matchCount, noMatch, resultMeta, resultNext, ABUJA_SOON } from "@/lib/wording/search";

// Every sentence of Figma's Search and city section (192:7519), filled from the data.

describe("search wording", () => {
  it("counts the matches in the city, with the query in curly quotes", () => {
    expect(matchCount(2, "lagos", "Sp")).toBe("2 films in Lagos match “Sp”");
    expect(matchCount(1, "abuja", "Rama")).toBe("1 film in Abuja matches “Rama”");
  });

  it("a result says how long, the rating, the formats and how many cinemas, today or tomorrow", () => {
    const now = "2026-11-13T16:30:00Z"; // 5:30 PM in Lagos: tonight
    expect(resultMeta({ runtimeMin: 145, rating: "12A" }, [], 2, 0, now, "2026-11-13T17:00:00Z")).toBe("2 h 25 min · 12A · 2 cinemas tonight");
    expect(resultMeta({ runtimeMin: 201, rating: null }, ["IMAX", "4D"], 12, 0, now, "2026-11-13T17:00:00Z")).toBe("3 h 21 min · IMAX · 4D · 12 cinemas tonight");
    expect(resultMeta({ runtimeMin: null, rating: null }, [], 5, 0, now, "2026-11-13T17:00:00Z")).toBe("5 cinemas tonight");
    expect(resultMeta({ runtimeMin: null, rating: null }, [], 1, 0, "2026-11-13T09:00:00Z", "2026-11-13T12:00:00Z")).toBe("1 cinema today");
    expect(resultMeta({ runtimeMin: null, rating: null }, [], 3, 1, now, "2026-11-14T13:00:00Z")).toBe("3 cinemas tomorrow");
  });

  it("the next showing: its time and cinema; tomorrow's says so", () => {
    expect(resultNext({ at: "2026-11-13T17:00:00Z", cinema: "Grand Cinemas Lekki" }, 0, "2026-11-13T16:30:00Z")).toBe("Next 6:00\u00a0PM · Grand Cinemas Lekki");
    const now = "2026-11-13T16:30:00Z";
    expect(resultNext({ at: "2026-11-14T13:00:00Z", cinema: "Sky Cinemas Sangotedo" }, 1, now)).toBe("Tomorrow 2:00\u00a0PM · Sky Cinemas Sangotedo");
    expect(resultNext({ at: "2026-11-13T23:30:00Z", cinema: "Filmhouse IMAX Lekki" }, 0, now)).toBe("Next 12:30\u00a0AM (Sat) · Filmhouse IMAX Lekki");
  });

  it("after midnight, with last night's late shows still to start, the next day's times are today's", () => {
    const now = "2026-11-14T00:00:00Z"; // 1:00 AM Saturday in Lagos
    expect(resultNext({ at: "2026-11-14T13:00:00Z", cinema: "Sky" }, 1, now)).toBe("Today 2:00\u00a0PM · Sky");
    expect(resultMeta({ runtimeMin: null, rating: null }, [], 2, 1, now, "2026-11-14T13:00:00Z")).toBe("2 cinemas today");
    expect(resultNext({ at: "2026-11-15T13:00:00Z", cinema: "Sky" }, 1, now)).toBe("Tomorrow 2:00\u00a0PM · Sky");
    // Once last night's shows are over, today is the new day: a 2:00 PM show is "today", not "tonight".
    expect(resultMeta({ runtimeMin: null, rating: null }, [], 1, 0, now, "2026-11-14T13:00:00Z")).toBe("1 cinema today");
    expect(resultMeta({ runtimeMin: null, rating: null }, [], 1, 0, now, "2026-11-14T01:30:00Z")).toBe("1 cinema tonight");
  });

  it("Enter shows them on Films", () => {
    expect(enterHint(1)).toBe("Press Enter to see it on Films.");
    expect(enterHint(2)).toBe("Press Enter to see both on Films.");
    expect(enterHint(5)).toBe("Press Enter to see all 5 on Films.");
  });

  it("no match names the cities searched", () => {
    expect(noMatch("Avengers", "both")).toEqual({
      title: "Nothing called “Avengers” in Lagos or Abuja yet",
      body: "Times appear here as soon as a cinema lists them. Check the spelling, or see what's on now.",
      action: "See what's on in Lagos",
    });
    expect(noMatch("Avengers", "abuja").title).toBe("Nothing called “Avengers” in Abuja yet");
  });

  it("the city sheet: the cinemas and the first three areas of each city", () => {
    expect(cityLine(22, ["Lekki", "Victoria Island", "Ikeja", "Surulere", "Yaba", "Lagos Island", "Festac", "Maryland", "Agege", "Sangotedo", "Ikorodu Road", "Idimu"])).toBe(
      "22 cinemas in Lekki, Victoria Island, Ikeja and 9 more areas",
    );
    expect(cityLine(2, ["Jabi", "Lugbe"])).toBe("2 cinemas in Jabi and Lugbe");
    expect(cityLine(4, ["Jabi", "Lugbe", "Kuje", "Wuse"])).toBe("4 cinemas in Jabi, Lugbe, Kuje and 1 more area");
    expect(CITY_SHEET.title).toBe("Choose your city");
    expect(ABUJA_SOON).toBe("Abuja's cinemas are being added");
  });
});
