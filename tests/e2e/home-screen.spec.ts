import { expect, test, type Page } from "./test";

// The Home Screen guide (D-162): A, a sheet on a second visit; B, a card at the end of Films. Never on
// a first visit, never in the Home Screen app. An iPhone's browser here (Safari's steps); real timers,
// since the guide waits a moment after the page is up.
test.use({
  realClock: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
});

const KEY = "sinima.homeScreen";
/** This phone has been here before: one visit kept, long ago (so this page starts the second). Set once per test. */
const returning = (page: Page, kept: object = { visits: 1, seenAt: 0 }) =>
  page.addInitScript(([key, value]) => sessionStorage.getItem("seeded") || (sessionStorage.setItem("seeded", "1"), localStorage.setItem(key, value)), [KEY, JSON.stringify(kept)] as const);
const kept = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), KEY);

test("a first visit shows neither the sheet nor the card", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.locator("html[data-now]")).toHaveCount(1);
  await page.waitForTimeout(5000);
  await expect(page.getByTestId("home.sheet")).not.toBeVisible();
  await expect(page.getByTestId("home.card")).toHaveCount(0);
  expect((await kept(page)).visits).toBe(1);
});

test("on a second visit the sheet shows the iPhone's steps; Not now holds it back", async ({ page }) => {
  await returning(page);
  await page.goto("/lagos");
  const sheet = page.getByTestId("home.sheet");
  await expect(sheet).toBeVisible({ timeout: 8000 });
  await expect(sheet).toHaveAccessibleName("Keep Sinima on your Home Screen");
  await expect(sheet).toContainText("It opens like an app: pull down for new times, and Add to calendar goes straight to Calendar.");
  await expect(sheet.getByTestId("home.step.1")).toContainText("Tap More (•••), then Share"); // Safari (D-163)
  await expect(sheet.getByTestId("home.step.1")).toContainText("Older iPhones: Share is in the bar");
  await expect(sheet.getByTestId("home.step.2")).toContainText("Tap Add to Home Screen");
  await expect(sheet.getByTestId("home.step.3")).toContainText("Tap Add");
  await sheet.getByTestId("home.sheet.not-now").click();
  await expect(sheet).not.toBeVisible();
  const after = await kept(page);
  expect(after.notNow).toBe(1);
  expect(after.sheetAfter).toBeGreaterThan(Date.now() + 13 * 86_400_000);
  // The next page of the same visit: no sheet.
  await page.goto("/lagos/cinemas");
  await page.waitForTimeout(5000);
  await expect(page.getByTestId("home.sheet")).not.toBeVisible();
});

test("the card at the end of Films opens the steps, and closing it ends it", async ({ page }) => {
  await returning(page, { visits: 1, seenAt: 0, sheetDone: true });
  await page.goto("/lagos");
  const card = page.getByTestId("home.card");
  await expect(card).toBeVisible({ timeout: 8000 });
  await expect(card).toContainText("Keep Sinima on your Home Screen");
  await expect(card).toContainText("It opens like an app, and you can pull down for new times.");
  // After Coming soon, at the end of the page.
  const below = await page.evaluate(() => {
    const coming = document.querySelector('[data-testid="section.coming"]')!.getBoundingClientRect();
    return document.querySelector('[data-testid="home.card"]')!.getBoundingClientRect().top >= coming.bottom;
  });
  expect(below).toBe(true);
  await card.getByTestId("home.card.show").click();
  const steps = page.getByTestId("home.steps");
  await expect(steps).toBeVisible();
  await expect(steps).toHaveAccessibleName("Add Sinima to your Home Screen");
  await expect(steps.getByTestId("home.step.1")).toContainText("Tap More (•••), then Share");
  await steps.getByTestId("home.steps.got-it").click();
  await expect(steps).not.toBeVisible();
  const close = card.getByTestId("home.card.close");
  await expect(close).toHaveAccessibleName("Close");
  expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(card).toHaveCount(0);
  expect((await kept(page)).cardDone).toBe(true);
  await page.reload();
  await page.waitForTimeout(4000);
  await expect(page.getByTestId("home.card")).toHaveCount(0);
});

test("in the Home Screen app there is no guide", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  await returning(page);
  await page.goto("/lagos");
  await expect(page.locator("html[data-now]")).toHaveCount(1);
  await page.waitForTimeout(5000);
  await expect(page.getByTestId("home.sheet")).toHaveCount(0);
  await expect(page.getByTestId("home.card")).toHaveCount(0);
});

// D-163: Chrome on an iPhone keeps Share at the top, next to the address.
test.describe("Chrome on an iPhone", () => {
  test.use({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1" });

  test("its steps start with Share at the top", async ({ page }) => {
    await returning(page, { visits: 1, seenAt: 0, sheetDone: true });
    await page.goto("/lagos");
    await page.getByTestId("home.card.show").click({ timeout: 8000 });
    const first = page.getByTestId("home.steps").getByTestId("home.step.1");
    await expect(first).toContainText("Tap Share");
    await expect(first).toContainText("Next to the address bar");
  });
});
