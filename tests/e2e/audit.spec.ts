import { expect, test, type Browser, type Page } from "./test";
import { freeze, sampleTime } from "./helpers";

// D-112: the motion audit's picks. Units 1 and 2: small fixes and no motion on keyboard actions.

/** A computer with a mouse: the phone project is a touch screen, where hovers are off. */
const computer = async (browser: Browser) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  return { context, page: await context.newPage() };
};

test("F1: the heart's pop eases per keyframe, so it swells and settles", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await page.getByTestId("cinema.keep").first().click();
  const frames = await page.evaluate(() => document.getAnimations().find((a) => a.id === "pop")!.effect!.constructor.name === "KeyframeEffect" ? (document.getAnimations().find((a) => a.id === "pop")!.effect as KeyframeEffect).getKeyframes().map((k) => k.easing) : []);
  expect(frames[0]).not.toBe("linear");
  expect(frames[1]).not.toBe("linear");
  expect(await page.evaluate(() => (document.getAnimations().find((a) => a.id === "pop")!.effect as KeyframeEffect).getTiming().easing)).toBe("linear");
});

test("F10: on a computer the lift keeps the cards' fill fades", async ({ browser }) => {
  const { context, page } = await computer(browser);
  await page.goto("/lagos/area/lekki");
  const card = page.locator('[data-testid^="next.card."]').first();
  await expect(card).toBeVisible();
  expect(await card.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain("background-color");
  await context.close();
});

test("C6: the Cinemas row chevron no longer nudges on hover", async ({ browser }) => {
  const { context, page } = await computer(browser);
  await page.goto("/lagos/cinemas");
  const row = page.locator('[data-testid^="cinema.card."]').first();
  await row.hover();
  expect(await row.locator("svg").last().evaluate((el) => getComputedStyle(el).translate)).toBe("none");
  await context.close();
});

test("C9: the countdown pill fades in, with no move", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "17:30"));
  await page.goto("/lagos/soon");
  const pill = page.locator('[data-testid="countdown-pill"], [data-testid="countdown-badge"]').first();
  await expect(pill).toBeVisible();
  const frames = await pill.evaluate((el) => el.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().map((k) => k.transform ?? null)));
  expect(frames.every((t) => t === null || t === "none")).toBe(true);
});

test("C4: the 12-area menu's last rows start by 275 ms", async ({ browser }) => {
  const { context, page } = await computer(browser);
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.area").click();
  const menu = page.getByTestId("sheet.area");
  // 300 ms after opening every row has started (the old cap began the ninth at 410 ms).
  await page.waitForTimeout(300);
  const started = await menu.locator("[role=option]").evaluateAll((rows) => rows.map((row) => Number(getComputedStyle(row).opacity) > 0));
  expect(started.length).toBeGreaterThanOrEqual(9);
  expect(started.every(Boolean)).toBe(true);
  await context.close();
});

test.describe("no motion on keyboard actions (F4, F5, C7)", () => {
  const duration = (page: Page, testId: string) => page.getByTestId(testId).evaluate((el) => getComputedStyle(el).transitionDuration);

  test("F4: a sheet opened with Enter and closed with Escape has no transition; a tap keeps it", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    await page.getByTestId("pick.day").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("sheet.day")).toBeVisible();
    expect((await duration(page, "sheet.day")).split(", ").every((d) => d === "0s")).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("sheet.day")).toBeHidden();

    await page.getByTestId("pick.day").click();
    await expect(page.getByTestId("sheet.day")).toBeVisible();
    expect(await duration(page, "sheet.day")).not.toBe("0s");
  });

  test("F5: the heart doesn't pop when pressed with Enter", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    await page.getByTestId("cinema.keep").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("cinema.keep").first()).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.getAnimations().some((a) => a.id === "pop"))).toBe(false);
  });

  test("F5: Show more from the keyboard brings the rows with no wave", async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/soon");
    await page.getByTestId("later.rows.more").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-enter]")).toHaveCount(0);
  });

  test("C7: on a computer, search reached with the keyboard opens with no fade", async ({ browser }) => {
    const { context, page } = await computer(browser);
    await page.goto("/lagos/cinemas");
    await page.getByTestId("search.field").focus();
    await page.keyboard.press("a");
    const panel = page.getByTestId("search.panel");
    await expect(panel).toBeVisible();
    expect((await panel.evaluate((el) => getComputedStyle(el).transitionDuration)).split(", ").every((d) => d === "0s")).toBe(true);
    await context.close();
  });
});

test.describe("F8: the toast", () => {
  test("it slips away before it goes", async ({ page }) => {
    await page.goto("/lagos/cinema/filmhouse-lekki-imax");
    await page.getByTestId("cinema.save").click();
    const toast = page.getByTestId("toast");
    await expect(toast).toBeVisible();
    // Note how it left: marked leaving, with its 160 ms exit, before it was taken away.
    await toast.evaluate((el) => {
      new MutationObserver(() => {
        if (el.hasAttribute("data-leaving")) (window as unknown as { left: string }).left = getComputedStyle(el).transitionDuration;
      }).observe(el, { attributes: true });
    });
    await expect(toast).toHaveCount(0, { timeout: 6000 });
    expect(await page.evaluate(() => (window as unknown as { left?: string }).left)).toContain("0.16s");
  });

  test("saving a second cinema keeps the same toast and starts its time again", async ({ page }) => {
    await page.clock.install();
    await page.goto("/lagos/cinemas");
    await page.getByTestId("cinema.keep").nth(0).click();
    const toast = page.getByTestId("toast");
    await expect(toast).toBeVisible();
    await toast.evaluate((el) => el.setAttribute("data-same", ""));
    await page.clock.runFor(3000);
    await page.getByTestId("cinema.keep").nth(1).click();
    await page.clock.runFor(3000); // 6 s after the first save, 3 s after the second
    await expect(toast).toHaveAttribute("data-same", "");
    await expect(toast).not.toHaveAttribute("data-leaving", "");
  });
});

