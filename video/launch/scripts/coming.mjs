// The Coming soon cards for Avengers: Doomsday and Dune: Part Three, light and dark, from the live site.
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const scheme of (process.argv[2] ? [process.argv[2]] : ["light", "dark"])) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, timezoneId: "Africa/Lagos" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-11-20T17:40:00Z") });
  await page.addInitScript((t) => { try { localStorage.setItem("ls.theme", t); } catch {} }, scheme);
  await page.goto("https://sinima.com.ng/lagos", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  const heading = page.getByRole("heading", { name: /Coming soon/i }).first();
  console.log(scheme, "coming heading:", await heading.count());
  for (const name of ["Avengers: Doomsday", "Dune: Part Three"]) {
    const card = page.getByRole("link", { name: new RegExp(name.replace(/[:]/g, ".")) }).first();
    if (await card.count()) {
      await card.scrollIntoViewIfNeeded();
      await card.locator("img").first().evaluate((img) => img.decode?.()).catch(() => {});
      await page.waitForFunction((el) => [...el.querySelectorAll("img")].every((i) => i.complete && i.naturalWidth > 0), await card.elementHandle(), { timeout: 20000 }).catch(() => console.log("poster not loaded", name));
      await page.waitForTimeout(800); await card.screenshot({ path: `assets/capture/coming-${name.startsWith("Dune") ? "dune" : "doomsday"}-${scheme}.png` }); }
    else console.log("no card", name);
  }
  if (await heading.count()) { await heading.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500); await page.evaluate(() => window.scrollBy(0, -80)); await page.waitForTimeout(500); await page.screenshot({ path: `assets/capture/coming-${scheme}.png` }); }
  await context.close();
}
await browser.close();
