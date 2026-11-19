import { describe, expect, it } from "vitest";
import { afterAnswer, cardDue, closeCard, FRESH, pageSeen, sheetDue, sheetShown, type GuideState } from "@/lib/homeScreen";
import { homeSteps } from "@/lib/wording/homeScreen";

// D-162: the Home Screen guide. A sheet on a second visit and a card at the end of Films; never on a
// first visit; "Not now" hides the sheet for 14 days, a second time for good; "Got it" ends it; ×
// ends the card.

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 19, 12);

describe("when the guide shows", () => {
  it("shows nothing on a first visit, then both on the second", () => {
    const first = pageSeen(FRESH, T0);
    expect(first.visits).toBe(1);
    expect(sheetDue(first, T0)).toBe(false);
    expect(cardDue(first)).toBe(false);
    // Another page 10 minutes later is the same visit; 30 minutes after the last page, a new one.
    const sameVisit = pageSeen(first, T0 + 10 * 60_000);
    expect(sameVisit.visits).toBe(1);
    const second = pageSeen(sameVisit, T0 + 40 * 60_000);
    expect(second.visits).toBe(2);
    expect(sheetDue(second, T0)).toBe(true);
    expect(cardDue(second)).toBe(true);
  });

  // Safari on an iPhone keeps a tab's session for days, so a visit is counted by the gap, not the session.
  it("counts a return to the same tab hours later as a new visit", () => {
    expect(pageSeen({ ...FRESH, visits: 1, seenAt: T0 }, T0 + 5 * 3_600_000).visits).toBe(2);
  });

  it("shows the sheet once a visit at most", () => {
    const shown = sheetShown({ ...FRESH, visits: 2 });
    expect(sheetDue(shown, T0)).toBe(false);
    expect(sheetDue(pageSeen(shown, T0 + 31 * 60_000), T0 + 31 * 60_000)).toBe(true);
  });

  it("hides the sheet for 14 days after Not now, then for good after a second Not now", () => {
    const due: GuideState = { ...FRESH, visits: 2 };
    const once = afterAnswer(due, "not-now", T0);
    expect(sheetDue(once, T0 + 13 * DAY)).toBe(false);
    expect(sheetDue(once, T0 + 14 * DAY)).toBe(true);
    const twice = afterAnswer(once, "not-now", T0 + 14 * DAY);
    expect(sheetDue(twice, T0 + 400 * DAY)).toBe(false);
  });

  it("ends the sheet after Got it, and leaves the card", () => {
    const done = afterAnswer({ ...FRESH, visits: 3 }, "got-it", T0);
    expect(sheetDue(done, T0 + 400 * DAY)).toBe(false);
    expect(cardDue(done)).toBe(true);
  });

  it("ends the card when it is closed, and leaves the sheet", () => {
    const closed = closeCard({ ...FRESH, visits: 2 });
    expect(cardDue(closed)).toBe(false);
    expect(sheetDue(closed, T0)).toBe(true);
  });

  it("stops both once the app is on the Home Screen", () => {
    const added = afterAnswer({ ...FRESH, visits: 2 }, "added", T0);
    expect(sheetDue(added, T0)).toBe(false);
    expect(cardDue(added)).toBe(false);
  });
});

describe("the steps", () => {
  it("iPhone: Share (under ••• on newer iPhones), Add to Home Screen, Add", () => {
    expect(homeSteps("ios").map((step) => step.title)).toEqual(["Tap Share", "Tap Add to Home Screen", "Tap Add"]);
    expect(homeSteps("ios")[0]!.note).toBe("On newer iPhones, it's under •••");
  });

  it("Android without Chrome's own offer: the browser's menu (⋮ in Chrome)", () => {
    expect(homeSteps("android").map((step) => step.title)).toEqual(["Open your browser's menu", "Tap Add to Home screen", "Tap Add"]);
  });
});
