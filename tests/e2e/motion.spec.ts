import { expect, test, type Page } from "@playwright/test";
import { dataFile, freeze, lagosDay, sampleTime } from "./helpers";

// The motion pass (D-102, D-103). Each test reads the animations the page started, by id, with the
// clock frozen: the keyframes and timing are the contract, the feel is checked by eye.

type Swap = { first: Record<string, unknown>; duration: number; easing: string };

/** The "swap" animations running on the day's list, one per element marked data-swap. */
const swaps = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-swap]")].flatMap((el) =>
      el
        .getAnimations()
        .filter((a) => a.id === "swap")
        .map((a) => {
          const effect = a.effect as KeyframeEffect;
          const { opacity, transform } = effect.getKeyframes()[0]!;
          return { first: { opacity, transform }, duration: Number(effect.getTiming().duration), easing: String(effect.getTiming().easing) };
        }),
    ),
  ) as Promise<Swap[]>;

const firstDay = async (request: Parameters<typeof dataFile>[0]) => new Date((await dataFile(request, "all")).generatedAt);

test.describe("M1: the day's list follows Today | Tomorrow", () => {
  test("a tap slides the new day in from the side the thumb moved to, and back", async ({ page, request }) => {
    await freeze(page, await firstDay(request));
    await page.goto("/lagos");
    const day = page.getByTestId("films.day");
    await day.getByRole("radio", { name: "Tomorrow" }).click();
    const forward = await swaps(page);
    expect(forward.length).toBeGreaterThan(0);
    for (const swap of forward) {
      expect(swap.first).toEqual({ opacity: "0", transform: "translateX(8px)" });
      expect(swap.duration).toBe(220);
      expect(swap.easing).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
    }
    await day.getByRole("radio", { name: "Today" }).click();
    expect((await swaps(page)).map((s) => s.first.transform)).toContain("translateX(-8px)");
  });

  test("the arrow keys change the day at once (no motion on keyboard actions)", async ({ page, request }) => {
    await freeze(page, await firstDay(request));
    await page.goto("/lagos");
    await page.getByTestId("films.day").getByRole("radio", { name: "Today" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("films.day").getByRole("radio", { name: "Tomorrow" })).toBeChecked();
    expect(await swaps(page)).toEqual([]);
  });

  test("with reduced motion the list only fades", async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await freeze(page, await firstDay(request));
    await page.goto("/lagos");
    await page.getByTestId("films.day").getByRole("radio", { name: "Tomorrow" }).click();
    const fades = await swaps(page);
    expect(fades.length).toBeGreaterThan(0);
    for (const swap of fades) {
      expect(swap.first).toEqual({ opacity: "0", transform: undefined });
      expect(swap.duration).toBe(160);
    }
  });

  test("Films' \"nothing more today\" state enters too, coming back to Today", async ({ page, request }) => {
    const all = await dataFile(request, "all");
    const first = lagosDay(all.showings.map((s) => s.startsAt).sort()[0]!);
    const last = all.showings.filter((s) => lagosDay(s.startsAt) === first).map((s) => s.startsAt).sort().at(-1)!;
    await freeze(page, new Date(Date.parse(last) + 60_000));
    await page.goto("/lagos");
    await expect(page.getByTestId("films.empty")).toBeVisible();
    await page.getByTestId("films.day").getByRole("radio", { name: "Tomorrow" }).click();
    await page.getByTestId("films.day").getByRole("radio", { name: "Today" }).click();
    await expect(page.getByTestId("films.empty")).toBeVisible();
    expect(await page.getByTestId("films.empty").evaluate((el) => el.getAnimations().filter((a) => a.id === "swap").length)).toBe(1);
  });

  test("the film, cinema and cinemas pages do the same", async ({ page, request }) => {
    await freeze(page, await firstDay(request));
    await page.goto("/lagos/film/ramayana");
    await page.getByTestId("film.day").getByRole("radio", { name: "Tomorrow" }).click();
    expect((await swaps(page)).length).toBeGreaterThan(0);

    await page.goto("/lagos/cinema/ebonylife-vi");
    await page.getByTestId("films.day").getByRole("radio", { name: /^Tomorrow/ }).click();
    expect((await swaps(page)).length).toBeGreaterThan(0);

    await page.goto("/lagos/cinemas");
    await page.getByTestId("pick.day").click();
    await page.getByTestId("day.option.tomorrow").click();
    expect((await swaps(page)).length).toBeGreaterThan(0);
  });
});

