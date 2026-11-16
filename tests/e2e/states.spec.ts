import { devices, expect, test, type Locator } from "./test";
import { sampleTime } from "./helpers";

// Review round 1 (D-106 c, d): a picked state fades in instead of switching in one frame, and on a
// pointer device every hover answers. Read from the running transitions and computed styles.

/** The CSS transitions running on an element, by property. */
const fading = (el: Locator) => el.evaluate((node) => node.getAnimations().map((a) => (a as CSSTransition).transitionProperty).filter(Boolean));
const fill = (el: Locator) => el.evaluate((node) => getComputedStyle(node).backgroundColor);

test.describe("on a computer", () => {
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, userAgent: devices["Desktop Chrome"].userAgent, deviceScaleFactor: 1 });

  test("picking a format fades the chip's fill and colour in (Any format → IMAX)", async ({ page }) => {
    await page.goto("/lagos");
    const imax = page.getByTestId("format.IMAX");
    await imax.click();
    await expect(imax).toHaveAttribute("aria-pressed", "true");
    expect(await fading(imax)).toEqual(expect.arrayContaining(["background-color", "color"]));
  });

  test("hovering a chip, a button and the + on Your cinemas tints them", async ({ page }) => {
    await page.goto("/lagos");
    const chip = page.getByTestId("format.IMAX");
    const before = await fill(chip);
    await chip.hover();
    await expect.poll(() => fill(chip)).not.toBe(before);

    await page.evaluate(() => localStorage.setItem("ls.cinemas", JSON.stringify(["grand-lekki"]))); // the + shows once one is kept
    await page.goto("/lagos/yours");
    const add = page.getByTestId("yours.add");
    const rest = await fill(add);
    await add.hover();
    await expect.poll(() => fill(add)).not.toBe(rest);
  });
});

test("on a touch screen a tap leaves no hover tint behind", async ({ page }) => {
  await page.goto("/lagos");
  const chip = page.getByTestId("format.IMAX");
  const before = await fill(chip);
  await chip.hover();
  await page.waitForTimeout(300);
  expect(await fill(chip)).toBe(before);
});

test("films without a poster come in several colours, each film always the same one (D-106 j)", async ({ page, request }) => {
  // Noon in the sample day: on the real clock, late in the evening most films have started and gone.
  await page.clock.install({ time: await sampleTime(request, "12:00") });
  await page.goto("/lagos");
  const tints = () => page.getByTestId("poster.none").evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  const first = await tints();
  expect(first.length).toBeGreaterThan(3);
  expect(new Set(first).size).toBeGreaterThan(2);
  await page.reload();
  expect(await tints()).toEqual(first);
});
