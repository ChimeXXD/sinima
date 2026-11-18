import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "./test";
import { dataFile, freeze, lagosDay, live, sampleTime, type DataFile } from "./helpers";

// Abuja is a city like Lagos (D-120): its own areas, cinemas, films and times, from the same
// pipeline. The sample has Abuja's times from Silverbird's two Veezi pages, saved on 17 Nov; Genesis
// Ceddi Plaza and Nova Lugbe have no saved page yet, and The Jays publishes no times.

const ABUJA_CINEMAS = ["silverbird-sec", "silverbird-jabi", "genesis-ceddi-plaza", "nova-abuja", "jays-kuje"];
const cards = (page: import("@playwright/test").Page, kind: "film" | "cinema") =>
  page.locator(`[data-testid^="${kind}.card."]`).evaluateAll((els, prefix) => els.map((el) => el.getAttribute("data-testid")!.slice(prefix.length)), `${kind}.card.`);

test("Abuja's Films lists Abuja's films only, and Lagos's none of them that Lagos isn't showing", async ({ page, request }) => {
  const abuja = await dataFile(request, "abuja");
  const lagos = await dataFile(request, "lagos");
  await page.goto("/abuja");
  await expect(page.getByTestId("films.title")).toHaveText(/^What's on in Abuja/);
  await expect(page.getByTestId("banner.sample")).toBeVisible();
  const shown = await cards(page, "film");
  expect(shown.length).toBeGreaterThan(0);
  const abujaFilms = new Set(abuja.films.map((film) => film.id));
  expect(shown.filter((id) => !abujaFilms.has(id))).toEqual([]);
  expect(shown).toContain("dear-ajayi"); // on only in Abuja
  expect(shown).not.toContain("ramayana"); // on only in Lagos

  await page.goto("/lagos");
  const lagosShown = await cards(page, "film");
  const lagosFilms = new Set(lagos.films.map((film) => film.id));
  expect(lagosShown.filter((id) => !lagosFilms.has(id))).toEqual([]);
  expect(lagosShown).not.toContain("dear-ajayi");
});

test("Abuja's Cinemas lists its five cinemas; The Jays says in words that it has no times", async ({ page }) => {
  await page.goto("/abuja/cinemas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sinimas in Abuja");
  await expect(page.getByTestId("cinemas.count")).toHaveText("5 of them!");
  // The title's logo stickers are chains Abuja has: no Filmhouse or EbonyLife (D-120).
  await expect(page.locator('img[src="/logos/filmhouse.png"], img[src="/logos/ebonylife.png"]')).toHaveCount(0);
  await expect(page.locator('img[src="/logos/nova.png"]').first()).toBeAttached();
  // Four stickers like Lagos's, The Jays in the fourth place (D-141).
  await expect(page.getByTestId("cinemas.hero.art").locator("img")).toHaveCount(4);
  await expect(page.getByTestId("cinemas.hero.art").locator('img[src="/logos/jays.png"]')).toHaveCount(1);
  expect((await cards(page, "cinema")).sort()).toEqual([...ABUJA_CINEMAS].sort());
  await expect(page.getByTestId("cinema.card.jays-kuje").getByTestId("cinema.next")).toHaveText("Times not available yet");
  await expect(page.getByTestId("cinema.card.jays-kuje")).toContainText("Kuje");
  await expect(page.getByTestId("cinema.card.silverbird-jabi").getByTestId("cinema.next")).toHaveText(/^Next at \d{1,2}:\d\d\s[AP]M · \d+ films? today$/);
  await expect(page.getByTestId("cinemas.no-times")).toBeVisible();
  // The area picker offers Abuja's areas only.
  await page.getByTestId("pick.area").click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("Central Business District");
  await expect(sheet).not.toContainText("Lekki");
});

test("a Lagos page shows no Abuja cinema", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  const shown = await cards(page, "cinema");
  expect(shown).toHaveLength(22);
  expect(shown.filter((id) => ABUJA_CINEMAS.includes(id))).toEqual([]);
});

