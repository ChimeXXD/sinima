import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseVeeziSessions, readVeezi } from "../../../../scripts/sources/veezi";

// Silverbird Ikeja's Veezi listing, saved on 11 Nov 2026 and cut down (D-24). Its dates have no
// year ("Wednesday 11, November") and its times are on a 12-hour clock ("6:35 PM").
const html = readFileSync(join(import.meta.dirname, "../../../fixtures/silverbird/2026-11-11-ikeja.html"), "utf8");
const readOn = { year: 2026, month: 11, day: 11 };
const parse = (page = html, on = readOn) => parseVeeziSessions(page, { cinemaId: "silverbird-ikeja", readOn: on });

describe("parseVeeziSessions", () => {
  const page = parse();

  it("reads all 70 sessions: 28 on each of 11 and 12 Nov, then the December dates", () => {
    expect(page.showings).toHaveLength(70);
    const days: Record<string, number> = {};
    for (const s of page.showings) days[s.startsAt.slice(0, 10)] = (days[s.startsAt.slice(0, 10)] ?? 0) + 1;
    expect(days).toEqual({
      "2026-11-11": 28, "2026-11-12": 28, "2026-12-04": 2, "2026-12-05": 2, "2026-12-06": 2,
      "2026-12-07": 2, "2026-12-08": 2, "2026-12-09": 2, "2026-12-10": 2,
    });
    expect(new Set(page.showings.map((s) => s.filmTitle)).size).toBe(17);
  });

  it("turns a 12-hour Lagos time into UTC: 10:40 AM is 09:40Z", () => {
    expect(page.showings[0]).toEqual({
      cinemaId: "silverbird-ikeja",
      filmTitle: "Arnie & Barney",
      rating: "PG",
      startsAt: "2026-11-11T09:40:00Z",
      format: null,
      bookingUrl: "https://ticketing.eu.veezi.com/purchase/321781?siteToken=9chn7w68550a7sxgexpdng2ndm",
    });
    expect(page.showings[1]?.startsAt).toBe("2026-11-11T11:30:00Z"); // 12:30 PM
    const lovingItohan = page.showings.filter((s) => s.filmTitle === "Loving Itohan" && s.startsAt.startsWith("2026-11-11"));
    expect(lovingItohan.map((s) => s.startsAt)).toEqual(["2026-11-11T10:00:00Z", "2026-11-11T15:15:00Z", "2026-11-11T19:50:00Z"]);
  });

  it("gives the same start times as Lagocine's page for the same cinema", () => {
    const lagocine = readFileSync(join(import.meta.dirname, "../../../fixtures/lagocine/2026-11-11-cinema-silverbird-ikeja.html"), "utf8");
    const theirs = [...lagocine.matchAll(/data-showtime="true" data-starts-at="([^"]+)"/g)].map((m) => new Date(m[1] as string).toISOString().replace(".000Z", "Z"));
    expect(page.showings.map((s) => s.startsAt).sort()).toEqual(theirs.sort());
  });

  it("reads an empty or TBC rating as no rating", () => {
    expect(page.showings.find((s) => s.filmTitle === "The Cleaner")?.rating).toBeNull();
    expect(page.showings.find((s) => s.filmTitle === "The Cat in the Hat")?.rating).toBeNull();
  });

  it("puts a date earlier in the year than the day it was read into next year", () => {
    const january = html.replaceAll("Friday 4, December", "Monday 4, January");
    const starts = parse(january).showings.map((s) => s.startsAt.slice(0, 10));
    expect(starts).toContain("2027-01-04");
    expect(starts).not.toContain("2026-01-04");
  });

  // Read in November, a booking date in May is nearer last May; its weekday says next May.
  it("reads a booking date more than six months ahead into next year when the weekday says so", () => {
    const may = html.replaceAll("Friday 4, December", "Friday 21, May");
    const starts = parse(may, { year: 2026, month: 11, day: 17 }).showings.map((s) => s.startsAt.slice(0, 10));
    expect(starts).toContain("2027-05-21");
    expect(starts.filter((day) => day.startsWith("2026-05"))).toEqual([]);
  });

  it("refuses a date whose weekday does not match, rather than guessing the year", () => {
    expect(() => parse(html.replaceAll("Wednesday 11, November", "Friday 11, November"))).toThrow(
      'Veezi page: "Friday 11, November" is not a Friday in 2026',
    );
  });

  it("handles noon and midnight on the 12-hour clock", () => {
    const edge = html.replace("<time>10:40 AM</time>", "<time>12:05 AM</time>").replace("<time>12:30 PM</time>", "<time>12:00 PM</time>");
    const starts = parse(edge).showings.slice(0, 2).map((s) => s.startsAt);
    expect(starts).toEqual(["2026-11-10T23:05:00Z", "2026-11-11T11:00:00Z"]);
  });

  it("fails loudly on a time it cannot read or a page with no sessions", () => {
    expect(() => parse(html.replace("<time>10:40 AM</time>", "<time>10.40</time>"))).toThrow('Veezi page: cannot read the time "10.40"');
    expect(() => parse("<html></html>")).toThrow("Veezi page: no films found. Has the page layout changed?");
  });
});

