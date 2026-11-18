import { describe, expect, it } from "vitest";
import { formatTag } from "@/lib/data/format";
import { anchorFor, byCinema, byFilm, dayDates, dayOf, formatChoices, formatsOf, showingOn } from "@/lib/data/programme";
import { formatDate } from "@/lib/time/lagos";
import type { ListRow } from "@/lib/data/select";

// Fri 6 Nov 2026, 18:00 in Lagos.
const NOW = "2026-11-06T17:00:00Z";
const row = (at: string, film = 0, cinema = 0, format: string | null = null): ListRow => ({ at, film, cinema, format, book: null, fresh: 0 });

describe("formatTag: the format as the app says it (D-50)", () => {
  it.each([
    ["IMAX 2D", "IMAX"], ["IMAX", "IMAX"], ["imax 3d", "IMAX"], ["MX4D", "4D"], ["4DX", "4D"], ["3D", "3D"], ["2D", null], [null, null], ["", null], ["Dolby", null],
  ])("%s -> %s", (given, tag) => {
    expect(formatTag(given)).toBe(tag);
  });
});

describe("dayOf: today to four days on, by the evening (SPEC §3, D-142)", () => {
  it.each([
    ["2026-11-06T17:30:00Z", 0], // 18:30 tonight
    ["2026-11-06T23:30:00Z", 0], // 00:30 on Saturday still belongs to Friday evening
    ["2026-11-07T03:00:00Z", 1], // 04:00 on Saturday starts tomorrow
    ["2026-11-07T20:00:00Z", 1],
    ["2026-11-08T09:00:00Z", 2], // Sunday, the third day (D-142)
    ["2026-11-10T20:00:00Z", 4], // Tuesday, the fifth
    ["2026-11-11T02:30:00Z", 4], // 03:30 on Wednesday is still Tuesday evening
    ["2026-11-11T03:00:00Z", null], // 04:00 on Wednesday starts the sixth day
    ["2026-11-11T09:00:00Z", null], // past the fifth day
    ["2026-11-05T20:00:00Z", null], // yesterday
  ] as const)("%s -> %s", (at, day) => {
    expect(dayOf(at, NOW)).toBe(day);
  });
});

describe("showingOn", () => {
  const rows = [row("2026-11-06T16:59:00Z"), row("2026-11-06T17:00:00Z"), row("2026-11-06T17:00:01Z"), row("2026-11-07T09:00:00Z"), row("2026-11-08T09:00:00Z")];

  it("leaves out today's showings from the second they start", () => {
    expect(showingOn(rows, 0, NOW).map((r) => r.at)).toEqual(["2026-11-06T17:00:01Z"]);
  });

  it("gives all of tomorrow, and nothing past it", () => {
    expect(showingOn(rows, 1, NOW).map((r) => r.at)).toEqual(["2026-11-07T09:00:00Z"]);
  });

  it("can keep one format only, leaving out rows that give none", () => {
    const mixed = [row("2026-11-06T18:00:00Z", 0, 0, "IMAX 2D"), row("2026-11-06T18:30:00Z", 0, 0, "2D"), row("2026-11-06T19:00:00Z", 0, 0, null)];
    expect(showingOn(mixed, 0, NOW, "IMAX").map((r) => r.at)).toEqual(["2026-11-06T18:00:00Z"]);
    expect(showingOn(mixed, 0, NOW, null)).toHaveLength(3);
  });
});

describe("byFilm and byCinema", () => {
  const rows = [row("2026-11-06T20:00:00Z", 1, 0), row("2026-11-06T18:00:00Z", 0, 1), row("2026-11-06T19:00:00Z", 1, 1), row("2026-11-06T21:00:00Z", 0, 1)];

  it("groups by film, soonest film first, each film's times in order", () => {
    expect(byFilm(rows).map((g) => [g.film, g.rows.map((r) => r.at.slice(11, 16))])).toEqual([[0, ["18:00", "21:00"]], [1, ["19:00", "20:00"]]]);
  });

  it("groups by cinema, soonest cinema first", () => {
    expect(byCinema(rows).map((g) => [g.cinema, g.rows.length])).toEqual([[1, 3], [0, 1]]);
  });

  it("lists the formats a set of rows is showing in, biggest first", () => {
    expect(formatsOf([row("a", 0, 0, "2D"), row("a", 0, 0, "MX4D"), row("a", 0, 0, "IMAX 2D"), row("a", 0, 0, "IMAX 2D"), row("a", 0, 0, null)])).toEqual(["IMAX", "4D"]);
    expect(formatsOf([row("a")])).toEqual([]);
  });
});

