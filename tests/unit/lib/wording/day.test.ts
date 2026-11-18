import { describe, expect, it } from "vitest";
import { TRY_AGAIN, dayFailed, dayLoading, dayWords, listedSentence, tileWords } from "@/lib/wording/day";

// CLAUDE.md rule 3: "today" and "tomorrow" are only said once the browser knows the time.
describe("dayWords", () => {
  it("says Today and Tomorrow when the time is known", () => {
    expect(dayWords(0, "2026-11-06T17:00:00Z", true)).toEqual({ name: "Today", on: "today" });
    expect(dayWords(1, "2026-11-07T17:00:00Z", true)).toEqual({ name: "Tomorrow", on: "tomorrow" });
  });

  it("names the date when it is not: the page's own HTML may be read on a later day", () => {
    expect(dayWords(0, "2026-11-06T17:00:00Z", false)).toEqual({ name: "Fri 6 Nov", on: "on Fri 6 Nov" });
    expect(dayWords(1, "2026-11-07T17:00:00Z", false)).toEqual({ name: "Sat 7 Nov", on: "on Sat 7 Nov" });
  });
});

// Five days (D-142, D-146, D-148): the date tiles, the sentence under them and a later day's file.
// Wed 18 Nov 2026 to Sat 21 Nov, each an instant on its date.
const WED = "2026-11-18T03:00:00Z";
const THU = "2026-11-19T03:00:00Z";
const FRI = "2026-11-20T03:00:00Z";
const SAT = "2026-11-21T03:00:00Z";

describe("dayWords on a later day", () => {
  it("names the weekday once the time is known, the date before", () => {
    expect(dayWords(2, FRI, true)).toEqual({ name: "Fri 20 Nov", on: "on Friday" });
    expect(dayWords(3, SAT, false)).toEqual({ name: "Sat 21 Nov", on: "on Sat 21 Nov" });
  });
});

describe("tileWords: a date tile's two lines and its full name (D-148)", () => {
  it("says Today on the first tile, then the weekday, over the date", () => {
    expect(tileWords(0, WED, true)).toEqual({ weekday: "Today", date: "18", label: "Today, Wednesday 18 November" });
    expect(tileWords(1, THU, true)).toEqual({ weekday: "Thu", date: "19", label: "Tomorrow, Thursday 19 November" });
    expect(tileWords(3, SAT, true)).toEqual({ weekday: "Sat", date: "21", label: "Saturday 21 November" });
  });

  it("before the page knows the time, every tile is its weekday and date (rule 3)", () => {
    expect(tileWords(0, WED, false)).toEqual({ weekday: "Wed", date: "18", label: "Wednesday 18 November" });
    expect(tileWords(1, THU, false)).toEqual({ weekday: "Thu", date: "19", label: "Thursday 19 November" });
  });
});

describe("listedSentence: how complete a day is (D-146)", () => {
  it("says how many of the city's sinimas have put the day up", () => {
    expect(listedSentence({ listed: 7, total: 21, day: 3, date: SAT, live: true })).toBe("7 of 21 sinimas have put up Saturday's times so far.");
    expect(listedSentence({ listed: 20, total: 21, day: 1, date: THU, live: true })).toBe("20 of 21 sinimas have put up tomorrow's times so far.");
    expect(listedSentence({ listed: 20, total: 21, day: 0, date: WED, live: true })).toBe("20 of 21 sinimas have put up today's times so far.");
  });

  it("names the weekday before the time is known", () => {
    expect(listedSentence({ listed: 20, total: 21, day: 1, date: THU, live: false })).toBe("20 of 21 sinimas have put up Thursday's times so far.");
  });

  it("one sinima has", () => {
    expect(listedSentence({ listed: 1, total: 2, day: 2, date: FRI, live: true })).toBe("1 of 2 sinimas has put up Friday's times so far.");
  });

  it("says nothing when every sinima has listed the day, or none has", () => {
    expect(listedSentence({ listed: 21, total: 21, day: 2, date: FRI, live: true })).toBeNull();
    expect(listedSentence({ listed: 0, total: 21, day: 1, date: THU, live: true })).toBeNull();
  });
});

describe("a later day's file: loading and failing in words", () => {
  it("says what it is getting", () => {
    expect(dayLoading(2, FRI, true)).toBe("Getting Friday's times…");
    expect(dayLoading(1, THU, true)).toBe("Getting tomorrow's times…");
  });

  it("offline, says the day needs a connection; online, that it didn't load", () => {
    expect(dayFailed({ day: 2, date: FRI, live: true, offline: true })).toBe("Friday's times need a connection.");
    expect(dayFailed({ day: 1, date: THU, live: true, offline: true })).toBe("Tomorrow's times need a connection.");
    expect(dayFailed({ day: 3, date: SAT, live: true, offline: false })).toBe("Saturday's times didn't load.");
    expect(TRY_AGAIN).toBe("Try again");
  });
});
