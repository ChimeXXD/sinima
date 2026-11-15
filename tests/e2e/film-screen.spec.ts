import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { dataFile, freeze, lagosClock, sampleTime } from "./helpers";

// Film (Figma 185:3558, build unit 4). The sample data holds Figma's own example: Ramayana at
// 17:30, Lekki saved as the visitor's area.

const keepArea = (page: Page, slug: string) => page.addInitScript((area) => localStorage.setItem("ls.area", area), slug);
const ids = (page: Page, prefix: string) => page.locator(`[data-testid^="${prefix}"]`).evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!));

/** "Monday 16 November": the sample data's second day, the day the tests' clock is on. */
const sampleDay = async (request: Parameters<typeof dataFile>[0]) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" }).format(await sampleTime(request, "12:00")).replace(",", "");

async function startOf(request: Parameters<typeof dataFile>[0], cinema: string, hhmm: string): Promise<string> {
  const all = await dataFile(request, "all");
  const day = (await sampleTime(request, "12:00")).toISOString().slice(0, 10);
  return all.showings.find((s) => s.filmId === "ramayana" && s.cinemaId === cinema && s.startsAt.startsWith(day) && lagosClock(s.startsAt) === hhmm)!.startsAt;
}

test("your area first, then the areas next to it, then the rest soonest first (Figma: Stay or Go not known)", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await keepArea(page, "lekki");
  await page.goto("/film/ramayana");
  await expect(page.getByTestId("film.title")).toHaveText("Ramayana");
  await expect(page.getByTestId("film.facts")).toHaveText("3 h 21 min·IMAX·MX4D·at 10 cinemas in Lagos today");
  await expect(page.getByTestId("credits.chip")).toHaveText("Credits scene: not known yet");
  await expect(page.getByTestId("film.note")).toHaveText("in IMAX!");
  await expect(page.getByText(`${await sampleDay(request)} · your area first`)).toBeVisible();

  expect(await ids(page, "area.")).toEqual(["area.lekki", "area.victoria-island", "area.maryland", "area.festac", "area.surulere"]);
  await expect(page.getByTestId("area.lekki").getByRole("heading")).toHaveText("Lekkiyour area");
  await expect(page.getByTestId("area.victoria-island").getByRole("heading")).toHaveText("Victoria Islandnext to Lekki");
  await expect(page.getByTestId("area.maryland").getByRole("heading")).toHaveText("Maryland");
  expect(await page.getByTestId("area.lekki").locator('[data-testid^="venue."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")))).toEqual(["venue.filmhouse-circle-mall", "venue.filmhouse-ikota", "venue.filmhouse-lekki-imax"]);

  // The soonest time within the hour is blue and counts down after its format.
  const first = page.getByTestId(`time.filmhouse-circle-mall.${await startOf(request, "filmhouse-circle-mall", "18:00")}`);
  await expect(first).toHaveAttribute("data-state", "soonest");
  await expect(first).toHaveText("18:00IMAX · in 30 min");
  await expect(first).toHaveAccessibleName("18:00, IMAX, starts in 30 minutes");
  await expect(page.getByTestId(`time.filmhouse-ikota.${await startOf(request, "filmhouse-ikota", "19:00")}`)).not.toHaveAttribute("data-state", "soonest");

  // Cinemas whose times have all started are named under the list, not listed.
  await expect(page.getByTestId("film.earlier")).toHaveText("Started earlier today: Filmhouse Palms Mall Lekki at 14:00 and Genesis Deluxe Purple Mall at 16:50.");
  await expect(page.getByTestId("venue.filmhouse-palms-lekki")).toHaveCount(0);
});

test("with no area kept, every area is in order of its soonest time, with no tags", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/film/ramayana");
  await expect(page.getByText(`${await sampleDay(request)} · soonest first`)).toBeVisible();
  expect(await ids(page, "area.")).toEqual(["area.lekki", "area.victoria-island", "area.maryland", "area.festac", "area.surulere"]);
  await expect(page.getByTestId("area.victoria-island").getByRole("heading")).toHaveText("Victoria Island");
});

