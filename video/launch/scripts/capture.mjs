// Captures the real Sinima screens the launch video uses, from the live site, at 6:40 PM Lagos on Fri 20 Nov 2026.
// iPhone viewport (390 × 844 at 3×), light and dark. Usage: node scripts/capture.mjs [out dir]
// Viewport shots only: the full-page captures and stay-*.png the film uses come from capture-boxes.mjs
// (tab bar hidden), so this script must not write those names or it bakes a second tab bar into them.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const site = "https://sinima.com.ng";
const out = process.argv[2] ?? "assets/capture";
const now = new Date("2026-11-20T17:40:00Z"); // 6:40 PM in Lagos
const hungerGames = "/lagos/film/the-hunger-games-sunrise-on-the-reaping";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

async function phone(scheme) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
    locale: "en-NG",
    timezoneId: "Africa/Lagos",
    permissions: [],
  });
  const page = await context.newPage();
  await page.clock.install({ time: now });
  await page.addInitScript((t) => { try { localStorage.setItem("ls.theme", t); } catch {} }, scheme); // the app's own theme switch
  return { context, page };
}

const settle = (page) => page.waitForTimeout(1200);
const shot = (page, name, opts = {}) => page.screenshot({ path: join(out, `${name}.png`), ...opts });

for (const scheme of ["light", "dark"]) {
  const s = scheme;
  const { context, page } = await phone(scheme);

  // 04 Starting soon, Lekki
  await page.goto(`${site}/lagos/soon`, { waitUntil: "networkidle" });
  await settle(page);
  const lekki = page.getByRole("button", { name: /^Lekki/ }).or(page.getByRole("radio", { name: /^Lekki/ })).or(page.getByRole("link", { name: /^Lekki$/ })).first();
  if (await lekki.count()) { await lekki.click(); await settle(page); }
  await shot(page, `soon-${s}`);

  // 05 A film's page, then the next day's tile tapped
  await page.goto(`${site}${hungerGames}`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, `film-${s}`);

  // 07 The showing sheet for 7:20 PM at Filmhouse Circle Mall
  const circleMall = page.locator("section, article, li, div").filter({ has: page.getByText("Filmhouse Circle Mall", { exact: true }) }).filter({ has: page.getByRole("button", { name: /7:20 PM/ }) }).last();
  const time = circleMall.getByRole("button", { name: /7:20 PM/ }).first();
  if (await time.count()) {
    await time.scrollIntoViewIfNeeded();
    await shot(page, `film-at-time-${s}`);
    await time.click();
    await settle(page);
    await shot(page, `sheet-${s}`);
    await page.keyboard.press("Escape");
    await settle(page);
  }
  const tomorrow = page.getByRole("radio", { name: /Sat/ }).first();
  if (await tomorrow.count()) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await tomorrow.scrollIntoViewIfNeeded();
    await shot(page, `film-before-day-${s}`);
    await tomorrow.click();
    await settle(page);
    await shot(page, `film-day2-${s}`);
  }

  // 06 Stay or Go: Street Fighter has a named answer
  await page.goto(`${site}/lagos/film/street-fighter`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, `stay-bar-${s}`);

  // 08 Films in Lagos and in Abuja
  for (const city of ["lagos", "abuja"]) {
    await page.goto(`${site}/${city}`, { waitUntil: "networkidle" });
    await settle(page);
    await shot(page, `films-${city}-${s}`);
  }
  await context.close();
}

// 07 Filmhouse's own booking page is not captured: their site refused the automated visit (403),
// and we never work around a block (CLAUDE.md rule 6). Chime records it by hand.

await browser.close();
console.log("done");
