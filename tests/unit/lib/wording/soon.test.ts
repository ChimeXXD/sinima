import { describe, expect, it } from "vitest";
import { KEPT, bookLabel, dayNote, dayTitle, laterNote, quietWords, rowLine, showMore, showingMeta, soonNote } from "@/lib/wording/soon";

// Words on Starting soon (Figma 204:7192 Default, 204:7931 Nothing in 2 hours). The sample clock
// is 17:30 Fri 13 Nov (Default) and 22:50 (Nothing in 2 hours).

const NOW = "2026-11-13T21:50:00Z"; // 22:50

describe("section notes", () => {
  it("counts the next 2 hours and says when booking closes (Figma)", () => {
    expect(soonNote({ count: 10, place: "Lekki" })).toBe("10 showings in Lekki · booking closes when a film starts");
    expect(soonNote({ count: 1, place: "Lagos" })).toBe("1 showing in Lagos · booking closes when a film starts");
  });
  it("counts the rest of tonight up to the last start (Figma: 14 more in Lekki until 22:45)", () => {
    expect(laterNote({ count: 14, place: "Lekki", last: "2026-11-13T21:45:00Z" })).toBe("14 more in Lekki until 22:45");
    expect(laterNote({ count: 1, place: "Lekki", last: "2026-11-13T21:45:00Z" })).toBe("1 more in Lekki at 22:45");
  });
  it("after midnight the last time says its day", () => {
    expect(laterNote({ count: 3, place: "Lekki", last: "2026-11-13T23:30:00Z" })).toBe("3 more in Lekki until 00:30 (Sat)");
  });
  it("Show 8 more", () => expect(showMore(8)).toBe("Show 8 more"));
  it("before the time is known the list is the day, by its date (rule 3)", () => {
    expect(dayTitle("2026-11-13T11:00:00Z")).toBe("Showings on Fri 13 Nov");
    expect(dayNote({ count: 24, place: "Lagos" })).toBe("24 showings in Lagos");
  });
  it("kept countdowns have their own heading", () => {
    expect(KEPT).toEqual({ title: "Your countdowns", note: "Kept on this phone until each film starts" });
  });
});

describe("showingMeta", () => {
  it("runtime, then the showing's format, then the rating (Figma cards)", () => {
    expect(showingMeta({ runtimeMin: 201, rating: null }, "IMAX 2D")).toBe("3 h 21 min · IMAX");
    expect(showingMeta({ runtimeMin: 109, rating: "18" }, null)).toBe("1 h 49 min · 18");
    expect(showingMeta({ runtimeMin: 120, rating: "15" }, null)).toBe("2 h 0 min · 15");
    expect(showingMeta({ runtimeMin: null, rating: "18" }, null)).toBe("18");
    expect(showingMeta({ runtimeMin: null, rating: null }, null)).toBe("Runtime not listed");
    expect(showingMeta({ runtimeMin: null, rating: null }, "MX4D")).toBe("MX4D");
  });
});

describe("bookLabel", () => {
  it("names the film, the time and whose site, with the day after midnight", () => {
    expect(bookLabel("Clayface", "2026-11-13T17:00:00Z", "Filmhouse")).toBe("Book Clayface at 18:00 on Filmhouse's site");
    expect(bookLabel("Clayface", "2026-11-13T23:30:00Z", "Filmhouse")).toBe("Book Clayface at 00:30 on Saturday on Filmhouse's site");
  });
});

describe("rowLine", () => {
  it("the cinema and how long until it starts (Figma: Filmworld Cinemas Idimu · starts in 50 min)", () => {
    expect(rowLine("Filmworld Cinemas Idimu", "2026-11-13T22:40:00Z", NOW)).toBe("Filmworld Cinemas Idimu · starts in 50 min");
    expect(rowLine("Filmworld Cinemas Idimu", "2026-11-13T21:50:30Z", NOW)).toBe("Filmworld Cinemas Idimu · starts now");
  });
});

