import { expect, test, type Page } from "./test";
import { dataFile, sampleTime } from "./helpers";

// Filmhouse's featured films (D-131): on a Filmhouse cinema with no times, the films Filmhouse's
// home page features today, in words, beside the button to Filmhouse's site. Real times win. The
// sample leaves Palms Lekki out of Lagocine's 11 Nov page (tests/fixtures/index.json), so it has
// none, as all 7 had live on 17 Nov; the saved home page's films sit on the sample's first day.

const NONE = "filmhouse-palms-lekki";
const TIMED = "filmhouse-oniru";
const DAY = 86_400_000;

type Featured = { sourceId: string; cinemaIds: string[]; day: string; films: { id: string; title: string }[] };

async function featured(page: Page, request: Parameters<typeof dataFile>[0]): Promise<string> {
  const lagos = (await dataFile(request, "lagos")) as Awaited<ReturnType<typeof dataFile>> & { featured?: Featured[] };
  const list = lagos.featured?.find((entry) => entry.sourceId === "filmhouse-home");
  expect(list?.cinemaIds).toContain(NONE);
  expect(lagos.showings.some((s) => s.cinemaId === NONE)).toBe(false);
  expect(lagos.showings.some((s) => s.cinemaId === TIMED)).toBe(true);
  // Noon on the list's own day (the sample's first), in place of the usual second day.
  await page.clock.install({ time: new Date((await sampleTime(request, "12:00")).getTime() - DAY) });
  const titles = list!.films.map((film) => film.title);
  return `Filmhouse's home page features ${titles.slice(0, -1).join(", ")} and ${titles.at(-1)} today.`;
}

test("a Filmhouse cinema with no times names the films its home page features today, and keeps the button to Filmhouse's site", async ({ page, request }) => {
  const line = await featured(page, request);
  expect(line).toBe("Filmhouse's home page features Ghost Soldier, How to Rob a Bank, Five Figurines and Dear Ajayi today.");
  await page.goto(`/lagos/cinema/${NONE}`);
  await expect(page.getByTestId("films.none")).toHaveText("No times listed today.");
  await expect(page.getByTestId("films.featured")).toHaveText(`${line} All times are on Filmhouse's site.`);
  await expect(page.getByTestId("cinema.book")).toHaveAttribute("href", "https://filmhouseng.com/");
});

test("on the Cinemas tab its row says so under “Times not available yet”; a Filmhouse cinema with real times does not", async ({ page, request }) => {
  const line = await featured(page, request);
  await page.goto("/lagos/cinemas");
  const row = page.getByTestId(`cinema.card.${NONE}`);
  await expect(row.getByTestId("cinema.next")).toHaveText("Times not available yet");
  await expect(row.getByTestId("cinema.featured")).toHaveText(line);
  await expect(page.getByTestId(`cinema.card.${TIMED}`).getByTestId("cinema.featured")).toHaveCount(0);
  await expect(page.locator('[data-testid="cinema.featured"]')).toHaveCount(1);
  await page.goto(`/lagos/cinema/${TIMED}`);
  await expect(page.getByTestId("films.featured")).toHaveCount(0);
});

test("Lekki's area page says so on Palms Lekki's card", async ({ page, request }) => {
  const line = await featured(page, request);
  await page.goto("/lagos/area/lekki");
  const card = page.getByTestId(`cinema.card.${NONE}`);
  await expect(card.getByTestId("cinema.none")).toHaveText("Times not available yet");
  await expect(card.getByTestId("cinema.featured")).toHaveText(line);
});

test("the next day the list is gone: it was for one day", async ({ page }) => {
  // The usual clock: noon on the sample's second day.
  await page.goto(`/lagos/cinema/${NONE}`);
  await expect(page.getByTestId("cinema.title")).toBeVisible();
  await expect(page.getByTestId("films.featured")).toHaveCount(0);
  await page.goto("/lagos/cinemas");
  await expect(page.getByTestId(`cinema.card.${NONE}`)).toBeVisible();
  await expect(page.locator('[data-testid="cinema.featured"]')).toHaveCount(0);
});
