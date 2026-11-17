import { expect, test, type Page } from "./test";
import { afterLastShowing, cinemasBySoonest, dataFile, freeze, sampleTime, shownClock, today, type DataFile } from "./helpers";

// The Cinemas tab as Figma draws it (Figma Cinemas 200:6415, build unit 6): your area first, then
// the areas next to it, then the rest; a picker row; every cinema in the city, at three widths.

const LEKKI = ["victoria-island", "sangotedo"]; // Lekki's neighbours in data/cinemas.json
const keep = (page: Page, area: string) => page.addInitScript((slug) => localStorage.setItem("ls.area", slug), area);
const shown = (page: Page, group: string) => page.getByTestId(`group.${group}`).locator('[data-testid^="cinema.card."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(12)));
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));

/** The expected order: soonest next showing first (in the data's showing order), then nothing left today, then no times at all (registry order). */
function order(all: DataFile, now: Date, ids: string[]): string[] {
  const soonest = cinemasBySoonest(today(all, now));
  const rank = (id: string) => (soonest.includes(id) ? 0 : all.showings.some((s) => s.cinemaId === id) ? 1 : 2);
  return [...ids].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? soonest.indexOf(a) - soonest.indexOf(b) : 0));
}

test("with Lekki kept, Lekki's cinemas come first, then the areas next to it, then the rest; every cinema once", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await keep(page, "lekki");
  await freeze(page, now);
  await page.goto("/lagos/cinemas");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Lagos");
  await expect(page.getByTestId("cinemas.count")).toHaveText(`${all.cinemas.length} of them!`);
  await expect(page.getByTestId("pick.area")).toHaveText("AreaLekki");

  const inArea = all.cinemas.filter((c) => c.area === "lekki").map((c) => c.id);
  const next = all.cinemas.filter((c) => LEKKI.includes(c.area)).map((c) => c.id);
  const rest = all.cinemas.filter((c) => c.area !== "lekki" && !LEKKI.includes(c.area)).map((c) => c.id);
  expect(await shown(page, "area")).toEqual(order(all, now, inArea));
  expect(await shown(page, "next")).toEqual(order(all, now, next));
  expect(await shown(page, "rest")).toEqual(order(all, now, rest));

  const heading = (group: string) => page.getByTestId(`group.${group}`).locator("h2 + p");
  await expect(page.getByTestId("group.area").getByRole("heading", { level: 2 })).toHaveText("In Lekki");
  await expect(heading("area")).toHaveText(`Your area · ${inArea.length} cinemas, soonest first`);
  await expect(page.getByTestId("group.next").getByRole("heading", { level: 2 })).toHaveText("Next to Lekki");
  await expect(heading("next")).toHaveText("Victoria Island and Sangotedo");
  await expect(page.getByTestId("group.rest").getByRole("heading", { level: 2 })).toHaveText("Elsewhere in Lagos");
  await expect(heading("rest")).toHaveText("Soonest first");
});

test("a row gives the next time and the films left tonight, its area and formats; a cinema we can't read says so", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await freeze(page, now);
  await page.goto("/lagos/cinemas");

  const left = today(all, now);
  const first = left[0]!.cinemaId;
  const films = new Set(left.filter((s) => s.cinemaId === first).map((s) => s.filmId)).size;
  const card = page.getByTestId(`cinema.card.${first}`);
  await expect(card.getByTestId("cinema.name")).toHaveText(all.cinemas.find((c) => c.id === first)!.name);
  await expect(card.getByTestId("cinema.next")).toHaveText(`Next at ${shownClock(left[0]!.startsAt)} · ${films} ${films === 1 ? "film" : "films"} tonight`);
  await expect(card.getByTestId("logo-sticker")).toBeVisible();

  const imax = left.find((s) => /^IMAX/.test(s.format ?? ""))!.cinemaId;
  await expect(page.getByTestId(`cinema.card.${imax}`).getByTestId("cinema.tags")).toContainText("IMAX");

  const unread = all.cinemas.filter((c) => !all.showings.some((s) => s.cinemaId === c.id));
  expect(unread.length).toBeGreaterThan(0);
  for (const cinema of unread) await expect(page.getByTestId(`cinema.card.${cinema.id}`).getByTestId("cinema.next")).toHaveText("Times not available yet");
  await expect(page.getByTestId("cinemas.no-times")).toHaveText("“Times not available yet”: we can't read this cinema's times yet. Check its own site.");

  await card.click();
  await expect(page).toHaveURL(new RegExp(`/lagos/cinema/${first}$`));
});

