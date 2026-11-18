import { expect, test } from "./test";
import { dataFile, freeze, sampleTime, shownClock, today } from "./helpers";

// The showing sheet's own flows are in film-screen, cinema-screen and soon-screen specs (Figma, build
// units 4, 8 and 9); the old panel and its share card went with build unit 9.

test("an old shared link to a showing on a cinema's page (#s=<film>@<start>) opens it in the sheet (D-93 f)", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "18:00");
  const row = today(all, now)[0]!;
  const cinema = all.cinemas.find((c) => c.id === row.cinemaId)!;
  await freeze(page, now);
  await page.goto(`/lagos/cinema/${cinema.id}#s=${row.filmId}@${row.startsAt}`);
  await expect(page.getByTestId("showing.sheet")).toHaveAccessibleName(`${shownClock(row.startsAt)} · ${cinema.name}`);
});

test("an address with a broken % after the # still opens the page", async ({ page }) => {
  await page.goto("/lagos/cinema/genesis-purple-lekki#%E0%A4%A");
  await expect(page.getByTestId("cinema.title")).toHaveText("Genesis Deluxe Purple Mall");
  await expect(page.getByTestId("showing.sheet")).toHaveCount(0);
});

// The site holds only sample data, which can never be booked or go stale. To run those paths,
// these tests rewrite the page on its way to the browser into live data read at a chosen time.
// Nothing in the built site changes.
async function asLiveData(page: import("@playwright/test").Page, path: string, readAt: Date) {
  const stamp = readAt.toISOString().replace(".000Z", "Z");
  await page.route(`**${path}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace(/(fetchedAt\\?":\\?")[0-9T:Z-]+/g, `$1${stamp}`)
      .replace(/(method\\?":\\?")fixture/g, "$1public-page")
      .replace(/(sample\\?":)true/g, "$1false")
      .replace(/(book\\?":)null/g, '$1\\"https://ebonylifecinemas.com/movies/x\\"');
    await route.fulfill({ response, body });
  });
}

test("a live showing can be booked on the cinema's own site until the second it starts, never after", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const row = today(all, await sampleTime(request, "18:00")).find((s) => s.cinemaId === "ebonylife-vi")!;
  const now = new Date(Date.parse(row.startsAt) - 60_000);
  await asLiveData(page, "/lagos/cinema/ebonylife-vi", new Date(now.getTime() - 3_600_000));
  await freeze(page, now);
  await page.goto("/lagos/cinema/ebonylife-vi");
  await expect(page.getByTestId("banner.sample")).toHaveCount(0);
  await page.getByTestId(`time.${row.filmId}.${row.startsAt}`).click();

  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet.getByTestId("countdown-badge")).toHaveText("Starts in1 min");
  const book = sheet.getByTestId("showing.book");
  await expect(book).toContainText("Book on EbonyLife's site");
  await expect(book).toHaveAttribute("href", "https://ebonylifecinemas.com/movies/x");
  await expect(book).toHaveAttribute("target", "_blank");
  await expect(book).toHaveAttribute("rel", "noopener");

  await page.clock.runFor(61_000);
  await expect(sheet.getByTestId("showing.book")).toHaveCount(0);
  await expect(sheet.getByTestId("showing.started")).toBeVisible();
});

test("times read 30 hours ago show the stale banner, and the showing says so in words", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "18:00");
  const row = today(all, now).find((s) => s.cinemaId === "ebonylife-vi")!;
  await asLiveData(page, "/lagos/cinema/ebonylife-vi", new Date(now.getTime() - 30 * 3_600_000));
  await freeze(page, now);
  await page.goto("/lagos/cinema/ebonylife-vi");
  await expect(page.getByTestId("banner.stale")).toHaveText("Some times are from yesterday. Sinimas change programmes; check before you travel.");
  // Figma Cinema › Times a day old: the films' note and a warning say so too.
  await expect(page.getByTestId("films.note")).toHaveText(/ · times from yesterday$/);
  await expect(page.getByTestId("films.warning")).toHaveText("Times from yesterday");
  await page.getByTestId(`time.${row.filmId}.${row.startsAt}`).click();
  // Stale times can still be booked (D-25).
  await expect(page.getByTestId("showing.sheet").getByTestId("showing.book")).toContainText("Book on EbonyLife's site");
});
