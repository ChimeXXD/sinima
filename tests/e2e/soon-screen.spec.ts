import { expect, test, type Page } from "./test";
import { dataFile, freeze, sampleTime, shownClock, today, type DataFile } from "./helpers";

// Starting soon as Figma draws it (Figma 204:7192 Default, 204:7931 Nothing in 2 hours, build unit
// 9): in your area, the next 2 hours as cards that count down, then the rest of tonight as rows;
// with nothing in the next 2 hours, what else there is. Kept countdowns lead the page.

const HOUR = 3_600_000;
const keepArea = (page: Page, slug: string) => page.addInitScript((area) => localStorage.setItem("ls.area", area), slug);
const ids = (page: Page, testId: string, prefix: string) => page.getByTestId(testId).locator(`[data-testid^="${prefix}."]`).evaluateAll((els, cut) => els.map((el) => el.getAttribute("data-testid")!.slice(cut)), prefix.length + 1);
const areaOf = (all: DataFile, cinemaId: string) => all.cinemas.find((c) => c.id === cinemaId)!.area;
const key = (s: DataFile["showings"][number]) => `${s.filmId}.${s.startsAt}`;
const plural = (n: number) => `${n} ${n === 1 ? "showing" : "showings"}`;

test("your area's next 2 hours as cards, soonest first, then the rest of tonight (Figma Default)", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await keepArea(page, "lekki");
  await freeze(page, now);
  await page.goto("/lagos/soon");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Starting soon in Lekki");
  const chips = await page.getByRole("group", { name: "Area" }).locator('[data-testid^="area.chip."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(10)));
  expect(chips).toEqual(["lekki", "victoria-island", "sangotedo", "all"]);
  await expect(page.getByTestId("area.chip.lekki")).toHaveAttribute("aria-pressed", "true");

  const left = today(all, now).filter((s) => areaOf(all, s.cinemaId) === "lekki");
  const soon = left.filter((s) => Date.parse(s.startsAt) - now.getTime() <= 2 * HOUR);
  const later = left.filter((s) => !soon.includes(s));
  await expect(page.getByTestId("section.soon").locator("h2")).toHaveText("Next 2 hours");
  await expect(page.getByTestId("section.soon").locator("h2 + p")).toHaveText(`${plural(soon.length)} in Lekki · booking closes when a film starts`);
  const cards = await ids(page, "section.soon", "soon");
  expect(cards.map((id) => id.slice(-20))).toEqual(soon.map((s) => s.startsAt)); // soonest first
  expect(new Set(cards)).toEqual(new Set(soon.map(key)));
  const first = page.getByTestId(`soon.${key(soon[0]!)}`);
  await expect(first.getByTestId("countdown-badge")).toContainText("Starts in");
  await expect(first.getByTestId("time-pill")).toContainText(shownClock(soon[0]!.startsAt));
  await expect(first.getByTestId("time-pill.book")).toHaveCount(0); // sample times can't be booked (D-25)

  await expect(page.getByTestId("section.later").locator("h2")).toHaveText("Later tonight");
  await expect(page.getByTestId("section.later").locator("h2 + p")).toHaveText(`${later.length} more in Lekki until ${shownClock(later.at(-1)!.startsAt)}`);
  expect(await ids(page, "later.rows", "later")).toHaveLength(Math.min(6, later.length));
  await page.getByTestId("later.rows.more").click();
  expect((await ids(page, "later.rows", "later")).map((id) => id.slice(-20))).toEqual(later.map((s) => s.startsAt));
  await expect(page.getByTestId("later.rows.more")).toHaveCount(0);
  // Another area starts folded again.
  await page.getByTestId("area.chip.all").click();
  await expect(page.getByTestId("later.rows.more")).toBeVisible();
  expect(await ids(page, "later.rows", "later")).toHaveLength(6);
});

test("All Lagos takes every area; the chips don't move, and the area stays kept", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await keepArea(page, "lekki");
  await freeze(page, now);
  await page.goto("/lagos/soon");
  await page.getByTestId("area.chip.all").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Starting soon in Lagos");
  const soon = today(all, now).filter((s) => Date.parse(s.startsAt) - now.getTime() <= 2 * HOUR);
  await expect(page.getByTestId("section.soon").locator("h2 + p")).toHaveText(`${plural(soon.length)} in Lagos · booking closes when a film starts`);
  await page.getByTestId("area.chip.victoria-island").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Starting soon in Victoria Island");
  expect(await page.getByRole("group", { name: "Area" }).locator('[data-testid^="area.chip."]').count()).toBe(4);
  expect(await page.evaluate(() => localStorage.getItem("ls.area"))).toBe("lekki");
});

