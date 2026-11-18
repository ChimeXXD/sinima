import { describe, expect, it } from "vitest";
import { filmCount, formatNote, nothingMoreToday, sectionWords } from "@/lib/wording/films";

// Words on the Films screen (Figma 175:3480: Default, IMAX chosen, Nothing more today).

describe("sectionWords", () => {
  it.each([
    [{ key: "soon", count: 16 }, "Now showing", "16 films start in the next 2 hours"],
    [{ key: "soon", count: 1 }, "Now showing", "1 film starts in the next 2 hours"],
    [{ key: "later", count: 4, later: "Later tonight" }, "Later tonight", "4 films"],
    [{ key: "format", count: 1, format: "IMAX", on: "today", city: "Lagos" }, "In IMAX", "1 film in Lagos today"],
    [{ key: "day", count: 30, on: "tomorrow", live: true }, "Tomorrow", "30 films"],
    [{ key: "day", count: 16, on: "on Fri 13 Nov", live: false }, "Now showing", "16 films on Fri 13 Nov"],
  ] as const)("%j", (input, title, note) => {
    expect(sectionWords(input)).toEqual({ title, note });
  });
});

describe("formatNote (IMAX chosen)", () => {
  it("is Figma's sentence for one chain and many silent cinemas", () => {
    expect(formatNote(["Filmhouse"], 13)).toBe("Only Filmhouse says which format each showing is in. 13 sinimas don't, so they're left out here; their times are under Any format.");
  });
  it("agrees in number", () => {
    expect(formatNote(["Filmhouse", "Genesis"], 1)).toBe("Only Filmhouse and Genesis say which format each showing is in. 1 sinima doesn't, so it's left out here; its times are under Any format.");
  });
  it("says nothing when every cinema gives its formats", () => {
    expect(formatNote(["Filmhouse"], 0)).toBeNull();
  });
});

describe("nothingMoreToday", () => {
  it("is Figma's empty state when tomorrow's times are in", () => {
    expect(nothingMoreToday({ city: "Lagos", last: "2026-11-13T22:40:00Z", tomorrowFilms: 30, tomorrowFirst: "2026-11-14T09:00:00Z" })).toEqual({
      title: "Nothing more starts today",
      body: "The last showing in Lagos began at 11:40\u00a0PM. Tomorrow's times are in: 30 films from 10:00\u00a0AM.",
      action: "See tomorrow",
      note: "see you tomorrow!",
    });
  });
  it("does not offer tomorrow when its times are not in", () => {
    const words = nothingMoreToday({ city: "Lagos", last: "2026-11-13T22:40:00Z", tomorrowFilms: 0, tomorrowFirst: null });
    expect(words.body).toBe("The last showing in Lagos began at 11:40\u00a0PM. Tomorrow's times aren't in yet.");
    expect(words.action).toBeNull();
  });
});

it("filmCount", () => {
  expect(filmCount(1)).toBe("1 film");
  expect(filmCount(0)).toBe("0 films");
});