describe("formatChoices: the format chips a day can offer (D-135)", () => {
  const imaxTonight = row("2026-11-06T19:00:00Z", 0, 0, "IMAX 2D"); // 20:00 tonight
  const imaxStarted = row("2026-11-06T16:00:00Z", 0, 0, "IMAX 2D"); // 17:00 tonight, started
  const fourDTomorrow = row("2026-11-07T15:00:00Z", 0, 1, "MX4D");
  const plain = row("2026-11-06T20:00:00Z", 1, 2, "2D");

  it("offers only the formats of the day's showings still to start", () => {
    expect(formatChoices([imaxTonight, fourDTomorrow, plain], 0, NOW, true, null)).toEqual(["IMAX"]);
    expect(formatChoices([imaxTonight, fourDTomorrow, plain], 1, NOW, true, null)).toEqual(["4D"]);
  });

  it("offers nothing when no showing to come has a format: 2D, VIP and none are not choices", () => {
    expect(formatChoices([plain, row("2026-11-06T21:00:00Z", 1, 2, "VIP"), row("2026-11-06T21:00:00Z")], 0, NOW, true, null)).toEqual([]);
    expect(formatChoices([imaxStarted, fourDTomorrow], 0, NOW, true, null)).toEqual([]); // tonight's IMAX has started
    expect(formatChoices([], 0, NOW, true, null)).toEqual([]);
  });

  it("keeps the picked format so it can be cleared, even on a day without it", () => {
    expect(formatChoices([fourDTomorrow], 0, NOW, true, "IMAX")).toEqual(["IMAX"]);
  });

  it("on sample data (not live) counts the day's started showings too, as the lists do", () => {
    expect(formatChoices([imaxStarted], 0, NOW, false, null)).toEqual(["IMAX"]);
  });
});

describe("after midnight (D-54)", () => {
  // 01:30 on Saturday 7 Nov in Lagos.
  const LATE = "2026-11-07T00:30:00Z";
  const lateShow = row("2026-11-07T01:30:00Z"); // 02:30, the tail of Friday evening
  const saturday = row("2026-11-07T17:00:00Z");
  const sunday = row("2026-11-08T17:00:00Z");

  it("while a late show is still to start, today is still the evening that began yesterday", () => {
    expect(anchorFor([lateShow, saturday], LATE)).toBe(LATE);
    expect(showingOn([lateShow, saturday, sunday], 0, LATE).map((r) => r.at)).toEqual([lateShow.at]);
    expect(showingOn([lateShow, saturday, sunday], 1, LATE).map((r) => r.at)).toEqual([saturday.at]);
  });

  it("once the evening has nothing left, today is the new calendar day", () => {
    expect(showingOn([saturday, sunday], 0, LATE).map((r) => r.at)).toEqual([saturday.at]);
    expect(showingOn([saturday, sunday], 1, LATE).map((r) => r.at)).toEqual([sunday.at]);
    expect(showingOn([row("2026-11-06T23:00:00Z"), saturday], 0, LATE).map((r) => r.at)).toEqual([saturday.at]); // the 00:00 show has started
  });

  it("changes nothing from 04:00 on", () => {
    const morning = "2026-11-07T08:00:00Z";
    expect(anchorFor([saturday], morning)).toBe(morning);
  });

  it("dates each day by the evening its rows belong to", () => {
    const dates = (rows: ListRow[], now: string) => dayDates(rows, now).map(formatDate);
    // A late show is left: today is still Friday, and "Tomorrow" holds Saturday's rows.
    expect(dates([lateShow, saturday, sunday], LATE)).toEqual(["Fri 6 Nov", "Sat 7 Nov", "Sun 8 Nov", "Mon 9 Nov", "Tue 10 Nov"]);
    // Nothing left of Friday evening: today is Saturday.
    expect(dates([saturday, sunday], LATE)).toEqual(["Sat 7 Nov", "Sun 8 Nov", "Mon 9 Nov", "Tue 10 Nov", "Wed 11 Nov"]);
    expect(dates([saturday, sunday], NOW).slice(0, 2)).toEqual(["Fri 6 Nov", "Sat 7 Nov"]);
    expect(dates([saturday], "2026-11-07T03:00:00Z").slice(0, 2)).toEqual(["Sat 7 Nov", "Sun 8 Nov"]); // 04:00 on Saturday
  });
});