test("an Abuja cinema's page shows its times and leads back to Abuja's cinemas", async ({ page, request }) => {
  const abuja = await dataFile(request, "abuja");
  await page.goto("/abuja/cinema/silverbird-jabi");
  await expect(page.getByTestId("cinema.title")).toHaveText("Silverbird Cinemas Jabi Lake Mall");
  await expect(page.locator('[data-testid^="time.street-fighter."]').first()).toBeVisible();
  expect(abuja.showings.some((s) => s.cinemaId === "silverbird-jabi" && s.filmId === "street-fighter")).toBe(true);
  await expect(page.getByTestId("cinema.back")).toHaveAccessibleName(/All sinimas in Abuja/);
  await page.getByTestId("cinema.back").click();
  await expect(page).toHaveURL(/\/abuja\/cinemas$/);
});

test("an Abuja film's page says where it is on in Abuja, by Abuja's areas", async ({ page }) => {
  await page.goto("/abuja/film/dear-ajayi");
  await expect(page.getByTestId("film.title")).toHaveText("Dear Ajayi");
  await expect(page.locator('[id="film.times"]')).toHaveText("Times in Abuja");
  await expect(page.getByTestId("film.back")).toHaveAccessibleName(/All films in Abuja/);
  await expect(page.locator("main")).toContainText(/in Abuja/);
  await expect(page.getByTestId("area.central-business-district")).toBeVisible();
  await expect(page.getByTestId("area.jabi")).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Lagos");
});

test("an Abuja area page lists its cinemas, then the areas next to it", async ({ page }) => {
  await page.goto("/abuja/area/central-business-district");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Central Business District");
  await expect(page.locator("main")).toContainText("Silverbird Entertainment Centre");
  await expect(page.locator("main")).toContainText("Genesis Cinemas Ceddi Plaza");
  await expect(page.locator("main")).toContainText("Jabi");
  await expect(page.locator("main")).not.toContainText("Lekki");
});

test("the tab bar's Your cinemas count counts the page city's saved cinemas only (D-136)", async ({ page }) => {
  // Two saved in Lagos, one in Abuja, as a phone that has used both cities would have them.
  await page.addInitScript(() => localStorage.setItem("ls.cinemas", JSON.stringify(["silverbird-ikeja", "grand-lekki", "silverbird-jabi"])));
  await page.goto("/lagos");
  await expect(page.getByTestId("nav.count")).toHaveText("2");
  await page.goto("/abuja");
  await expect(page.getByTestId("nav.count")).toHaveText("1");
});

