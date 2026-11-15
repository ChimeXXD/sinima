import { describe, expect, it } from "vitest";
import { areaHeading, cardBody, cardLine, locality, nextAreaLine, quietTitle, quietWhy } from "@/lib/wording/areaPage";

// Words on an area's page (Figma Area 200:6420). The sample clock is 17:30 Fri 13 Nov.

describe("areaHeading", () => {
  it("names the kept cinemas, then the area's others (Figma Default)", () => {
    expect(areaHeading({ key: "saved", area: "Lekki" })).toEqual({ title: "Your cinemas in Lekki", note: "Saved on this phone" });
    expect(areaHeading({ key: "area", area: "Lekki", afterSaved: true, quiet: false })).toEqual({ title: "More cinemas in Lekki", note: "Soonest first" });
    expect(areaHeading({ key: "area", area: "Lekki", afterSaved: false, quiet: false })).toEqual({ title: "In Lekki", note: "Soonest first" });
  });
  it("with nothing left tonight, the neighbours lead, soonest first, and the area follows (Figma Nothing left tonight)", () => {
    expect(areaHeading({ key: "next", area: "Lagos Island", quiet: true })).toEqual({ title: "Next to Lagos Island", note: "Soonest first" });
    expect(areaHeading({ key: "next", area: "Lekki", quiet: false })).toEqual({ title: "Next to Lekki", note: null });
    expect(areaHeading({ key: "area", area: "Lagos Island", afterSaved: false, quiet: true })).toEqual({ title: "In Lagos Island", note: null });
  });
});

describe("locality", () => {
  it("is the last part of the address before the city, or the area's name", () => {
    expect(locality("The Rock Drive, off Bisola Durosinmi Etti Drive, Lekki Phase 1, Lagos", "Lekki")).toBe("Lekki Phase 1");
    expect(locality("Purple Mall, Freedom Way, Lekki Phase 1, Lagos (no street number found)", "Lekki")).toBe("Lekki Phase 1");
    expect(locality(null, "Lagos Island")).toBe("Lagos Island");
  });
});

describe("cardLine", () => {
  it("says the films left tonight and the formats (Figma Filmhouse Circle Mall)", () => {
    expect(cardLine({ films: 3, formats: ["IMAX"], when: "tonight", place: null, tomorrow: null })).toBe("3 films tonight · IMAX");
    expect(cardLine({ films: 1, formats: [], when: "tonight", place: null, tomorrow: null })).toBe("1 film tonight");
    expect(cardLine({ films: 2, formats: [], when: "today", place: null, tomorrow: null })).toBe("2 films today");
  });
  it("on a kept cinema, leads with where it is (Figma Filmhouse Lekki IMAX)", () => {
    expect(cardLine({ films: 3, formats: ["IMAX"], when: "tonight", place: "Lekki Phase 1", tomorrow: null })).toBe("Lekki Phase 1 · 3 films tonight");
  });
  it("with nothing left, says where it is and when tomorrow starts (Figma Blue Pictures)", () => {
    expect(cardLine({ films: 0, formats: [], when: "tonight", place: "Lagos Island", tomorrow: "2026-11-14T11:00:00Z" })).toBe("Lagos Island · tomorrow from 12:00");
    expect(cardLine({ films: 0, formats: [], when: "tonight", place: "Lagos Island", tomorrow: null })).toBe("Lagos Island");
  });
  it("after midnight, the next day is later today, not tomorrow", () => {
    expect(cardLine({ films: 0, formats: [], when: "tonight", place: "Lagos Island", tomorrow: "2026-11-14T11:00:00Z", next: "Later today" })).toBe("Lagos Island · later today from 12:00");
    expect(cardBody({ listed: true, when: "tonight", tomorrow: { films: 7, from: "2026-11-14T11:00:00Z" }, date: "Sat 14 Nov", next: "Later today" })).toBe("Nothing more tonight. Later today: 7 films from 12:00.");
  });
  it("has no word that depends on the clock before the page knows the time (rule 3)", () => {
    expect(cardLine({ films: 4, formats: [], when: null, place: null, tomorrow: "2026-11-14T11:00:00Z" })).toBe("4 films");
    expect(cardLine({ films: 0, formats: [], when: null, place: "Lekki", tomorrow: null })).toBe("Lekki");
  });
});

