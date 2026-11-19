import { describe, expect, it } from "vitest";
import type { Metadata } from "next";
import { CARD_SIZE, filmCard, filmMeta, pageMeta, SITE_CARD, SITE_URL, siteMeta } from "@/lib/share/meta";

// Which picture a shared link shows (D-149): a film's page points at its own card, made for that
// film in that city; every other page points at the site's own card. The addresses are relative
// here; `metadataBase` (https://sinima.com.ng) makes them absolute in the HTML.

type Image = { url: string | URL; width?: number | string; height?: number | string; alt?: string };
const ogImages = (meta: Metadata): Image[] => {
  const images = meta.openGraph?.images;
  return (Array.isArray(images) ? images : images ? [images] : []) as Image[];
};

describe("card addresses", () => {
  it("one card per film per city, as a PNG under /og/", () => {
    expect(filmCard("lagos", "ghost-soldier")).toBe("/og/lagos/ghost-soldier.png");
    expect(filmCard("abuja", "loving-itohan")).toBe("/og/abuja/loving-itohan.png");
  });

  it("the site's own card", () => {
    expect(SITE_CARD).toBe("/og/site.png");
  });

  it("are 1200 × 630, what WhatsApp and X show", () => {
    expect(CARD_SIZE).toEqual({ width: 1200, height: 630 });
  });
});

describe("a film's page", () => {
  const meta = filmMeta({ id: "ghost-soldier", title: "Ghost Soldier" }, "lagos");

  it("points at its own card, with its size and alt text", () => {
    expect(ogImages(meta)).toEqual([{ url: "/og/lagos/ghost-soldier.png", width: 1200, height: 630, alt: "Ghost Soldier in Lagos, on Sinima: every showing at every sinima, in one place." }]);
  });

  it("keeps its page title and gives the share title and description", () => {
    expect(meta.title).toBe("Ghost Soldier · Sinima");
    expect(meta.description).toBe("Every showing at every sinima in Lagos, with times and where to book.");
    expect(meta.openGraph?.title).toBe("Ghost Soldier: showtimes in Lagos · Sinima");
    expect(meta.openGraph?.description).toBe("Every showing at every sinima in Lagos, with times and where to book.");
    expect(meta.openGraph?.url).toBe("/lagos/film/ghost-soldier");
  });

  it("a title Urbanist can't draw gets the site's card and its alt text, as the card route draws", () => {
    expect(ogImages(filmMeta({ id: "kimi-no-na-wa", title: "君の名は。" }, "lagos"))).toEqual([{ url: "/og/site.png", width: 1200, height: 630, alt: "What's on in Lagos & Abuja, on Sinima." }]);
  });

  it("an Abuja film page points at Abuja's card", () => {
    expect(ogImages(filmMeta({ id: "ghost-soldier", title: "Ghost Soldier" }, "abuja"))[0]?.url).toBe("/og/abuja/ghost-soldier.png");
  });
});

describe("every other page", () => {
  it("points at the site's card, under its own title", () => {
    const meta = pageMeta("Sinimas in Lagos · Sinima");
    expect(meta.title).toBe("Sinimas in Lagos · Sinima");
    expect(meta.openGraph?.title).toBe("Sinimas in Lagos · Sinima");
    expect(ogImages(meta)).toEqual([{ url: "/og/site.png", width: 1200, height: 630, alt: "What's on in Lagos & Abuja, on Sinima." }]);
  });

  it("the site's defaults: the address, the site card and X's large card", () => {
    const meta = siteMeta();
    expect(SITE_URL).toBe("https://sinima.com.ng");
    expect(String(meta.metadataBase)).toBe("https://sinima.com.ng/");
    expect(ogImages(meta)[0]?.url).toBe("/og/site.png");
    expect(meta.openGraph?.siteName).toBe("Sinima");
    expect(meta.openGraph?.title).toBe("Sinima: what's on in Lagos & Abuja");
    expect(meta.twitter).toEqual({ card: "summary_large_image" });
  });
});
