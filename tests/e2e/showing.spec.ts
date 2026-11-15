import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { dataFile, freeze, lagosClock, sampleTime, today } from "./helpers";

// The old showing panel still serves Starting soon until build unit 9; a cinema's page has Figma's
// sheet since unit 8 (tests/e2e/cinema-screen.spec.ts).
async function openFirst(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "18:00");
  const row = today(all, now)[0]!;
  await freeze(page, now);
  await page.goto("/soon");
  await page.getByTestId("section.soon").getByTestId(`time.${row.filmId}.${row.startsAt}`).first().click();
  await expect(page.getByTestId("showing.panel")).toBeVisible();
  const name = await page.getByTestId("showing.cinema").textContent();
  const cinema = all.cinemas.find((c) => c.name === name)!;
  return { all, row, cinema, film: all.films.find((f) => f.id === row.filmId)! };
}

test("Share opens the card; Copy link copies a link that opens this exact showing", async ({ page, request, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const { row, film, cinema } = await openFirst(page, request);
  await page.getByTestId("showing.share").click();
  const share = page.getByTestId("share.dialog");
  await expect(share).toBeVisible();
  await expect(share.getByRole("heading")).toHaveText("Films are better with friends");
  await expect(share.getByTestId("share.card")).toContainText(film.title);
  await expect(share.getByTestId("share.card")).toContainText(lagosClock(row.startsAt));
  await expect(share.getByTestId("share.card")).toContainText(cinema.name);
  // The card sits at a tilt, as in the approved design.
  expect(await share.getByTestId("share.card").evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");

  await share.getByTestId("share.copy").click();
  await expect(share.getByTestId("share.copy")).toHaveText("Link copied");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain(`/cinema/${cinema.id}#s=${film.id}@${row.startsAt}`);
  expect(link).not.toMatch(/utm_|fbclid/);

  // The link opens that showing in the cinema page's sheet (Figma, build unit 8).
  await page.goto(link);
  await expect(page.getByTestId("showing.sheet")).toHaveAccessibleName(`${lagosClock(row.startsAt)} · ${cinema.name}`);
});

test("a tap on Share's own edge keeps it open; closing Share goes back to the showing, still open", async ({ page, request }) => {
  const { film } = await openFirst(page, request);
  await page.getByTestId("showing.share").click();
  const share = page.getByTestId("share.dialog");
  await expect(share).toBeVisible();
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)))); // an animation that is cancelled rejects; that is fine here
  const box = (await share.boundingBox())!;
  await page.mouse.click(box.x + 6, box.y + box.height - 6); // inside the box, on its padding
  await expect(share).toBeVisible();

  await share.getByTestId("share.close").click();
  await expect(share).toHaveCount(0);
  await expect(page.getByTestId("showing.panel")).toBeVisible();
  await expect(page.getByTestId("showing.title")).toHaveText(film.title);
});

test("an address with a broken % after the # still opens the page", async ({ page }) => {
  await page.goto("/cinema/genesis-purple-lekki#%E0%A4%A");
  await expect(page.getByTestId("cinema.title")).toHaveText("Genesis Deluxe Purple Mall");
  await expect(page.getByTestId("showing.sheet")).toHaveCount(0);
});

test("Remind me downloads a calendar file for the showing with a 30-minute alert", async ({ page, request }) => {
  const { row, cinema } = await openFirst(page, request);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("showing.remind").click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`${cinema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.*\\.ics$`));
  const ics = readFileSync(await download.path(), "utf8");
  expect(ics).toContain(`DTSTART:${row.startsAt.replace(/[-:]/g, "")}`);
  expect(ics).toContain("TRIGGER:-PT30M");
});

test("the panel closes with Escape and gives focus back to the time that opened it", async ({ page, request }) => {
  const { row } = await openFirst(page, request);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("showing.panel")).toBeHidden();
  await expect(page.getByTestId("section.soon").getByTestId(`time.${row.filmId}.${row.startsAt}`).first()).toBeFocused();
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
  const all = await dataFile(request, "all");
  const row = today(all, await sampleTime(request, "18:00")).find((s) => s.cinemaId === "ebonylife-vi")!;
  const now = new Date(Date.parse(row.startsAt) - 60_000);
  await asLiveData(page, "/cinema/ebonylife-vi", new Date(now.getTime() - 3_600_000));
  await freeze(page, now);
  await page.goto("/cinema/ebonylife-vi");
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
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "18:00");
  const row = today(all, now).find((s) => s.cinemaId === "ebonylife-vi")!;
  await asLiveData(page, "/cinema/ebonylife-vi", new Date(now.getTime() - 30 * 3_600_000));
  await freeze(page, now);
  await page.goto("/cinema/ebonylife-vi");
  await expect(page.getByTestId("banner.stale")).toHaveText("Some times are from yesterday. Cinemas change programmes; check before you travel.");
  // Figma Cinema › Times a day old: the films' note and a warning say so too.
  await expect(page.getByTestId("films.note")).toHaveText(/ · times from yesterday$/);
  await expect(page.getByTestId("films.warning")).toHaveText("Times from yesterday");
  await page.getByTestId(`time.${row.filmId}.${row.startsAt}`).click();
  // Stale times can still be booked (D-25).
  await expect(page.getByTestId("showing.sheet").getByTestId("showing.book")).toContainText("Book on EbonyLife's site");
});
