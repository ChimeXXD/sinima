import { expect, test } from "./test";
import { dataFile, freeze, lagosDay, sampleTime, today } from "./helpers";

// The Films screen as Figma draws it (Figma Films 175:3480, build unit 3): the next 2 hours, then
// later tonight; IMAX chosen; nothing more today; at phone, iPad and desktop widths.

const HOUR = 3_600_000;

test("today splits into the next 2 hours and later tonight, soonest first, each card counting down within the hour", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await freeze(page, now);
  await page.goto("/lagos");
  const left = today(all, now);
  const soonFilms = new Set(left.filter((s) => Date.parse(s.startsAt) - now.getTime() <= 2 * HOUR).map((s) => s.filmId));
  const laterFilms = new Set(left.map((s) => s.filmId).filter((id) => !soonFilms.has(id)));

  const soon = page.getByTestId("section.soon");
  await expect(soon.getByRole("heading", { level: 2 })).toHaveText("Now showing");
  await expect(soon.locator("p").first()).toHaveText(`${soonFilms.size} films start in the next 2 hours`);
  const soonIds = await soon.locator('[data-testid^="film.card."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(10)));
  expect(new Set(soonIds)).toEqual(soonFilms);

  const later = page.getByTestId("section.later");
  await expect(later.getByRole("heading", { level: 2 })).toHaveText("Later tonight");
  await expect(later.locator('[data-testid^="film.card."]')).toHaveCount(laterFilms.size);

  // Soonest first, and a countdown on the cards starting within the hour.
  const times = await soon.locator("time").evaluateAll((els) => els.map((el) => el.getAttribute("datetime")!));
  expect(times).toEqual([...times].sort());
  const first = soon.locator('[data-testid^="film.card."]').first();
  await expect(first.getByTestId("countdown-pill")).toHaveText(/^Starts in \d+ min$/);
});

test("choosing IMAX leaves only IMAX films, and says which cinemas were left out and why", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  const imax = new Set(today(all, now).filter((s) => /^IMAX/i.test(s.format ?? "")).map((s) => s.filmId));
  await freeze(page, now);
  await page.goto("/lagos");
  await page.getByTestId("format.IMAX").click();
  const section = page.getByTestId("section.format");
  await expect(section.getByRole("heading", { level: 2 })).toHaveText("In IMAX");
  await expect(section.locator("p").first()).toHaveText(`${imax.size} ${imax.size === 1 ? "film" : "films"} in Lagos today`);
  await expect(section.locator('[data-testid^="film.card."]')).toHaveCount(imax.size);
  await expect(section.locator("p").last()).toContainText("says which format each showing is in.");
  await page.getByTestId("format.any").click();
  await expect(page.getByTestId("section.soon")).toBeVisible();
});

// The sample holds two days: on the first, tomorrow's times are in; on the second, they are not.
async function afterLastShowing(request: Parameters<typeof dataFile>[0], first: boolean): Promise<Date> {
  const all = await dataFile(request, "lagos");
  const days = [...new Set(all.showings.map((s) => lagosDay(s.startsAt)))].sort();
  const day = first ? days[0]! : days.at(-1)!;
  const last = all.showings.filter((s) => lagosDay(s.startsAt) === day).map((s) => s.startsAt).sort().at(-1)!;
  return new Date(Date.parse(last) + 60_000);
}

test("after the last showing has started, the page says so and offers tomorrow", async ({ page, request }) => {
  await freeze(page, await afterLastShowing(request, true));
  await page.goto("/lagos");
  const empty = page.getByTestId("films.empty");
  await expect(empty.getByRole("heading", { level: 2 })).toHaveText("Nothing more starts today");
  await expect(empty.locator("p")).toContainText(/The last showing in Lagos began at \d{1,2}:\d\d\s[AP]M\. Tomorrow's times are in: \d+ films? from \d{1,2}:\d\d\s[AP]M\./);
  await page.getByTestId("films.tomorrow").click();
  await expect(page.getByTestId("section.day").getByRole("heading", { level: 2 })).toHaveText("Tomorrow");
  await expect(page.getByRole("radio", { name: "Tomorrow" })).toHaveAttribute("aria-checked", "true");
});

test("with no times for tomorrow yet, it says so and offers nothing it cannot show", async ({ page, request }) => {
  await freeze(page, await afterLastShowing(request, false));
  await page.goto("/lagos");
  await expect(page.getByTestId("films.empty").locator("p")).toContainText("Tomorrow's times aren't in yet.");
  await expect(page.getByTestId("films.tomorrow")).toHaveCount(0);
});

for (const [width, columns] of [
  [360, 2],
  [390, 2],
  [834, 4],
  [1440, 5],
] as const) {
  test(`at ${width} px the posters sit in ${columns} columns and nothing scrolls sideways`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos");
    const cards = page.getByTestId("section.soon").locator('[data-testid^="film.card."]');
    const lefts = await cards.evaluateAll((els) => [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().left)))]);
    expect(lefts.length).toBe(columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    // The nav: the floating tab bar below 1200, the labelled pill in the header from 1200 (D-86).
    const nav = await page.getByTestId("nav").boundingBox();
    if (width >= 1200) expect(nav!.y).toBeLessThan(100);
    else expect(nav!.y).toBeGreaterThan(700);
  });
}

// The switch is the pull cord's bead now (D-106 i), not Figma's 40 round button: its grab target stays 44.
test("the theme switch and the logo are 44 px touch targets", async ({ page }) => {
  await page.goto("/lagos");
  const theme = page.getByTestId("theme.toggle");
  const box = (await theme.boundingBox())!;
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  expect((await page.getByTestId("wordmark").boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test('"tonight!" sits beside today\'s list only, never over Tomorrow', async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos");
  await expect(page.getByText("tonight!")).toBeVisible();
  await page.getByRole("radio", { name: "Tomorrow" }).click();
  await expect(page.getByText("tonight!")).toHaveCount(0);
});

for (const width of [360, 390]) {
  test(`at ${width} px no hero sticker covers the title`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/lagos");
    await page.waitForTimeout(500); // the stickers' entrance
    // The words themselves: the first line is a block, so its box spans the page.
    const title = await page.getByTestId("films.title").locator("span").first().evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const stickers = await page.locator('[aria-hidden="true"] > img').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })));
    const overlaps = stickers.filter((r) => r.x < title!.x + title!.width && r.x + r.w > title!.x && r.y < title!.y + title!.height && r.y + r.h > title!.y);
    expect(overlaps).toEqual([]);
  });
}