test("with no area kept, one list of every cinema, soonest first", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await freeze(page, now);
  await page.goto("/lagos/cinemas");
  await expect(page.getByTestId("pick.area")).toHaveText("AreaAll");
  await expect(page.getByTestId("group.all").getByRole("heading", { level: 2 })).toHaveText("All cinemas");
  expect(await shown(page, "all")).toEqual(order(all, now, all.cinemas.map((c) => c.id)));
});

test("choosing an area regroups the page in place and is kept on this phone", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.area").click();
  const sheet = page.getByTestId("sheet.area");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading", { level: 2 })).toHaveText("Choose an area");
  const lekki = all.cinemas.filter((c) => c.area === "lekki").length;
  await expect(sheet.getByTestId("sheet.area.lekki")).toHaveText(`Lekki${lekki} cinemas`);
  await sheet.getByTestId("sheet.area.ikeja").click();
  await expect(sheet).toBeHidden();

  await expect(page).toHaveURL(/\/cinemas$/);
  await expect(page.getByTestId("group.area").getByRole("heading", { level: 2 })).toHaveText("In Ikeja");
  await expect(page.getByTestId("pick.area")).toHaveText("AreaIkeja");
  expect(await page.evaluate(() => localStorage.getItem("ls.area"))).toBe("ikeja");
  await page.reload();
  await expect(page.getByTestId("group.area").getByRole("heading", { level: 2 })).toHaveText("In Ikeja");

  // The kept area is ticked when the sheet opens again.
  await page.getByTestId("pick.area").click();
  await expect(page.getByTestId("sheet.area.ikeja")).toHaveAttribute("aria-pressed", "true");
});

for (const [name, viewport] of [["phone", { width: 390, height: 844 }], ["iPad", { width: 834, height: 1194 }]] as const) {
  test(`on a ${name} the area sheet rises from the bottom with every area on screen`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/lagos/cinemas");
    await page.getByTestId("pick.area").click();
    await settle(page);
    const box = (await page.getByTestId("sheet.area").boundingBox())!;
    expect(Math.round(viewport.height - (box.y + box.height))).toBe(8);
    expect(Math.round(box.width)).toBe(name === "phone" ? 374 : 640);
    const hidden = await page.locator('[data-testid^="sheet.area."]').evaluateAll((els) =>
      els.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top < 0 || r.bottom > window.innerHeight || !el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      }).map((el) => el.getAttribute("data-testid")),
    );
    expect(hidden).toEqual([]);
  });
}

// D-109 c supersedes Figma's popover over the picker: on a computer the menu hangs 8 px under it,
// so the picker stays in view.
test("on a computer the area picker drops a menu under the picker, two areas to a row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lagos/cinemas");
  const picker = (await page.getByTestId("pick.area").boundingBox())!;
  await page.getByTestId("pick.area").click();
  await expect(page.getByTestId("sheet.area")).toHaveAttribute("data-state", "open");
  const box = (await page.getByTestId("sheet.area").boundingBox())!;
  expect(Math.round(box.x)).toBe(Math.round(picker.x));
  expect(Math.round(box.y - (picker.y + picker.height))).toBe(8);
  expect(Math.round(box.width)).toBe(640);
  const lekki = (await page.getByTestId("sheet.area.lekki").boundingBox())!;
  const vi = (await page.getByTestId("sheet.area.victoria-island").boundingBox())!;
  expect(Math.round(vi.y)).toBe(Math.round(lekki.y));

  // It stays under its picker when the page scrolls.
  await page.evaluate(() => window.scrollBy(0, 120));
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const moved = (await page.getByTestId("pick.area").boundingBox())!;
  const after = (await page.getByTestId("sheet.area").boundingBox())!;
  expect(Math.round(moved.y)).toBe(Math.round(picker.y) - 120);
  expect(Math.round(after.y - (moved.y + moved.height))).toBe(8);
});

