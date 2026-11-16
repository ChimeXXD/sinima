import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { dataFile, freeze, lagosDay, sampleTime, shownClock, type DataFile } from "./helpers";

// A cinema's page as Figma draws it (Figma Cinema 202:7192, build unit 8): the logo, name, address,
// tags, Save and Book; then its films on the day, soonest first, each with its times. The sample data
// holds Figma's own example: Filmhouse Lekki IMAX at 17:30.

const ID = "filmhouse-lekki-imax";
const HOUR = 3_600_000;
/** `hh:mm` Lagos on the sample data's first day, which has a next day of times. The second day has none after it. */
const firstDay = async (request: APIRequestContext, hhmm: string) => new Date((await sampleTime(request, hhmm)).getTime() - 24 * HOUR);
const cards = (page: Page) => page.locator('[data-testid^="film.card."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(10)));

/** The films on `now`'s Lagos day at this cinema: those with a time still to start by their soonest, then the rest by their first. */
function filmsOn(all: DataFile, id: string, now: Date) {
  const day = all.showings.filter((s) => s.cinemaId === id && lagosDay(s.startsAt) === lagosDay(now.toISOString())).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const left = day.filter((s) => Date.parse(s.startsAt) > now.getTime());
  const films = [...new Set(day.map((s) => s.filmId))];
  const first = (film: string) => left.find((s) => s.filmId === film)?.startsAt ?? null;
  return { day, left, order: [...films].sort((a, b) => (first(a) && first(b) ? first(a)!.localeCompare(first(b)!) : Number(first(a) === null) - Number(first(b) === null))) };
}

test("the cinema, then its films tonight soonest first, each with its times still to start (Figma Default)", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await firstDay(request, "17:30");
  await freeze(page, now);
  await page.goto(`/lagos/cinema/${ID}`);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Filmhouse Lekki IMAX");
  await expect(page.getByTestId("cinema.address")).toHaveText("The Rock Drive, off Bisola Durosinmi Etti Drive, Lekki Phase 1, Lagos");
  await expect(page.getByTestId("cinema.tags")).toHaveText("LekkiIMAX");
  await expect(page.getByTestId("cinema.save")).toHaveText(/^Save /); // then, for screen readers, " Filmhouse Lekki IMAX on Your cinemas"
  await expect(page.getByTestId("cinema.save")).toHaveAttribute("aria-pressed", "false");
  const book = page.getByTestId("cinema.book");
  await expect(book).toHaveText("Book on Filmhouse's site");
  await expect(book).toHaveAttribute("href", "https://filmhouseng.com/");
  await expect(book).toHaveAttribute("target", "_blank");

  const { left, order } = filmsOn(all, ID, now);
  await expect(page.getByTestId("films.title")).toHaveText("Films tonight");
  await expect(page.getByTestId("films.note")).toHaveText(`${order.length} films today · ${new Set(left.map((s) => s.filmId)).size} still to start`);
  await expect(page.getByTestId("films.day").getByRole("radio")).toHaveText([/^Today · \w{3} \d+$/, /^Tomorrow · \w{3} \d+$/]);
  expect(await cards(page)).toEqual(order);

  for (const film of order) {
    const card = page.getByTestId(`film.card.${film}`);
    await expect(card.getByRole("heading")).toHaveText(all.films.find((f) => f.id === film)!.title);
    const times = left.filter((s) => s.filmId === film);
    if (times.length > 0) await expect(card.locator('[data-testid^="time."]')).toHaveText(times.map((s) => new RegExp(`^${shownClock(s.startsAt).replace(" ", "\\s")}`)));
  }
  // Agbara Nla's times have all started (Figma): when, and tomorrow's.
  await expect(page.getByTestId("film.card.agbara-nla-the-return").getByTestId("film.earlier")).toHaveText("Started earlier today at 2:00 PM and 4:50 PM. Tomorrow at 2:00 PM and 4:50 PM.");
  await expect(page.getByTestId("film.card.street-fighter").getByTestId("credits.chip")).toHaveText("Stay a little: scene during the credits");
  await expect(page.getByTestId("film.card.ramayana").getByTestId("credits.chip")).toHaveCount(0); // not known: no chip on the card
  await expect(page.getByTestId("footer.tickets")).toHaveText("Filmhouse sells the tickets. Sinima only shows the times and sends you to their site.");
});

test("Tomorrow lists the next day's films with all their times", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await firstDay(request, "17:30");
  await freeze(page, now);
  await page.goto(`/lagos/cinema/${ID}`);
  await page.getByTestId("films.day").getByRole("radio", { name: /^Tomorrow/ }).click();
  await expect(page.getByTestId("films.title")).toHaveText("Films tomorrow");
  const next = filmsOn(all, ID, new Date(now.getTime() + 24 * HOUR - 17 * HOUR)); // the next day, before its first show
  expect(await cards(page)).toEqual(next.order);
  await expect(page.getByTestId("film.card.agbara-nla-the-return").locator('[data-testid^="time."]')).toHaveCount(2);
});

