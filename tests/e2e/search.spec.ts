import { expect, test, type Page } from "./test";
import { dataFile, freeze, sampleTime, type DataFile } from "./helpers";

// Search and city (Figma 192:7519, build unit 5). Both cities are in the index since D-120: each
// result is in the city of the cinema showing it.

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
  const all = await dataFile(request, "lagos");
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
  await expect(page.getByTestId("search.hit.spider-man-brand-new-day")).toContainText(/Spider-Man: Brand New Day.*sinimas? (tonight|today|tomorrow).*(Next|Tomorrow) \d{1,2}:\d\d\s[AP]M.* · /);
  await page.getByTestId("search.hit.spider-man-brand-new-day").click();
  await expect(page).toHaveURL(/\/film\/spider-man-brand-new-day$/);
});

test("both cities groups the results by city, each result at that city's cinemas", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos");
  await openSearch(page);
  await page.getByTestId("search.query").fill("street fighter"); // on in both cities that evening
  await page.getByTestId("search.scope.both").click();
  await expect(page.getByTestId("search.group.lagos").getByRole("heading")).toHaveAccessibleName("In Lagos"); // the sticker is decoration
  await expect(page.getByTestId("search.group.abuja").getByRole("heading")).toHaveAccessibleName("In Abuja");
  const abuja = page.getByTestId("search.group.abuja").getByTestId("search.hit.street-fighter");
  await expect(abuja).toContainText(/Silverbird (Entertainment Centre|Cinemas Jabi Lake Mall)/);
  await expect(abuja).toHaveAttribute("href", "/abuja/film/street-fighter");
  await expect(page.getByTestId("search.group.lagos").getByTestId("search.hit.street-fighter")).toHaveAttribute("href", "/lagos/film/street-fighter");
  await expect(page.getByTestId("search.group.lagos").getByTestId("search.hit.street-fighter")).not.toContainText("Silverbird Entertainment Centre");
  await expect(page.getByTestId("search.abuja-soon")).toHaveCount(0);
});

test("search finds a film on only in Abuja, at its Abuja cinema, and opens Abuja's page for it", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "09:00"));
  await page.goto("/abuja");
  await openSearch(page);
  await expect(page.getByTestId("search.scope.abuja")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("search.query").fill("dear ajayi");
  await expect(page.getByTestId("search.count")).toHaveText("1 film in Abuja matches “dear ajayi”");
  await expect(page.getByTestId("search.hit.dear-ajayi")).toContainText(/Next \d{1,2}:\d\d\s[AP]M · Silverbird (Entertainment Centre|Cinemas Jabi Lake Mall)/);
  await page.getByTestId("search.scope.lagos").click();
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Nothing called “dear ajayi” in Lagos yet");
  await page.getByTestId("search.scope.abuja").click();
  await page.getByTestId("search.hit.dear-ajayi").click();
  await expect(page).toHaveURL(/\/abuja\/film\/dear-ajayi$/);
});

test("no match names the cities searched, and leads back to what's on", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos");
  await openSearch(page);
  await page.getByTestId("search.query").fill("Avengers");
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Nothing called “Avengers” in Lagos yet");
  await page.getByTestId("search.scope.both").click();
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Nothing called “Avengers” in Lagos or Abuja yet");
  await page.getByTestId("search.scope.abuja").click();
  await expect(page.getByTestId("search.none").getByRole("heading")).toHaveText("Nothing called “Avengers” in Abuja yet");
  await expect(page.getByTestId("search.home")).toHaveText("See what's on in Lagos"); // the page's city
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

test("the city sheet opens from the search bar and from the Films title; Lagos is picked, each city with its own line", async ({ page }) => {
  await page.goto("/lagos");
  await page.getByTestId("search.city").click();
  const sheet = page.getByTestId("city");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading")).toHaveText("Choose your city");
  await expect(page.getByTestId("city.lagos")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("city.lagos")).toContainText(/\d+ sinimas in Lekki, Victoria Island, Ikeja and \d+ more areas/);
  await expect(page.getByTestId("city.abuja")).toHaveText("AbujaAbuja5 sinimas in Central Business District, Jabi, Lugbe and 1 more area"); // D-120
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sinimas in Abuja");
  expect(await page.evaluate(() => localStorage.getItem("ls.city"))).toBe("abuja");
  await page.getByTestId("search.city").click();
  await expect(page.getByTestId("city.abuja")).toHaveAttribute("aria-pressed", "true");
});
