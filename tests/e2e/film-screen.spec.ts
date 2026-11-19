import { readFileSync } from "node:fs";
import { expect, test, type Page } from "./test";
import { dataFile, freeze, lagosClock, lagosDay, sampleTime, shownClock } from "./helpers";

// Film (Figma 185:3558, build unit 4). The sample data holds Figma's own example: Ramayana at
// 17:30, Lekki saved as the visitor's area. Lagocine writes it "Ramayana" (Filmhouse) and
// "Ramayana: Rise of a Legend" (the rest); since D-119 both are this one film.

const keepArea = (page: Page, slug: string) => page.addInitScript((area) => localStorage.setItem("ls.area", area), slug);
const ids = (page: Page, prefix: string) => page.locator(`[data-testid^="${prefix}"]`).evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!));

/** "Monday 16 November": the sample data's second day, the day the tests' clock is on. */
const sampleDay = async (request: Parameters<typeof dataFile>[0]) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" }).format(await sampleTime(request, "12:00")).replace(",", "");

async function startOf(request: Parameters<typeof dataFile>[0], cinema: string, hhmm: string): Promise<string> {
  const all = await dataFile(request, "lagos");
  const day = (await sampleTime(request, "12:00")).toISOString().slice(0, 10);
  return all.showings.find((s) => s.filmId === "ramayana" && s.cinemaId === cinema && s.startsAt.startsWith(day) && lagosClock(s.startsAt) === hhmm)!.startsAt;
}

test("your area first, then the areas next to it, then the rest soonest first (Figma: Stay or Go not known)", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await keepArea(page, "lekki");
  await page.goto("/lagos/film/ramayana");
  await expect(page.getByTestId("film.title")).toHaveText("Ramayana");
  // The runtime is TMDB's, which TMDB can correct (201 → 195 min on 16 Nov), so it comes from the data.
  const all = await dataFile(request, "lagos");
  const runtime = all.films.find((f) => f.id === "ramayana") as unknown as { runtimeMin: number };
  // So is the number of cinemas showing it today, which grows as sources merge spellings (D-119).
  const today = lagosDay((await sampleTime(request, "12:00")).toISOString());
  const cinemas = new Set(all.showings.filter((s) => s.filmId === "ramayana" && lagosDay(s.startsAt) === today).map((s) => s.cinemaId)).size;
  expect(cinemas).toBeGreaterThan(10);
  await expect(page.getByTestId("film.facts")).toHaveText(`${Math.floor(runtime.runtimeMin / 60)} h ${runtime.runtimeMin % 60} min·IMAX·MX4D·at ${cinemas} sinimas in Lagos today`);
  await expect(page.getByTestId("credits.chip")).toHaveText("Credits scene: not known yet");
  await expect(page.getByTestId("film.note")).toHaveText("in IMAX!");
  await expect(page.getByText(`${await sampleDay(request)} · your area first`)).toBeVisible();

  // Lekki, then its neighbours, then the rest by their soonest time (18:45, 18:50, 19:05, 19:10, 19:50).
  expect(await ids(page, "area.")).toEqual(["area.lekki", "area.victoria-island", "area.sangotedo", "area.maryland", "area.festac", "area.agege", "area.yaba", "area.surulere"]);
  await expect(page.getByTestId("area.lekki").getByRole("heading")).toHaveText("Lekkiyour area");
  await expect(page.getByTestId("area.victoria-island").getByRole("heading")).toHaveText("Victoria Islandnext to Lekki");
  await expect(page.getByTestId("area.sangotedo").getByRole("heading")).toHaveText("Sangotedonext to Lekki");
  await expect(page.getByTestId("area.maryland").getByRole("heading")).toHaveText("Maryland");
  expect(await page.getByTestId("area.lekki").locator('[data-testid^="venue."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")))).toEqual(["venue.filmhouse-circle-mall", "venue.filmhouse-ikota", "venue.filmhouse-lekki-imax"]);

  // The soonest time within the hour is blue and counts down after its format.
  const first = page.getByTestId(`time.filmhouse-circle-mall.${await startOf(request, "filmhouse-circle-mall", "18:00")}`);
  await expect(first).toHaveAttribute("data-state", "soonest");
  await expect(first).toHaveText("6:00 PMIMAX · in 30 min");
  await expect(first).toHaveAccessibleName("6:00 PM, IMAX, starts in 30 minutes");
  await expect(page.getByTestId(`time.filmhouse-ikota.${await startOf(request, "filmhouse-ikota", "19:00")}`)).not.toHaveAttribute("data-state", "soonest");

  // Cinemas whose times have all started are named under the list, not listed. (Filmhouse Palms
  // Lekki's 2:00 PM is no longer in the sample: its rows are left out so it has no times, D-131.)
  await expect(page.getByTestId("film.earlier")).toHaveText("Started earlier today: Viva Cinemas Ikeja at 11:40 AM, Genesis Deluxe Purple Mall at 4:50 PM and Filmworld Cinemas Idimu at 5:00 PM.");
  // Genesis Purple Mall is in Lekki, so it would be listed there if a started cinema were.
  await expect(page.getByTestId("venue.genesis-purple-lekki")).toHaveCount(0);
});

test("with no area kept, every area is in order of its soonest time, with no tags", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/film/ramayana");
  await expect(page.getByText(`${await sampleDay(request)} · soonest first`)).toBeVisible();
  // EbonyLife VI at 5:40 PM, then Lekki 6:00, Maryland 6:45, Festac 6:50, Agege 7:05, Yaba 7:10, Sangotedo 7:40, Surulere 7:50.
  expect(await ids(page, "area.")).toEqual(["area.victoria-island", "area.lekki", "area.maryland", "area.festac", "area.agege", "area.yaba", "area.sangotedo", "area.surulere"]);
  await expect(page.getByTestId("area.victoria-island").getByRole("heading")).toHaveText("Victoria Island");
});

