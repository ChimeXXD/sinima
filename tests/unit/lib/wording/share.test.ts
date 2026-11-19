import { describe, expect, it } from "vitest";
import { CARD_LINE, CARD_NOTE, cardTitleSize, filmShare, SITE_CARD_WORDS, SITE_SHARE } from "@/lib/wording/share";

// The words of a shared link's preview: the card picture (D-149) and the title and description
// WhatsApp and X print under it. Chats keep a link's picture for days, so nothing on a card or in its
// words may go stale: never a count, a time or "today" (D-149).

const STALE = /\d|\btoday\b|\btomorrow\b|\bnow\b|\bAM\b|\bPM\b/i;

describe("a film's share words", () => {
  it("names the film and the city, in Sinima's plain voice", () => {
    expect(filmShare("Ghost Soldier", "lagos")).toEqual({
      title: "Ghost Soldier: showtimes in Lagos · Sinima",
      description: "Every showing at every sinima in Lagos, with times and where to book.",
      alt: "Ghost Soldier in Lagos, on Sinima: every showing at every sinima, in one place.",
    });
  });

  it("says Abuja on Abuja's page", () => {
    expect(filmShare("Loving Itohan", "abuja").title).toBe("Loving Itohan: showtimes in Abuja · Sinima");
    expect(filmShare("Loving Itohan", "abuja").description).toContain("in Abuja");
  });

  it("never adds a count, a time or 'today' of its own", () => {
    for (const words of Object.values(filmShare("Ghost Soldier", "lagos"))) expect(words).not.toMatch(STALE);
  });
});

describe("the site's own share words", () => {
  it("has a title, a description and the card's alt text", () => {
    expect(SITE_SHARE.title).toBe("Sinima: what's on in Lagos & Abuja");
    expect(SITE_SHARE.description).toBe("What's starting soon at Lagos and Abuja sinimas, and should you stay after the credits?");
    expect(SITE_SHARE.alt).toBe("What's on in Lagos & Abuja, on Sinima.");
  });

  it("never carries a count, a time or 'today'", () => {
    for (const words of [...Object.values(SITE_SHARE), ...Object.values(SITE_CARD_WORDS)]) expect(words).not.toMatch(STALE);
  });
});

describe("the words drawn on the cards (D-149)", () => {
  it("are the approved lines", () => {
    expect(CARD_LINE).toBe("Every showing at every sinima, in one place.");
    expect(CARD_NOTE).toBe("who's coming?");
    expect(SITE_CARD_WORDS).toEqual({ lead: "What's on in", circled: "Lagos", rest: "& Abuja", note: "tonight!" });
    expect(CARD_LINE).not.toMatch(STALE);
    expect(CARD_NOTE).not.toMatch(STALE);
  });

  it.each([
    ["Ghost Soldier", 96],
    ["DUNE: PART THREE", 96], // 16 characters: still 96
    ["How to Rob a Bank", 80], // 17: longer than 16
    ["Maybe… Maybe Not", 96], // the ellipsis is one character
    ["The Hunger Games: Sunrise on the Reaping", 80],
  ])("title %s is %i px", (title, size) => {
    expect(cardTitleSize(title)).toBe(size);
  });
});
