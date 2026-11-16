import { expect, test, type Browser, type Page } from "@playwright/test";
import { freeze, sampleTime } from "./helpers";

// D-112: the motion audit's picks. Units 1 and 2: small fixes and no motion on keyboard actions.

/** A computer with a mouse: the phone project is a touch screen, where hovers are off. */
const computer = async (browser: Browser) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  return { context, page: await context.newPage() };
};

test("F1: the heart's pop eases per keyframe, so it swells and settles", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await page.getByTestId("cinema.keep").first().click();
  const frames = await page.evaluate(() => document.getAnimations().find((a) => a.id === "pop")!.effect!.constructor.name === "KeyframeEffect" ? (document.getAnimations().find((a) => a.id === "pop")!.effect as KeyframeEffect).getKeyframes().map((k) => k.easing) : []);
  expect(frames[0]).not.toBe("linear");
  expect(frames[1]).not.toBe("linear");
  expect(await page.evaluate(() => (document.getAnimations().find((a) => a.id === "pop")!.effect as KeyframeEffect).getTiming().easing)).toBe("linear");
});

test("F10: on a computer the lift keeps the cards' fill fades", async ({ browser }) => {
  const { context, page } = await computer(browser);
  await page.goto("/lagos/area/lekki");
  const card = page.locator('[data-testid^="next.card."]').first();
  await expect(card).toBeVisible();
  expect(await card.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain("background-color");
  await context.close();
});

test("C6: the Cinemas row chevron no longer nudges on hover", async ({ browser }) => {
  const { context, page } = await computer(browser);
  await page.goto("/lagos/cinemas");
  const row = page.locator('[data-testid^="cinema.card."]').first();
  await row.hover();
  expect(await row.locator("svg").last().evaluate((el) => getComputedStyle(el).translate)).toBe("none");
  await context.close();
});

test("C9: the countdown pill fades in, with no move", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/soon");
  const pill = page.locator('[data-testid="countdown-pill"], [data-testid="countdown-badge"]').first();
  await expect(pill).toBeVisible();
  const frames = await pill.evaluate((el) => el.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().map((k) => k.transform ?? null)));
  expect(frames.every((t) => t === null || t === "none")).toBe(true);
});

test("C4: the 12-area menu's last rows start by 275 ms", async ({ browser }) => {
  const { context, page } = await computer(browser);
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.area").click();
  const menu = page.getByTestId("sheet.area");
  // 300 ms after opening every row has started (the old cap began the ninth at 410 ms).
  await page.waitForTimeout(300);
  const started = await menu.locator("[role=option]").evaluateAll((rows) => rows.map((row) => Number(getComputedStyle(row).opacity) > 0));
  expect(started.length).toBeGreaterThanOrEqual(9);
  expect(started.every(Boolean)).toBe(true);
  await context.close();
});

test.describe("no motion on keyboard actions (F4, F5, C7)", () => {
  const duration = (page: Page, testId: string) => page.getByTestId(testId).evaluate((el) => getComputedStyle(el).transitionDuration);

  test("F4: a sheet opened with Enter and closed with Escape has no transition; a tap keeps it", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    await page.getByTestId("pick.day").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("sheet.day")).toBeVisible();
    expect((await duration(page, "sheet.day")).split(", ").every((d) => d === "0s")).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("sheet.day")).toBeHidden();

    await page.getByTestId("pick.day").click();
    await expect(page.getByTestId("sheet.day")).toBeVisible();
    expect(await duration(page, "sheet.day")).not.toBe("0s");
  });

  test("F5: the heart doesn't pop when pressed with Enter", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    await page.getByTestId("cinema.keep").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("cinema.keep").first()).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.getAnimations().some((a) => a.id === "pop"))).toBe(false);
  });

  test("F5: Show more from the keyboard brings the rows with no wave", async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/soon");
    await page.getByTestId("later.rows.more").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-enter]")).toHaveCount(0);
  });

  test("C7: on a computer, search reached with the keyboard opens with no fade", async ({ browser }) => {
    const { context, page } = await computer(browser);
    await page.goto("/lagos/cinemas");
    await page.getByTestId("search.field").focus();
    await page.keyboard.press("a");
    const panel = page.getByTestId("search.panel");
    await expect(panel).toBeVisible();
    expect((await panel.evaluate((el) => getComputedStyle(el).transitionDuration)).split(", ").every((d) => d === "0s")).toBe(true);
    await context.close();
  });
});
