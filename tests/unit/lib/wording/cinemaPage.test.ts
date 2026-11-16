import { describe, expect, it } from "vitest";
import { SAVED_TOAST, dayOption, earlierLine, filmsNote, filmsTitle, noFilms, notListedYet, ticketsFooter } from "@/lib/wording/cinemaPage";

// Words on a cinema's page (Figma Cinema 202:7192). The sample clock is 5:30 PM Fri 13 Nov.

const FRI = "2026-11-13T11:00:00Z";
const SAT = "2026-11-14T11:00:00Z";

describe("filmsTitle", () => {
  it("names tonight, today or tomorrow once the page knows the time", () => {
    expect(filmsTitle({ day: 0, when: "tonight", date: FRI })).toBe("Films tonight");
    expect(filmsTitle({ day: 0, when: "today", date: FRI })).toBe("Films today");
    expect(filmsTitle({ day: 1, when: "tonight", date: SAT })).toBe("Films tomorrow");
  });
  it("names the date before it knows the time (rule 3)", () => {
    expect(filmsTitle({ day: 0, when: null, date: FRI })).toBe("Films on Fri 13 Nov");
  });
});

describe("filmsNote", () => {
  it("counts today's films and those still to start (Figma)", () => {
    expect(filmsNote({ day: 0, live: true, total: 4, left: 3, warning: null })).toBe("4 films today · 3 still to start");
    expect(filmsNote({ day: 0, live: true, total: 1, left: 1, warning: null })).toBe("1 film today · 1 still to start");
    expect(filmsNote({ day: 0, live: true, total: 4, left: 0, warning: null })).toBe("4 films today · all started");
  });
  it("with times from yesterday, says so instead (Figma Times a day old)", () => {
    expect(filmsNote({ day: 0, live: true, total: 3, left: 3, warning: "Times from yesterday" })).toBe("3 films · times from yesterday");
  });
  it("counts the films for tomorrow, and before the time is known", () => {
    expect(filmsNote({ day: 1, live: true, total: 2, left: 2, warning: null })).toBe("2 films");
    expect(filmsNote({ day: 0, live: false, total: 5, left: 5, warning: null })).toBe("5 films");
  });
});

describe("dayOption", () => {
  it("says the day and its date (Figma: Today · Fri 13)", () => {
    expect(dayOption({ day: 0, date: FRI, live: true })).toBe("Today · Fri 13");
    expect(dayOption({ day: 1, date: SAT, live: true })).toBe("Tomorrow · Sat 14");
  });
  it("is only the date before the page knows the time", () => {
    expect(dayOption({ day: 0, date: FRI, live: false })).toBe("Fri 13 Nov");
  });
});

describe("notListedYet", () => {
  it("names the chain and the day it hasn't listed (Figma)", () => {
    expect(notListedYet("Filmhouse", "2026-11-15T11:00:00Z")).toBe("Filmhouse hasn't listed Sunday yet.");
  });
});

describe("earlierLine", () => {
  it("says when a film's times started today, and tomorrow's (Figma Agbara Nla)", () => {
    expect(earlierLine(["2026-11-13T13:00:00Z", "2026-11-13T15:50:00Z"], ["2026-11-14T13:00:00Z", "2026-11-14T15:50:00Z"])).toBe("Started earlier today at 2:00\u00a0PM and 4:50\u00a0PM. Tomorrow at 2:00\u00a0PM and 4:50\u00a0PM.");
    expect(earlierLine(["2026-11-13T13:00:00Z"], [])).toBe("Started earlier today at 2:00\u00a0PM.");
    expect(earlierLine(["2026-11-13T22:00:00Z"], ["2026-11-14T13:00:00Z"], "Today")).toBe("Started earlier today at 11:00\u00a0PM. Later today at 2:00\u00a0PM.");
  });
});

describe("ticketsFooter and the toast", () => {
  it("says who sells the tickets (Figma)", () => {
    expect(ticketsFooter({ chain: "Filmhouse", name: "Filmhouse Lekki IMAX", online: true })).toBe("Filmhouse sells the tickets. Sinima only shows the times and sends you to their site.");
    expect(ticketsFooter({ chain: "THC", name: "THC Cinemas Agege", online: false })).toBe("THC Cinemas Agege sells the tickets at the cinema. Sinima only shows the times.");
  });
  it("tells a visitor the save stays on this phone (Figma Saved)", () => {
    expect(SAVED_TOAST).toBe("Saved to Your cinemas. Only on this phone.");
  });
});

describe("noFilms", () => {
  it("says when a day has no times, by its date before the time is known", () => {
    expect(noFilms({ day: 1, live: true, date: SAT })).toBe("No times listed for tomorrow yet.");
    expect(noFilms({ day: 0, live: true, date: FRI })).toBe("No times listed today.");
    expect(noFilms({ day: 0, live: false, date: FRI })).toBe("No times on Fri 13 Nov.");
  });
});
