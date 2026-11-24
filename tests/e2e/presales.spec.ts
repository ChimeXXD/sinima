import { expect, test } from "./test";

// Tickets on sale before a film opens (D-194, mockup/presales/ card A and page 1), on the sample:
// Lagocine's page for 18 Dec, moved onto each film's sample first date. Dune: Part Three has 15
// showings at 6 Filmhouses, Avengers: Doomsday 22 at 7; The Four is coming with nothing on sale.

test("Coming soon: a film already on sale wears the sticker and names who sells it; one not on sale doesn't", async ({ page }) => {
  await page.goto("/lagos");
  const card = (slug: string) => page.locator(`[data-testid="section.coming"] a[href$="/film/${slug}"]`);
  await expect(card("dune-part-three").getByTestId("coming.onsale")).toHaveText("Tickets on sale");
  await expect(card("dune-part-three")).toContainText("6 Filmhouses");
  await expect(card("avengers-doomsday").getByTestId("coming.onsale")).toBeVisible();
  await expect(card("avengers-doomsday")).toContainText("7 Filmhouses");
  await expect(card("the-four").getByTestId("coming.onsale")).toHaveCount(0);
});

test("the film's page: tickets on sale in the chip, then its opening day's times by area, as any film's", async ({ page }) => {
  await page.goto("/lagos/film/dune-part-three");
  await expect(page.getByTestId("coming.chip")).toHaveText(/^Opens \w{3} \d{1,2} \w{3} · tickets on sale$/);
  const opening = page.getByTestId("film.opening");
  await expect(opening.getByRole("heading", { level: 2 })).toHaveText("Times in Lagos");
  await expect(opening).toContainText(/\w+day \d{1,2} \w+ · opening day · tickets on sale/);
  await expect(opening.getByRole("radio")).toHaveCount(1);
  await expect(opening.getByRole("radio")).toContainText("Opens");
  await expect(opening.locator('[data-testid^="area."] h3')).toHaveText(["Lekki", "Victoria Island", "Surulere"]);
  await expect(opening.locator('[data-testid^="time."]')).toHaveCount(15);
  await expect(page.getByTestId("coming.note")).toHaveCount(0);
  await expect(page.getByTestId("coming.calendar")).toBeVisible();
  // A time opens the usual sheet for that showing.
  await opening.locator('[data-testid^="time.filmhouse-circle-mall."]').first().click();
  await expect(page.getByTestId("showing.sheet")).toBeVisible();
  await expect(page.getByTestId("showing.sheet")).toContainText("Filmhouse Circle Mall");
});

test("a coming film with nothing on sale keeps its page as before", async ({ page }) => {
  await page.goto("/lagos/film/the-four");
  await expect(page.getByTestId("coming.note")).toBeVisible();
  await expect(page.getByTestId("film.opening")).toHaveCount(0);
});

test("the page the city's files carry holds no presales: only the film's own page has them", async ({ page, request }) => {
  const lagos = await (await request.get("/data/lagos.json")).json();
  expect(lagos.presales).toBeUndefined();
  await page.goto("/lagos");
  await expect(page.getByTestId("coming.onsale").first()).toBeVisible();
});

for (const width of [360, 390]) {
  test(`at ${width} px the opening day's page and the sticker fit: nothing scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/lagos/film/dune-part-three");
    await expect(page.getByTestId("film.opening")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.goto("/lagos");
    const sticker = page.getByTestId("coming.onsale").first();
    await sticker.scrollIntoViewIfNeeded();
    const poster = await sticker.locator("xpath=ancestor::a[1]").boundingBox();
    const box = await sticker.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(poster!.x - 4);
    expect(box!.x + box!.width).toBeLessThanOrEqual(poster!.x + poster!.width + 4);
  });
}