test("a film with a credits scene says Stay, with its source, and stay put! (Figma: Default)", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/film/spider-man-brand-new-day");
  await expect(page.getByTestId("credits.chip")).toHaveText("Stay: scene after the credits · TMDB");
  await expect(page.getByTestId("credits.detail")).toHaveText("TMDB lists an after-credits scene.");
  await expect(page.getByTestId("film.note")).toHaveText("stay put!");
});

test("a time opens its sheet: sample times can't be booked; calendar, countdown; Escape closes it", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/film/ramayana");
  const at = await startOf(request, "filmhouse-circle-mall", "18:00");
  const chip = page.getByTestId(`time.filmhouse-circle-mall.${at}`);
  await chip.click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAccessibleName("6:00 PM · Filmhouse Circle Mall");
  await expect(sheet.getByText("Ramayana · IMAX · Lekki")).toBeVisible();
  await expect(sheet.getByTestId("countdown-badge")).toHaveText("Starts in30 min");
  await expect(sheet.getByTestId("showing.book")).toContainText("Sample only");
  expect(await sheet.getByTestId("showing.book").evaluate((el) => el.tagName)).toBe("DIV"); // not a link (rule 8, D-25)

  // D-160: a plain link, in the same tab, to the file the build wrote; an iPhone offers to add it to Calendar.
  const calendar = sheet.getByTestId("showing.calendar");
  await expect(calendar).toHaveAttribute("href", `/cal/ramayana_filmhouse-circle-mall_${lagosDay(at)}-1800.ics`);
  await expect(calendar).not.toHaveAttribute("target", /./);
  const served = await request.get((await calendar.getAttribute("href"))!);
  expect(served.headers()["content-type"]).toMatch(/^text\/calendar/);
  const [download] = await Promise.all([page.waitForEvent("download"), calendar.click()]);
  const ics = readFileSync(await download.path(), "utf8");
  expect(ics).toContain(`DTSTART:${at.replace(/[-:]/g, "")}`);
  expect(ics).toContain("TRIGGER:-PT30M");
  // It ends when Ramayana's TMDB runtime says (it can change), so the end comes from the data.
  const { runtimeMin } = (await dataFile(request, "lagos")).films.find((f) => f.id === "ramayana") as unknown as { runtimeMin: number };
  await expect(sheet.getByTestId("showing.calendar")).toContainText(`6:00 PM to ${shownClock(new Date(Date.parse(at) + runtimeMin * 60_000).toISOString())}, with an alert 30 min before.`);

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
  await page.goto("/lagos/film/ramayana");
  await page.getByTestId(`time.filmhouse-circle-mall.${at}`).click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet.getByTestId("showing.book")).toBeVisible();

  await page.clock.runFor(6 * 60_000); // 18:05, as Figma
  await expect(sheet.getByTestId("countdown-badge")).toHaveText("Started5 min ago");
  await expect(sheet.getByTestId("showing.book")).toHaveCount(0);
  await expect(sheet.getByTestId("showing.started")).toHaveText("This showing started at 6:00 PM, so it can't be booked here. The next times nearby:");
  await expect(sheet.getByTestId("showing.next").getByRole("listitem")).toHaveText(["6:15 PMin 10 minFilmhouse OniruVictoria Island", "7:00 PMFilmhouse IkotaLekki", "10:00 PMFilmhouse Circle MallThis sinima, in IMAX"]);
  await expect(sheet.getByTestId("showing.share-film")).toContainText("A link to Ramayana's times in Lagos.");

  await sheet.getByTestId(`next.filmhouse-oniru.${await startOf(request, "filmhouse-oniru", "18:15")}`).click();
  await expect(sheet).toHaveAccessibleName("6:15 PM · Filmhouse Oniru");
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
  await asLiveData(page, "/lagos/film/ramayana", new Date(now.getTime() - 3_600_000));
  await freeze(page, now);
  await page.goto("/lagos/film/ramayana");
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
  await page.goto(`/lagos/film/ramayana#s=filmhouse-oniru@${at}`);
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toHaveAccessibleName("6:15 PM · Filmhouse Oniru");
  await sheet.getByTestId("showing.sheet.close").click();
  await expect(sheet).toBeHidden();
});

