import { expect, test } from "@playwright/test";
import { dataFile, freeze, sampleTime, shownClock, today } from "./helpers";

// A cinema's page, Your cinemas, and the rules every page keeps (rule 3, 44 px, no sideways scroll).

test("tapping a time opens that showing; sample data cannot be booked", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "18:00");
  const row = today(all, now).find((s) => all.cinemas.find((c) => c.id === s.cinemaId)!.area === "lekki")!;
  await freeze(page, now);
  await page.goto(`/lagos/cinema/${row.cinemaId}`); // the times moved here from the Cinemas tab (D-56)
  await page.getByTestId(`time.${row.filmId}.${row.startsAt}`).click();

  const sheet = page.getByTestId("showing.sheet"); // Figma's sheet since build unit 8
  await expect(sheet).toHaveAccessibleName(`${shownClock(row.startsAt)} · ${all.cinemas.find((c) => c.id === row.cinemaId)!.name}`);
  await expect(sheet.getByText(all.films.find((f) => f.id === row.filmId)!.title, { exact: false }).first()).toBeVisible();
  await expect(sheet.getByTestId("countdown-badge")).toHaveText(/^Starts in/);
  await expect(sheet.getByTestId("showing.book")).toContainText("Sample only");
  await expect(page.getByTestId("banner.sample")).toHaveText("Sample data. These times are for the demo, not for booking.");

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("a showing is gone from the card the minute it starts", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const row = today(all, await sampleTime(request, "18:00")).find((s) => all.cinemas.find((c) => c.id === s.cinemaId)!.area === "lekki")!;
  await freeze(page, new Date(Date.parse(row.startsAt) - 60_000));
  await page.goto(`/lagos/cinema/${row.cinemaId}`);
  const chip = page.getByTestId(`time.${row.filmId}.${row.startsAt}`);
  await expect(chip).toBeVisible();
  await page.clock.runFor(61_000);
  await expect(chip).toHaveCount(0);
});

test("Tomorrow shows the whole of the next day", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const built = new Date(all.generatedAt);
  const next = new Date(built.getTime() + 24 * 3_600_000);
  const tomorrow = all.showings.filter((s) => new Date(Date.parse(s.startsAt) + 3_600_000).toISOString().slice(0, 10) === new Date(next.getTime() + 3_600_000).toISOString().slice(0, 10));
  const id = "ebonylife-vi";
  const films = new Set(tomorrow.filter((s) => s.cinemaId === id).map((s) => s.filmId));
  expect(films.size).toBeGreaterThan(3);
  await freeze(page, built);
  await page.goto(`/lagos/cinema/${id}`);
  await page.getByTestId("films.day").getByRole("radio", { name: /^Tomorrow/ }).click();
  await expect(page.locator('[data-testid^="film.card."]')).toHaveCount(films.size);
});

// Picking an area: the Cinemas tab's sheet, tests/e2e/cinemas-screen.spec.ts. An area's own page
// (Figma Area, build unit 7): tests/e2e/area-screen.spec.ts.

// D-61: hearted cinemas live on their own tab, Your cinemas (Figma, build unit 10):
// tests/e2e/yours-screen.spec.ts.

// Each page with its own tab current: the current tab shows its name, so the longest names count.
for (const width of [390, 360, 320]) {
  test(`at ${width} px the four tabs fit, each whole on screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/lagos/yours", "/lagos/soon", "/lagos/cinemas", "/lagos"]) {
      await page.goto(path);
      const tabs = page.locator('[data-testid^="tab."]');
      await expect(tabs).toHaveCount(4);
      expect(await tabs.evaluateAll((els) => els.filter((el) => { const box = el.getBoundingClientRect(); return box.left < 0 || box.right > window.innerWidth || el.scrollWidth > el.clientWidth; }).map((el) => el.getAttribute("data-testid"))), path).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}

// IMAX on the Cinemas tab: tests/e2e/cinemas-screen.spec.ts.

// CLAUDE.md rule 3: the page's own HTML may be read on a later day than it was built.
for (const path of ["/lagos/area/lekki", "/lagos/cinemas", "/lagos", "/lagos/soon", "/lagos/cinema/genesis-purple-lekki", "/lagos/film/ramayana"]) {
  test(`${path}: the page's own HTML holds absolute times and the sample banner, and no word that depends on the clock`, async ({ request }) => {
    const html = (await (await request.get(path)).text()).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<title>[^<]*<\/title>/, "");
    expect([...html.matchAll(/<time datetime="[^"]+Z"/gi)].length).toBeGreaterThan(5);
    expect(html).toContain("Sample data. These times are for the demo, not for booking.");
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/Starts in|Starting now|\bago\b|\bin \d+ (min|h)\b|\btoday\b|\btomorrow\b|\btonight\b|next 2 hours/i);
  });
}

test("/lagos/area/lekki's own HTML names its cinemas", async ({ request }) => {
  expect(await (await request.get("/lagos/area/lekki")).text()).toContain("Filmhouse Lekki IMAX");
});

for (const width of [390, 360, 320]) {
  test(`nothing scrolls sideways at ${width} px, and every time and button is at least 44 px tall`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 800 });
    await freeze(page, await sampleTime(request, "18:00"));
    await page.goto("/lagos/area/lekki");
    await expect(page.locator('[data-testid^="cinema.card."]').first()).toBeVisible();
    // clientWidth, not innerWidth: a phone's layout viewport grows to fit content that is too wide.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const short = await page.locator("main button, main a.chip, main a.btn, header a").evaluateAll((els) =>
      els.filter((el) => { const h = el.getBoundingClientRect().height; return h > 0 && h < 43.5; // half a pixel of rounding
      }).map((el) => el.outerHTML.slice(0, 90)),
    );
    expect(short).toEqual([]);
  });
}