// Silverbird's two Abuja cinemas, saved once each on 17 Nov 2026 (00:38 in Lagos) and cut down
// (D-24, D-120): the sample data's Abuja times. The counts are the <time> elements under each date
// in the saved markup.
describe("parseVeeziSessions: Silverbird Abuja", () => {
  const read = (file: string, cinemaId: string) =>
    parseVeeziSessions(readFileSync(join(import.meta.dirname, `../../../fixtures/silverbird/${file}`), "utf8"), { cinemaId, readOn: { year: 2026, month: 11, day: 17 } }).showings;
  const byDay = (rows: { startsAt: string }[]) => {
    const days: Record<string, number> = {};
    for (const s of rows) days[s.startsAt.slice(0, 10)] = (days[s.startsAt.slice(0, 10)] ?? 0) + 1;
    return days;
  };
  const december = { "2026-12-04": 2, "2026-12-05": 2, "2026-12-06": 2, "2026-12-07": 2, "2026-12-08": 2, "2026-12-09": 2, "2026-12-10": 2 };

  it("reads Silverbird Entertainment Centre: 30 times on each of 17, 18 and 19 Nov, 17 films", () => {
    const rows = read("2026-11-17-sec.html", "silverbird-sec");
    expect(byDay(rows)).toEqual({ "2026-11-17": 30, "2026-11-18": 30, "2026-11-19": 30, ...december });
    expect(new Set(rows.map((s) => s.filmTitle)).size).toBe(17);
    expect(rows[0]).toEqual({
      cinemaId: "silverbird-sec",
      filmTitle: "The Beacon Man",
      rating: null,
      startsAt: "2026-11-17T09:00:00Z", // 10:00 AM in Abuja, on Lagos's clock
      format: null,
      bookingUrl: "https://ticketing.eu.veezi.com/purchase/323428?siteToken=ntfpkgyc0phrmzxb2ctk828vd4",
    });
  });

  it("reads Silverbird Jabi Lake Mall: 27, 24 and 27 times on 17, 18 and 19 Nov, 12 films", () => {
    const rows = read("2026-11-17-jabi.html", "silverbird-jabi");
    expect(byDay(rows)).toEqual({ "2026-11-17": 27, "2026-11-18": 24, "2026-11-19": 27, ...december });
    expect(new Set(rows.map((s) => s.filmTitle)).size).toBe(12);
    expect(rows[0]).toMatchObject({ filmTitle: "Street Fighter", rating: "12A", startsAt: "2026-11-17T09:05:00Z" });
  });
});

describe("parseVeeziSessions: dates near New Year and empty pages (D-122)", () => {
  it("a date at the end of December read just after New Year stays in the old year", () => {
    const late = html.replaceAll("Wednesday 11, November", "Thursday 31, December");
    const starts = parse(late, { year: 2027, month: 1, day: 1 }).showings.map((s) => s.startsAt.slice(0, 10));
    expect(starts).toContain("2026-12-31");
    expect(starts).not.toContain("2027-12-31");
  });

  it("reads a page that says no shows are scheduled as no showings, not as a broken page", () => {
    const empty = readFileSync(join(import.meta.dirname, "../../../fixtures/silverbird/2026-11-17-galleria-empty.html"), "utf8");
    expect(parseVeeziSessions(empty, { cinemaId: "silverbird-galleria", readOn: { year: 2026, month: 11, day: 17 } }).showings).toEqual([]);
  });
});

