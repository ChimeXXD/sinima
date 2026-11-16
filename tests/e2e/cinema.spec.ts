import { expect, test } from "./test";
import { dataFile, freeze, sampleTime, today } from "./helpers";

// A cinema's page: every film has artwork, and a day that is over still says what was on.
// The page as Figma draws it (build unit 8): tests/e2e/cinema-screen.spec.ts.

test("every film on a cinema's page has a poster: TMDB's, or a stand-in, never an empty box", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "10:00");
  const id = "genesis-purple-lekki";
  const films = [...new Set(today(all, now).filter((s) => s.cinemaId === id).map((s) => s.filmId))];
  await freeze(page, now);
  await page.goto(`/lagos/cinema/${id}`);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Genesis Deluxe Purple Mall");
  expect((await page.locator('[data-testid^="film.card."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(10)))).sort()).toEqual([...films].sort());

  const withPoster = films.find((f) => all.films.find((x) => x.id === f)?.posterPath);
  const without = films.find((f) => !all.films.find((x) => x.id === f)?.posterPath);
  expect(withPoster && without).toBeTruthy();
  await expect(page.getByTestId(`film.card.${withPoster}`).locator("img").first()).toHaveAttribute("src", /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\//);
  await expect(page.getByTestId(`film.card.${without}`).getByTestId("poster.none")).toBeVisible();
  for (const card of await page.locator('[data-testid^="film.card."]').all()) {
    expect(await card.locator("img[src*='image.tmdb.org'], [data-testid='poster.none']").count()).toBe(1); // the Stay chip's sticker is an image too
  }
});

test("late at night, with every time started, each film says when it showed", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "23:55"));
  await page.goto("/lagos/cinema/genesis-purple-lekki");
  await expect(page.getByTestId("films.note")).toHaveText(/ today · all started$/);
  await expect(page.locator('[data-testid^="time."]')).toHaveCount(0);
  const cards = page.locator('[data-testid^="film.card."]');
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) await expect(card.getByTestId("film.earlier")).toHaveText(/^Started earlier today at \d{1,2}:\d\d\s[AP]M/);
});
