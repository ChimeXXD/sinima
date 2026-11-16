import { devices, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { sampleTime } from "./helpers";

// The motion pass, units 5 to 9 (D-103): the first visit, the countdowns, hover, search and tabs.
// As motion.spec: the animations the page starts are the contract; the feel is checked by eye.

/** CSS animations running in an element and inside it: keyframes name, delay, duration, play state. */
const animationsIn = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) =>
    els.flatMap((el) =>
      el.getAnimations({ subtree: true }).map((a) => {
        const css = a as CSSAnimation;
        const timing = a.effect!.getTiming();
        return { name: css.animationName ?? "", delay: Number(timing.delay), duration: Number(timing.duration), state: a.playState };
      }),
    ),
  );

/** The sticker pictures arrive late, as they do on a phone (low priority, after the page's script). */
const lateStickers = (page: Page) =>
  page.route("**/stickers/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });

const atLagos = (context: BrowserContext) => Promise.all([context.grantPermissions(["geolocation"]), context.setGeolocation({ latitude: 6.45, longitude: 3.47 })]);

test.describe("M5: Where are you watching? on a first visit", () => {
  test("the stickers press on in a shrinking wave once their pictures are in; the answer's check springs in and the note writes itself", async ({ page, context }) => {
    await atLagos(context);
    await lateStickers(page);
    await page.setViewportSize({ width: 1440, height: 900 }); // every sticker shows from an iPad up
    await page.goto("/");
    await expect(page.getByTestId("where.status")).toContainText("found you in Lagos!");
    await expect(page.locator("main img[data-ready]")).toHaveCount(5); // each pressed on as its picture came in
    const stickers = await page.locator("main img[alt='']").evaluateAll((imgs) =>
      imgs.map((img) => ({ ready: img.hasAttribute("data-ready"), delay: getComputedStyle(img).animationDelay, name: getComputedStyle(img).animationName })),
    );
    expect(stickers).toHaveLength(5);
    expect(stickers.every((s) => s.ready && /stick/.test(s.name))).toBe(true);
    expect(stickers.map((s) => s.delay)).toEqual(["0s", "0.04s", "0.07s", "0.09s", "0.1s"]);
    const answer = await animationsIn(page, '[data-testid="where.lagos"], [data-testid="where.status"]');
    expect(answer.map((a) => a.name)).toEqual(expect.arrayContaining([expect.stringMatching(/checkIn/), expect.stringMatching(/write/)]));
  });

  test("with reduced motion everything only fades, the stickers together", async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await atLagos(context);
    await lateStickers(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("where.status")).toContainText("found you in Lagos!");
    const delays = await page.locator("main img[alt='']").evaluateAll((imgs) => imgs.map((img) => getComputedStyle(img).animationDelay));
    expect(new Set(delays)).toEqual(new Set(["0s"]));
    const answer = await animationsIn(page, '[data-testid="where.lagos"], [data-testid="where.status"]');
    expect(answer.length).toBeGreaterThan(0);
    expect(answer.every((a) => /fade/.test(a.name) && a.duration === 160)).toBe(true);
  });
});

test("M5: a sticker whose picture is in before the page's script runs stays as it was (no second entrance)", async ({ page }) => {
  // The script comes late instead: every picture is in by the time the page takes over.
  await page.route("**/_next/static/chunks/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("main img[data-shown]")).toHaveCount(5);
  const stickers = await page.locator("main img[alt='']").evaluateAll((imgs) => imgs.map((img) => ({ name: getComputedStyle(img).animationName, opacity: getComputedStyle(img).opacity })));
  expect(stickers.every((s) => s.name === "none" && s.opacity === "1")).toBe(true);
});

test.describe("M5 without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the stickers simply show", async ({ page }) => {
    await page.goto("/");
    const clapper = page.locator("main img[alt='']").first();
    await expect(clapper).toBeVisible();
    expect(await clapper.evaluate((img) => getComputedStyle(img).opacity)).toBe("1");
  });
});

test.describe("M7: cards lift under a pointer", () => {
  // A computer: a fine pointer that hovers (Desktop Chrome without its browser type, which would need its own worker).
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, userAgent: devices["Desktop Chrome"].userAgent, deviceScaleFactor: 1 });

  test("a film card lifts its poster 4 px, a cinema's next-area card 2 px", async ({ page }) => {
    await page.goto("/lagos");
    const card = page.locator('[data-testid^="film.card."]').first();
    await card.hover();
    await expect.poll(() => card.locator("span").first().evaluate((el) => getComputedStyle(el).transform)).toBe("matrix(1, 0, 0, 1, 0, -4)");
    await page.mouse.down(); // pressed: the press wins, the poster settles
    await expect.poll(() => card.locator("span").first().evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    await page.mouse.up();
    await page.goto("/lagos/area/lekki");
    const next = page.locator('[data-testid^="next.card."]').first();
    await next.hover();
    await expect.poll(() => next.evaluate((el) => getComputedStyle(el).transform)).toBe("matrix(1, 0, 0, 1, 0, -2)");
    expect(await next.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0.16s");
  });
});

test("M7: on a touch screen (the phone project) nothing lifts", async ({ page }) => {
  await page.goto("/lagos");
  const card = page.locator('[data-testid^="film.card."]').first();
  await card.hover();
  expect(await card.locator("span").first().evaluate((el) => getComputedStyle(el).transitionProperty)).not.toContain("transform");
});