// Five days (D-142, D-146, D-147, D-148). The sample has a third day only in Abuja: Silverbird's two
// Veezi pages list it, in its own file, /data/abuja/<date>.json, fetched when a visitor picks it.
test.describe("a later day in Abuja", () => {
  // The abort below must reach the page's own fetch, not one the service worker makes.
  test.use({ serviceWorkers: "block" });
  const DAY = 24 * 3_600_000;
  /** The sample's first day at `hhmm` (the build's day), and the third day's date and file. */
  const first = async (request: APIRequestContext) => new Date((await sampleTime(request, "12:00")).getTime() - DAY);
  const third = async (request: APIRequestContext) => {
    const { generatedAt } = await dataFile(request, "abuja");
    const date = new Date(Date.parse(`${lagosDay(generatedAt)}T12:00:00Z`) + 2 * DAY);
    const key = date.toISOString().slice(0, 10);
    const file = (await (await request.get(`/data/abuja/${key}.json`)).json()) as DataFile;
    const name = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" }).format(date).replace(",", "");
    return { key, file, name, weekday: name.split(" ")[0]! };
  };
  const fetched = (page: Page) => {
    const urls: string[] = [];
    page.on("request", (r) => void (r.url().includes("/data/abuja/") && urls.push(new URL(r.url()).pathname)));
    return urls;
  };

  test("Films shows a tile per day with times, and picking the third fetches its file and shows its films", async ({ page, request }) => {
    const day = await third(request);
    await freeze(page, await first(request));
    const urls = fetched(page);
    await page.goto("/abuja");
    await live(page);
    const tiles = page.getByTestId("films.day").getByRole("radio");
    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0)).toHaveAccessibleName(/^Today, /);
    await expect(tiles.nth(2)).toHaveAccessibleName(day.name);
    expect(urls).toEqual([]); // nothing is fetched until a later day is picked
    await tiles.nth(2).click();
    await expect(tiles.nth(2)).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("section.day").locator("p").first()).toHaveText(`${new Set(day.file.showings.map((s) => s.filmId)).size} films on ${day.weekday}`);
    expect(urls).toEqual([`/data/abuja/${day.key}.json`]);
    const shown = await cards(page, "film");
    expect(new Set(shown)).toEqual(new Set(day.file.showings.map((s) => s.filmId)));
    // Both of Abuja's sinimas with times have listed it: no "so far" sentence.
    await expect(page.getByTestId("films.listed")).toHaveCount(0);
    // A film on that day opens on that day.
    await page.getByTestId(`film.card.${shown[0]}`).getByRole("link").last().click();
    await expect(page).toHaveURL(new RegExp(`/abuja/film/${shown[0]}\\?day=${day.key}$`));
    await expect(page.getByTestId("film.day").getByRole("radio").nth(2)).toHaveAttribute("aria-checked", "true");
    const cinemas = new Set(day.file.showings.filter((s) => s.filmId === shown[0]).map((s) => s.cinemaId));
    for (const id of cinemas) await expect(page.getByTestId(`venue.${id}`)).toBeVisible();
  });

  test("the arrow keys move the day without motion, and fetch the later day", async ({ page, request }) => {
    const day = await third(request);
    await freeze(page, await first(request));
    await page.goto("/abuja");
    await live(page);
    const row = page.getByTestId("films.day");
    await row.getByRole("radio").nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(row.getByRole("radio").nth(2)).toBeFocused();
    await expect(row.getByRole("radio").nth(2)).toHaveAttribute("aria-checked", "true");
    await expect(row).toHaveAttribute("data-instant", "true");
    expect(await row.locator("span").first().evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
    await expect(page.getByTestId("section.day").locator("p").first()).toHaveText(new RegExp(`on ${day.weekday}$`));
  });

  test("a sinima's page and Sinimas' Day menu offer the third day", async ({ page, request }) => {
    const day = await third(request);
    await freeze(page, await first(request));
    await page.goto("/abuja/cinema/silverbird-jabi");
    await live(page);
    await page.getByTestId("films.day").getByRole("radio", { name: day.name }).click();
    await expect(page.getByTestId("films.title")).toHaveText(`Films on ${day.weekday}`);
    const films = new Set(day.file.showings.filter((s) => s.cinemaId === "silverbird-jabi").map((s) => s.filmId));
    await expect(page.locator('[data-testid^="film.card."]')).toHaveCount(films.size);

    await page.goto("/abuja/cinemas");
    await live(page);
    await page.getByTestId("pick.day").click();
    await expect(page.locator('[data-testid^="day.option."]')).toHaveCount(3);
    await page.getByTestId(`day.option.${day.key}`).click();
    await expect(page.getByTestId("pick.day")).toHaveText(new RegExp(`^Day${day.weekday.slice(0, 3)} \\d+ \\w{3}$`));
    await expect(page.getByTestId("cinema.card.silverbird-jabi")).toContainText(new RegExp(`films? on ${day.weekday}`));
    await expect(page.getByTestId("cinema.card.jays-kuje")).toContainText("Times not available yet");
  });

  test("a later day that can't be fetched says so in words, and Try again fetches it", async ({ page, request }) => {
    const day = await third(request);
    await freeze(page, await first(request));
    await page.route("**/data/abuja/*.json", (route) => route.abort());
    await page.goto("/abuja");
    await live(page);
    await page.getByTestId("films.day").getByRole("radio").nth(2).click();
    await expect(page.getByTestId("day.failed")).toContainText(`${day.weekday}'s times didn't load.`);
    await expect(page.locator('[data-testid^="film.card."]')).toHaveCount(0);
    await page.unroute("**/data/abuja/*.json");
    await page.getByTestId("day.retry").click();
    await expect(page.getByTestId("day.failed")).toHaveCount(0);
    await expect(page.getByTestId("section.day").locator("p").first()).toHaveText(new RegExp(`on ${day.weekday}$`));
  });

  for (const width of [320, 360, 390]) {
    test(`at ${width} px a later day's Films page doesn't scroll sideways`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 800 });
      await freeze(page, await first(request));
      await page.goto("/abuja");
      await live(page);
      await page.getByTestId("films.day").getByRole("radio").nth(2).click();
      await expect(page.getByTestId("section.day")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(await page.getByTestId("films.day").locator("span").evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 0.5).length)).toBe(0);
    });
  }
});
