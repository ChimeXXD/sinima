import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bookingLinks, filmDateSelector, parseReachDay, pickedDateSelector, parseReachTabs, reachDayUrl, reachTabSelector, readReach } from "../../../../scripts/sources/reach";

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

  it("reads a day the site has no slide for yet as no showings, so a later day doesn't fail the read (D-147)", () => {
    // The fixture's slides run 17-23 Nov; 25 Nov isn't published.
    expect(ozone(undefined, { year: 2026, month: 11, day: 25 })).toEqual([]);
  });

  it("reads a slide whose day is padded as the site's own day address pads it (\"Dec 07\")", () => {
    // Not seen live yet (the fixtures are 17-23 Nov): the slide's day changed to "07", the rest as read.
    const padded = fixture("reachcinema/2026-11-17-ozone.html").replace('lg:text-[32px]">17</span><span class="text-xs uppercase md:text-sm lg:text-base">Tue', 'lg:text-[32px]">07</span><span class="text-xs uppercase md:text-sm lg:text-base">Mon').replace('text-base">Nov</span>', 'text-base">Dec</span>');
    expect(ozone(padded, { year: 2026, month: 12, day: 7 }).length).toBeGreaterThan(0);
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
    expect(asked.slice(0, 4)).toEqual([`${OZONE}&date=Tue+Nov+17+2026`, `${OZONE}&date=Wed+Nov+18+2026`, `${SKY} button:text-is('Nov 17th')`, `${SKY} button:text-is('Nov 18th')`]);
    // Then, for a dated page, each film's own page once a day, at that day's address, for its showings' booking links (D-176, D-196).
    expect(asked.slice(4).length).toBeGreaterThan(0);
    expect(asked.slice(4).every((url) => /\/movies\/[0-9a-f-]{36}\?date=2026-11-1[78]$/.test(url))).toBe(true);
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

  // D-199: a coming film's opening date after the days read, and the days after it while they have times,
  // each at its own address; its rows go on as read (the pipeline keeps them as tickets on sale).
  it("reads each coming film's opening date ahead at a dated address, then the next day until one shows nothing or fails", async () => {
    const asked: string[] = [];
    const pages: Record<string, string> = {
      [`${OZONE}&date=Tue+Nov+17+2026`]: fixture("reachcinema/2026-11-17-ozone.html"),
      [`${OZONE}&date=Wed+Nov+18+2026`]: fixture("reachcinema/2026-11-17-ozone-nov-18.html"),
      // The 19th's address answering with the 17th still picked: not that day, so it ends the read ahead.
      [`${OZONE}&date=Thu+Nov+19+2026`]: fixture("reachcinema/2026-11-17-ozone.html"),
    };
    const renderText = Object.assign(
      async (url: string) => {
        asked.push(url);
        if (url.includes("/movies/")) throw Object.assign(new Error("film page not served"), { name: "TimeoutError" });
        const page = pages[url];
        if (page === undefined) throw new Error(`unexpected render ${url}`);
        return page;
      },
      { close: async () => {} },
    );
    const read = await readReach({ now: "2026-11-17T01:44:00Z", days: 1, fetchText: async () => "", renderText, pages: { "ozone-yaba": OZONE }, names: { "ozone-yaba": "Ozone Cinemas" }, openings: ["2026-11-18", "2026-11-17"] });
    const rows = read.flatMap((page) => page.showings);
    expect(asked.filter((url) => !url.includes("/movies/"))).toEqual([`${OZONE}&date=Tue+Nov+17+2026`, `${OZONE}&date=Wed+Nov+18+2026`, `${OZONE}&date=Thu+Nov+19+2026`]);
    expect(rows.filter((row) => row.startsAt >= "2026-11-17T23:00:00Z")).toHaveLength(20);
    expect(read.flatMap((page) => page.notes ?? []).join(" ")).toMatch(/ozone-yaba: stopped reading ahead at 2026-11-19 \(Reach page for ozone-yaba: the page shows "Nov 17 Tue", not "Nov 19 Thu"\.\)/);
  });

  it("stops an opening's days at one with no slide yet, keeps the film page as each row's link, and opens no film page for them (D-199)", async () => {
    const asked: string[] = [];
    // Viva's page with no slide for 19 Nov: nothing published for that day yet.
    const noSlide = fixture("reachcinema/2026-11-17-ozone.html").replace(/Nov<\/span>\s*<span[^>]*>19<\/span>/g, "Nov</span><span>99</span>");
    const pages: Record<string, string> = {
      [`${OZONE}&date=Tue+Nov+17+2026`]: fixture("reachcinema/2026-11-17-ozone.html"),
      [`${OZONE}&date=Wed+Nov+18+2026`]: fixture("reachcinema/2026-11-17-ozone-nov-18.html"),
      [`${OZONE}&date=Thu+Nov+19+2026`]: noSlide,
    };
    const renderText = Object.assign(
      async (url: string) => {
        asked.push(url);
        if (url.includes("/movies/")) throw Object.assign(new Error("film page not served"), { name: "TimeoutError" });
        const page = pages[url];
        if (page === undefined) throw new Error(`unexpected render ${url}`);
        return page;
      },
      { close: async () => {} },
    );
    const read = await readReach({ now: "2026-11-17T01:44:00Z", days: 1, fetchText: async () => "", renderText, pages: { "ozone-yaba": OZONE }, names: { "ozone-yaba": "Ozone Cinemas" }, openings: ["2026-11-18", "2026-11-19"] });
    const ahead = read.flatMap((page) => page.showings).filter((row) => row.startsAt >= "2026-11-17T23:00:00Z");
    // 18th read, 19th empty: neither opening goes on to the 20th.
    expect(asked.filter((url) => !url.includes("/movies/"))).toEqual([`${OZONE}&date=Tue+Nov+17+2026`, `${OZONE}&date=Wed+Nov+18+2026`, `${OZONE}&date=Thu+Nov+19+2026`]);
    expect(ahead).toHaveLength(20);
    expect(ahead.every((row) => /^https:\/\/[^/]+\/movies\/[0-9a-f-]{36}$/.test(row.bookingUrl ?? ""))).toBe(true);
    // Film pages are opened only for the days read, never for the 18th's rows read ahead.
    expect(asked.filter((url) => url.includes("/movies/")).every((url) => url.endsWith("?date=2026-11-17"))).toBe(true);
    expect(read.flatMap((page) => page.notes ?? []).join(" ")).not.toMatch(/stopped reading ahead/);
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

// D-176 (Chime, 21 Nov 2026): Viva's and Nova's links go to the showing's own booking page, not the film's.
describe("bookingLinks: each showing's own /book/ page, found by tapping its time on the film page", () => {
  const film = "https://web.vivacinemas.com/movies/039f28cf-abfc-4ec1-abe5-3bb8661ca191";
  const day = { year: 2026, month: 11, day: 21 };
  const showing = (_time: string, startsAt: string) => ({ cinemaId: "viva-ikeja", filmTitle: "The Hunger Games", rating: null, startsAt, format: null, bookingUrl: film });
  it("links each tapped time to its booking page and keeps the film page for a time not tapped", async () => {
    const two = showing("2:00 PM", "2026-11-21T13:00:00Z");
    const late = showing("7:45 PM", "2026-11-21T18:45:00Z");
    const asked: { url: string; opts: unknown }[] = [];
    const renderText = Object.assign(async (url: string, opts?: unknown) => {
      asked.push({ url, opts });
      return `<main></main><script type="application/json" data-sinima-taps="2026-11-21">[{"text":"02:00 PM Screen 2","href":"/book/b05cc3a0-9cf9-48ce-b8a7-fdbd9f99bc87"}]</script>`;
    }, { close: async () => {} });
    const notes: string[] = [];
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: [two, late] }], notes);
    expect(two.bookingUrl).toBe("https://web.vivacinemas.com/book/b05cc3a0-9cf9-48ce-b8a7-fdbd9f99bc87");
    expect(late.bookingUrl).toBe(film);
    expect(asked).toHaveLength(1); // one film page, opened once, at the day's own address (D-196)
    expect(asked[0]!.url).toBe(`${film}?date=2026-11-21`);
    expect(asked[0]!.opts).toEqual({ steps: [{ click: 'text="Viva Ikeja"' }, { click: filmDateSelector(day) }, { tap: 'section:has(:text-is("Viva Ikeja")) button', capture: "/book/", label: "2026-11-21", when: pickedDateSelector(day) }] });
    expect(notes).toEqual([]);
  });
  it("keeps the film page and notes it when the film page cannot be read", async () => {
    const two = showing("2:00 PM", "2026-11-21T13:00:00Z");
    const renderText = Object.assign(async () => { throw new Error("timed out"); }, { close: async () => {} });
    const notes: string[] = [];
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: [two] }], notes);
    expect(two.bookingUrl).toBe(film);
    expect(notes[0]).toMatch(/viva-ikeja: .* kept as the link \(timed out\)/);
  });
  // 21 Nov 2026: Sunday's date could not be picked, so the page stayed on Saturday and Saturday's
  // 3:05 PM booking page went to Sunday's 3:05 PM showing too. A booking page is one showing's.
  it("keeps the film page, with a note, for a day the film page could not be moved to", async () => {
    const two = showing("2:00 PM", "2026-11-21T13:00:00Z");
    const renderText = Object.assign(async () => `<script type="application/json" data-sinima-taps="2026-11-21">null</script>`, { close: async () => {} });
    const notes: string[] = [];
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: [two] }], notes);
    expect(two.bookingUrl).toBe(film);
    expect(notes).toEqual([`viva-ikeja: ${film} could not be moved to 2026-11-21; its showings keep the film page`]);
  });
  it("gives a booking page found for two showings to neither", async () => {
    const sun = { year: 2026, month: 11, day: 22 };
    const sat = showing("3:05 PM", "2026-11-21T14:05:00Z");
    const sunday = showing("3:05 PM", "2026-11-22T14:05:00Z");
    const tap = `[{"text":"03:05 PM Screen 2","href":"/book/7530b3ca"}]`;
    const renderText = Object.assign(async () => `<script type="application/json" data-sinima-taps="2026-11-21">${tap}</script><script type="application/json" data-sinima-taps="2026-11-22">${tap}</script>`, { close: async () => {} });
    const notes: string[] = [];
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: [sat] }, { cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day: sun, showings: [sunday] }], notes);
    expect(sat.bookingUrl).toBe(film);
    expect(sunday.bookingUrl).toBe(film);
    expect(notes).toEqual(["viva-ikeja: https://web.vivacinemas.com/book/7530b3ca was found for 2 showings; each keeps its film page"]);
  });
  // 24 Nov 2026: once a time was tapped, the film page's date slides stopped answering, so every
  // film tapped today kept its film page tomorrow (Viva 3 of 18 exact links, Nova 2 of 48). The page
  // has an address for each day (?date=2026-11-25) that opens with that day picked (probed live).
  it("opens the film page afresh at each day's own address, so tomorrow's times are tapped too (D-196)", async () => {
    const sun = { year: 2026, month: 11, day: 22 };
    const sat = showing("3:05 PM", "2026-11-21T14:05:00Z");
    const sunday = showing("3:05 PM", "2026-11-22T14:05:00Z");
    const asked: { url: string; opts: unknown }[] = [];
    const renderText = Object.assign(async (url: string, opts?: unknown) => {
      asked.push({ url, opts });
      const label = new URL(url).searchParams.get("date");
      return `<script type="application/json" data-sinima-taps="${label}">[{"text":"03:05 PM Screen 2","href":"/book/${label}"}]</script>`;
    }, { close: async () => {} });
    const notes: string[] = [];
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: [sat] }, { cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day: sun, showings: [sunday] }], notes);
    expect(asked.map(({ url }) => url)).toEqual([`${film}?date=2026-11-21`, `${film}?date=2026-11-22`]);
    expect(asked[1]!.opts).toEqual({ steps: [{ click: 'text="Viva Ikeja"' }, { click: filmDateSelector(sun) }, { tap: 'section:has(:text-is("Viva Ikeja")) button', capture: "/book/", label: "2026-11-22", when: pickedDateSelector(sun) }] });
    expect(sat.bookingUrl).toBe("https://web.vivacinemas.com/book/2026-11-21");
    expect(sunday.bookingUrl).toBe("https://web.vivacinemas.com/book/2026-11-22");
    expect(notes).toEqual([]);
  });
  it("opens film pages for the first two days read only; later days keep the film page (D-196)", async () => {
    const days = [21, 22, 23].map((d) => ({ year: 2026, month: 11, day: d }));
    const rows = days.map((d) => showing("3:05 PM", `2026-11-${d.day}T14:05:00Z`));
    const asked: string[] = [];
    const renderText = Object.assign(async (url: string) => {
      asked.push(url);
      const label = new URL(url).searchParams.get("date");
      return `<script type="application/json" data-sinima-taps="${label}">[{"text":"03:05 PM","href":"/book/${label}"}]</script>`;
    }, { close: async () => {} });
    await bookingLinks(renderText, days.map((d, i) => ({ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day: d, showings: [rows[i]!] })), []);
    expect(asked).toEqual([`${film}?date=2026-11-21`, `${film}?date=2026-11-22`]);
    expect(rows.map((r) => r.bookingUrl)).toEqual(["https://web.vivacinemas.com/book/2026-11-21", "https://web.vivacinemas.com/book/2026-11-22", film]);
  });
  // 22 Nov 2026: with Viva's back end down, each film page waited out its timeouts and the run took
  // 26 of its 30 minutes. Two timeouts in a row end that cinema's film pages for the run; one slow
  // page alone doesn't cost the other films their links.
  const films = ["039f28cf-abfc-4ec1-abe5-3bb8661ca191", "66e2bd11-9590-4401-97d0-4ce267a2ec80", "8799f272-05d2-4d03-9d5d-b8e4f9dc2054"].map((id) => `https://web.vivacinemas.com/movies/${id}`);
  const timeout = () => Object.assign(new Error("page.goto: Timeout 30000ms exceeded."), { name: "TimeoutError" });
  const oneEach = () => films.map((page, i) => ({ ...showing("2:00 PM", `2026-11-21T1${i}:00:00Z`), bookingUrl: page }));
  it("stops opening a cinema's film pages after two time out in a row; the rest keep their film page (D-196)", async () => {
    const rows = oneEach();
    const asked: string[] = [];
    const renderText = Object.assign(async (url: string) => {
      asked.push(url);
      throw timeout();
    }, { close: async () => {} });
    const notes: string[] = [];
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: rows }], notes);
    expect(asked).toHaveLength(2);
    expect(rows.map((r) => r.bookingUrl)).toEqual(films);
    expect(notes).toEqual([
      `viva-ikeja: ${films[0]} kept as the link (page.goto: Timeout 30000ms exceeded.)`,
      `viva-ikeja: ${films[1]} kept as the link (page.goto: Timeout 30000ms exceeded.)`,
      "viva-ikeja: two film pages timed out in a row; 1 more not opened this run, so their showings keep the film page",
    ]);
  });
  it("goes on after one film page times out when the next one answers (D-196)", async () => {
    const rows = oneEach();
    const asked: string[] = [];
    const renderText = Object.assign(async (url: string) => {
      asked.push(url);
      if (asked.length === 1) throw timeout();
      const time = asked.length === 2 ? "12:00 PM" : "01:00 PM"; // films[1] at 11:00Z, films[2] at 12:00Z
      return `<script type="application/json" data-sinima-taps="2026-11-21">[{"text":"${time}","href":"/book/${asked.length}"}]</script>`;
    }, { close: async () => {} });
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: rows }], []);
    expect(asked).toHaveLength(3);
    expect(rows.map((r) => r.bookingUrl)).toEqual([films[0], "https://web.vivacinemas.com/book/2", "https://web.vivacinemas.com/book/3"]);
  });
  it("keeps the film page for a showing given two booking pages", async () => {
    const two = showing("2:00 PM", "2026-11-21T13:00:00Z");
    const taps = `[{"text":"02:00 PM Screen 1","href":"/book/aaaa"},{"text":"02:00 PM Screen 2","href":"/book/bbbb"}]`;
    const renderText = Object.assign(async () => `<script type="application/json" data-sinima-taps="2026-11-21">${taps}</script>`, { close: async () => {} });
    await bookingLinks(renderText, [{ cinemaId: "viva-ikeja", name: "Viva Ikeja", origin: "https://web.vivacinemas.com", day, showings: [two] }], []);
    expect(two.bookingUrl).toBe(film);
  });
  it("names the date slide to tap and the one that shows it picked", () => {
    const mon = { year: 2026, month: 11, day: 23 };
    expect(filmDateSelector(mon)).toBe('.swiper-slide:text-matches("^Mon\\\\s*0?23\\\\s*Nov$", "i") > *');
    expect(pickedDateSelector(mon)).toBe('.swiper-slide.bg-grad-yellow:text-matches("^Mon\\\\s*0?23\\\\s*Nov$", "i")');
  });
});