test("Tomorrow with no times says so", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/film/ramayana");
  await page.getByTestId("film.day").getByRole("radio", { name: "Tomorrow" }).click();
  await expect(page.getByTestId("film.none")).toHaveText("No times for Ramayana are listed tomorrow yet.");
});

test("phone: a top bar with back and share instead of the header; desktop: the film's column on the left", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await keepArea(page, "lekki");
  await page.goto("/lagos/film/ramayana");
  await expect(page.getByTestId("film.back")).toHaveAttribute("href", "/lagos");
  for (const id of ["film.back", "film.share"]) {
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40); // the 40 circle, drawn as in Figma
    expect(await page.getByTestId(id).evaluate((el) => { const r = el.getBoundingClientRect(); const after = getComputedStyle(el, "::after"); const grow = after.content === "none" ? 0 : -parseFloat(after.top) * 2; return Math.min(r.width, r.height) + grow; })).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByTestId("film.share")).toBeVisible();
  await expect(page.getByTestId("wordmark")).toBeHidden();

  await page.setViewportSize({ width: 834, height: 1194 });
  const sangotedo = (await page.getByTestId("area.sangotedo").boundingBox())!;
  const maryland = (await page.getByTestId("area.maryland").boundingBox())!;
  expect(Math.abs(sangotedo.y - maryland.y)).toBeLessThan(1); // two areas to a row
  expect(maryland.x).toBeGreaterThan(sangotedo.x + sangotedo.width);

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
  await page.goto("/lagos/film/ramayana");
  const hero = (await page.getByTestId("film.hero").boundingBox())!;
  expect(hero.x).toBe(0);
  expect(hero.width).toBe(360);
  const out = await page.getByTestId("film.hero").locator("img, [data-testid='film.note']").evaluateAll((els) => els.filter((el) => { const box = el.getBoundingClientRect(); return box.left < 0 || box.right > innerWidth; }).length);
  expect(out).toBe(0);
});