describe("cardBody", () => {
  it("with nothing left tonight, says what tomorrow holds (Figma)", () => {
    expect(cardBody({ listed: true, when: "tonight", tomorrow: { films: 7, from: "2026-11-14T11:00:00Z" }, date: "Fri 13 Nov" })).toBe("Nothing more tonight. Tomorrow: 7 films from 12:00.");
    expect(cardBody({ listed: true, when: "today", tomorrow: { films: 1, from: "2026-11-14T11:00:00Z" }, date: "Fri 13 Nov" })).toBe("Nothing more today. Tomorrow: 1 film from 12:00.");
    expect(cardBody({ listed: true, when: "tonight", tomorrow: null, date: "Fri 13 Nov" })).toBe("Nothing more tonight.");
  });
  it("says when the times cannot be read, and the date before the page knows the time", () => {
    expect(cardBody({ listed: false, when: "tonight", tomorrow: null, date: "Fri 13 Nov" })).toBe("Times not available yet");
    expect(cardBody({ listed: true, when: null, tomorrow: null, date: "Fri 13 Nov" })).toBe("No times on Fri 13 Nov.");
  });
});

describe("nextAreaLine", () => {
  it("says how many cinemas and the soonest (Figma)", () => {
    expect(nextAreaLine({ cinemas: 4, next: { at: "2026-11-13T16:40:00Z", name: "EbonyLife Cinemas" }, listed: true, when: "tonight" })).toBe("4 cinemas · next 17:40 at EbonyLife Cinemas");
    expect(nextAreaLine({ cinemas: 1, next: { at: "2026-11-13T17:10:00Z", name: "Sky Cinemas Sangotedo" }, listed: true, when: "tonight" })).toBe("1 cinema · next 18:10 at Sky Cinemas Sangotedo");
  });
  it("says first before the page knows the time, and when nothing is left or nothing can be read", () => {
    expect(nextAreaLine({ cinemas: 2, next: { at: "2026-11-13T11:00:00Z", name: "Ozone Cinemas" }, listed: true, when: null })).toBe("2 cinemas · first 12:00 at Ozone Cinemas");
    expect(nextAreaLine({ cinemas: 2, next: null, listed: true, when: "tonight" })).toBe("2 cinemas · nothing more tonight");
    expect(nextAreaLine({ cinemas: 1, next: null, listed: false, when: "tonight" })).toBe("1 cinema · times not available yet");
    expect(nextAreaLine({ cinemas: 1, next: null, listed: true, when: null })).toBe("1 cinema");
  });
});

describe("the quiet state", () => {
  it("says nothing more starts tonight (Figma)", () => {
    expect(quietTitle("Lagos Island", "tonight")).toBe("Nothing more starts in Lagos Island tonight");
    expect(quietTitle("Ikeja", "today")).toBe("Nothing more starts in Ikeja today");
  });
  it("says whose showing was last and that the areas next to it still have times (Figma)", () => {
    const last = { name: "Blue Pictures Cinemas City Mall", at: "2026-11-13T18:00:00Z" };
    expect(quietWhy({ last, cinemas: 1, neighbours: 3, neighboursWithTimes: 3, when: "tonight" })).toBe("Blue Pictures Cinemas City Mall's last showing began at 19:00. The areas next to it still have times tonight.");
  });
  it("with several cinemas, names the last; with one neighbour, says so; with none left nearby, says that", () => {
    const last = { name: "Filmhouse Ikota", at: "2026-11-13T21:45:00Z" };
    expect(quietWhy({ last, cinemas: 6, neighbours: 1, neighboursWithTimes: 1, when: "tonight" })).toBe("The last showing here began at 22:45, at Filmhouse Ikota. The area next to it still has times tonight.");
    expect(quietWhy({ last, cinemas: 6, neighbours: 2, neighboursWithTimes: 0, when: "tonight" })).toBe("The last showing here began at 22:45, at Filmhouse Ikota. Nothing more starts next to it tonight either.");
    expect(quietWhy({ last: null, cinemas: 2, neighbours: 2, neighboursWithTimes: 2, when: "today" })).toBe("No cinema here has a showing today. The areas next to it still have times today.");
  });
  it("when only some of the areas next to it still have times, says how many", () => {
    const last = { name: "Filmhouse Ikota", at: "2026-11-13T21:45:00Z" };
    expect(quietWhy({ last, cinemas: 6, neighbours: 3, neighboursWithTimes: 1, when: "tonight" })).toBe("The last showing here began at 22:45, at Filmhouse Ikota. One area next to it still has times tonight.");
    expect(quietWhy({ last, cinemas: 6, neighbours: 3, neighboursWithTimes: 2, when: "tonight" })).toBe("The last showing here began at 22:45, at Filmhouse Ikota. 2 areas next to it still have times tonight.");
  });
});
