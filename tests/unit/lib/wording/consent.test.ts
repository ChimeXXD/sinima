import { describe, expect, it } from "vitest";
import { CONSENT, PRIVACY } from "@/lib/wording/consent";

// The banner and About › Privacy, word for word from the approved mockup (mockup/consent/, D-191).
// Sinima sets no cookies, so nothing here may say it does.

describe("the banner", () => {
  it("asks to count the visit, honestly", () => {
    expect(CONSENT.title).toBe("Cookies? Not here.");
    expect(CONSENT.body).toBe("Can we count your visit instead? We’d see which films get opened, never who you are.");
    expect(CONSENT.no).toBe("No thanks");
    expect(CONSENT.sure).toBe("Sure");
    expect(CONSENT.label).toBe("Counting visits");
  });
  it("folds into a note that says what happened", () => {
    expect(CONSENT.noteYes).toBe("Thanks! Your visit counts");
    expect(CONSENT.noteNo).toBe("Not counted · change it in About");
  });
});

describe("About › Privacy", () => {
  it("says what is kept, where, and what is never done", () => {
    expect(PRIVACY.title).toBe("Privacy");
    expect(PRIVACY.facts.map((fact) => fact.title)).toEqual(["No cookies", "Your picks stay on your phone", "Location"]);
    expect(PRIVACY.facts[0]!.body).toBe("Sinima doesn’t set any. Not one.");
    expect(PRIVACY.countTitle).toBe("Counting visits");
    expect(PRIVACY.countBody).toContain("Vercel Web Analytics");
  });
  it("names the switch by what it will do", () => {
    expect(PRIVACY.state("yes")).toBe("On, on this phone");
    expect(PRIVACY.state("no")).toBe("Off, on this phone");
    expect(PRIVACY.state(null)).toBe("Off, on this phone");
    expect(PRIVACY.action("yes")).toBe("Stop counting");
    expect(PRIVACY.action("no")).toBe("Count my visits");
    expect(PRIVACY.toast("yes")).toBe("Visits will be counted");
    expect(PRIVACY.toast("no")).toBe("Visits won’t be counted");
  });
  it("never claims a cookie", () => {
    const all = JSON.stringify({ CONSENT, PRIVACY: { ...PRIVACY, state: 0, action: 0, toast: 0 } });
    expect(all).not.toMatch(/we use cookies|uses cookies|accept cookies/i);
  });
});
