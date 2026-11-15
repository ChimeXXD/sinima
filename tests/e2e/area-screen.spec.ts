import { expect, test, type Page } from "@playwright/test";
import { cinemasBySoonest, dataFile, freeze, lagosClock, sampleTime, today, type DataFile } from "./helpers";

// An area's page as Figma draws it (Figma Area 200:6420, build unit 7): the cinemas kept on this
// phone, then the area's other cinemas soonest first with their next three times, then the areas
// next to it. With nothing left tonight, it says so and the areas next to it lead.

const keepCinemas = (page: Page, ids: string[]) => page.addInitScript((list) => localStorage.setItem("ls.cinemas", JSON.stringify(list)), ids);
const shown = (page: Page, group: string) => page.getByTestId(`group.${group}`).locator('[data-testid^="cinema.card."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(12)));
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/** Soonest next showing first (the data's showing order), then nothing left today, then no times at all. */
function order(all: DataFile, now: Date, ids: string[]): string[] {
  const soonest = cinemasBySoonest(today(all, now));
  const rank = (id: string) => (soonest.includes(id) ? 0 : all.showings.some((s) => s.cinemaId === id) ? 1 : 2);
  return [...ids].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? soonest.indexOf(a) - soonest.indexOf(b) : 0));
}

test("kept cinemas first, then the area's others soonest first, then the areas next to it (Figma Default)", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "17:30");
  await keepCinemas(page, ["filmhouse-lekki-imax", "ebonylife-vi"]); // one here, one elsewhere
  await freeze(page, now);
  await page.goto("/area/lekki");

  const lekki = all.cinemas.filter((c) => c.area === "lekki").map((c) => c.id);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Lekki");
  await expect(page.getByTestId("area.count")).toHaveText(`${lekki.length} cinemas`);

  const heading = (group: string) => page.getByTestId(`group.${group}`).locator("h2");
  await expect(heading("saved")).toHaveText("Your cinemas in Lekki");
  await expect(page.getByTestId("group.saved").locator("h2 + p")).toHaveText("Saved on this phone");
  expect(await shown(page, "saved")).toEqual(["filmhouse-lekki-imax"]);
  await expect(heading("area")).toHaveText("More cinemas in Lekki");
  await expect(page.getByTestId("group.area").locator("h2 + p")).toHaveText("Soonest first");
  expect(await shown(page, "area")).toEqual(order(all, now, lekki.filter((id) => id !== "filmhouse-lekki-imax")));

  await expect(heading("next")).toHaveText("Next to Lekki");
  await expect(page.getByTestId("group.next").locator("h2 + p")).toHaveCount(0);
  const cards = page.getByTestId("group.next").locator('[data-testid^="next.card."]');
  const left = today(all, now);
  const firstIn = (area: string) => left.find((s) => all.cinemas.find((c) => c.id === s.cinemaId)!.area === area)!;
  const areas = ["victoria-island", "sangotedo"].sort((a, b) => firstIn(a).startsAt.localeCompare(firstIn(b).startsAt));
  expect(await cards.evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(10)))).toEqual(areas);
  for (const area of areas) {
    const first = firstIn(area);
    const count = all.cinemas.filter((c) => c.area === area).length;
    const card = page.getByTestId(`next.card.${area}`);
    await expect(card.getByTestId("next.line")).toHaveText(`${plural(count, "cinema")} · next ${lagosClock(first.startsAt)} at ${all.cinemas.find((c) => c.id === first.cinemaId)!.name}`);
    await expect(card).toHaveAttribute("href", `/area/${area}`);
  }
});

