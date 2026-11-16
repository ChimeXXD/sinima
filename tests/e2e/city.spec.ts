import { expect, test } from "@playwright/test";

// The city is the first part of every city page's address (D-98, build unit 13): /lagos/…,
// /abuja/…. Old addresses forward to their Lagos page; "/" opens the city kept on this phone.

test("old addresses forward to their Lagos page, keeping a shared showing after the #", async ({ page }) => {
  await page.goto("/cinemas");
  await expect(page).toHaveURL(/\/lagos\/cinemas$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Lagos");
  await page.goto("/film/ramayana");
  await expect(page).toHaveURL(/\/lagos\/film\/ramayana$/);
  await page.goto("/cinema/ebonylife-vi#s=ramayana@2026-11-13T17:15:00Z");
  await expect(page).toHaveURL(/\/lagos\/cinema\/ebonylife-vi#s=ramayana@2026-11-13T17:15:00Z$/);
  await page.goto("/area/lekki");
  await expect(page).toHaveURL(/\/lagos\/area\/lekki$/);
});

// With none kept, "/" asks Where are you watching? (build unit 12, tests/e2e/where.spec.ts).
test('"/" opens the city kept on this phone', async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where are you watching?");
  await page.evaluate(() => localStorage.setItem("ls.city", "lagos"));
  await page.goto("/");
  await expect(page).toHaveURL(/\/lagos$/);
  await page.evaluate(() => localStorage.setItem("ls.city", "abuja"));
  await page.goto("/");
  await expect(page).toHaveURL(/\/abuja$/);
});

test("links inside a Lagos page carry /lagos", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.getByTestId("tab.cinemas")).toHaveAttribute("href", "/lagos/cinemas");
  await expect(page.getByTestId("tab.films")).toHaveAttribute("href", "/lagos");
  await expect(page.locator('[data-testid^="film.card."] a').first()).toHaveAttribute("href", /^\/lagos\/film\//);
  await expect(page.getByTestId("footer.about")).toHaveAttribute("href", "/about");
});

test("Abuja's tabs say its cinemas are being added, never made-up times, and lead to Lagos", async ({ page }) => {
  for (const [path, title] of [["/abuja", "What's on in Abuja"], ["/abuja/cinemas", "Cinemas in Abuja"], ["/abuja/soon", "Starting soon in Abuja"], ["/abuja/yours", "Your cinemas"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByTestId("city.coming").locator("h2")).toHaveText("Abuja's cinemas are being added");
    await expect(page.locator("time")).toHaveCount(0);
  }
  await expect(page.getByTestId("tab.cinemas")).toHaveAttribute("href", "/abuja/cinemas");
  await page.getByTestId("city.other").click();
  await expect(page).toHaveURL(/\/lagos$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
});

test("Abuja has no film, cinema or area pages until it has times", async ({ page }) => {
  expect((await page.goto("/abuja/film/ramayana"))!.status()).toBe(404);
  expect((await page.goto("/abuja/cinema/ebonylife-vi"))!.status()).toBe(404);
});

test("Enter in search on an Abuja page lists the matches on Lagos's Films", async ({ page }) => {
  await page.goto("/abuja");
  await page.getByTestId("search.field").click(); // opens search over the page
  await page.getByTestId("search.query").fill("spider");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lagos\?q=spider$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
});

test("with Abuja kept, the 404's button names the city it opens", async ({ page }) => {
  await page.goto("/about");
  await page.evaluate(() => localStorage.setItem("ls.city", "abuja"));
  await page.goto("/no-such-page");
  await expect(page.getByTestId("notfound.home")).toHaveText("See what's on in Abuja");
  await expect(page.getByTestId("notfound.home")).toHaveAttribute("href", "/abuja");
});
