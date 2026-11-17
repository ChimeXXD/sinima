import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseReachDay, parseReachTabs, reachDayUrl, reachTabSelector, readReach } from "../../../../scripts/sources/reach";

// The Reach Cinema platform (Fusion Intelligence, D-125): Ozone, Viva and Nova show each day on its
// own address (?cinemaId=…&date=Tue+Nov+17+2026) with the day as the highlighted slide; Sky shows
// its days as tabs a visitor taps. Rendered once each on 17 Nov 2026 (02:38-02:44 in Lagos) through
// politeBrowser and cut down (D-24); Ozone's 18 Nov page was rendered at 02:38 from its dated address. Times are on a 12-hour clock ("01:00 PM").
const fixture = (path: string) => readFileSync(join(import.meta.dirname, `../../../fixtures/${path}`), "utf8");
const nov17 = { year: 2026, month: 11, day: 17 };
const nov18 = { year: 2026, month: 11, day: 18 };
const OZONE = "https://ozone.reachcinema.io/showtimes?cinemaId=ozo-a4239533";
const SKY = "https://skycinemas.reachcinema.io/showtimes";
const ozone = (html = fixture("reachcinema/2026-11-17-ozone.html"), day = nov17, name = "Ozone Cinemas") =>
  parseReachDay(html, { cinemaId: "ozone-yaba", day, name, origin: "https://ozone.reachcinema.io" });
const sky = (html: string, day = nov17) => parseReachTabs(html, { cinemaId: "sky-sangotedo", day, name: "Sky Cinema", origin: "https://skycinemas.reachcinema.io" });

describe("reachDayUrl", () => {
  it("is the address a visitor opens for that day, as the site's own date slides write it", () => {
    expect(reachDayUrl(OZONE, nov18)).toBe("https://ozone.reachcinema.io/showtimes?cinemaId=ozo-a4239533&date=Wed+Nov+18+2026");
    expect(reachDayUrl(OZONE, { year: 2026, month: 12, day: 7 })).toBe("https://ozone.reachcinema.io/showtimes?cinemaId=ozo-a4239533&date=Mon+Dec+07+2026");
  });
});

