import { expect, test } from "./test";

// The city is the first part of every city page's address (D-98, build unit 13): /lagos/…,
// /abuja/…. Old addresses forward to their Lagos page; "/" opens the city kept on this phone.

test("old addresses forward to their Lagos page, keeping a shared showing after the #", async ({ page }) => {
  await page.goto("/cinemas");
  await expect(page).toHaveURL(/\/lagos\/cinemas$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sinimas in Lagos");
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

// Abuja's tabs have its own times since D-120 (tests/e2e/abuja.spec.ts); its links carry /abuja.
test("Abuja's tabs are titled for Abuja and their links carry /abuja", async ({ page }) => {
  for (const [path, title] of [["/abuja", "What's on in Abuja"], ["/abuja/cinemas", "Sinimas in Abuja"], ["/abuja/soon", "Starting soon in Abuja"], ["/abuja/yours", "Your sinimas"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
  await expect(page.getByTestId("tab.cinemas")).toHaveAttribute("href", "/abuja/cinemas");
  await expect(page.getByTestId("tab.films")).toHaveAttribute("href", "/abuja");
});

test("each cinema and area has a page in its own city only; a film in each city it is showing in", async ({ page }) => {
  expect((await page.goto("/abuja/cinema/ebonylife-vi"))!.status()).toBe(404);
  expect((await page.goto("/lagos/cinema/silverbird-jabi"))!.status()).toBe(404);
  expect((await page.goto("/abuja/area/lekki"))!.status()).toBe(404);
  expect((await page.goto("/lagos/area/jabi"))!.status()).toBe(404);
  expect((await page.goto("/abuja/film/ramayana"))!.status()).toBe(404); // Ramayana isn't on in Abuja's sample
  expect((await page.goto("/lagos/film/dear-ajayi"))!.status()).toBe(404); // nor Dear Ajayi in Lagos's
  expect((await page.goto("/abuja/film/spider-man-brand-new-day"))!.status()).toBe(200);
  expect((await page.goto("/lagos/film/spider-man-brand-new-day"))!.status()).toBe(200);
});

test("old addresses were Lagos pages: an Abuja cinema has none", async ({ page }) => {
  expect((await page.goto("/cinema/silverbird-jabi"))!.status()).toBe(404);
  expect((await page.goto("/area/jabi"))!.status()).toBe(404);
});

test("Enter in search on an Abuja page lists the matches on Abuja's Films", async ({ page }) => {
  await page.goto("/abuja/cinemas");
  await page.getByTestId("search.field").click(); // opens search over the page
  await page.getByTestId("search.query").fill("spider");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/abuja\?q=spider$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Abuja");
  await expect(page.getByTestId("film.card.spider-man-brand-new-day")).toBeVisible();
});

test("with Abuja kept, the 404's button names the city it opens", async ({ page }) => {
  await page.goto("/about");
  await page.evaluate(() => localStorage.setItem("ls.city", "abuja"));
  await page.goto("/no-such-page");
  await expect(page.getByTestId("notfound.home")).toHaveText("See what's on in Abuja");
  await expect(page.getByTestId("notfound.home")).toHaveAttribute("href", "/abuja");
});