/** Each Later tonight row's CSS animation: its name, delay and duration as computed. */
const rowEntrances = (page: Page) =>
  page.getByTestId("later.rows").evaluate((list) =>
    [...list.children].map((row) => {
      const style = getComputedStyle(row);
      return { name: style.animationName, delay: style.animationDelay, duration: style.animationDuration };
    }),
  );

test.describe("M2: Show N more on Later tonight", () => {
  test.beforeEach(async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await freeze(page, await sampleTime(request, "17:30"));
  });

  test("the first rows never animate; the new ones rise in a wave with shrinking gaps, the rest with the sixth", async ({ page }) => {
    await page.goto("/lagos/soon");
    expect((await rowEntrances(page)).every((row) => row.name === "none")).toBe(true);
    await page.getByTestId("later.rows.more").click();
    const added = (await rowEntrances(page)).slice(6);
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((row) => row.name !== "none" && row.duration === "0.22s")).toBe(true);
    const wave = ["0s", "0.03s", "0.055s", "0.075s", "0.09s", "0.1s"];
    expect(added.map((row) => row.delay)).toEqual(added.map((_, i) => wave[Math.min(i, 5)]));
  });

  test("with reduced motion the new rows fade in together", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/lagos/soon");
    await page.getByTestId("later.rows.more").click();
    const added = (await rowEntrances(page)).slice(6);
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((row) => row.name !== "none" && row.delay === "0s" && row.duration === "0.16s")).toBe(true);
  });
});

/** The animations with this id on the page's elements: each one's first keyframe. */
const running = (page: Page, id: string) =>
  page.evaluate(
    (name) =>
      [...document.querySelectorAll("*")].flatMap((el) =>
        el
          .getAnimations()
          .filter((a) => a.id === name)
          .map((a) => {
            const { opacity, transform } = (a.effect as KeyframeEffect).getKeyframes()[0]!;
            return { at: el.getAttribute("data-flip") ?? el.tagName.toLowerCase(), opacity, transform };
          }),
      ),
    id,
  );

test.describe("M3: keeping a cinema, and letting one go", () => {
  test("Save pops the heart as it fills; letting go and a page that opens already saved don't", async ({ page, request }) => {
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/cinema/filmhouse-lekki-imax");
    const save = page.getByTestId("cinema.save");
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    expect(await running(page, "pop")).toEqual([{ at: "svg", opacity: undefined, transform: "scale(1)" }]);
    await page.reload();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    expect(await running(page, "pop")).toEqual([]);
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "false");
    expect(await running(page, "pop")).toEqual([]);
  });

  test("on an area, a cinema let go travels to its new place and what was under it closes up", async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem("ls.cinemas", JSON.stringify(["grand-lekki"])));
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/area/lekki");
    await page.getByTestId("cinema.card.grand-lekki").getByTestId("cinema.save").click();
    await expect(page.getByTestId("group.saved")).toHaveCount(0);
    const moves = await running(page, "flip");
    expect(moves.find((move) => move.at === "grand-lekki")?.transform).toMatch(/^translate\(-?[\d.]+px, -?[\d.]+px\)$/);
    expect(moves.filter((move) => move.at !== "grand-lekki").length).toBeGreaterThan(0);
  });

  test("with reduced motion nothing travels: what moved fades in where it is", async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("ls.cinemas", JSON.stringify(["grand-lekki"])));
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/area/lekki");
    await page.getByTestId("cinema.card.grand-lekki").getByTestId("cinema.save").click();
    await expect(page.getByTestId("group.saved")).toHaveCount(0);
    const moves = await running(page, "flip");
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((move) => move.transform === undefined && move.opacity === "0")).toBe(true);
  });
});