test("a film with a credits scene says Stay, with its source, and stay put! (Figma: Default)", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/film/spider-man-brand-new-day");
  await expect(page.getByTestId("credits.chip")).toHaveText("Stay: scene after the credits · TMDB");
  await expect(page.getByTestId("credits.detail")).toHaveText("TMDB lists an after-credits scene.");
  await expect(page.getByTestId("film.note")).toHaveText("stay put!");
});

test("a time opens its sheet: sample times can't be booked; calendar, countdown; Escape closes it", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/film/ramayana");
  const at = await startOf(request, "filmhouse-circle-mall", "18:00");
  const chip = page.getByTestId(`time.filmhouse-circle-mall.${at}`);
  await chip.click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAccessibleName("18:00 · Filmhouse Circle Mall");
  await expect(sheet.getByText("Ramayana · IMAX · Lekki")).toBeVisible();
  await expect(sheet.getByTestId("countdown-badge")).toHaveText("Starts in30 min");
  await expect(sheet.getByTestId("showing.book")).toContainText("Sample only");
  expect(await sheet.getByTestId("showing.book").evaluate((el) => el.tagName)).toBe("DIV"); // not a link (rule 8, D-25)

  const [download] = await Promise.all([page.waitForEvent("download"), sheet.getByTestId("showing.calendar").click()]);
  const ics = readFileSync(await download.path(), "utf8");
  expect(ics).toContain(`DTSTART:${at.replace(/[-:]/g, "")}`);
  expect(ics).toContain("TRIGGER:-PT30M");
  await expect(sheet.getByTestId("showing.calendar")).toContainText("18:00 to 21:21, with an alert 30 min before.");

  await sheet.getByTestId("showing.keep").click();
  await expect(sheet.getByTestId("showing.keep")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("ls.countdowns"))).toBe(JSON.stringify([`ramayana|filmhouse-circle-mall|${at}`]));

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(chip).toBeFocused();
});

test("once the showing starts the sheet can't book it, and offers the next times nearby (Figma: Started showing)", async ({ page, request }) => {
  const at = await startOf(request, "filmhouse-circle-mall", "18:00");
  await freeze(page, new Date(Date.parse(at) - 60_000));
  await keepArea(page, "lekki");
  await page.goto("/film/ramayana");
  await page.getByTestId(`time.filmhouse-circle-mall.${at}`).click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet.getByTestId("showing.book")).toBeVisible();

  await page.clock.runFor(6 * 60_000); // 18:05, as Figma
  await expect(sheet.getByTestId("countdown-badge")).toHaveText("Started5 min ago");
  await expect(sheet.getByTestId("showing.book")).toHaveCount(0);
  await expect(sheet.getByTestId("showing.started")).toHaveText("This showing started at 18:00, so it can't be booked here. The next times nearby:");
  await expect(sheet.getByTestId("showing.next").getByRole("listitem")).toHaveText(["18:15in 10 minFilmhouse OniruVictoria Island", "19:00Filmhouse IkotaLekki", "22:00Filmhouse Circle MallThis cinema, in IMAX"]);
  await expect(sheet.getByTestId("showing.share-film")).toContainText("A link to Ramayana's times in Lagos.");

  await sheet.getByTestId(`next.filmhouse-oniru.${await startOf(request, "filmhouse-oniru", "18:15")}`).click();
  await expect(sheet).toHaveAccessibleName("18:15 · Filmhouse Oniru");
  await expect(sheet.getByTestId("showing.book")).toBeVisible();
});

