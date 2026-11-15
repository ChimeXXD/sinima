import { describe, expect, it } from "vitest";
import { PICKER_SHEETS, NO_TIMES_NOTE, cinemaCount, cinemaLine, cinemasHeading, cinemasTitleNote, pickerValue } from "@/lib/wording/cinemas";

// Words on the Cinemas tab (Figma Cinemas 200:6415). The sample clock is 17:30 Fri 13 Nov.

const AT = "2026-11-13T17:00:00Z"; // 18:00 in Lagos

describe("cinemaLine", () => {
  it("says the next time and the films left tonight, once the page knows the time (Figma)", () => {
    expect(cinemaLine({ next: AT, films: 3, listed: true, when: "tonight" })).toEqual({ lead: "Next at", time: "18:00", rest: " · 3 films tonight" });
    expect(cinemaLine({ next: AT, films: 1, listed: true, when: "tonight" }).rest).toBe(" · 1 film tonight");
  });
  it("says today in the daytime and tomorrow for tomorrow", () => {
    expect(cinemaLine({ next: AT, films: 2, listed: true, when: "today" }).rest).toBe(" · 2 films today");
    expect(cinemaLine({ next: AT, films: 2, listed: true, when: "tomorrow" })).toEqual({ lead: "First at", time: "18:00", rest: " · 2 films tomorrow" });
  });
  it("has no word that depends on the clock before the page knows the time (rule 3)", () => {
    expect(cinemaLine({ next: AT, films: 4, listed: true, when: null })).toEqual({ lead: "First at", time: "18:00", rest: " · 4 films" });
  });
  it("shows a time after midnight with its day", () => {
    expect(cinemaLine({ next: "2026-11-13T23:30:00Z", films: 1, listed: true, when: "tonight" }).time).toBe("00:30 (Sat)");
  });
  it("says when there is nothing left, and when the cinema's times cannot be read (Figma Galleria)", () => {
    expect(cinemaLine({ next: null, films: 0, listed: true, when: "tonight" })).toEqual({ lead: "Nothing more today", time: null, rest: "" });
    expect(cinemaLine({ next: null, films: 0, listed: true, when: "today" })).toEqual({ lead: "Nothing more today", time: null, rest: "" });
    expect(cinemaLine({ next: null, films: 0, listed: true, when: "tomorrow" })).toEqual({ lead: "No times tomorrow", time: null, rest: "" });
    expect(cinemaLine({ next: null, films: 0, listed: true, when: null })).toEqual({ lead: "No times listed", time: null, rest: "" });
    expect(cinemaLine({ next: null, films: 0, listed: false, when: "tonight" })).toEqual({ lead: "Times not available yet", time: null, rest: "" });
  });
});

describe("cinemasHeading", () => {
  it.each([
    [{ key: "area", area: "Lekki", count: 6 }, "In Lekki", "Your area · 6 cinemas, soonest first"],
    [{ key: "area", area: "Ikeja", count: 1 }, "In Ikeja", "Your area · 1 cinema, soonest first"],
    [{ key: "next", neighbours: ["Victoria Island", "Sangotedo"] }, "Next to Lekki", "Victoria Island and Sangotedo"],
    [{ key: "rest", city: "Lagos" }, "Elsewhere in Lagos", "Soonest first"],
    [{ key: "all", count: 22, format: null }, "All cinemas", "22 cinemas, soonest first"],
    [{ key: "all", count: 7, format: "IMAX" }, "Showing in IMAX", "7 cinemas, soonest first"],
  ] as const)("%j", (input, title, note) => {
    expect(cinemasHeading({ area: "Lekki", ...input } as Parameters<typeof cinemasHeading>[0])).toEqual({ title, note });
  });
});

describe("the rest of the page", () => {
  it("counts the city's cinemas by hand under the title", () => {
    expect(cinemasTitleNote(22)).toBe("22 of them!");
  });
  it("counts an area's cinemas in the area sheet", () => {
    expect(cinemaCount(6)).toBe("6 cinemas");
    expect(cinemaCount(1)).toBe("1 cinema");
  });
  it("names the pickers' values", () => {
    expect(pickerValue.area(null)).toBe("All");
    expect(pickerValue.area("Lekki")).toBe("Lekki");
    expect(pickerValue.format(null)).toBe("Any");
    expect(pickerValue.format("IMAX")).toBe("IMAX");
  });
  it("explains the missing times under the list, as Figma words it", () => {
    expect(NO_TIMES_NOTE).toBe("“Times not available yet”: we can't read this cinema's times yet. Check its own site.");
    expect(PICKER_SHEETS.area).toEqual({ title: "Choose an area", subtitle: "Cinemas in your area come first, then the areas next to it." });
  });
});