/** The CSS animations running in an element and everything inside it, by keyframes name. */
const cssAnimations = (page: Page, testId: string) =>
  page.getByTestId(testId).first().evaluate((el) => el.getAnimations({ subtree: true }).map((a) => (a as CSSAnimation).animationName ?? ""));

test.describe("M4: the moment a showing starts", () => {
  async function circleMallAt18(request: Parameters<typeof dataFile>[0]): Promise<string> {
    const all = await dataFile(request, "all");
    const day = lagosDay((await sampleTime(request, "12:00")).toISOString());
    return all.showings.find((s) => s.filmId === "ramayana" && s.cinemaId === "filmhouse-circle-mall" && lagosDay(s.startsAt) === day && new Date(Date.parse(s.startsAt) + 3_600_000).toISOString().slice(11, 16) === "18:00")!.startsAt;
  }

  test("watched: the strike draws across the time, the note and the sheet's notice fade in, the ring gives way to the dot", async ({ page, request }) => {
    const at = await circleMallAt18(request);
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await freeze(page, new Date(Date.parse(at) - 60_000));
    await page.goto("/lagos/film/ramayana");
    const chip = `time.filmhouse-circle-mall.${at}`;
    await page.getByTestId(chip).click();
    await page.clock.runFor(61_000);
    await expect(page.getByTestId("showing.started")).toBeVisible();
    expect(await cssAnimations(page, chip)).toEqual(expect.arrayContaining([expect.stringMatching(/draw/), expect.stringMatching(/arrive/)]));
    expect(await cssAnimations(page, "showing.started")).toEqual([expect.stringMatching(/arrive/)]);
    // The drawn line replaces the plain line-through while it draws (not on top of a full one).
    expect(await page.getByTestId(chip).locator("s").evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
    const badge = page.getByTestId("showing.sheet").getByTestId("countdown-badge");
    expect(await badge.evaluate((el) => el.getAnimations({ subtree: true }).map((a) => (a as CSSAnimation).animationName))).toEqual(expect.arrayContaining([expect.stringMatching(/arcOut/), expect.stringMatching(/dotIn/)]));
  });

  test("a page that opens on a started showing shows it as it is, without motion", async ({ page, request }) => {
    const at = await circleMallAt18(request);
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await freeze(page, new Date(Date.parse(at) + 5 * 60_000));
    await page.goto("/lagos/film/ramayana");
    const chip = `time.filmhouse-circle-mall.${at}`;
    await expect(page.getByTestId(chip)).toHaveAttribute("data-state", "started");
    expect(await cssAnimations(page, chip)).toEqual([]);
  });

  test("with reduced motion the strike fades in instead of drawing", async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const at = await circleMallAt18(request);
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await freeze(page, new Date(Date.parse(at) - 60_000));
    await page.goto("/lagos/film/ramayana");
    await page.clock.runFor(61_000);
    const chip = `time.filmhouse-circle-mall.${at}`;
    await expect(page.getByTestId(chip)).toHaveAttribute("data-state", "started");
    const names = await cssAnimations(page, chip);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /arrive/.test(name))).toBe(true);
  });
});

test("M1: Enter on a segment, or on the Cinemas day option, changes the day without motion", async ({ page, request }) => {
  await freeze(page, await firstDay(request));
  await page.goto("/lagos");
  await page.getByTestId("films.day").getByRole("radio", { name: "Today" }).focus();
  await page.getByTestId("films.day").getByRole("radio", { name: "Tomorrow" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("films.day").getByRole("radio", { name: "Tomorrow" })).toBeChecked();
  expect(await swaps(page)).toEqual([]);

  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.day").click();
  await page.getByTestId("day.option.tomorrow").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("pick.day")).toHaveText("DayTomorrow");
  expect(await swaps(page)).toEqual([]);
});
