// Draft 2 captures (D-169): Starting soon with the pull cord's drawing hidden (the film draws the cord
// itself so it can be pulled), and The Hunger Games at Filmhouse Lekki IMAX, 7:50 PM, the showing
// Chime booked on Filmhouse's site. Live site, 6:40 PM Lagos, Fri 20 Nov 2026.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const site = "https://sinima.com.ng";
const out = "assets/capture";
const boxesFile = `${out}/boxes.json`;
const boxes = JSON.parse(readFileSync(boxesFile, "utf8"));
const browser = await chromium.launch();

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
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}
// Fails fast with the control's name: a missing control (the live site changed, or the 7:50 PM showing is
// gone) would otherwise wait 30 s and stop with half the captures overwritten.
async function rect(l, key) {
  if (!(await l.count())) throw new Error(`missing on the live site: ${key}`);
  return l.first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; });
}
const hideBar = (page) => page.addStyleTag({ content: "nav:has(a[href$='/soon']) { visibility: hidden !important; }" });

try {
for (const scheme of ["light", "dark"]) {
  const { context, page } = await phone(scheme);
  await open(page, "/lagos/soon");
  const lekki = page.getByRole("radio", { name: /^Lekki/ }).or(page.getByRole("button", { name: /^Lekki/ }));
  if (await lekki.count()) { await lekki.first().click(); await page.waitForTimeout(1200); } else console.log("Lekki chip not found: capturing all of Lagos");
  const art = page.locator("span:has(> button[data-testid='theme.toggle']) > svg");
  boxes[`soon.cordArt-${scheme}`] = await rect(art, "cord art");
  await art.first().evaluate((el) => { el.style.visibility = "hidden"; });
  await hideBar(page);
  await page.screenshot({ path: `${out}/soon-full-nocord-${scheme}.png`, fullPage: true });

  if (scheme === "dark") {
    await open(page, "/lagos/film/the-hunger-games-sunrise-on-the-reaping");
    const card = page.locator("section, article, li, div").filter({ has: page.getByText("Filmhouse Lekki IMAX", { exact: true }) }).filter({ has: page.getByRole("button", { name: /7:50 PM/ }) }).last();
    boxes["film.lekki-dark"] = await rect(card, "Filmhouse Lekki IMAX 7:50 PM card");
    boxes["film.time750-dark"] = await rect(card.getByRole("button", { name: /7:50 PM/ }), "7:50 PM button");
    await card.getByRole("button", { name: /7:50 PM/ }).first().click();
    await page.waitForTimeout(1500);
    const sheet = page.getByRole("dialog").first();
    boxes["sheet750-dark"] = await rect(sheet, "showing sheet");
    boxes["sheet750.book-dark"] = await rect(sheet.getByRole("link", { name: /Book on/ }), "Book on link");
    boxes["sheet750.scrollY-dark"] = await page.evaluate(() => scrollY);
    await sheet.screenshot({ path: `${out}/sheet750-panel-dark.png` });
  }
  await context.close();
}
writeFileSync(boxesFile, JSON.stringify(boxes, null, 1));
} finally {
  await browser.close();
}
for (const k of Object.keys(boxes).filter((k) => /cordArt|lekki|750/.test(k))) console.log(k, JSON.stringify(boxes[k]));