test("with no area kept: all of Lagos, All Lagos first, then every area", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/soon");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Starting soon in Lagos");
  const chips = await page.getByRole("group", { name: "Area" }).locator('[data-testid^="area.chip."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(10)));
  expect(chips[0]).toBe("all");
  expect(new Set(chips.slice(1))).toEqual(new Set(all.cinemas.map((c) => c.area)));
  await expect(page.getByTestId("area.chip.all")).toHaveAttribute("aria-pressed", "true");
});

test("a card opens the showing sheet; Book is never on a sample time; Escape gives focus back", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await keepArea(page, "lekki");
  await freeze(page, now);
  await page.goto("/lagos/soon");
  const row = today(all, now).find((s) => areaOf(all, s.cinemaId) === "lekki")!;
  const cinema = all.cinemas.find((c) => c.id === row.cinemaId)!;
  const card = page.getByTestId(`soon.${key(row)}`);
  await card.getByRole("button").click();
  const sheet = page.getByTestId("showing.sheet");
  await expect(sheet).toHaveAccessibleName(`${shownClock(row.startsAt)} · ${cinema.name}`);
  await expect(sheet.getByTestId("showing.book")).toContainText("Sample only");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(card.getByRole("button")).toBeFocused();
});

test("Keep a countdown puts the showing at the top of Starting soon until it begins (D-88)", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  await keepArea(page, "lekki");
  await freeze(page, now);
  // A showing in Ikeja, more than 2 hours away: not otherwise on a Lekki page.
  const row = today(all, now).find((s) => areaOf(all, s.cinemaId) === "ikeja" && Date.parse(s.startsAt) - now.getTime() > 2 * HOUR)!;
  await page.addInitScript((id) => localStorage.setItem("ls.countdowns", JSON.stringify([id])), `${row.filmId}|${row.cinemaId}|${row.startsAt}`);
  await page.goto("/lagos/soon");
  const kept = page.getByTestId("section.kept");
  await expect(kept.locator("h2")).toHaveText("Your countdowns");
  await expect(kept.locator("h2 + p")).toHaveText("Kept on this phone until each film starts");
  expect(await ids(page, "section.kept", "kept")).toEqual([key(row)]);
  await expect(kept.getByTestId("countdown-badge")).toContainText("Starts in");
  // It goes when the film starts.
  await page.clock.runFor(Date.parse(row.startsAt) - now.getTime() + 1000);
  await expect(kept).toHaveCount(0);
});

test("nothing in the next 2 hours: Figma's words, what's left in Lagos, and tomorrow in Lekki (Figma Nothing in 2 hours)", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = new Date((await sampleTime(request, "22:50")).getTime() - 24 * HOUR); // the first day, so tomorrow has times
  await keepArea(page, "lekki");
  await freeze(page, now);
  await page.goto("/lagos/soon");
  const quiet = page.getByTestId("soon.quiet");
  await expect(quiet.locator("h2")).toHaveText("Nothing starts in Lekki in the next 2 hours");
  const left = today(all, now);
  expect(left.filter((s) => ["lekki", "victoria-island", "sangotedo"].includes(areaOf(all, s.cinemaId)))).toEqual([]);
  await expect(quiet.locator("h2 + p")).toHaveText(`Nor in Victoria Island or Sangotedo. ${left.length === 1 ? "One showing is" : `${left.length} showings are`} left in Lagos tonight:`);
  const first = left[0]!;
  const minutes = Math.round((Date.parse(first.startsAt) - now.getTime()) / 60_000);
  await expect(quiet.getByTestId(`later.${key(first)}`)).toContainText(`${all.cinemas.find((c) => c.id === first.cinemaId)!.name} · starts in ${minutes} min`);

  const tomorrow = all.showings.filter((s) => areaOf(all, s.cinemaId) === "lekki" && Date.parse(s.startsAt) > now.getTime() + 6 * HOUR).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]!;
  const film = all.films.find((f) => f.id === tomorrow.filmId)!.title.split(": ")[0];
  await expect(quiet.locator("p").last()).toHaveText(`Tomorrow in Lekki starts at ${shownClock(tomorrow.startsAt)} with ${film} at ${all.cinemas.find((c) => c.id === tomorrow.cinemaId)!.name}.`);
  await expect(page.getByTestId("soon.tomorrow")).toHaveText("See tomorrow in Lekki");
  await expect(page.getByTestId("soon.tomorrow")).toHaveAttribute("href", "/lagos/area/lekki");
  await expect(page.getByTestId("soon.tomorrow")).not.toHaveAttribute("target", "_blank"); // a page of this site opens in place
  await expect(quiet).toContainText("early night?");
  await expect(page.getByTestId("section.soon")).toHaveCount(0);
  await expect(page.getByTestId("section.later")).toHaveCount(0);
});