test("the day picker shows tomorrow, and says so", async ({ page, request }) => {
  await freeze(page, new Date((await dataFile(request, "lagos")).generatedAt)); // the data's first day, so tomorrow has times
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.day").click();
  await page.getByTestId("day.option.tomorrow").click();
  await expect(page.getByTestId("sheet.day")).toBeHidden();
  await expect(page.getByTestId("pick.day")).toHaveText("DayTomorrow");
  await expect(page.getByTestId("cinema.next").first()).toHaveText(/^First at \d{1,2}:\d\d\s[AP]M · \d+ films? tomorrow$/);
});

test("choosing IMAX leaves only cinemas showing in IMAX, and says which were left out", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "10:00");
  const rows = today(all, now);
  const imax = [...new Set(rows.filter((s) => /^IMAX/.test(s.format ?? "")).map((s) => s.cinemaId))];
  const silent = new Set(rows.map((s) => s.cinemaId).filter((id) => !rows.some((s) => s.cinemaId === id && s.format))).size;
  expect(imax.length).toBeGreaterThan(0);
  expect(silent).toBeGreaterThan(1);
  await freeze(page, now);
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.format").click();
  await page.getByTestId("format.option.IMAX").click();
  await expect(page.getByTestId("pick.format")).toHaveText("FormatIMAX");
  expect((await shown(page, "all")).sort()).toEqual(imax.sort());
  await expect(page.getByTestId("format.left-out")).toContainText(`${silent} cinemas don't, so they're left out here; their times are under Any format.`);
});

test("the rows sit one to a line on a phone and two on an iPad and a computer, at Figma's widths", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  for (const [width, columns, cardWidth] of [[390, 1, 358], [834, 2, 377], [1440, 2, 612]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/lagos/cinemas");
    const cards = page.getByTestId("group.all").locator('[data-testid^="cinema.card."]');
    const boxes = await cards.evaluateAll((els) => els.slice(0, 4).map((el) => el.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), w: Math.round(r.width) })));
    expect(new Set(boxes.map((b) => b.x)).size).toBe(columns);
    expect(boxes[0]!.w).toBe(cardWidth);
  }
});

for (const width of [390, 360, 320]) {
  test(`at ${width} px nothing scrolls sideways, and the pickers and rows are at least 44 px tall`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 800 });
    await keep(page, "lekki");
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/cinemas");
    await expect(page.getByTestId("group.area")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const short = await page.locator('main button, [data-testid^="cinema.card."]').evaluateAll((els) => els.filter((el) => { const h = el.getBoundingClientRect().height; return h > 0 && h < 43.5; }).map((el) => el.outerHTML.slice(0, 90)));
    expect(short).toEqual([]);
  });
}

test("the footer says the logos are the chains' own and how to have one removed", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await expect(page.getByTestId("footer.logos")).toContainText("Cinema logos belong to their owners");
  await expect(page.getByTestId("footer.logos").getByRole("link")).toHaveAttribute("href", "https://github.com/ChimeXXD/sinima/issues");
});

test("with nothing left to start today there is no Format picker; tomorrow's formats bring it back (D-135)", async ({ page, request }) => {
  await freeze(page, await afterLastShowing(request, true));
  await page.goto("/lagos/cinemas");
  await expect(page.getByTestId("pick.day")).toBeVisible();
  await expect(page.getByTestId("pick.format")).toHaveCount(0); // no lone "Any format" that filters nothing
  await page.getByTestId("pick.day").click();
  await page.getByTestId("day.option.tomorrow").click();
  await expect(page.getByTestId("pick.format")).toBeVisible();
});
