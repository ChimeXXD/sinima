import { CONSENT_KEY } from "../../src/lib/consent";
import { expect, test } from "./test";

// The Cookie bite banner and About › Privacy (D-191, mockup/consent/). These pages open as a first
// visit: no answer kept (the other specs open as a visitor who said No thanks).
test.use({ consent: null });

const kept = (page: import("@playwright/test").Page) => page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);

test("a first visit asks once, over the tab bar; Sure keeps yes, says thanks and goes, and nothing is sent off Vercel", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (request) => /_vercel\/insights|vercel-insights|\/view$/.test(request.url()) && sent.push(request.url()));
  await page.goto("/lagos");
  const banner = page.getByRole("region", { name: "Counting visits" });
  await expect(banner).toBeVisible();
  await expect(banner.getByTestId("consent.title")).toHaveText("Cookies? Not here.");
  await expect(banner.getByTestId("consent.body")).toHaveText("Can we count your visit instead? We’d see which films get opened, never who you are.");
  // 12 px over the tab bar (mockup: the card's bottom 106 px up, the bar's top 94).
  const card = (await banner.boundingBox())!;
  const bar = (await page.getByRole("navigation").last().boundingBox())!;
  expect(Math.abs(bar.y - (card.y + card.height) - 12)).toBeLessThanOrEqual(2);

  await banner.getByRole("button", { name: "Sure" }).click();
  expect(await kept(page)).toBe("yes");
  await expect(page.getByTestId("consent.note")).toHaveText("Thanks! Your visit counts");
  await expect(banner).toHaveCount(0, { timeout: 8000 });
  expect(sent).toEqual([]); // the e2e site is not on Vercel: nothing to count with

  await page.reload();
  await page.waitForTimeout(2500); // past the banner's 1.5 s
  await expect(banner).toHaveCount(0);
});

test("No thanks keeps no and points to About, whose switch turns counting on and off again", async ({ page }) => {
  await page.goto("/lagos");
  await page.getByRole("button", { name: "No thanks" }).click();
  expect(await kept(page)).toBe("no");
  await expect(page.getByTestId("consent.note")).toHaveText("Not counted · change it in About");

  await page.goto("/about");
  const count = page.getByTestId("about.privacy.count");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await expect(page.getByTestId("about.privacy.fact.1")).toContainText("Sinima doesn’t set any. Not one.");
  await expect(count.getByTestId("about.privacy.state")).toHaveText("Off, on this phone");
  await count.getByRole("button", { name: "Count my visits" }).click();
  expect(await kept(page)).toBe("yes");
  await expect(page.getByTestId("toast")).toContainText("Visits will be counted");
  await expect(count.getByTestId("about.privacy.state")).toHaveText("On, on this phone");
  await count.getByRole("button", { name: "Stop counting" }).click();
  expect(await kept(page)).toBe("no");
  await expect(count.getByTestId("about.privacy.state")).toHaveText("Off, on this phone");
});

test("an answer given on About first closes the banner unasked", async ({ page }) => {
  await page.goto("/about");
  const banner = page.getByTestId("consent.banner");
  await expect(banner).toBeVisible();
  await page.getByRole("button", { name: "Count my visits" }).click();
  expect(await kept(page)).toBe("yes");
  await expect(banner).toHaveCount(0);
});

test("a keyboard answer moves focus to the note, then back to where it came from", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.getByTestId("consent.banner")).toBeVisible();
  const chip = page.getByRole("button", { name: "Any format" });
  await chip.focus();
  await page.getByRole("button", { name: "No thanks" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("consent.note")).toBeFocused();
  await expect(page.getByTestId("consent.banner")).toHaveCount(0, { timeout: 8000 });
  await expect(chip).toBeFocused();
});

test("the city question on / is never covered by it", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.getByTestId("consent.banner")).toHaveCount(0);
});

test("at 360 px it fits: nothing scrolls sideways and both buttons are at least 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/lagos");
  const banner = page.getByTestId("consent.banner");
  await expect(banner).toBeVisible();
  await page.waitForTimeout(800); // settled
  const box = (await banner.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(15);
  expect(box.x + box.width).toBeLessThanOrEqual(345);
  for (const name of ["No thanks", "Sure"]) expect((await banner.getByRole("button", { name }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("with reduced motion it still answers and goes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lagos");
  await page.getByRole("button", { name: "Sure" }).click();
  expect(await kept(page)).toBe("yes");
  await expect(page.getByTestId("consent.banner")).toHaveCount(0, { timeout: 8000 });
});

test("with storage switched off it never asks, and About offers no switch", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Storage.prototype.setItem = Storage.prototype.getItem;
  });
  await page.goto("/lagos");
  await page.waitForTimeout(2500);
  await expect(page.getByTestId("consent.banner")).toHaveCount(0);
  await page.goto("/about");
  await expect(page.getByTestId("about.privacy.count")).toBeVisible();
  await expect(page.getByTestId("about.privacy.toggle")).toHaveCount(0);
});
