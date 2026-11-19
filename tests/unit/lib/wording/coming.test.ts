import { afterEach, describe, expect, it } from "vitest";
import { calendarAction, COMING_SECTION, comingCalendar, leafWords, opensChip, opensLine, timesNotUp } from "@/lib/wording/coming";

// Coming soon's words (D-151): the section on Films, each card's line and date sticker, and a coming
// film's page. A date is the sinima's own, a Lagos date ("2026-12-18"), shown in Lagos whatever the
// device's zone; a film with no date says "Date not announced", never a guess (rule 8).

const realTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = realTz;
});

describe("the Coming soon section on Films", () => {
  it("has the approved heading, line and handwritten note", () => {
    expect(COMING_SECTION).toEqual({ title: "Coming soon", note: "First dates from the sinimas' own pages", hand: "save the date!" });
  });
});

describe("opensLine: the card's line under the title", () => {
  it("names the first date as the sinima gives it", () => {
    expect(opensLine("2026-12-18")).toBe("Opens Fri 18 Dec");
    expect(opensLine("2026-11-22")).toBe("Opens Sun 22 Nov");
  });
  it("says so when the sinima gives no date", () => {
    expect(opensLine(null)).toBe("Date not announced");
  });
  it("keeps the Lagos date on a phone in another zone", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(opensLine("2026-12-18")).toBe("Opens Fri 18 Dec");
    process.env.TZ = "Pacific/Kiritimati";
    expect(opensLine("2026-12-18")).toBe("Opens Fri 18 Dec");
  });
});

describe("leafWords: the calendar-leaf sticker", () => {
  it("gives the month short over the day of the month", () => {
    expect(leafWords("2026-12-18")).toEqual({ month: "Dec", day: "18" });
    expect(leafWords("2027-01-02")).toEqual({ month: "Jan", day: "2" });
  });
});

describe("a coming film's page", () => {
  it("the chip says when and where it opens", () => {
    expect(opensChip("2026-12-18", ["Filmhouse"])).toBe("Opens Fri 18 Dec at Filmhouse");
    expect(opensChip("2026-12-18", ["Filmhouse", "Genesis"])).toBe("Opens Fri 18 Dec at Filmhouse and Genesis");
    expect(opensChip(null, ["Filmhouse"])).toBe("Coming to Filmhouse, date not announced");
  });

  it("says plainly that the times aren't up, whose they will be and when they start", () => {
    expect(timesNotUp("Avengers: Doomsday", ["Filmhouse"], "2026-12-18")).toBe(
      "Times aren't up yet. Filmhouse lists Avengers: Doomsday from Fri 18 Dec; its times will show here as soon as Filmhouse puts them up.",
    );
    expect(timesNotUp("Dune: Part Three", ["Filmhouse", "Genesis"], "2026-12-20")).toBe(
      "Times aren't up yet. Filmhouse and Genesis list Dune: Part Three from Sun 20 Dec; their times will show here as soon as they put them up.",
    );
    expect(timesNotUp("The Four", ["Filmhouse"], null)).toBe("Times aren't up yet. Filmhouse lists The Four as coming soon, with no date yet; its times will show here as soon as Filmhouse puts them up.");
  });

  it("the calendar button names the day", () => {
    expect(calendarAction("2026-12-18")).toBe("Add 18 Dec to my calendar");
    expect(calendarAction("2027-01-02")).toBe("Add 2 Jan to my calendar");
  });

  it("the calendar event: what it says, the alert and the file's name", () => {
    expect(comingCalendar({ film: "Avengers: Doomsday", filmId: "avengers-doomsday", sinimas: ["Filmhouse"], firstDay: "2026-12-18", city: "lagos", url: "https://sinima.com.ng/lagos/film/avengers-doomsday" })).toEqual({
      uid: "opens-lagos-avengers-doomsday@sinima",
      day: "2026-12-18",
      summary: "Avengers: Doomsday opens at Filmhouse",
      description: "Filmhouse lists Avengers: Doomsday from Fri 18 Dec. Its times will be on Sinima as soon as Filmhouse puts them up: https://sinima.com.ng/lagos/film/avengers-doomsday",
      alert: "Avengers: Doomsday opens today at Filmhouse",
      fileName: "avengers-doomsday-opens-2026-12-18.ics",
    });
  });
});
