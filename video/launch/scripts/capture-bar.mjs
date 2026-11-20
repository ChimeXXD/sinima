// The app's own tab bar on a transparent background, per page and theme, to sit fixed over the scrolled pages.
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const shots = [["light", "/lagos/soon", "soon"], ["dark", "/lagos/soon", "soon"], ["dark", "/lagos/film/the-hunger-games-sunrise-on-the-reaping", "film"], ["dark", "/lagos", "films"]];
for (const [scheme, path, name] of shots) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, timezoneId: "Africa/Lagos" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-11-20T17:40:00Z") });
  await page.addInitScript((t) => { try { localStorage.setItem("ls.theme", t); } catch {} }, scheme);
  await page.goto("https://sinima.com.ng" + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  const nav = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: /Starting soon/ }) }).last();
  const box = await nav.boundingBox();
  await nav.evaluate((el) => {
    const keep = new Set(); for (let n = el; n; n = n.parentElement) keep.add(n);
    for (const n of document.querySelectorAll("body *")) if (!keep.has(n) && !el.contains(n)) n.style.visibility = "hidden";
    document.documentElement.style.background = "transparent"; document.body.style.background = "transparent";
  });
  const pad = 24;
  await page.screenshot({ path: `assets/capture/bar-${name}-${scheme}.png`, omitBackground: true, clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
  console.log(name, scheme, JSON.stringify({ x: box.x - pad, y: box.y - pad, w: box.width + pad * 2, h: box.height + pad * 2 }));
  await context.close();
}
await browser.close();
