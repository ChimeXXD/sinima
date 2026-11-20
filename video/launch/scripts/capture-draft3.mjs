// Draft 3 captures (D-170). Live site, 6:40 PM Lagos, Fri 20 Nov 2026, dark.
// 1. The website's own day switch on The Hunger Games' page (M1, D-103: the thumb slides, the new
//    day's times slide 8 px in and fade up), recorded at a tenth of its speed, frame by frame, so the
//    film plays the website's animation rather than one made up for the video.
// 2. Coming soon's Dune and Doomsday cards with TMDB's full-size posters swapped in, captured at 4×.
import { chromium } from "@playwright/test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const site = "https://sinima.com.ng";
const out = "assets/capture";
const slow = 0.1;
const browser = await chromium.launch();
const only = process.argv[2]; // "days" or "posters" runs one part

async function phone(scale, frozen = false) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, colorScheme: "dark", timezoneId: "Africa/Lagos", serviceWorkers: "block", bypassCSP: true });
  const page = await context.newPage();
  if (frozen) await page.clock.install({ time: new Date("2026-11-20T17:40:00Z") });
  else await page.clock.setFixedTime(new Date("2026-11-20T17:40:00Z")); // Date is fixed; timers and animations run
  await page.addInitScript(() => { try { localStorage.setItem("ls.theme", "dark"); } catch {} });
  return { context, page };
}
const hideBar = (page) => page.addStyleTag({ content: "nav:has(a[href$='/soon']) { visibility: hidden !important; }" });

try {
  // 1. The day switch, Today -> Sat -> Today, at the film's scroll (440 px)
  if (only !== "posters") {
    // a fresh folder: frame numbers depend on screenshot speed, so an older run's extra frames must not linger
    rmSync(`${out}/days`, { recursive: true, force: true });
    mkdirSync(`${out}/days`, { recursive: true });
    const { context, page } = await phone(3);
    await page.goto(`${site}/lagos/film/the-hunger-games-sunrise-on-the-reaping`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    await hideBar(page);
    await page.evaluate(() => window.scrollTo(0, 440));
    await page.waitForTimeout(800);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Animation.enable");
    await cdp.send("Animation.setPlaybackRate", { playbackRate: slow });
    const frames = [];
    for (const [name, label] of [["sat", /Sat/], ["today", /Today/]]) {
      const tile = page.getByRole("radio", { name: label }).first();
      if (!(await tile.count())) throw new Error(`missing on the live site: ${label} tile`);
      const start = Date.now();
      await tile.click();
      for (let i = 0; Date.now() - start < 3200; i++) {
        const t = (Date.now() - start) / 1000;
        const file = `days/${name}-${String(i).padStart(2, "0")}.jpg`;
        await page.screenshot({ path: `${out}/${file}`, type: "jpeg", quality: 92 });
        frames.push({ name, file, at: +(t * slow).toFixed(4) }); // seconds of real-speed animation
      }
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 440));
    }
    writeFileSync(`${out}/days/frames.json`, JSON.stringify(frames, null, 1));
    console.log("day frames:", frames.length, "scrollY", await page.evaluate(() => scrollY));
    await context.close();
  }
  // 2. The two Coming soon cards, sharp
  if (only !== "days") {
    const { context, page } = await phone(4, true);
    await page.goto(`${site}/lagos`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    // Coming soon sits far down the page; scroll so it is drawn (from here: the page's timers are frozen)
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 600) { await page.evaluate((top) => window.scrollTo(0, top), y); await page.waitForTimeout(150); }
    await page.getByRole("heading", { name: /Coming soon/i }).first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(1000);
    for (const [name, label] of [["dune", /Dune: Part Three/], ["doomsday", /Avengers: Doomsday/]]) {
      const card = page.getByRole("link", { name: label }).first();
      if (!(await card.count())) throw new Error(`missing on the live site: ${name} card`);
      await card.evaluate((el) => el.scrollIntoView({ block: "center", inline: "center" })); // clear of the row's edge fade
      await page.waitForTimeout(400);
      // The card's own image, pointed at TMDB's 780 px poster instead of the 342 px one a phone gets
      await card.evaluate((el) => el.querySelectorAll("img").forEach((img) => {
        const path = (img.currentSrc || img.src).replace(/^.*\/w(?:154|342|500)\//, "");
        img.loading = "eager";
        img.removeAttribute("srcset");
        img.src = `https://image.tmdb.org/t/p/w780/${path}`;
      }));
      for (let i = 0; ; i++) { // polled from here: the page's own timers are frozen
        if (await card.evaluate((el) => [...el.querySelectorAll("img")].every((im) => im.complete && /w780/.test(im.src) && im.naturalWidth > 0))) break;
        if (i > 120) throw new Error(`the ${name} poster never loaded`);
        await page.waitForTimeout(250);
      }
      await page.waitForTimeout(500);
      // With room round it for the date sticker that overhangs the card, on a see-through page
      const box = await card.boundingBox();
      await card.evaluate((el) => {
        document.documentElement.style.background = "transparent"; document.body.style.background = "transparent";
        const keep = new Set(); for (let n = el; n; n = n.parentElement) keep.add(n);
        for (const n of document.querySelectorAll("body *")) {
          n.dataset.capVis = n.style.visibility; // put back after, so the next card's page is as the site drew it
          n.style.visibility = keep.has(n) || el.contains(n) ? n.style.visibility : "hidden";
        }
      });
      await page.screenshot({ path: `${out}/coming-${name}-sharp.png`, omitBackground: true, clip: { x: box.x - 4, y: box.y - 18, width: box.width + 22, height: box.height + 22 } });
      await page.evaluate(() => { for (const n of document.querySelectorAll("[data-cap-vis]")) { n.style.visibility = n.dataset.capVis; delete n.dataset.capVis; } });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
