import type { Request } from "@playwright/test";
import { expect, test, type Page } from "./test";

// Pull to refresh (D-161), in the app added to the Home Screen only: pulled past 88 px and let go, the
// page reads its data again and springs home; short of it, it springs home with nothing read. In the
// browser the gesture isn't there (Safari has its own). Touches go through the DevTools protocol, the
// only way to send a real touch drag in Chromium. Real timers: the springs run on animation frames.
test.use({ realClock: true });

/** The Home Screen app: an iPhone says so through navigator.standalone. */
const asInstalled = (page: Page) => page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));

async function drag(page: Page, by: number) {
  const cdp = await page.context().newCDPSession(page);
  const at = (y: number) => [{ x: 195, y }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(320) });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(320 + (by * i) / 12) });
    await page.waitForTimeout(16);
  }
  return { release: () => cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }) };
}

/** A read of the page's data, not Next's prefetch of a link on screen (those carry next-router-prefetch). */
const isRead = (request: Request) =>
  (request.url().includes("_rsc") || request.headers()["rsc"] === "1") && !request.headers()["next-router-prefetch"];

const offset = (page: Page) => page.locator("main").evaluate((el) => parseFloat(getComputedStyle(el).translate.split(" ")[1] ?? "0") || 0);

test("in the Home Screen app, a pull past the threshold reads the page again and springs home", async ({ page }) => {
  await asInstalled(page);
  await page.goto("/lagos");
  await expect(page.locator("html[data-now]")).toHaveCount(1);
  await expect(page.getByRole("status").filter({ hasText: /^$/ })).toHaveCount(1); // the gesture is attached: its quiet live line
  const finger = await drag(page, 260);
  // The page follows the finger with resistance: 260 px of finger is under 150 px of page.
  await expect.poll(() => offset(page)).toBeGreaterThan(88);
  expect(await offset(page)).toBeLessThan(150);
  // The footer moves with the content; the bar at the top stays.
  expect(await page.locator("footer").evaluate((el) => getComputedStyle(el).translate)).not.toBe("none");
  expect(await page.locator("header").evaluate((el) => getComputedStyle(el).translate)).toBe("none");
  const read = page.waitForRequest(isRead);
  await finger.release();
  await read; // the page's data, read again
  await expect(page.getByText("Checking for new times")).toBeAttached();
  await expect(page.getByText("Done checking for new times")).toBeAttached({ timeout: 10_000 });
  await expect.poll(() => offset(page), { timeout: 3000 }).toBe(0);
});

test("in the Home Screen app, a short pull springs home and reads nothing", async ({ page }) => {
  await asInstalled(page);
  await page.goto("/lagos");
  await expect(page.locator("html[data-now]")).toHaveCount(1);
  await expect(page.getByRole("status").filter({ hasText: /^$/ })).toHaveCount(1);
  let reads = 0;
  page.on("request", (request) => {
    if (isRead(request)) reads += 1;
  });
  const finger = await drag(page, 100); // 55 px of page: short of 88
  await expect.poll(() => offset(page)).toBeGreaterThan(20);
  await finger.release();
  await expect.poll(() => offset(page), { timeout: 3000 }).toBe(0);
  expect(reads).toBe(0);
});

test("in the browser there is no pull to refresh of ours: Safari has its own", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.locator("html[data-now]")).toHaveCount(1);
  const finger = await drag(page, 260);
  await page.waitForTimeout(100);
  expect(await offset(page)).toBe(0);
  await finger.release();
  await expect(page.getByText("Checking for new times")).toHaveCount(0);
});
