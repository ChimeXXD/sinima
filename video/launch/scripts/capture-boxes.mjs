// Full-page captures plus where each tapped control sits (CSS px, page coordinates; images are 3×),
// so the video's touch dot lands on the real control. Live site, 6:40 PM Lagos, Fri 20 Nov 2026.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const site = "https://sinima.com.ng";
const out = "assets/capture";
const browser = await chromium.launch();
const boxes = {};

async function phone(scheme) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, timezoneId: "Africa/Lagos" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-11-20T17:40:00Z") });
  await page.addInitScript((t) => { try { localStorage.setItem("ls.theme", t); } catch {} }, scheme);
  return { context, page };
}
async function open(page, path) {
  await page.goto(site + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => { // load every lazy poster, then return to the top
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}
// The tab bar is fixed; a full-page capture would bake it into the page. It is captured on its own (capture-bar.mjs).
const hideBar = (page) => page.addStyleTag({ content: "nav:has(a[href$='/soon']) { visibility: hidden !important; }" });
async function box(page, key, locator) {
  const l = locator.first();
  if (!(await l.count())) return console.log("missing", key);
  const b = await l.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; });
  boxes[key] = b;
}

for (const scheme of ["light", "dark"]) {
  const { context, page } = await phone(scheme);
  const k = (name) => `${name}-${scheme}`;

  await open(page, "/lagos/soon");
  const lekki = page.getByRole("radio", { name: /^Lekki/ }).or(page.getByRole("button", { name: /^Lekki/ })).or(page.getByRole("link", { name: /^Lekki/ }));
  if (await lekki.count()) { await lekki.first().click(); await page.waitForTimeout(1200); }
  await box(page, k("soon.lekki"), lekki);
  await box(page, k("soon.theme"), page.getByRole("button", { name: /theme|light|dark|lamp/i }));
  await box(page, k("soon.hunger"), page.getByRole("link", { name: /Hunger Games/ }));
  await hideBar(page);
  await page.screenshot({ path: `${out}/soon-full-${scheme}.png`, fullPage: true });

  await open(page, "/lagos/film/the-hunger-games-sunrise-on-the-reaping");
  await box(page, k("film.today"), page.getByRole("radio", { name: /Today/ }));
  await box(page, k("film.sat"), page.getByRole("radio", { name: /Sat/ }));
  await box(page, k("film.times"), page.getByRole("heading", { name: /Times in Lagos/ }));
  const circle = page.locator("section, article, li, div").filter({ has: page.getByText("Filmhouse Circle Mall", { exact: true }) }).filter({ has: page.getByRole("button", { name: /7:20 PM/ }) }).last();
  await box(page, k("film.circle"), circle);
  await box(page, k("film.time720"), circle.getByRole("button", { name: /7:20 PM/ }));
  await hideBar(page);
  await page.screenshot({ path: `${out}/film-full-${scheme}.png`, fullPage: true });
  await circle.getByRole("button", { name: /7:20 PM/ }).first().click();
  await page.waitForTimeout(1500);
  const sheet = page.getByRole("dialog").first();
  await box(page, k("sheet"), sheet);
  await box(page, k("sheet.book"), sheet.getByRole("link", { name: /Book on/ }));
  boxes[k("sheet.scrollY")] = await page.evaluate(() => scrollY);
  await sheet.screenshot({ path: `${out}/sheet-panel-${scheme}.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  const sat = page.getByRole("radio", { name: /Sat/ }).first();
  await sat.click();
  await page.waitForTimeout(2000);
  await hideBar(page);
  await page.screenshot({ path: `${out}/film-day2-full-${scheme}.png`, fullPage: true });

  await open(page, "/lagos/film/street-fighter");
  const chip = page.getByText(/Stay a little/).first();
  await box(page, k("stay.chip"), chip.locator("xpath=..")); // the element stay-chip-*.png is cut from
  await chip.evaluate((el) => (el.closest("p, div, span") ?? el).scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  await chip.locator("xpath=..").screenshot({ path: `${out}/stay-chip-${scheme}.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await hideBar(page);
  await page.screenshot({ path: `${out}/stay-${scheme}.png` });

  for (const city of ["lagos", "abuja"]) {
    await open(page, `/${city}`);
    await box(page, k(`films.${city}.city`), page.getByRole("button", { name: new RegExp(city, "i") }));
    await box(page, k(`films.${city}.coming`), page.getByRole("heading", { name: /Coming soon/ }));
    await box(page, k(`films.${city}.dune`), page.getByRole("link", { name: /Dune: Part Three/ }));
    await box(page, k(`films.${city}.doomsday`), page.getByRole("link", { name: /Avengers: Doomsday/ }));
    await hideBar(page);
    await page.screenshot({ path: `${out}/films-${city}-full-${scheme}.png`, fullPage: true });
  }
  await context.close();
}
writeFileSync(`${out}/boxes.json`, JSON.stringify(boxes, null, 1));
await browser.close();
console.log(Object.keys(boxes).length, "boxes");