describe("parseReachDay (dated slides: Ozone, Viva, Nova)", () => {
  it("reads Ozone's 20 times on 17 Nov into UTC, with each film's rating and its Book Now page", () => {
    const rows = ozone();
    expect(rows).toHaveLength(20);
    expect(rows[0]).toEqual({
      cinemaId: "ozone-yaba", filmTitle: "The Cat in the Hat", rating: "12A", startsAt: "2026-11-17T10:00:00Z", format: null,
      bookingUrl: "https://ozone.reachcinema.io/movies/a90e52e6-b83f-4d34-81ac-1b4f50cf1f43",
    });
    expect(rows.filter((r) => r.filmTitle === "Ghost Soldier").map((r) => r.startsAt)).toEqual(["2026-11-17T11:00:00Z", "2026-11-17T15:00:00Z"]);
    expect(rows.find((r) => r.filmTitle === "Dear Ajayi")?.rating).toBe("15");
  });

  it("reads a rating the platform gives as N/A as none", () => {
    const html = fixture("reachcinema/2026-11-17-ozone.html").replace("<span>12A</span>", "<span>N/A</span>");
    expect(ozone(html)[0]?.rating).toBeNull();
  });

  it("reads Viva Ikeja's 19 times, and Nova Lagos's 26 and Nova Abuja's 23 from the same platform", () => {
    const read = (path: string, cinemaId: string, name: string, origin: string) => parseReachDay(fixture(path), { cinemaId, day: nov17, name, origin });
    expect(read("viva/2026-11-17-ikeja.html", "viva-ikeja", "Viva Ikeja", "https://web.vivacinemas.com")).toHaveLength(19);
    expect(read("nova/2026-11-17-lagos.html", "nova-lagos", "Nova Lagos", "https://novacinemang.com")).toHaveLength(26);
    const abuja = read("nova/2026-11-17-abuja.html", "nova-abuja", "Nova Abuja", "https://novacinemang.com");
    expect(abuja).toHaveLength(23);
    for (const row of abuja) expect(row.bookingUrl).toMatch(/^https:\/\/novacinemang\.com\/movies\/[0-9a-f-]{36}$/);
  });

  it("puts a show after midnight on the night it is listed under", () => {
    const html = fixture("reachcinema/2026-11-17-ozone.html").replace(">08:10 PM<", ">12:10 AM<");
    expect(ozone(html).find((r) => r.filmTitle === "Clayface")?.startsAt).toBe("2026-11-17T23:10:00Z");
  });

  it("reads a day with nothing on (Viva Lekki's page) as no showings", () => {
    expect(parseReachDay(fixture("viva/2026-11-17-lekki-empty.html"), { cinemaId: "viva-ikeja", day: nov17, name: "Viva Lekki", origin: "https://web.vivacinemas.com" })).toEqual([]);
  });

  it("refuses a page that shows another day, another cinema, or no date slides", () => {
    expect(() => ozone(undefined, nov18)).toThrow('Reach page for ozone-yaba: the page shows "Nov 17 Tue", not "Nov 18 Wed".');
    expect(() => ozone(undefined, nov17, "Nova Lagos")).toThrow('Reach page for ozone-yaba: the page shows "Ozone Cinemas", not "Nova Lagos".');
    expect(() => ozone("<main><ul><li><section><p>Film</p></section></li></ul></main>")).toThrow("Reach page for ozone-yaba: no date slides found. Has the page layout changed?");
  });

  it("refuses a time it can't read or a Book Now link that is not a film page on the site", () => {
    expect(() => ozone(fixture("reachcinema/2026-11-17-ozone.html").replace(">11:00 AM<", ">11h00<"))).toThrow('Reach page for ozone-yaba: cannot read the time "11h00"');
    const offsite = fixture("reachcinema/2026-11-17-ozone.html").replaceAll('href="/movies/a90e52e6-b83f-4d34-81ac-1b4f50cf1f43"', 'href="https://pay.example/checkout"');
    expect(() => ozone(offsite)).toThrow('Reach page for ozone-yaba: "https://pay.example/checkout" is not a film page on the cinema\'s site.');
  });
});

describe("parseReachTabs (date tabs: Sky)", () => {
  it("reads the tab that was clicked: 21 times on each of 17 and 18 Nov, with each film's page on Sky's site", () => {
    const today = sky(fixture("reachcinema/2026-11-17-sky-nov-17th.html"));
    const tomorrow = sky(fixture("reachcinema/2026-11-17-sky-nov-18th.html"), nov18);
    expect(today).toHaveLength(21);
    expect(tomorrow).toHaveLength(21);
    expect(today[0]).toEqual({
      cinemaId: "sky-sangotedo", filmTitle: "Loving Itohan", rating: null, startsAt: "2026-11-17T10:00:00Z", format: null,
      bookingUrl: "https://skycinemas.reachcinema.io/movies/8f153353-c8ee-449b-a7a0-0f6f01ab7906",
    });
    expect(tomorrow.at(-1)).toMatchObject({ filmTitle: "Spider-Man: Brand New Day", startsAt: "2026-11-18T15:40:00Z" });
  });

  it("reads a day with no tab (Sky lists no 21 Nov) as no showings", () => {
    expect(sky(fixture("reachcinema/2026-11-17-sky-nov-17th.html"), { year: 2026, month: 11, day: 21 })).toEqual([]);
  });

  it("refuses a page where the day's tab was not the one clicked, or that has no tabs", () => {
    expect(() => sky(fixture("reachcinema/2026-11-17-sky-nov-17th.html"), nov18)).toThrow('Reach page for sky-sangotedo: the clicked tab is "Nov 17th", not "Nov 18th".');
    expect(() => sky("<main><article><p>Sky</p></article></main>")).toThrow("Reach page for sky-sangotedo: no date tabs found. Has the page layout changed?");
  });
});