test.describe("M8: search results as you type", () => {
  /** The search hits with a running fade, and those without. */
  const hits = (page: Page) =>
    page.locator('[data-testid^="search.hit."]').evaluateAll((els) =>
      els.map((el) => ({ id: el.getAttribute("data-testid")!, fading: el.getAnimations().some((a) => /resultIn/.test((a as CSSAnimation).animationName)) })),
    );

  test("a film that joins the results fades in; the ones already there stay still", async ({ page }) => {
    await page.goto("/lagos");
    await page.getByTestId("search.field").click();
    await page.getByTestId("search.query").fill("the c");
    const narrow = await hits(page);
    expect(narrow.length).toBeGreaterThan(0);
    await page.waitForTimeout(400); // their own fade is over
    await page.getByTestId("search.query").fill("the");
    const wide = await hits(page);
    const before = new Set(narrow.map((hit) => hit.id));
    expect(wide.filter((hit) => before.has(hit.id)).every((hit) => !hit.fading)).toBe(true);
    const joined = wide.filter((hit) => !before.has(hit.id));
    expect(joined.length).toBeGreaterThan(0);
    expect(joined.every((hit) => hit.fading)).toBe(true);
  });

  test("with reduced motion nothing fades", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/lagos");
    await page.getByTestId("search.field").click();
    await page.getByTestId("search.query").fill("the");
    expect((await hits(page)).some((hit) => hit.fading)).toBe(false);
  });
});

test.describe("M9: moving between tabs", () => {
  /** The tab slide running on the page's content: its first keyframe. */
  const slide = (page: Page) =>
    page.locator("main").evaluate((main) =>
      main
        .getAnimations()
        .filter((a) => a.id === "tab")
        .map((a) => (a.effect as KeyframeEffect).getKeyframes()[0]!.transform),
    );

  test("a tapped tab's page slides in from its side: Cinemas from the right, back to Films from the left", async ({ page }) => {
    await page.goto("/lagos");
    expect(await slide(page)).toEqual([]); // not on a page load
    await page.getByTestId("tab.cinemas").click();
    await expect(page).toHaveURL(/\/lagos\/cinemas$/);
    expect(await slide(page)).toEqual(["translateX(12px)"]);
    await page.getByTestId("tab.films").click();
    await expect(page).toHaveURL(/\/lagos$/);
    expect(await slide(page)).toEqual(["translateX(-12px)"]);
  });

  test("a key press opens the tab without motion, and so does reduced motion", async ({ page }) => {
    await page.goto("/lagos");
    await page.getByTestId("tab.cinemas").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/lagos\/cinemas$/);
    expect(await slide(page)).toEqual([]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByTestId("tab.soon").click();
    await expect(page).toHaveURL(/\/lagos\/soon$/);
    expect(await slide(page)).toEqual([]);
  });
});

test.describe("M6: the countdowns move with the clock", () => {
  test("the number rolls up when it changes, never on the first draw; the ring glides to its new share", async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await page.clock.install({ time: await sampleTime(request, "17:30") });
    await page.clock.pauseAt(await sampleTime(request, "17:30"));
    await page.goto("/lagos/soon");
    const badge = page.getByTestId("countdown-badge").first();
    await expect(badge).toBeVisible();
    const rolling = () => badge.locator("b").evaluate((el) => el.getAnimations().some((a) => /roll/.test((a as CSSAnimation).animationName)));
    expect(await rolling()).toBe(false);
    await page.clock.runFor(60_000);
    expect(await rolling()).toBe(true);
    const ring = await badge.locator("span").first().evaluate((el) => getComputedStyle(el).transition);
    expect(ring).toContain("--share 1s linear");
  });

  test("with reduced motion the ring steps and the number only fades", async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("ls.area", "lekki"));
    await page.clock.install({ time: await sampleTime(request, "17:30") });
    await page.clock.pauseAt(await sampleTime(request, "17:30"));
    await page.goto("/lagos/soon");
    const badge = page.getByTestId("countdown-badge").first();
    await page.clock.runFor(60_000);
    const names = await badge.locator("b").evaluate((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /rollFade/.test(name))).toBe(true);
    expect(await badge.locator("span").first().evaluate((el) => getComputedStyle(el).transitionProperty)).not.toContain("--share");
  });
});

test.describe("D-106 g: every move between pages slides", () => {
  const slide = (page: Page) => page.locator("main").evaluate((main) => main.getAnimations().filter((a) => a.id === "tab").map((a) => (a as Animation & { effect: KeyframeEffect }).effect.getKeyframes()[0]!.transform));

  test("into a cinema from the right; back out (the back button, the browser's back) from the left", async ({ page }) => {
    await page.goto("/lagos/cinemas");
    await page.getByTestId("cinema.card.grand-lekki").getByTestId("cinema.name").click();
    await expect(page).toHaveURL(/\/lagos\/cinema\/grand-lekki$/);
    expect(await slide(page)).toEqual(["translateX(12px)"]);
    await page.getByTestId("cinema.back").click();
    await expect(page).toHaveURL(/\/lagos\/cinemas$/);
    expect(await slide(page)).toEqual(["translateX(-12px)"]);
    // The back button added a step; the browser's back walks the history: into the cinema, then out.
    await page.goBack();
    await expect(page).toHaveURL(/\/lagos\/cinema\/grand-lekki$/);
    expect(await slide(page)).toEqual(["translateX(12px)"]);
    await page.goBack();
    await expect(page).toHaveURL(/\/lagos\/cinemas$/);
    expect(await slide(page)).toEqual(["translateX(-12px)"]);
  });

  test("Films to a film's page is left to the poster travelling (no slide)", async ({ page }) => {
    await page.goto("/lagos");
    await page.locator('[data-testid^="film.card."] a').first().click();
    await expect(page).toHaveURL(/\/lagos\/film\//);
    expect(await slide(page)).toEqual([]);
  });
});
