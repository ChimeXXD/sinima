import { expect, test } from "./test";
import { dataFile } from "./helpers";

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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Abuja");
  await expect(page.getByTestId("cinemas.count")).toHaveText("5 of them!");
  // The title's logo stickers are chains Abuja has: no Filmhouse or EbonyLife (D-120).
  await expect(page.locator('img[src="/logos/filmhouse.png"], img[src="/logos/ebonylife.png"]')).toHaveCount(0);
  await expect(page.locator('img[src="/logos/nova.png"]').first()).toBeAttached();
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
  await expect(page.getByTestId("cinema.back")).toHaveAccessibleName(/All cinemas in Abuja/);
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