describe("readReach", () => {
  const served: Record<string, string> = {
    [`${OZONE}&date=Tue+Nov+17+2026`]: fixture("reachcinema/2026-11-17-ozone.html"),
    [`${OZONE}&date=Wed+Nov+18+2026`]: fixture("reachcinema/2026-11-17-ozone-nov-18.html"),
    [`${SKY} button:text-is('Nov 17th')`]: fixture("reachcinema/2026-11-17-sky-nov-17th.html"),
    [`${SKY} button:text-is('Nov 18th')`]: fixture("reachcinema/2026-11-17-sky-nov-18th.html"),
  };
  const run = (swap: Record<string, string> = {}) => {
    const asked: string[] = [];
    const renderText = Object.assign(
      async (url: string, opts: { click?: string } = {}) => {
        const key = opts.click ? `${url} ${opts.click}` : url;
        asked.push(key);
        const page = swap[key] ?? served[key];
        if (page === undefined) throw new Error(`unexpected render ${key}`);
        return page;
      },
      { close: async () => {} },
    );
    const fetchText = async (url: string) => {
      throw new Error(`a script-built page was fetched: ${url}`);
    };
    const read = readReach({ now: "2026-11-17T01:44:00Z", days: 2, fetchText, renderText, pages: { "ozone-yaba": OZONE, "sky-sangotedo": SKY }, names: { "ozone-yaba": "Ozone Cinemas", "sky-sangotedo": "Sky Cinema" } });
    return { asked, read };
  };

  it("renders each cinema's day: Ozone by its dated address, Sky by clicking the day's tab; two page loads each", async () => {
    const { asked, read } = run();
    const rows = (await read).flatMap((page) => page.showings);
    expect(asked).toEqual([`${OZONE}&date=Tue+Nov+17+2026`, `${OZONE}&date=Wed+Nov+18+2026`, `${SKY} button:text-is('Nov 17th')`, `${SKY} button:text-is('Nov 18th')`]);
    expect(rows.filter((r) => r.cinemaId === "ozone-yaba")).toHaveLength(40);
    expect(rows.filter((r) => r.cinemaId === "sky-sangotedo" && r.startsAt.startsWith("2026-11-18"))).toHaveLength(21);
  });

  it("fails when a cinema shows nothing on any day read, rather than emptying it silently", async () => {
    const empty = fixture("viva/2026-11-17-lekki-empty.html").replace(">Viva Lekki<", ">Ozone Cinemas<");
    // The same empty page with the next day's slide highlighted, as the site does for that day's address.
    const tomorrowEmpty = empty.replace('bg-grad-yellow">', 'bg-[#0F0F11] !text-white">').replace(/(swiper-slide-next[^"]*)bg-\[#0F0F11\] !text-white">/, "$1bg-grad-yellow\">");
    const { read } = run({ [`${OZONE}&date=Tue+Nov+17+2026`]: empty, [`${OZONE}&date=Wed+Nov+18+2026`]: tomorrowEmpty });
    await expect(read).rejects.toThrow("Reach page for ozone-yaba: no times on any day read. Has the page layout changed?");
  });

  it("needs the name each cinema has on its page", async () => {
    const renderText = Object.assign(async () => "", { close: async () => {} });
    const read = readReach({ now: "2026-11-17T01:44:00Z", days: 2, fetchText: async () => "", renderText, pages: { "ozone-yaba": OZONE }, names: {} });
    await expect(read).rejects.toThrow("Reach: ozone-yaba has no entry in pageNames in data/sources.json.");
  });

  it("names the selector a visitor's tap would use", () => {
    expect(reachTabSelector(nov18)).toBe("button:text-is('Nov 18th')");
    expect(reachTabSelector({ year: 2026, month: 11, day: 21 })).toBe("button:text-is('Nov 21st')");
    expect(reachTabSelector({ year: 2026, month: 11, day: 22 })).toBe("button:text-is('Nov 22nd')");
    expect(reachTabSelector({ year: 2026, month: 11, day: 23 })).toBe("button:text-is('Nov 23rd')");
    expect(reachTabSelector({ year: 2026, month: 11, day: 11 })).toBe("button:text-is('Nov 11th')");
  });
});
