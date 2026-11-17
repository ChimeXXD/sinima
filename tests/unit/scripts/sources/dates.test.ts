import { describe, expect, it } from "vitest";
import { clock12, clock24h, dateNearest, lagosDay, showStart, withinDays } from "../../../../scripts/sources/dates";

// The clock and calendar pieces every cinema reader shares (D-122). Cinemas write times on a
// 12-hour clock ("6:35 PM", "4:20pm") or a 24-hour one ("09:15"), and dates without a year
// ("Tuesday, November 17th"); every time still goes to UTC through lagosLocalToUtc only (rule 1).

describe("clock12", () => {
  it("reads both ways cinemas write it", () => {
    expect(clock12("6:35 PM")).toEqual({ hour: 18, minute: 35 });
    expect(clock12("4:20pm")).toEqual({ hour: 16, minute: 20 });
    expect(clock12(" 3:00 pm ")).toEqual({ hour: 15, minute: 0 });
  });
  it("noon is 12 PM and midnight is 12 AM", () => {
    expect(clock12("12:00 PM")).toEqual({ hour: 12, minute: 0 });
    expect(clock12("12:05 AM")).toEqual({ hour: 0, minute: 5 });
  });
  it("gives null for anything else", () => {
    for (const text of ["13:00 pm", "0:30 am", "10.40", "10:60 am", "19:30", ""]) expect(clock12(text), text).toBeNull();
  });
});

describe("clock24h", () => {
  it("reads 09:15 and 22:45, and nothing that is not a time", () => {
    expect(clock24h("09:15")).toEqual({ hour: 9, minute: 15 });
    expect(clock24h("22:45 ")).toEqual({ hour: 22, minute: 45 });
    for (const text of ["24:00", "9:75", "7:30 PM", ""]) expect(clock24h(text), text).toBeNull();
  });
});

describe("dateNearest", () => {
  const nov11 = { year: 2026, month: 11, day: 11 };
  it("a date ahead in the year is this year; one months behind is next year", () => {
    expect(dateNearest({ month: 12, day: 4 }, nov11)).toEqual({ year: 2026, month: 12, day: 4 });
    expect(dateNearest({ month: 1, day: 4 }, nov11)).toEqual({ year: 2027, month: 1, day: 4 });
  });
  it("around New Year it takes the nearer year, so a late show read after midnight stays in the old year", () => {
    expect(dateNearest({ month: 12, day: 31 }, { year: 2027, month: 1, day: 1 })).toEqual({ year: 2026, month: 12, day: 31 });
    expect(dateNearest({ month: 1, day: 2 }, { year: 2026, month: 12, day: 31 })).toEqual({ year: 2027, month: 1, day: 2 });
  });
  it("checks the weekday the page gives, rather than guessing", () => {
    expect(dateNearest({ month: 11, day: 17, weekday: "Tuesday" }, nov11)).toEqual({ year: 2026, month: 11, day: 17 });
    expect(() => dateNearest({ month: 11, day: 17, weekday: "Friday" }, nov11)).toThrow("17 November is not a Friday in 2026");
  });
  it("refuses a day the month does not have", () => {
    expect(() => dateNearest({ month: 2, day: 30 }, nov11)).toThrow("30 February is not a date");
  });
});

describe("lagosDay", () => {
  it("is the day in Lagos, an hour ahead of UTC, and counts on across month and year ends", () => {
    expect(lagosDay("2026-11-16T23:30:00Z")).toEqual({ year: 2026, month: 11, day: 17 });
    expect(lagosDay("2026-11-16T23:30:00Z", 1)).toEqual({ year: 2026, month: 11, day: 18 });
    expect(lagosDay("2026-12-31T23:30:00Z", 1)).toEqual({ year: 2027, month: 1, day: 2 });
  });
});

describe("showStart", () => {
  const nov17 = { year: 2026, month: 11, day: 17 };
  it("is the Lagos time in UTC", () => {
    expect(showStart(nov17, { hour: 19, minute: 30 })).toBe("2026-11-17T18:30:00Z");
    expect(showStart(nov17, { hour: 4, minute: 0 })).toBe("2026-11-17T03:00:00Z");
  });
  it("puts a show before 04:00 after midnight, on the evening it is listed under (SPEC §3)", () => {
    expect(showStart(nov17, { hour: 0, minute: 30 })).toBe("2026-11-17T23:30:00Z"); // 00:30 on the 18th in Lagos
    expect(showStart(nov17, { hour: 3, minute: 59 })).toBe("2026-11-18T02:59:00Z");
    expect(showStart({ year: 2026, month: 12, day: 31 }, { hour: 0, minute: 15 })).toBe("2026-12-31T23:15:00Z"); // New Year's Day
  });
});

describe("withinDays", () => {
  const row = (startsAt: string) => ({ cinemaId: "c", filmTitle: "F", rating: null, startsAt, format: null, bookingUrl: null });
  it("keeps today and the days after it, each to 04:00 the next morning, and drops the rest", () => {
    const now = "2026-11-17T00:20:00Z"; // 01:20 on the 17th in Lagos
    const rows = ["2026-11-16T22:00:00Z", "2026-11-17T08:00:00Z", "2026-11-18T20:00:00Z", "2026-11-19T02:30:00Z", "2026-11-19T03:00:00Z", "2026-12-04T18:00:00Z"].map(row);
    expect(withinDays(rows, now, 2).map((r) => r.startsAt)).toEqual(["2026-11-17T08:00:00Z", "2026-11-18T20:00:00Z", "2026-11-19T02:30:00Z"]);
  });
});
