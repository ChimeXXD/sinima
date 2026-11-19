import { expect, test, type APIRequestContext } from "./test";

// Coming soon (D-144, D-151, D-154) on the built sample site: a section on Lagos's Films, none on
// Abuja's (no sinima there lists a coming film), and a coming film's own page, which has no times and
// no booking, only when it opens and a calendar button. Dates are the sinima's, read in Lagos.

type Coming = { filmId: string; firstDay: string | null; cinemaIds: string[] };
type CityFile = { generatedAt: string; films: { id: string; title: string }[]; showings: { filmId: string }[]; coming?: Coming[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Fri 18 Dec" for "2026-12-18": a calendar date, so read in UTC. */
const shown = (day: string) => {
  const at = new Date(`${day}T12:00:00Z`);
  return `${at.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })} ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}`;
};

/** The coming films the Films page lists: in the city's file, with no showing (D-154). */
async function comingFilms(request: APIRequestContext) {
  const file = (await (await request.get("/data/lagos.json")).json()) as CityFile;
  const showing = new Set(file.showings.map((s) => s.filmId));
  // The file's Lagos day (UTC+1, no DST): an entry dated on or before it is no longer coming.
  const today = new Date(Date.parse(file.generatedAt) + 3_600_000).toISOString().slice(0, 10);
  const seen = new Set<string>();
  return (file.coming ?? [])
    .filter((entry) => entry.firstDay === null || entry.firstDay > today)
    .filter((entry) => !showing.has(entry.filmId) && !seen.has(entry.filmId) && seen.add(entry.filmId))
    .map((entry) => ({ ...entry, title: file.films.find((film) => film.id === entry.filmId)!.title }));
}

test("Lagos's Films lists the coming films under Coming soon, each with its date sticker and when it opens", async ({ page, request }) => {
  const coming = await comingFilms(request);
  expect(coming.length, "the sample has coming films in Lagos").toBeGreaterThan(0);
  await page.goto("/lagos");
  const section = page.getByTestId("section.coming");
  await expect(section.getByRole("heading", { level: 2, name: "Coming soon" })).toBeVisible();
  await expect(section).toContainText("First dates from the sinimas' own pages");
  await expect(section).toContainText("save the date!");
  // Each card is one link to the film's page.
  const cards = section.getByRole("link");
  await expect(cards).toHaveCount(coming.length);
  for (const film of coming) {
    const card = section.locator(`a[href="/lagos/film/${film.filmId}"]`);
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(film.title);
    await expect(card).toContainText(film.firstDay ? `Opens ${shown(film.firstDay)}` : "Date not announced");
    await expect(card).toContainText("Filmhouse");
    const leaf = card.getByTestId("coming.leaf");
    if (film.firstDay) await expect(leaf).toHaveText(`${MONTHS[Number(film.firstDay.slice(5, 7)) - 1]}${Number(film.firstDay.slice(8))}`);
    else await expect(leaf).toHaveCount(0);
  }
  // A phone: one sideways row of 148 px cards that scrolls.
  const first = cards.first();
  expect((await first.boundingBox())!.width).toBeCloseTo(148, 0);
  const row = first.locator("..");
  expect(await row.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
});

test("Abuja's Films has no Coming soon section, and no empty one", async ({ page }) => {
  await page.goto("/abuja");
  await expect(page.locator('[data-testid^="film.card."]').first()).toBeVisible();
  await expect(page.getByTestId("section.coming")).toHaveCount(0);
  await expect(page.getByText("Coming soon")).toHaveCount(0);
});

test("a coming film's page says when it opens, has no times and no booking, and saves the date to a calendar", async ({ page, request }) => {
  const film = (await comingFilms(request)).find((entry) => entry.firstDay !== null)!;
  const day = film.firstDay!;
  await page.goto("/lagos");
  await page.getByTestId("section.coming").locator(`a[href="/lagos/film/${film.filmId}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/lagos/film/${film.filmId}$`));
  await expect(page.getByTestId("film.title")).toHaveText(film.title);
  await expect(page.getByTestId("film.hero").getByTestId("coming.leaf")).toBeVisible();
  await expect(page.getByTestId("coming.chip")).toHaveText(`Opens ${shown(day)} at Filmhouse`);
  await expect(page.getByRole("heading", { level: 2, name: "Times in Lagos" })).toBeVisible();
  await expect(page.getByTestId("coming.note")).toHaveText(`Times aren't up yet. Filmhouse lists ${film.title} from ${shown(day)}; its times will show here as soon as Filmhouse puts them up.`);
  // No times, no day row, no booking.
  await expect(page.locator('[data-testid^="time."]')).toHaveCount(0);
  await expect(page.getByTestId("film.day")).toHaveCount(0);
  await expect(page.getByTestId("showing.book")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /book/i })).toHaveCount(0);

  const button = page.getByTestId("coming.calendar");
  await expect(button).toHaveText(`Add ${Number(day.slice(8))} ${MONTHS[Number(day.slice(5, 7)) - 1]} to my calendar`);
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toBe(`${film.filmId}-opens-${day}.ics`);
  const ics = await (await download.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString("utf8"));
  expect(ics).toContain(`\r\nDTSTART;VALUE=DATE:${day.replace(/-/g, "")}\r\n`);
  expect(ics).toContain(`\r\nUID:opens-lagos-${film.filmId}@sinima\r\n`);
});

test("a coming film's page has its own share card: the film's, with no date on it", async ({ request }) => {
  const film = (await comingFilms(request))[0]!;
  const html = await (await request.get(`/lagos/film/${film.filmId}`)).text();
  expect(html).toContain(`<meta property="og:image" content="https://sinima.com.ng/og/lagos/${film.filmId}.png"/>`);
  const card = await request.get(`/og/lagos/${film.filmId}.png`);
  expect(card.status()).toBe(200);
  const bytes = await card.body();
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
});
