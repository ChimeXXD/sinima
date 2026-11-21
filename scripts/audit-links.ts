// Checks one showing per cinema against the cinema's own site (Chime, 21 Nov 2026: "make sure every
// link is correct", Lagos and Abuja). For each cinema: its booking link (or, with none, its own
// listing page) is opened as a visitor in Lagos, and the page must show the film and the time we say.
// Usage: node scripts/audit-links.ts [--day YYYY-MM-DD]   (reads data/live/*.json; 5 s between loads per host)
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

type Showing = { filmId: string; cinemaId: string; startsAt: string; bookingUrl: string | null; sourceId: string };
type City = { films: { id: string; title: string }[]; showings: Showing[] };
const sources = JSON.parse(readFileSync("data/sources.json", "utf8")).sources as { id: string; cinemaPages?: Record<string, string> }[];
const pageOf = (cinemaId: string) => sources.map((s) => s.cinemaPages?.[cinemaId]).find(Boolean) ?? null;
const time = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" });
const day = process.argv.includes("--day") ? process.argv[process.argv.indexOf("--day") + 1] : null;
const now = Date.now();

/** "4:40 PM" also matches "04:40 PM", "4:40PM", "16:40" and "4.40pm". */
function timePattern(iso: string): RegExp {
  const [hm, ap] = time.format(new Date(iso)).split(" ");
  const [h, m] = hm!.split(":");
  const h24 = (Number(h) % 12) + (ap === "PM" ? 12 : 0);
  return new RegExp(`(\\b0?${h}[:.]${m}\\s*${ap}|\\b${h24}:${m}\\b)`, "i");
}
const words = (title: string) => title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 3);

const browser = await chromium.launch();
const context = await browser.newContext({ userAgent: "SinimaBot/0.1 (+https://github.com/ChimeXXD/sinima)", timezoneId: "Africa/Lagos", locale: "en-NG", serviceWorkers: "block" });
const lastLoad = new Map<string, number>();
const rows: string[][] = [];
try {
  for (const city of ["lagos", "abuja"]) {
    const data = JSON.parse(readFileSync(`data/live/${city}.json`, "utf8")) as City;
    const title = new Map(data.films.map((f) => [f.id, f.title]));
    const byCinema = new Map<string, Showing[]>();
    for (const s of data.showings) if (Date.parse(s.startsAt) > now && (!day || s.startsAt.startsWith(day))) byCinema.set(s.cinemaId, [...(byCinema.get(s.cinemaId) ?? []), s]);
    const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1]!.split(",") : null;
    for (const [cinemaId, list] of byCinema) {
      if (only && !only.includes(cinemaId)) continue;
      const s = list.find((x) => x.bookingUrl) ?? list[0]!;
      const url = s.bookingUrl ?? pageOf(cinemaId);
      const film = title.get(s.filmId) ?? s.filmId;
      const when = time.format(new Date(s.startsAt));
      if (!url) { rows.push([city, cinemaId, s.sourceId, film, when, "no link, no page", "-", "-"]); continue; }
      const host = new URL(url).host;
      const wait = (lastLoad.get(host) ?? 0) + 5000 - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastLoad.set(host, Date.now());
      const page = await context.newPage();
      let text = "";
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(6000);
        text = await page.evaluate(() => document.body.innerText);
      } catch (e) { text = `ERROR ${(e as Error).message.split("\n")[0]}`; }
      await page.close();
      const filmSeen = words(film).every((w) => text.toLowerCase().includes(w));
      const timeSeen = timePattern(s.startsAt).test(text);
      const seen = filmSeen && timeSeen ? "" : ` | page says: ${text.replace(/\s+/g, " ").slice(0, 140)}`;
      rows.push([city, cinemaId, s.sourceId, film, when, s.bookingUrl ? "booking link" : "cinema page", filmSeen ? "yes" : "NO", timeSeen ? "yes" : "NO", url + seen]);
    }
  }
} finally {
  await browser.close();
}
for (const r of rows) console.log(r.join(" | "));