test("with nothing listed for tomorrow, today stands alone and says so; the started line has no tomorrow", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30")); // the data's last day
  await page.goto(`/lagos/cinema/${ID}`);
  await expect(page.getByTestId("films.day")).toHaveCount(0);
  await expect(page.getByTestId("films.today")).toHaveText(/^Today · \w{3} \d+$/);
  await expect(page.getByTestId("films.not-listed")).toHaveText(/^Filmhouse hasn't listed (Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day yet\.$/);
  await expect(page.getByTestId("film.card.agbara-nla-the-return").getByTestId("film.earlier")).toHaveText("Started earlier today at 2:00 PM and 4:50 PM.");
});

test("Save keeps the cinema on this phone, says so in a toast, and Undo takes it back (Figma Saved)", async ({ page, request }) => {
  await freeze(page, await firstDay(request, "17:30"));
  await page.goto(`/lagos/cinema/${ID}`);
  const save = page.getByTestId("cinema.save");
  await save.click();
  await expect(save).toHaveText(/^Saved /);
  await expect(save).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("ls.cinemas"))).toBe(JSON.stringify([ID]));
  const toast = page.getByTestId("toast");
  await expect(toast).toContainText("Saved to Your cinemas. Only on this phone.");
  const undo = (await toast.getByRole("button", { name: "Undo" }).boundingBox())!;
  expect(Math.min(undo.width, undo.height)).toBeGreaterThanOrEqual(44);
  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(save).toHaveText(/^Save /);
  expect(await page.evaluate(() => localStorage.getItem("ls.cinemas"))).toBe("[]");
  await expect(toast).toHaveCount(0);

  await save.click();
  await expect(page.getByTestId("toast")).toBeVisible();
  await page.clock.runFor(6_000); // it goes by itself
  await page.clock.runFor(300); // after slipping away (D-112 F8), timed once it starts to leave
  await expect(page.getByTestId("toast")).toHaveCount(0);
  await save.click(); // a saved cinema lets go without a toast
  await expect(save).toHaveText(/^Save /);
  await expect(page.getByTestId("toast")).toHaveCount(0);
});

test("a time opens the showing sheet; sample times can't be booked; Escape gives focus back", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await firstDay(request, "17:30");
  await freeze(page, now);
  await page.goto(`/lagos/cinema/${ID}`);
  const row = filmsOn(all, ID, now).left[0]!;
  const chip = page.getByTestId(`time.${row.filmId}.${row.startsAt}`);
  await chip.click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toHaveAccessibleName(`${shownClock(row.startsAt)} · Filmhouse Lekki IMAX`);
  await expect(sheet.getByTestId("showing.book")).toContainText("Sample only");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(chip).toBeFocused();
});

test("a cinema that sells only at the door has no Book button, and its footer says so", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const door = (all.cinemas as (DataFile["cinemas"][number] & { bookingHost: string | null })[]).find((c) => !c.bookingHost && all.showings.some((s) => s.cinemaId === c.id));
  test.skip(!door, "every listed cinema sells online");
  await page.goto(`/lagos/cinema/${door!.id}`);
  await expect(page.getByTestId("cinema.book")).toHaveCount(0);
  await expect(page.getByTestId("footer.tickets")).toHaveText(`${door!.name} sells the tickets at the cinema. Sinima only shows the times.`);
});

test("phone and iPad: the top bar; desktop: the cinema on the left and its films beside it, two to a row", async ({ page, request }) => {
  await freeze(page, await firstDay(request, "17:30"));
  await page.goto(`/lagos/cinema/${ID}`);
  await expect(page.getByTestId("cinema.back")).toHaveAttribute("href", "/lagos/cinemas");
  await expect(page.getByTestId("cinema.share")).toBeVisible();
  for (const [width, columns, cardWidth] of [[390, 1, 358], [834, 2, 377], [1440, 2, 391]] as const) {
    await page.setViewportSize({ width, height: 900 });
    const boxes = await page.locator('[data-testid^="film.card."]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), w: Math.round(r.width) })));
    expect(new Set(boxes.map((b) => b.x)).size).toBe(columns);
    expect(boxes[0]!.w).toBe(cardWidth);
  }
  await expect(page.getByTestId("cinema.back")).toBeHidden();
  const crumb = page.getByRole("link", { name: "All cinemas in Lagos" });
  await expect(crumb).toHaveAttribute("href", "/lagos/cinemas");
  expect((await crumb.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const title = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
  const films = (await page.getByTestId("films.title").boundingBox())!;
  expect(Math.round(title.x)).toBe(100);
  expect(Math.round(films.x)).toBe(544);
});

for (const width of [390, 360, 320]) {
  test(`at ${width} px nothing scrolls sideways, and every button and time is at least 44 px tall`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 800 });
    await freeze(page, await firstDay(request, "17:30"));
    await page.goto(`/lagos/cinema/${ID}`);
    await expect(page.locator('[data-testid^="film.card."]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    // Each segment shows its whole label.
    expect(await page.locator("[role=radio]").evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length)).toBe(0);
    const wide = await page.locator('main *').evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5).map((el) => el.outerHTML.slice(0, 80)));
    expect(wide).toEqual([]);
    // The day segments are left out: kit.spec checks their 44 px touch area.
    const short = await page.locator("main button:not([role=radio]), main a[data-testid='cinema.book']").evaluateAll((els) => els.filter((el) => { const h = el.getBoundingClientRect().height; return h > 0 && h < 43.5; }).map((el) => el.outerHTML.slice(0, 90)));
    expect(short).toEqual([]);
  });
}
