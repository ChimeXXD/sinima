import { expect, test } from "@playwright/test";
import { dataFile, freeze, lagosClock, sampleTime, today } from "./helpers";

test("Films (the home page, D-55) lists every film still showing; typing narrows it; a film opens its page", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "18:00");
  const showing = new Set(today(all, now).map((s) => s.filmId));
  await freeze(page, now);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos"); // Figma Films (D-82)
  const cards = page.locator('[data-testid^="film.card."]');
  await expect(cards).toHaveCount(showing.size);

  await page.getByTestId("search.field").fill("  RAMA ");
  await expect(cards).toHaveCount([...showing].filter((id) => id.includes("rama")).length);
  await page.getByTestId("search.field").fill("zzz");
  await expect(cards).toHaveCount(0);
  await expect(page.getByTestId("films.none")).toHaveText('No film showing matches "zzz".');

  await page.getByTestId("search.field").fill("spider");
  await cards.first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/film\/spider-man-brand-new-day$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Spider-Man: Brand New Day");
  await expect(page.getByTestId("credits.chip")).toHaveText("Stay: scene after the credits · TMDB");
});

// The film page's format and area chips (D-50) are gone in the Figma design (D-88): it lists every
// cinema by area, your area first. tests/e2e/film-screen.spec.ts covers it.

for (const path of ["/film/ramayana", "/", "/cinemas", "/soon", "/cinema/ebonylife-vi"]) {
  test(`${path} does not scroll sideways on a phone`, async ({ page, request }) => {
    await freeze(page, await sampleTime(request, "10:00"));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("Starting soon lists only what starts in the next 2 hours, soonest first", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "18:00");
  const soon = today(all, now).filter((s) => Date.parse(s.startsAt) - now.getTime() <= 2 * 3_600_000);
  await freeze(page, now);
  await page.goto("/soon");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Starting soon in Lagos");
  const times = await page.getByTestId("section.soon").locator("[data-testid^='time.']").allTextContents();
  expect(times.map((t) => t.slice(0, 5))).toEqual(soon.map((s) => lagosClock(s.startsAt)));
  await expect(page.getByTestId("section.soon").getByTestId("soon.countdown").first()).toHaveText(/^Starts in /);
});

test.describe("with the phone set to New York", () => {
  test.use({ timezoneId: "America/New_York" });
  test("times are still Lagos times", async ({ page, request }) => {
    const all = await dataFile(request, "all");
    const now = await sampleTime(request, "18:00");
    const row = today(all, now).find((s) => s.cinemaId === "ebonylife-vi")!;
    await freeze(page, now);
    await page.goto("/cinema/ebonylife-vi");
    expect(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe("America/New_York");
    await expect(page.locator("[data-testid^='time.']").first()).toContainText(lagosClock(row.startsAt));
  });
});
