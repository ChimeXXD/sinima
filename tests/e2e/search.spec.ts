import { expect, test, type Page } from "@playwright/test";
import { dataFile, freeze, sampleTime, type DataFile } from "./helpers";

// Search and city (Figma 192:7519, build unit 5). The data has Lagos only until the city layer
// (unit 13), so Abuja says its cinemas are being added and is never filled with made-up times.

const fold = (text: string) => text.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");
/** Films whose title holds the query and that have a showing still to start today or tomorrow. */
function matching(file: DataFile, query: string, now: Date): string[] {
  const left = new Set(file.showings.filter((s) => Date.parse(s.startsAt) > now.getTime()).map((s) => s.filmId));
  return file.films.filter((film) => left.has(film.id) && fold(film.title).includes(fold(query))).map((film) => film.id);
}

async function openSearch(page: Page) {
  await page.getByTestId("search.field").click();
  await expect(page.getByTestId("search.panel")).toBeVisible();
  await expect(page.getByTestId("search.query")).toBeFocused();
}

test("on a phone, search opens over the page, finds films in Lagos and opens one", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "17:30");
  await freeze(page, now);
  await page.goto("/lagos");
  await openSearch(page);
  await expect(page.getByTestId("search.scope.lagos")).toHaveAttribute("aria-pressed", "true");
  const cancel = (await page.getByTestId("search.cancel").boundingBox())!;
  expect(cancel.height).toBeGreaterThanOrEqual(44);

  await page.getByTestId("search.query").fill("Sp");
  const ids = matching(all, "Sp", now);
  expect(ids.length).toBeGreaterThan(1);
  await expect(page.getByTestId("search.count")).toHaveText(`${ids.length} films in Lagos match “Sp”`);
  const hits = page.locator('[data-testid^="search.hit."]');
  await expect(hits).toHaveCount(ids.length);
  // On a phone search covers the page, so it carries the page's sample-data banner (rule 8).
  await expect(page.getByTestId("search.panel").getByTestId("banner.sample")).toBeVisible();
  // Each result: title, what we know of it with how many cinemas, and the next showing with its cinema.
  await expect(page.getByTestId("search.hit.spider-man-brand-new-day")).toContainText(/Spider-Man: Brand New Day.*cinemas? (tonight|today|tomorrow).*(Next|Tomorrow) \d{1,2}:\d\d\s[AP]M.* · /);
  await page.getByTestId("search.hit.spider-man-brand-new-day").click();
  await expect(page).toHaveURL(/\/film\/spider-man-brand-new-day$/);
});

test("both cities groups the results by city; Abuja says its cinemas are being added", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos");
  await openSearch(page);
  await page.getByTestId("search.query").fill("rama");
  await page.getByTestId("search.scope.both").click();
  await expect(page.getByTestId("search.group.lagos").getByRole("heading")).toHaveAccessibleName("In Lagos"); // the sticker is decoration
  await expect(page.getByTestId("search.group.lagos").locator('[data-testid^="search.hit."]')).not.toHaveCount(0);
  await expect(page.getByTestId("search.group.abuja")).toHaveCount(0);
  await expect(page.getByTestId("search.abuja-soon")).toHaveText("Abuja's cinemas are being added.");
});

test("no match names the cities searched, and leads back to what's on", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos");
  await openSearch(page);
  await page.getByTestId("search.query").fill("Avengers");
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Nothing called “Avengers” in Lagos yet");
  await page.getByTestId("search.scope.both").click();
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Nothing called “Avengers” in Lagos or Abuja yet");
  // Abuja has no cinemas yet: it says so, not that the spelling may be wrong.
  await page.getByTestId("search.scope.abuja").click();
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Abuja's cinemas are being added");
  await expect(page.getByTestId("search.none")).not.toContainText("spelling");
  await page.getByTestId("search.home").click();
  await expect(page.getByTestId("search.panel")).toHaveCount(0);
  await expect(page.getByTestId("search.field")).toHaveValue("");
  await expect(page.locator('[data-testid^="film.card."]')).not.toHaveCount(0);
});

test("Cancel closes search and empties it; Escape closes it and gives focus back to the bar", async ({ page }) => {
  await page.goto("/lagos");
  await openSearch(page);
  await page.getByTestId("search.query").fill("rama");
  await page.getByTestId("search.cancel").click();
  await expect(page.getByTestId("search.panel")).toHaveCount(0);
  await expect(page.getByTestId("search.field")).toHaveValue("");

  await openSearch(page);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("search.panel")).toHaveCount(0);
  await expect(page.getByTestId("search.field")).toBeFocused();
});

test("Enter on another page lists the matches on Films", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.setViewportSize({ width: 1440, height: 900 }); // a film page's search is in the desktop navbar
  await page.goto("/lagos/film/ramayana");
  await openSearch(page);
  await page.getByTestId("search.query").fill("spider");
  await expect(page.getByText("Press Enter to see it on Films.")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lagos\?q=spider$/);
  await expect(page.locator('[data-testid^="film.card."]')).toHaveCount(1);
});

// Figma: on the 834 iPad the panel is 752 wide, 41 in from each side; on desktop 560 wide from the
// bar's left edge. Both start 8 above the bar. The test browser may show a scrollbar, so the iPad's
// insets are measured from the page's own width.
for (const { width, height } of [
  { width: 834, height: 1194 },
  { width: 1440, height: 900 },
]) {
  test(`at ${width} px search is a panel over the bar, the page dimmed; a tap outside closes it`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/lagos");
    const bar = (await page.getByTestId("search").boundingBox())!;
    const inner = await page.evaluate(() => document.documentElement.clientWidth);
    await openSearch(page);
    await page.getByTestId("search.panel").evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished))); // it grows in from 98%
    const box = (await page.getByTestId("search.panel").boundingBox())!;
    expect(Math.round(box.y)).toBe(Math.round(bar.y) - 8);
    if (width >= 1200) {
      expect([Math.round(box.x), Math.round(box.width)]).toEqual([Math.round(bar.x), 560]);
    } else {
      expect([Math.round(box.x), Math.round(box.x + box.width)]).toEqual([41, inner - 41]);
    }
    await expect(page.getByTestId("search.cancel")).toBeHidden();
    await page.mouse.click(width - 20, height - 20);
    await expect(page.getByTestId("search.panel")).toHaveCount(0);
  });
}

test("the city sheet opens from the search bar and from the Films title; Lagos is picked, Abuja's cinemas are coming", async ({ page }) => {
  await page.goto("/lagos");
  await page.getByTestId("search.city").click();
  const sheet = page.getByTestId("city");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading")).toHaveText("Choose your city");
  await expect(page.getByTestId("city.lagos")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("city.lagos")).toContainText(/\d+ cinemas in Lekki, Victoria Island, Ikeja and \d+ more areas/);
  await expect(page.getByTestId("city.abuja")).toHaveText("AbujaAbujaAbuja's cinemas are being added");
  await page.getByTestId("city.lagos").click();
  await expect(sheet).toBeHidden();

  await page.getByTestId("films.city").click();
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

// Since the city layer (D-98) Abuja can be picked: it opens Abuja's same tab, kept on this phone.
test("picking Abuja in the city sheet opens Abuja's same tab and keeps the city", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await page.getByTestId("search.city").click();
  await page.getByTestId("city.abuja").click();
  await expect(page).toHaveURL(/\/abuja\/cinemas$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Abuja");
  expect(await page.evaluate(() => localStorage.getItem("ls.city"))).toBe("abuja");
  await page.getByTestId("search.city").click();
  await expect(page.getByTestId("city.abuja")).toHaveAttribute("aria-pressed", "true");
});
