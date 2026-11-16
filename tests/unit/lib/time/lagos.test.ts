import { afterEach, describe, expect, it } from "vitest";
import { eveningDayKey, formatDay, formatLateTime, formatTime, lagosDayKey, lagosLocalToUtc, toLagos } from "@/lib/time/lagos";

const realTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = realTz;
});

describe("toLagos and formatTime: UTC in, Africa/Lagos out", () => {
  it("shows a 18:30 UTC showing as 7:30 PM in Lagos", () => {
    expect(formatTime("2026-11-06T18:30:00Z")).toBe("7:30\u00a0PM");
    expect(toLagos("2026-11-06T18:30:00Z")).toEqual({ year: 2026, month: 11, day: 6, hour: 19, minute: 30, weekday: "Fri" });
  });

  it("uses a 12-hour clock, AM and PM, no leading zero, a space that never breaks (D-114)", () => {
    expect(formatTime("2026-11-06T08:05:00Z")).toBe("9:05\u00a0AM");
    expect(formatTime("2026-11-06T23:00:00Z")).toBe("12:00\u00a0AM"); // midnight
    expect(formatTime("2026-11-06T11:00:00Z")).toBe("12:00\u00a0PM"); // noon
    expect(formatTime("2026-11-06T21:45:00Z")).toBe("10:45\u00a0PM");
    expect(formatTime("2026-11-06T10:59:00Z")).toBe("11:59\u00a0AM");
  });

  it("rolls the Lagos date over an hour before UTC does", () => {
    expect(toLagos("2026-11-06T23:30:00Z")).toMatchObject({ day: 7, hour: 0, minute: 30, weekday: "Sat" });
    expect(toLagos("2026-12-31T23:30:00Z")).toMatchObject({ year: 2027, month: 1, day: 1 });
  });

  it.each(["America/New_York", "Asia/Tokyo", "Pacific/Kiritimati", "UTC"])("ignores the device's zone (%s)", (zone) => {
    process.env.TZ = zone;
    expect(formatTime("2026-11-06T18:30:00Z")).toBe("7:30\u00a0PM");
    expect(lagosDayKey("2026-11-06T23:30:00Z")).toBe("2026-11-07");
    expect(lagosLocalToUtc({ year: 2026, month: 11, day: 6, hour: 19, minute: 30 })).toBe("2026-11-06T18:30:00Z");
    expect(formatDay("2026-11-07T18:30:00Z", "2026-11-06T12:00:00Z")).toBe("Tomorrow");
  });

  it.each(["2026-11-06T19:30:00", "2026-11-06T19:30:00+01:00", "2026-11-06 19:30", "6 Nov 2026 19:30", "", "2026-13-40T99:99:00Z"])(
    "refuses a time that is not UTC with a Z (%s)",
    (bad) => {
      expect(() => formatTime(bad)).toThrow(/UTC/);
    },
  );
});

describe("lagosLocalToUtc: the one place a cinema's local time becomes UTC", () => {
  it("converts 19:30 in Lagos to 18:30 UTC", () => {
    expect(lagosLocalToUtc({ year: 2026, month: 11, day: 6, hour: 19, minute: 30 })).toBe("2026-11-06T18:30:00Z");
  });

  it("puts a 00:30 show on the previous UTC day", () => {
    expect(lagosLocalToUtc({ year: 2026, month: 11, day: 7, hour: 0, minute: 30 })).toBe("2026-11-06T23:30:00Z");
    expect(lagosLocalToUtc({ year: 2027, month: 1, day: 1, hour: 0, minute: 0 })).toBe("2026-12-31T23:00:00Z");
  });

  it("round-trips through toLagos", () => {
    const local = { year: 2026, month: 2, day: 28, hour: 23, minute: 59 };
    expect(toLagos(lagosLocalToUtc(local))).toMatchObject(local);
  });

  it.each([
    { year: 2026, month: 2, day: 30, hour: 10, minute: 0 }, // no 30 Feb
    { year: 2026, month: 11, day: 6, hour: 24, minute: 0 },
    { year: 2026, month: 11, day: 6, hour: 19, minute: 60 },
    { year: 2026, month: 0, day: 6, hour: 19, minute: 0 },
    { year: 2026, month: 11, day: 6.5, hour: 19, minute: 0 },
  ])("refuses a local time that does not exist (%o)", (bad) => {
    expect(() => lagosLocalToUtc(bad)).toThrow(/Not a real Lagos time/);
  });
});

describe("formatDay", () => {
  const now = "2026-11-06T12:00:00Z"; // Fri 6 Nov, 13:00 in Lagos
  it("says Today, Tomorrow, then the date", () => {
    expect(formatDay("2026-11-06T18:30:00Z", now)).toBe("Today");
    expect(formatDay("2026-11-07T18:30:00Z", now)).toBe("Tomorrow");
    expect(formatDay("2026-11-08T18:30:00Z", now)).toBe("Sun 8 Nov");
    expect(formatDay("2026-11-05T18:30:00Z", now)).toBe("Thu 5 Nov");
  });

  it("decides the day in Lagos, not in UTC", () => {
    // 23:30 UTC on the 6th is already the 7th in Lagos.
    expect(formatDay("2026-11-06T23:30:00Z", now)).toBe("Tomorrow");
    // At 23:30 UTC (00:30 Lagos, Sat) a showing at 18:30 UTC on the 7th is today.
    expect(formatDay("2026-11-07T18:30:00Z", "2026-11-06T23:30:00Z")).toBe("Today");
  });

  it("handles month and year ends", () => {
    expect(formatDay("2027-01-01T10:00:00Z", "2026-12-31T10:00:00Z")).toBe("Tomorrow");
    expect(formatDay("2026-03-01T10:00:00Z", "2026-02-28T10:00:00Z")).toBe("Tomorrow");
  });
});

describe("the evening runs to 04:00 Lagos time (SPEC §3)", () => {
  it("keeps a 00:30 Saturday show on Friday's evening", () => {
    expect(eveningDayKey("2026-11-06T23:30:00Z")).toBe("2026-11-06"); // 00:30 Sat in Lagos
    expect(lagosDayKey("2026-11-06T23:30:00Z")).toBe("2026-11-07");
    expect(formatLateTime("2026-11-06T23:30:00Z")).toBe("12:30\u00a0AM (Sat)");
  });

  it("switches at exactly 04:00", () => {
    expect(eveningDayKey("2026-11-07T02:59:59Z")).toBe("2026-11-06"); // 03:59:59 Lagos
    expect(formatLateTime("2026-11-07T02:59:00Z")).toBe("3:59\u00a0AM (Sat)");
    expect(eveningDayKey("2026-11-07T03:00:00Z")).toBe("2026-11-07"); // 04:00:00 Lagos
    expect(formatLateTime("2026-11-07T03:00:00Z")).toBe("4:00\u00a0AM");
  });

  it("leaves ordinary evening times alone", () => {
    expect(formatLateTime("2026-11-06T18:30:00Z")).toBe("7:30\u00a0PM");
    expect(eveningDayKey("2026-11-06T18:30:00Z")).toBe("2026-11-06");
  });
});
