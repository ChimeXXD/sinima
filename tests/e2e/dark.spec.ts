import type { Page } from "@playwright/test";
import { sampleTime } from "./helpers";
import { expect, test } from "./test";

// D-137, Chime, 18 Nov: in dark, Today | Tomorrow showed no picked day (the pill was the track's own
// #18181b), and a dropdown's highlighted row was "almost the same colour as the dropdown". Dark only:
// light keeps exactly the colours it had.

/** Relative luminance (WCAG) of a computed colour: `rgb(…)` (0–255) or, from color-mix, `color(srgb …)` (0–1). */
function luminance(css: string): number {
  const scale = css.startsWith("color(srgb") ? 1 : 255;
  const [r, g, b] = css.replace("color(srgb", "").match(/[\d.]+/g)!.slice(0, 3).map((n) => {
    const c = Number(n) / scale;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};
const bg = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);
/** What a CSS colour expression resolves to on this page, in its theme. */
const resolve = (page: Page, expression: string) =>
  page.evaluate((value) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = value;
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, expression);

for (const theme of ["dark", "light"] as const) {
  test(`${theme}: Today | Tomorrow shows which day is picked`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("ls.theme", t), theme);
    await page.goto("/lagos");
    const thumb = await bg(page, '[data-testid="films.day"] > span');
    const track = await bg(page, '[data-testid="films.day"]');
    if (theme === "dark") expect(contrast(thumb, track)).toBeGreaterThan(1.5);
    else expect(thumb).toBe(await resolve(page, "#ffffff")); // light: unchanged (--bg-raised)
  });

  test(`${theme}: on a computer, a dropdown's highlighted row stands out from the menu`, async ({ browser, request }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });
    await context.addInitScript((t) => localStorage.setItem("ls.theme", t), theme);
    const page = await context.newPage();
    await page.clock.install({ time: await sampleTime(request, "12:00") }); // a new context keeps the real clock
    await page.goto("/lagos/cinemas");
    await expect(page.locator("html[data-now]")).toBeAttached();
    await page.getByTestId("pick.area").click();
    const menu = page.locator('[role="listbox"]:not([data-state="closed"])');
    await menu.locator('[role="option"]').nth(2).hover();
    const highlight = await menu.evaluate((el) => getComputedStyle(el.querySelector("[data-hl]")!).backgroundColor);
    const surface = await menu.evaluate((el) => getComputedStyle(el).backgroundColor);
    if (theme === "dark") expect(contrast(highlight, surface)).toBeGreaterThan(1.15);
    else expect(highlight).toBe(await resolve(page, "color-mix(in srgb, var(--bg-surface), var(--text-primary) 2%)")); // light: unchanged
    await context.close();
  });
}