test.describe("unit 4: arrivals and the poster's travel", () => {
  const animationNames = (page: Page, selector: string) => page.locator(selector).evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));

  test("C8: hero stickers press on when a page opens fresh, not after a tab move", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    const stickers = 'h1 ~ * img, [class*="hero"] [class*="sticker"]';
    expect((await animationNames(page, stickers)).some((name) => name !== "none")).toBe(true);
    await page.getByTestId("tab.films").click();
    await expect(page).toHaveURL(/\/lagos$/);
    expect((await animationNames(page, stickers)).every((name) => name === "none")).toBe(true);
  });

  test("F6, F7: the poster travels by transform alone, and the film page's poster doesn't press on again", async ({ page }) => {
    await page.goto("/lagos");
    await page.waitForTimeout(1500); // as in motion-poster.spec: the film page prefetched, so the navigation is one transition
    await page.evaluate(() => {
      const w = window as unknown as { frames0: { pe: string; props: string[] }[] };
      w.frames0 = [];
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = ((update: () => void) => {
        const t = start(update);
        t.ready.then(() => requestAnimationFrame(() => {
          for (const a of document.getAnimations()) {
            const e = a.effect as KeyframeEffect;
            if (e.pseudoElement?.includes("group(poster-")) w.frames0.push({ pe: e.pseudoElement, props: Object.keys(e.getKeyframes()[0]!).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)) });
          }
        }));
        return t;
      }) as typeof document.startViewTransition;
    });
    await page.locator('[data-testid^="film.card."]').first().click();
    await expect(page).toHaveURL(/\/film\//);
    await page.waitForTimeout(400);
    const frames = await page.evaluate(() => (window as unknown as { frames0: { pe: string; props: string[] }[] }).frames0);
    expect(frames.length).toBe(1);
    expect(frames[0]!.props).toEqual(["transform"]);
    expect((await animationNames(page, '[data-testid="film.poster"], [class*="hero"] [class*="poster"]')).every((name) => name === "none")).toBe(true);
  });
});

test.describe("F3: taps answer before the list redraws", () => {
  test("the Cinemas heart fills at once and the cinema is kept just after", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    const heart = page.getByTestId("cinema.keep").first();
    // Pressed in the same task as the tap: read before the browser gets a frame to save it.
    const pressedAtOnce = await heart.evaluate((el) => (el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })), new Promise<string | null>((done) => queueMicrotask(() => done(el.getAttribute("aria-pressed"))))));
    expect(pressedAtOnce).toBe("true");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ls.cinemas") ?? "[]").length)).toBe(1);
    await expect(page.getByTestId("toast")).toBeVisible();
  });

  test("Today/Tomorrow: the thumb moves at once, the list follows", async ({ page }) => {
    await page.goto("/lagos");
    const day = page.getByTestId("films.day");
    // Read in the same task as the tap, as for the heart: the thumb has moved before any list work.
    const atOnce = await day.evaluate((el) => {
      el.querySelectorAll<HTMLElement>("[role=radio]")[1]!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      return new Promise<string>((done) => queueMicrotask(() => done(getComputedStyle(el).getPropertyValue("--i").trim())));
    });
    expect(atOnce).toBe("1");
    await expect(day.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("unit 8: what's added", () => {
  test("N1: saving makes the Your cinemas count pop in; arriving with one doesn't", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    await page.getByTestId("cinema.keep").first().click();
    const count = page.getByTestId("nav.count");
    await expect(count).toHaveText("1");
    await expect.poll(() => count.evaluate((el) => el.getAnimations().some((a) => a.id === "bump"))).toBe(true);
    await page.goto("/lagos/soon");
    await expect(page.getByTestId("nav.count")).toHaveText("1");
    expect(await page.getByTestId("nav.count").evaluate((el) => el.getAnimations().some((a) => a.id === "bump"))).toBe(false);
  });

  test("N2: when a link is copied, the ✓ swaps in", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
      Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.resolve() } });
    });
    await page.goto("/lagos/cinema/filmhouse-lekki-imax");
    await page.getByTestId("cinema.share").click();
    await expect.poll(() => page.getByTestId("cinema.share").locator("svg").evaluate((el) => getComputedStyle(el).animationName)).toContain("swapIn");
  });

  test("N3: a cinema ticked in the list pops its tick; ticks there when it opened don't", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("ls.cinemas", JSON.stringify(["grand-lekki"])));
    await page.goto("/lagos/yours");
    await page.getByTestId("yours.add").click();
    const sheet = page.getByTestId("yours.pick");
    await expect(sheet).toBeVisible();
    const tick = (id: string) => sheet.getByTestId(`pick.${id}`).locator('span[class*="_check"]');
    expect(await tick("grand-lekki").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    await sheet.getByTestId("pick.ebonylife-vi").click();
    await expect(sheet.getByTestId("pick.ebonylife-vi")).toHaveAttribute("aria-pressed", "true");
    expect(await tick("ebonylife-vi").evaluate((el) => getComputedStyle(el).animationName)).toContain("checkIn");
  });
});

test("F3: after Undo the row's heart is empty again", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  const heart = page.getByTestId("cinema.keep").first();
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("toast").getByRole("button", { name: "Undo" }).click();
  await expect(heart).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("ls.cinemas"))).toBe("[]");
});