test.describe("before the page knows the time", () => {
  test.use({ javaScriptEnabled: false });
  test("the page's own HTML lists the day for all of Lagos, with no countdowns (rule 3)", async ({ page }) => {
    await page.goto("/lagos/soon");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Starting soon in Lagos");
    await expect(page.getByTestId("section.day").locator("h2")).toHaveText(/^Showings on \w{3} \d{1,2} \w{3}$/);
    await expect(page.getByTestId("day.rows").locator('[data-testid^="later."]')).toHaveCount(6);
    await expect(page.getByTestId("section.soon")).toHaveCount(0);
    expect(await page.locator("main").textContent()).not.toMatch(/\b(Starts in|starts in|ago)\b/);
  });
});

test("cards are 2, 4 and 6 to a row and the later rows 1, 2 and 2, at Figma's widths", async ({ page, request }) => {
  await keepArea(page, "lekki");
  await freeze(page, await sampleTime(request, "17:30"));
  for (const [width, columns, cardWidth, rows, rowWidth] of [[390, 2, 173, 1, 358], [834, 4, 182, 2, 378], [1440, 6, 193, 2, 613]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/lagos/soon");
    const cards = await page.getByTestId("section.soon").locator('[data-testid^="soon."]').evaluateAll((els) => els.slice(0, 6).map((el) => el.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) })));
    expect(new Set(cards.slice(0, columns).map((c) => c.x)).size).toBe(columns);
    expect(cards[0]!.w).toBe(cardWidth);
    expect(new Set(cards.slice(0, columns).map((c) => c.h)).size).toBe(1); // one height in a row
    expect(cards[0]!.h).toBe(405); // Figma's card
    const later = await page.getByTestId("later.rows").locator('[data-testid^="later."]').evaluateAll((els) => els.slice(0, 2).map((el) => el.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), w: Math.round(r.width) })));
    expect(new Set(later.map((r) => r.x)).size).toBe(rows);
    expect(later[0]!.w).toBe(rowWidth);
  }
});

// Every area's name, on every width: the title never runs under the ticket sticker or its note, the circle
// goes round the whole name, and it stays above the chips.
for (const width of [320, 360, 390, 834, 1440]) {
  test(`at ${width} px every area's title stays clear of the sticker, "next 2 hours" and the chips`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    const all = await dataFile(request, "lagos");
    const slugs = [...new Set(all.cinemas.map((c) => c.area))];
    const bad: string[] = [];
    for (const slug of slugs) {
      await keepArea(page, slug);
      await page.goto("/lagos/soon");
      await expect(page.getByTestId("soon.place")).not.toHaveText("Lagos");
      const hit = await page.evaluate(() => {
        const box = (el: Element | null) => el!.getBoundingClientRect();
        const name = box(document.querySelector('[data-testid="soon.place"]'));
        const ring = box(document.querySelector('[data-testid="soon.place"] svg'));
        const sticker = box(document.querySelector('[data-testid="soon.sticker"] img'));
        const text = (el: Element) => { const range = document.createRange(); range.selectNodeContents(el.firstChild!); return range.getBoundingClientRect(); };
        const note = text(document.querySelector('[data-testid="soon.note"]')!);
        const words = [...document.querySelectorAll("h1 [data-word]")].map(text);
        const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const out = [ring, sticker, note].some((r) => r.left < 0 || r.right > innerWidth);
        const chips = box(document.querySelector('[role="group"][aria-label="Area"] button'));
        return { clash: [...words, ring].some((w) => overlaps(w, sticker) || overlaps(w, note)), round: ring.left <= name.left && ring.right >= name.right, out, onChips: ring.bottom > chips.top };
      });
      if (hit.clash || !hit.round || hit.out || hit.onChips) bad.push(`${slug} ${JSON.stringify(hit)}`);
    }
    expect(bad).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}