describe("readVeezi: each cinema's own sessions page (D-122)", () => {
  const fixture = (file: string) => readFileSync(join(import.meta.dirname, `../../../fixtures/${file}`), "utf8");
  const VEEZI = "https://ticketing.eu.veezi.com/sessions/?siteToken=";
  const pages = {
    "silverbird-sec": `${VEEZI}ntfpkgyc0phrmzxb2ctk828vd4`,
    "silverbird-jabi": `${VEEZI}ypr75qx9nh88brqya85qtg3wqc`,
    "silverbird-galleria": `${VEEZI}4x3z2wcre0rek2beab5w344ae0`,
  };
  const saved: Record<string, string> = {
    [pages["silverbird-sec"]]: fixture("silverbird/2026-11-17-sec.html"),
    [pages["silverbird-jabi"]]: fixture("silverbird/2026-11-17-jabi.html"),
    [pages["silverbird-galleria"]]: fixture("silverbird/2026-11-17-galleria-empty.html"),
  };
  const NOW = "2026-11-16T23:40:00Z"; // 00:40 on 17 Nov in Lagos, when the pages were saved
  const run = (served: Record<string, string> = saved, given: Record<string, string> = pages) => {
    const asked: string[] = [];
    const fetchText = async (url: string) => {
      asked.push(url);
      const page = served[url];
      if (page === undefined) throw new Error(`unexpected request ${url}`);
      return page;
    };
    const renderText = Object.assign(async () => "", { close: async () => {} });
    return { asked, read: readVeezi({ now: NOW, days: 2, fetchText, renderText, pages: given }) };
  };

  it("reads each cinema's sessions page once, nothing else, and keeps today and tomorrow", async () => {
    const { asked, read } = run();
    const pagesRead = await read;
    expect(asked).toEqual(Object.values(pages));
    expect(asked.every((url) => url.startsWith(VEEZI))).toBe(true);
    const days = (cinemaId: string) => {
      const out: Record<string, number> = {};
      for (const s of pagesRead.flatMap((p) => p.showings).filter((s) => s.cinemaId === cinemaId)) out[s.startsAt.slice(0, 10)] = (out[s.startsAt.slice(0, 10)] ?? 0) + 1;
      return out;
    };
    expect(days("silverbird-sec")).toEqual({ "2026-11-17": 30, "2026-11-18": 30 });
    expect(days("silverbird-jabi")).toEqual({ "2026-11-17": 27, "2026-11-18": 24 });
    expect(days("silverbird-galleria")).toEqual({});
  });

  it("every booking link carries the cinema's own siteToken (Veezi is shared, so the host proves nothing)", async () => {
    const rows = (await run().read).flatMap((p) => p.showings);
    for (const row of rows) {
      const link = new URL(row.bookingUrl!);
      expect(link.host).toBe("ticketing.eu.veezi.com");
      expect(`${VEEZI}${link.searchParams.get("siteToken")}`).toBe(pages[row.cinemaId as keyof typeof pages]);
    }
  });

  it("refuses a page whose booking links belong to another cinema", async () => {
    const swapped = { ...saved, [pages["silverbird-sec"]]: fixture("silverbird/2026-11-17-jabi.html") };
    await expect(run(swapped).read).rejects.toThrow(
      "Veezi page for silverbird-sec: a booking link (https://ticketing.eu.veezi.com/purchase/",
    );
    await expect(run(swapped).read).rejects.toThrow("is not this cinema's (siteToken ntfpkgyc0phrmzxb2ctk828vd4)");
  });

  it("reads only sessions pages: a purchase page (disallowed by robots.txt) is refused before any request", async () => {
    const { asked, read } = run(saved, { "silverbird-sec": "https://ticketing.eu.veezi.com/purchase/323428?siteToken=ntfpkgyc0phrmzxb2ctk828vd4" });
    await expect(read).rejects.toThrow("silverbird-sec: https://ticketing.eu.veezi.com/purchase/323428?siteToken=ntfpkgyc0phrmzxb2ctk828vd4 is not a Veezi sessions page with a siteToken");
    expect(asked).toEqual([]);
  });
});