test("a cinema card shows its next three times with their films, the soonest marked, and links to all its times", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "17:30");
  await freeze(page, now);
  await page.goto("/area/lekki");

  const id = "filmhouse-circle-mall";
  const rows = today(all, now).filter((s) => s.cinemaId === id);
  const card = page.getByTestId(`cinema.card.${id}`);
  const films = new Set(rows.map((s) => s.filmId)).size;
  await expect(card.getByTestId("cinema.name")).toHaveText("Filmhouse Circle Mall");
  await expect(card.getByTestId("cinema.line")).toHaveText(`${plural(films, "film")} tonight · IMAX`);
  const times = card.locator('[data-testid^="row."]');
  await expect(times).toHaveCount(Math.min(3, rows.length));
  for (const [i, row] of rows.slice(0, 3).entries()) {
    await expect(times.nth(i).getByTestId(`time.${id}.${row.startsAt}`)).toContainText(lagosClock(row.startsAt));
    await expect(times.nth(i).getByTestId("showing.film")).toHaveText(all.films.find((f) => f.id === row.filmId)!.title);
  }
  // Within the hour, every time at the first start is the soonest (Figma: both 18:00s).
  const first = rows[0]!.startsAt;
  for (const row of rows.slice(0, 3)) {
    const chip = card.getByTestId(`time.${id}.${row.startsAt}`).first();
    if (row.startsAt === first) await expect(chip).toHaveAttribute("data-state", "soonest");
    else await expect(chip).not.toHaveAttribute("data-state", "soonest");
  }
  await expect(card.getByTestId("cinema.all")).toHaveAttribute("href", `/cinema/${id}`);
  await expect(card.getByTestId("cinema.save")).toHaveCount(0); // only kept cinemas carry the heart (Figma)
});

test("a time opens the showing sheet; sample times can't be booked; Escape closes it", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const now = await sampleTime(request, "17:30");
  await freeze(page, now);
  await page.goto("/area/lekki");
  const row = today(all, now).find((s) => s.cinemaId === "grand-lekki")!;
  const chip = page.getByTestId(`time.grand-lekki.${row.startsAt}`).first();
  await chip.click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toHaveAccessibleName(`${lagosClock(row.startsAt)} · Grand Cinemas Lekki`);
  await expect(sheet.getByTestId("showing.book")).toContainText("Sample only");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(chip).toBeFocused();
});

test("the heart on a kept cinema lets it go: it moves to the area's other cinemas", async ({ page, request }) => {
  await keepCinemas(page, ["grand-lekki"]);
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/area/lekki");
  const heart = page.getByTestId("cinema.card.grand-lekki").getByTestId("cinema.save");
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await expect(heart).toHaveAccessibleName("Remove Grand Cinemas Lekki from your cinemas");
  await heart.click();
  await expect(page.getByTestId("group.saved")).toHaveCount(0);
  await expect(page.getByTestId("group.area").locator("h2")).toHaveText("In Lekki");
  expect(await shown(page, "area")).toContain("grand-lekki");
  expect(await page.evaluate(() => localStorage.getItem("ls.cinemas"))).toBe("[]");
});

test("with nothing more tonight, it says whose showing was last and the areas next to it lead (Figma Nothing left tonight)", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  const day = await sampleTime(request, "12:00");
  const island = all.cinemas.filter((c) => c.area === "lagos-island");
  expect(island.map((c) => c.id)).toEqual(["blue-pictures-onikan"]);
  const last = all.showings.filter((s) => s.cinemaId === "blue-pictures-onikan" && s.startsAt.slice(0, 10) === day.toISOString().slice(0, 10)).map((s) => s.startsAt).sort().at(-1)!;
  await freeze(page, new Date(Date.parse(last) + 60_000));
  await page.goto("/area/lagos-island");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Lagos Island");
  await expect(page.getByTestId("area.count")).toHaveText("1 cinema");
  await expect(page.getByTestId("area.empty").getByRole("heading")).toHaveText("Nothing more starts in Lagos Island tonight");
  await expect(page.getByTestId("area.empty").locator("p")).toHaveText(`Blue Pictures Cinemas City Mall's last showing began at ${lagosClock(last)}. The areas next to it still have times tonight.`);
  const groups = await page.locator('[data-testid^="group."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));
  expect(groups).toEqual(["group.next", "group.area"]);
  await expect(page.getByTestId("group.next").locator("h2 + p")).toHaveText("Soonest first");
  await expect(page.getByTestId("group.area").locator("h2")).toHaveText("In Lagos Island");
  const card = page.getByTestId("cinema.card.blue-pictures-onikan");
  await expect(card.getByTestId("cinema.line")).toHaveText("Lagos Island"); // no times tomorrow in the sample
  await expect(card.getByTestId("cinema.none")).toHaveText("Nothing more tonight.");
});