// As showing.spec: the built site holds only sample data, so the page is rewritten on its way to
// the browser into live data read an hour ago, to run the booking path.
async function asLiveData(page: Page, path: string, readAt: Date) {
  const stamp = readAt.toISOString().replace(".000Z", "Z");
  await page.route(`**${path}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace(/(fetchedAt\\?":\\?")[0-9T:Z-]+/g, `$1${stamp}`)
      .replace(/(method\\?":\\?")fixture/g, "$1public-page")
      .replace(/(sample\\?":)true/g, "$1false")
      .replace(/(book\\?":)null/g, '$1\\"https://filmhouseng.com/x\\"');
    await route.fulfill({ response, body });
  });
}

test("a live showing books on the cinema's own site until the second it starts, never after (rule 4)", async ({ page, request }) => {
  const at = await startOf(request, "filmhouse-circle-mall", "18:00");
  const now = new Date(Date.parse(at) - 60_000);
  await asLiveData(page, "/film/ramayana", new Date(now.getTime() - 3_600_000));
  await freeze(page, now);
  await page.goto("/film/ramayana");
  await expect(page.getByTestId("banner.sample")).toHaveCount(0);
  await page.getByTestId(`time.filmhouse-circle-mall.${at}`).click();
  const book = page.getByTestId("showing.sheet").getByTestId("showing.book");
  await expect(book).toContainText("Book on Filmhouse's site");
  await expect(book).toHaveAttribute("href", "https://filmhouseng.com/x");
  await expect(book).toHaveAttribute("target", "_blank");
  await expect(book).toHaveAttribute("rel", "noopener");
  await page.clock.runFor(61_000);
  await expect(book).toHaveCount(0);
});

test("a shared link opens its showing, once", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  const at = await startOf(request, "filmhouse-oniru", "18:15");
  await page.goto(`/film/ramayana#s=filmhouse-oniru@${at}`);
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toHaveAccessibleName("18:15 · Filmhouse Oniru");
  await sheet.getByTestId("showing.sheet.close").click();
  await expect(sheet).toBeHidden();
});

test("Tomorrow with no times says so", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/film/ramayana");
  await page.getByTestId("film.day").getByRole("radio", { name: "Tomorrow" }).click();
  await expect(page.getByTestId("film.none")).toHaveText("No times for Ramayana are listed tomorrow yet.");
});

test("phone: a top bar with back and share instead of the header; desktop: the film's column on the left", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await keepArea(page, "lekki");
  await page.goto("/film/ramayana");
  await expect(page.getByTestId("film.back")).toHaveAttribute("href", "/");
  for (const id of ["film.back", "film.share"]) {
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40); // the 40 circle, drawn as in Figma
    expect(await page.getByTestId(id).evaluate((el) => { const r = el.getBoundingClientRect(); const after = getComputedStyle(el, "::after"); const grow = after.content === "none" ? 0 : -parseFloat(after.top) * 2; return Math.min(r.width, r.height) + grow; })).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByTestId("film.share")).toBeVisible();
  await expect(page.getByTestId("wordmark")).toBeHidden();

  await page.setViewportSize({ width: 834, height: 1194 });
  const maryland = (await page.getByTestId("area.maryland").boundingBox())!;
  const festac = (await page.getByTestId("area.festac").boundingBox())!;
  expect(Math.abs(maryland.y - festac.y)).toBeLessThan(1); // two areas to a row
  expect(festac.x).toBeGreaterThan(maryland.x + maryland.width);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByTestId("film.back")).toBeHidden();
  await expect(page.getByTestId("wordmark")).toBeVisible();
  await expect(page.getByRole("link", { name: "All films in Lagos" })).toBeVisible();
  const title = (await page.getByTestId("film.title").boundingBox())!;
  const times = (await page.getByRole("heading", { name: "Times in Lagos" }).boundingBox())!;
  expect(title.x).toBeCloseTo(100, 0);
  expect(times.x).toBeCloseTo(100 + 390 + 64, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("on a 360 phone the hero still runs edge to edge with its stickers on screen", async ({ page, request }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/film/ramayana");
  const hero = (await page.getByTestId("film.hero").boundingBox())!;
  expect(hero.x).toBe(0);
  expect(hero.width).toBe(360);
  const out = await page.getByTestId("film.hero").locator("img, [data-testid='film.note']").evaluateAll((els) => els.filter((el) => { const box = el.getBoundingClientRect(); return box.left < 0 || box.right > innerWidth; }).length);
  expect(out).toBe(0);
});
