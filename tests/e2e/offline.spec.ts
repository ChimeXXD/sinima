import { expect, test, type Page } from "@playwright/test";
import { freeze, lagosClock, sampleTime } from "./helpers";

// Offline (Figma Offline · Films 208:9731, build unit 11): with no connection the site still opens
// on the copy saved on this phone, and says when those times were saved.

/** Loads `path` online until the service worker controls the page and has saved it. */
async function saveForOffline(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload(); // now through the service worker, which saves the page and its files
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("Films opens offline from the saved copy, and the banner says when it was saved (Figma Offline)", async ({ page, context, request }) => {
  const savedAt = await sampleTime(request, "17:05");
  await freeze(page, savedAt);
  await saveForOffline(page, "/lagos");
  await expect(page.getByTestId("banner.offline")).toHaveCount(0);

  await context.setOffline(true);
  await page.clock.setFixedTime(new Date(savedAt.getTime() + 25 * 60_000));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
  await expect(page.getByTestId("banner.offline")).toHaveText(`You're offline. These are the times saved on this phone at ${lagosClock(savedAt.toISOString())}, 25 min ago. Booking needs a connection.`);
  // Figma's offline banner leads; the sample note stays under it, since samples are never hidden (rule 8).
  await expect(page.getByTestId("banner.sample")).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByTestId("banner.offline")).toHaveCount(0);
  await expect(page.getByTestId("banner.sample")).toBeVisible();
});

test("a page saved earlier opens offline too; one never opened falls back to the kept city's Films", async ({ page, context }) => {
  await saveForOffline(page, "/lagos/cinemas");
  await page.evaluate(() => localStorage.setItem("ls.city", "lagos")); // chosen on Where are you watching? (unit 12)
  await page.goto("/lagos"); // Films, saved through the service worker
  await context.setOffline(true);
  await page.goto("/lagos/cinemas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Lagos");
  await expect(page.getByTestId("banner.offline")).toBeVisible();
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
});

test("a page opened just once, on the first visit, opens offline too", async ({ page, context }) => {
  await page.goto("/lagos/film/ramayana"); // the first visit: the worker isn't in charge yet
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  // The page asks the worker to save it, and the scripts it starts with, once the worker runs (not
  // the noModule polyfill, which a phone that runs the site never loads).
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const urls = ["/lagos/film/ramayana", ...[...document.querySelectorAll("script[src]:not([nomodule])")].map((el) => new URL((el as HTMLScriptElement).src).pathname)];
        const found = await Promise.all(urls.map((url) => caches.match(url)));
        return found.filter((hit) => !hit).length;
      }),
      { timeout: 10_000 }, // the page sends its files again 4 s in, after the parts loaded at idle
    )
    .toBe(0);
  await context.setOffline(true);
  await page.goto("/lagos/film/ramayana");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ramayana");
  await expect(page.getByTestId("banner.offline")).toBeVisible();
});

test("offline, a city page never opened falls back to that city's Films", async ({ page, context }) => {
  await saveForOffline(page, "/lagos/cinemas"); // the worker also saves /lagos and /abuja as it installs
  await context.setOffline(true);
  await page.goto("/abuja/soon");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Abuja");
  await page.goto("/lagos/soon");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
});
