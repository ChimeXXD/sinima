import { expect, test, type Page } from "./test";

// R9 (D-106 h): the nav's blue pill is moved by springs, as in Design Bookmark's Bottom bar. The
// pill (data-hl) is a layer of its own once the page's script runs (data-live on the nav).

/** Where the pill is, and where a tab is, in the page. */
const box = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left), w: Math.round(r.width) };
});

test("at rest the pill sits exactly on the picked tab", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await expect(page.getByTestId("nav")).toHaveAttribute("data-live", "");
  await expect.poll(() => box(page, "[data-hl]")).toEqual(await box(page, '[data-testid="tab.cinemas"]'));
});

test("a tapped tab: the pill is still on its way in the first frames, then lands on the new tab", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.getByTestId("nav")).toHaveAttribute("data-live", ""); // the springs load just after the page
  const films = await box(page, "[data-hl]");
  // The springs run on the page's frames: hold the clock so "the first frames" are the same on any
  // machine (GitHub's slower runner first looked once the pill was already past the tab's edge).
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1);
  await page.getByTestId("tab.soon").click();
  await expect(page).toHaveURL(/\/lagos\/soon$/);
  await page.clock.runFor(48); // three frames
  const soon = await box(page, '[data-testid="tab.soon"]');
  const pill = await box(page, "[data-hl]");
  expect(pill.x).toBeGreaterThan(films.x); // on its way from Films…
  expect(pill.x).toBeLessThan(soon.x); // …and not there yet
  await page.clock.resume();
  // The tab widens as its name opens, so the two are compared as they are each time.
  await expect.poll(async () => JSON.stringify(await box(page, "[data-hl]")) === JSON.stringify(await box(page, '[data-testid="tab.soon"]')), { timeout: 3000 }).toBe(true);
});

test("a key press opens the tab with the pill already in place (no motion on keyboard actions)", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.getByTestId("nav")).toHaveAttribute("data-live", "");
  await page.getByTestId("tab.soon").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lagos\/soon$/);
  expect(await box(page, "[data-hl]")).toEqual(await box(page, '[data-testid="tab.soon"]'));
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the picked tab draws its own pill", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    expect(await page.getByTestId("tab.cinemas").evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  });
});