describe("quietWords", () => {
  const base = { place: "Lekki", city: "Lagos", when: "tonight" as const, next: "Tomorrow" as const };
  it("nothing here or next door: Figma's words, word for word", () => {
    const words = quietWords({ ...base, quiet: { kind: "city", areas: ["Victoria Island", "Sangotedo"], left: 1, tomorrow: { at: "2026-11-14T09:00:00Z", film: "Ramayana: Rise of a Legend", cinema: "Filmhouse Circle Mall" } } });
    expect(words).toEqual({
      title: "Nothing starts in Lekki in the next 2 hours",
      body: "Nor in Victoria Island or Sangotedo. One showing is left in Lagos tonight:",
      tomorrow: "Tomorrow in Lekki starts at 10:00 with Ramayana at Filmhouse Circle Mall.",
      action: "See tomorrow in Lekki",
      note: "early night?",
    });
  });
  it("counts what is left in the city, and lists only the next three", () => {
    const quiet = { kind: "city" as const, areas: ["Victoria Island"], tomorrow: null };
    expect(quietWords({ ...base, quiet: { ...quiet, left: 3 } }).body).toBe("Nor in Victoria Island. 3 showings are left in Lagos tonight:");
    expect(quietWords({ ...base, quiet: { ...quiet, left: 7 } }).body).toBe("Nor in Victoria Island. 7 showings are left in Lagos tonight. The next three:");
    expect(quietWords({ ...base, quiet: { ...quiet, left: 0 } })).toMatchObject({ body: "Nor in Victoria Island. Nothing else is left in Lagos tonight.", tomorrow: null, action: null });
    expect(quietWords({ ...base, quiet: { kind: "city", areas: ["Victoria Island", "Lagos Island", "Surulere"], left: 0, tomorrow: null } }).body).toBe("Nor in Victoria Island, Lagos Island or Surulere. Nothing else is left in Lagos tonight.");
  });
  it("all of the city: nothing more tonight, tomorrow's first, and no button", () => {
    const words = quietWords({ ...base, place: "Lagos", quiet: { kind: "city", areas: [], left: 0, tomorrow: { at: "2026-11-14T09:00:00Z", film: "Clayface", cinema: "Filmhouse Ikota" } } });
    expect(words).toMatchObject({ title: "Nothing starts in Lagos in the next 2 hours", body: "Nothing more is showing in Lagos tonight.", tomorrow: "Tomorrow in Lagos starts at 10:00 with Clayface at Filmhouse Ikota.", action: null });
  });
  it("after midnight the next day is today", () => {
    const words = quietWords({ ...base, next: "Today", quiet: { kind: "city", areas: [], left: 0, tomorrow: { at: "2026-11-14T09:00:00Z", film: "Clayface", cinema: "Filmhouse Ikota" } } });
    expect(words).toMatchObject({ tomorrow: "Later today in Lekki starts at 10:00 with Clayface at Filmhouse Ikota.", action: "See later today in Lekki" });
  });
  it("soon next door: names the areas and counts their showings", () => {
    expect(quietWords({ ...base, quiet: { kind: "nearby", areas: ["Victoria Island"], left: 1 } })).toMatchObject({ body: "But Victoria Island has one in the next 2 hours:", tomorrow: null, action: null, note: null });
    expect(quietWords({ ...base, quiet: { kind: "nearby", areas: ["Victoria Island", "Sangotedo"], left: 5 } }).body).toBe("But Victoria Island and Sangotedo have 5 in the next 2 hours. The next three:");
  });
  it("more later here: when the next one starts; the rest of tonight is listed below", () => {
    expect(quietWords({ ...base, quiet: { kind: "later", next: { at: "2026-11-13T18:31:00Z", film: "Clayface", cinema: "Filmhouse Ikota" } } })).toEqual({
      title: "Nothing starts in Lekki in the next 2 hours",
      body: "The next one starts at 19:31: Clayface at Filmhouse Ikota.",
      tomorrow: null,
      action: null,
      note: null,
    });
  });
});