test("a cinema whose times we can't read says so, and the footer explains", async ({ page, request }) => {
  const all = await dataFile(request, "all");
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/area/victoria-island");
  const unread = all.cinemas.filter((c) => c.area === "victoria-island" && !all.showings.some((s) => s.cinemaId === c.id));
  expect(unread.length).toBeGreaterThan(0);
  for (const cinema of unread) await expect(page.getByTestId(`cinema.card.${cinema.id}`).getByTestId("cinema.none")).toHaveText("Times not available yet");
  await expect(page.getByTestId("area.no-times")).toHaveText("“Times not available yet”: we can't read this cinema's times yet. Check its own site.");
  await expect(page.getByTestId("footer.logos")).toContainText("Cinema logos belong to their owners");
});

test("phone and iPad: a top bar with back and share; desktop: a link back to all cinemas", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/area/lekki");
  await expect(page.getByTestId("area.back")).toHaveAttribute("href", "/cinemas");
  await expect(page.getByTestId("area.share")).toBeVisible();
  await expect(page.getByTestId("wordmark")).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByTestId("area.back")).toBeHidden();
  await expect(page.getByRole("link", { name: "All cinemas in Lagos" })).toHaveAttribute("href", "/cinemas");
  await expect(page.getByTestId("tab.cinemas")).toHaveAttribute("aria-current", "page");
});

test("cards sit one to a row on a phone, two on an iPad and three on a computer, at Figma's widths", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  for (const [width, columns, cardWidth, nextWidth] of [[390, 1, 358, 358], [834, 2, 377, 377], [1440, 3, 403, 612]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/area/lekki");
    const boxes = await page.getByTestId("group.area").locator('[data-testid^="cinema.card."]').evaluateAll((els) => els.slice(0, 3).map((el) => el.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), w: Math.round(r.width) })));
    expect(new Set(boxes.map((b) => b.x)).size).toBe(columns);
    expect(boxes[0]!.w).toBe(cardWidth);
    const next = (await page.locator('[data-testid^="next.card."]').first().boundingBox())!;
    expect(Math.round(next.width)).toBe(nextWidth);
  }
});

// Every area's name, on every width: the title never runs under the ticket sticker, and the circle goes round the whole name.
for (const width of [320, 360, 390, 834, 1440]) {
  test(`at ${width} px every area's title stays clear of its sticker`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    const all = await dataFile(request, "all");
    const slugs = [...new Set(all.cinemas.map((c) => c.area))];
    const bad: string[] = [];
    for (const slug of slugs) {
      await page.goto(`/area/${slug}`);
      const hit = await page.evaluate(() => {
        const box = (el: Element | null) => el!.getBoundingClientRect();
        const name = box(document.querySelector('[data-testid="area.name"]'));
        const ring = box(document.querySelector('[data-testid="area.name"] svg'));
        const sticker = box(document.querySelector('[data-testid="area.sticker"]'));
        // The words' own boxes (a block word's element runs the whole line).
        const words = [...document.querySelectorAll("h1 [data-word]")].map((el) => { const range = document.createRange(); range.selectNodeContents(el.firstChild!); return range.getBoundingClientRect(); });
        const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const out = [ring, sticker].some((r) => r.left < 0 || r.right > innerWidth);
        return { clash: [...words, ring].some((w) => overlaps(w, sticker)), round: ring.left <= name.left && ring.right >= name.right, out };
      });
      if (hit.clash || !hit.round || hit.out) bad.push(`${slug} ${JSON.stringify(hit)}`);
    }
    expect(bad).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

for (const width of [390, 360, 320]) {
  test(`at ${width} px nothing scrolls sideways, and every button and time is at least 44 px tall`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 800 });
    await keepCinemas(page, ["grand-lekki"]);
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/area/lekki");
    await expect(page.getByTestId("group.saved")).toBeVisible();
    // clientWidth, not innerWidth: a phone's layout viewport grows to fit content that is too wide.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const wide = await page.locator('[data-testid^="cinema.card."], [data-testid^="next.card."]').evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth).map((el) => el.getAttribute("data-testid")));
    expect(wide).toEqual([]);
    const short = await page.locator("main button, [data-testid^='next.card.']").evaluateAll((els) => els.filter((el) => { const h = el.getBoundingClientRect().height; return h > 0 && h < 43.5; }).map((el) => el.outerHTML.slice(0, 90)));
    expect(short).toEqual([]);
    // Film names that don't fit end in an ellipsis, inside the card.
    const spill = await page.locator('[data-testid="showing.film"]').evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().right > el.closest("article")!.getBoundingClientRect().right).length);
    expect(spill).toBe(0);
  });
}
