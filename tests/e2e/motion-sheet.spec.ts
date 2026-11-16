import { expect, test, type Page } from "./test";
import { sampleTime } from "./helpers";

// M10 (D-103): pull a sheet down to close it. Touches go through the DevTools protocol, the only
// way to send a real touch drag in Chromium; each move is a separate event a few ms apart.

async function pull(page: Page, from: { x: number; y: number }, by: number, steps: number, gapMs: number) {
  const cdp = await page.context().newCDPSession(page);
  const point = (y: number) => [{ x: from.x, y }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(from.y) });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(from.y + (by * i) / steps) });
    await page.waitForTimeout(gapMs);
  }
  return {
    /** Move the same finger to `to` px below where it started (negative: above). */
    moveTo: (to: number) => cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(from.y + to) }),
    release: () => cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }),
  };
}

async function openSheet(page: Page) {
  await page.goto("/lagos/film/ramayana");
  await page.locator('[data-testid^="time.filmhouse-"]').first().click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(600); // it has finished rising
  const box = (await sheet.boundingBox())!;
  return { sheet, box, top: { x: box.x + box.width / 2, y: box.y + 40 } };
}

const shift = (page: Page) => page.getByTestId("showing.sheet").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);

test.beforeEach(async ({ page, request }) => {
  await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
  // The clock runs (from noon on the sample day): a pull's speed is read from its events' times.
  await page.clock.install({ time: await sampleTime(request, "12:00") });
});

test("the sheet follows the finger down, and past a quarter of its height it closes", async ({ page }) => {
  const { sheet, box, top } = await openSheet(page);
  const drag = await pull(page, top, box.height * 0.4, 8, 30);
  expect(Math.round(await shift(page))).toBe(Math.round(box.height * 0.4));
  await drag.release();
  await expect(sheet).toBeHidden();
});

test("a short, slow pull snaps back and the sheet stays open", async ({ page }) => {
  const { sheet, top } = await openSheet(page);
  const drag = await pull(page, top, 30, 6, 60);
  expect(Math.round(await shift(page))).toBe(30);
  await drag.release();
  await expect.poll(() => shift(page)).toBe(0);
  await expect(sheet).toBeVisible();
});

test("a quick flick closes it even over a short distance", async ({ page }) => {
  const { sheet, top } = await openSheet(page);
  const drag = await pull(page, top, 50, 2, 5);
  await drag.release();
  await expect(sheet).toBeHidden();
});

test("pulled up, it stretches a fifth as far", async ({ page }) => {
  const { top } = await openSheet(page);
  // Starts downward (past Chromium's touch slop, ~15 px), so the sheet takes the pull.
  const drag = await pull(page, top, 40, 2, 10);
  await drag.moveTo(-50);
  expect(Math.round(await shift(page))).toBe(-10);
  await drag.release();
});

test("closed during its snap-back, the sheet keeps no leftover timing: it opens and closes as usual next time", async ({ page }) => {
  const { sheet, top } = await openSheet(page);
  const drag = await pull(page, top, 30, 6, 60);
  await drag.release(); // snapping back for 220 ms…
  await sheet.evaluate((el) => (el as HTMLDialogElement).close()); // …and closed before it lands (Escape, the scrim)
  await expect(sheet).toBeHidden();
  await page.locator('[data-testid^="time.filmhouse-"]').first().click();
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate((el) => el.style.transition)).toBe("");
});

// D-112 F9: a sheet caught while it snaps back stops where it is and follows the finger from there.
test("a sheet caught mid snap-back holds where it is, with no jump to rest", async ({ page }) => {
  const { top } = await openSheet(page);
  const finger = await pull(page, top, 60, 6, 60); // a short, slow pull: it will snap back
  await finger.release();
  await page.waitForTimeout(40); // the snap-back is under way
  const mid = await shift(page);
  expect(mid).toBeGreaterThan(5);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: top.x, y: top.y + 20 }] });
  await page.waitForTimeout(120); // the snap-back would have finished by now
  const held = await shift(page);
  expect(held).toBeGreaterThan(5); // still where it was caught, not at rest
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: top.x, y: top.y + 50 }] });
  expect(Math.abs((await shift(page)) - (held + 30))).toBeLessThan(2); // the finger moved 30 px: so does the sheet, from there
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
});
