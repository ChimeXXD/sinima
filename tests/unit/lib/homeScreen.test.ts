import { describe, expect, it } from "vitest";
import { afterAnswer, cardDue, closeCard, FRESH, pageSeen, sheetDue, sheetShown, type GuideState } from "@/lib/homeScreen";
import { homeBrowser, homeSteps } from "@/lib/wording/homeScreen";

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

describe("the steps (D-163: each browser's own Share)", () => {
  it("Safari on an iPhone: More (•••), then Share, Add to Home Screen, Add", () => {
    expect(homeSteps("safari").map((step) => step.title)).toEqual(["Tap More (•••), then Share", "Tap Add to Home Screen", "Tap Add"]);
    expect(homeSteps("safari")[0]!.note).toBe("Older iPhones: Share is in the bar");
  });

  it("Chrome on an iPhone: Share at the top", () => {
    expect(homeSteps("chrome-ios").map((step) => step.title)).toEqual(["Tap Share", "Tap Add to Home Screen", "Tap Add"]);
    expect(homeSteps("chrome-ios")[0]!.note).toBe("Next to the address bar"); // it can sit at the top or the bottom
  });

  it("Android without Chrome's own offer: the browser's menu (⋮ in Chrome)", () => {
    expect(homeSteps("android").map((step) => step.title)).toEqual(["Open your browser's menu", "Tap Add to Home screen", "Tap Add"]);
  });

  it("reads the browser from the user agent: CriOS is Chrome on an iPhone", () => {
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";
    expect(homeBrowser(`${iphone} Version/18.5 Mobile/15E148 Safari/604.1`)).toBe("safari");
    expect(homeBrowser(`${iphone} CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1`)).toBe("chrome-ios");
    expect(homeBrowser("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36")).toBe("android");
  });

  it("an iPad, and another iPhone browser, each get their own first step", () => {
    expect(homeSteps("ipad")[0]).toMatchObject({ title: "Tap Share", note: "At the top right, or under •••" });
    expect(homeSteps("other-ios")[0]).toMatchObject({ title: "Tap Share", note: "In your browser's menu or bar" });
  });
});

describe("homeBrowser", () => {
  const iPhone = (tail: string) => `Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${tail}`;
  it("tells the iPhone's browsers apart", () => {
    expect(homeBrowser(iPhone("Version/18.5 Mobile/15E148 Safari/604.1"))).toBe("safari");
    expect(homeBrowser(iPhone("CriOS/141.0 Mobile/15E148 Safari/604.1"))).toBe("chrome-ios");
    expect(homeBrowser(iPhone("FxiOS/140.0 Mobile/15E148 Safari/605.1.15"))).toBe("other-ios");
    expect(homeBrowser(iPhone("EdgiOS/140.0 Mobile/15E148 Safari/605.1.15"))).toBe("other-ios");
  });

  it("tells an iPad (which says Macintosh) from a Mac by touch", () => {
    const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
    expect(homeBrowser(mac, true)).toBe("ipad");
    expect(homeBrowser(mac, false)).toBe("safari");
  });

  it("gives no browser inside Instagram's or Facebook's own browser: no guide there", () => {
    expect(homeBrowser(iPhone("Mobile/15E148 Instagram 400.0.0.0"))).toBeNull();
    expect(homeBrowser(iPhone("Mobile/15E148 [FBAN/FBIOS;FBAV/500.0]"))).toBeNull();
  });

  it("Android", () => {
    expect(homeBrowser("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36")).toBe("android");
  });
});
