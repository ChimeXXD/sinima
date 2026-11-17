import { expect, test, type Page } from "./test";
import { live } from "./helpers";

// M11 (D-103): from the Films grid to a film's page, the poster you tapped travels into the
// film's hero (a view transition React starts on the navigation). The page records each view
// transition the browser is asked for and the names in play at that moment.

async function recordTransitions(page: Page) {
  await page.addInitScript(() => {
    const seen: string[][] = [];
    (window as unknown as { seen: string[][] }).seen = seen;
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((update: unknown) => {
      seen.push([...document.querySelectorAll<HTMLElement>("*")].map((el) => getComputedStyle(el).viewTransitionName).filter((name) => name && name !== "none"));
      return start(update as ViewTransitionUpdateCallback);
    }) as typeof document.startViewTransition;
  });
}
const transitions = (page: Page) => page.evaluate(() => (window as unknown as { seen: string[][] }).seen);

test("tapping a film's poster on Films carries it into the film page's hero", async ({ page }) => {
  await recordTransitions(page);
  await page.goto("/lagos");
  await live(page); // the grid as the browser's clock orders it, not as it was baked
  const card = page.locator('[data-testid^="film.card."]').first();
  const id = (await card.getAttribute("data-testid"))!.replace("film.card.", "");
  await page.waitForTimeout(1500); // Next prefetches the film page, so it renders with the navigation
  await card.locator("a").first().click();
  await expect(page).toHaveURL(new RegExp(`/lagos/film/${id}$`));
  await expect(page.getByTestId("film.hero")).toBeVisible();
  const names = (await transitions(page)).flat();
  expect(names.some((name) => name.includes(id))).toBe(true);
});

test("moving between tabs starts no view transition (the posters only pair with a film page)", async ({ page }) => {
  await recordTransitions(page);
  await page.goto("/lagos");
  await page.getByTestId("tab.cinemas").click();
  await expect(page).toHaveURL(/\/lagos\/cinemas$/);
  expect(await transitions(page)).toEqual([]);
});

test("from a film page, the Films tab sends the poster home", async ({ page }) => {
  await recordTransitions(page);
  await page.goto("/lagos");
  const card = page.locator('[data-testid^="film.card."]').first();
  const id = (await card.getAttribute("data-testid"))!.replace("film.card.", "");
  await page.goto(`/lagos/film/${id}`);
  await page.waitForTimeout(1500); // Films is prefetched from the tab bar
  await page.getByTestId("tab.films").click();
  await expect(page).toHaveURL(/\/lagos$/);
  expect((await transitions(page)).flat().some((name) => name.includes(id))).toBe(true);
});
