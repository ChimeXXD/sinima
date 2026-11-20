import type { Page } from "@playwright/test";
import { expect, test } from "./test";

// The Figma tokens (D-82) as the browser actually renders them. Dark is a stand-in until it is designed.
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
/** Every theme-color tag on the page (Next can repeat the tag once the page runs), so none disagrees. */
const barColours = (page: Page) => page.locator('meta[name="theme-color"]').evaluateAll((tags) => [...new Set(tags.map((t) => t.getAttribute("content")))]);

for (const [scheme, bg, text] of [
  ["light", "#ffffff", "#18181b"],
  ["dark", "#000000", "#fafafa"],
] as const) {
  test(`the page uses the ${scheme} palette`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("ls.theme", t), scheme);
    await page.goto("/lagos");
    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", rgb(bg));
    await expect(body).toHaveCSS("color", rgb(text));
    // The browser bar matches the page.
    await expect.poll(() => barColours(page)).toEqual([bg]);
  });
}

test("the two fonts load from our own site and stay inside 40 KB together", async ({ page }) => {
  const fonts: { url: string; bytes: number }[] = [];
  page.on("response", async (res) => {
    if (res.url().endsWith(".woff2")) fonts.push({ url: res.url(), bytes: (await res.body()).length });
  });
  await page.goto("/lagos");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 28px "Urbanist"'))).toBe(true);
  // Story Script loads only on a page with a handwritten note, so the list is a subset of our two files.
  const paths = fonts.map((f) => new URL(f.url));
  expect(paths.every((u) => u.origin === new URL(page.url()).origin)).toBe(true);
  expect(paths.map((u) => u.pathname)).toContain("/fonts/urbanist-sinima.woff2");
  expect(paths.map((u) => u.pathname).filter((p) => !["/fonts/urbanist-sinima.woff2", "/fonts/story-script-sinima.woff2"].includes(p))).toEqual([]);
  expect(fonts.reduce((sum, f) => sum + f.bytes, 0)).toBeLessThanOrEqual(40 * 1024);
});

for (const width of [390, 360, 320]) {
  test(`nothing scrolls sideways at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/lagos");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

// D-58: a switch in the header, on a phone and on a computer, changes the theme and is
// remembered on this device. The choice is applied before the page is drawn, so there is no flash.
for (const [name, viewport] of [["phone", { width: 390, height: 844 }], ["computer", { width: 1440, height: 900 }]] as const) {
  test(`on a ${name}, the header switch turns light into dark and back, and the choice is remembered`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/lagos/cinemas");
    const body = page.locator("body");
    const toggle = page.getByTestId("theme.toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAccessibleName("Switch to dark mode");
    await toggle.click();
    await expect(body).toHaveCSS("background-color", rgb("#000000"));
    await expect(toggle).toHaveAccessibleName("Switch to light mode");
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#000000");

    await page.goto("/lagos/soon"); // another page, a full load: still dark, from the first paint
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    await expect(body).toHaveCSS("background-color", rgb("#000000"));
    await page.getByTestId("theme.toggle").click();
    await expect(body).toHaveCSS("background-color", rgb("#ffffff"));
  });
}

// D-143 (supersedes D-58's "follows the phone"): with no choice made the page is light, even on a
// phone set to dark; dark comes only from the switch.
for (const name of ["phone", "computer"] as const) {
  test(`with no choice made, the page is light on a ${name} set to dark`, async ({ page }) => {
    if (name === "computer") await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/lagos");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
    await expect(page.locator("body")).toHaveCSS("background-color", rgb("#ffffff"));
    await expect(page.locator("body")).toHaveCSS("color", rgb("#18181b"));
    await expect.poll(() => barColours(page)).toEqual(["#ffffff"]);
    await expect(page.getByTestId("theme.toggle")).toHaveAccessibleName("Switch to dark mode");
    // The pull still turns it dark, and the choice is kept.
    await page.getByTestId("theme.toggle").click();
    await expect(page.locator("body")).toHaveCSS("background-color", rgb("#000000"));
    await page.reload();
    await expect(page.locator("body")).toHaveCSS("background-color", rgb("#000000"));
  });
}

// D-107 (supersedes D-60): the switch is a pull cord (D-106 i). Pulled, the new theme opens as a
// circle from its bulb: a view transition. With reduced motion the page changes at once, no transition.
for (const reduced of [false, true]) {
  test(`pulling the cord switches the theme ${reduced ? "at once (reduced motion)" : "through a view transition from the bulb"}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto("/lagos");
    await page.evaluate(() => {
      const w = window as unknown as { transitions: number };
      w.transitions = 0;
      const start = document.startViewTransition?.bind(document);
      if (start) document.startViewTransition = ((update: ViewTransitionUpdateCallback) => (w.transitions++, start(update))) as typeof document.startViewTransition;
    });
    await page.getByTestId("theme.toggle").click(); // a tap pulls it
    await expect(page.locator("body")).toHaveCSS("background-color", rgb("#000000"));
    expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(reduced ? 0 : 1);
  });
}

test("dragging the bead down past its click switches the theme too", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "mouse drag");
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lagos");
  await page.getByTestId("theme.toggle").hover(); // a pointer arriving loads the cord's physics
  await expect(page.getByTestId("theme.toggle")).toHaveAttribute("data-ready", "");
  const bead = (await page.getByTestId("theme.toggle").boundingBox())!;
  await page.mouse.move(bead.x + bead.width / 2, bead.y + bead.height / 2);
  await page.mouse.down();
  await page.mouse.move(bead.x + bead.width / 2, bead.y + bead.height / 2 + 50, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator("body")).toHaveCSS("background-color", rgb("#000000"));
});

test("Enter on the cord switches the theme at once: no pull, no light (no motion on keyboard actions)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/lagos");
  await page.evaluate(() => {
    const w = window as unknown as { transitions: number };
    w.transitions = 0;
    const start = document.startViewTransition?.bind(document);
    if (start) document.startViewTransition = ((update: ViewTransitionUpdateCallback) => (w.transitions++, start(update))) as typeof document.startViewTransition;
  });
  await page.getByTestId("theme.toggle").focus();
  // Press and read in the same task: right after, the page is already dark and nothing fades its
  // colours across (theme-cut), so the page is never half in one theme and half in the other.
  const after = await page.evaluate(async () => {
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    (document.activeElement as HTMLElement).click(); // what Enter does on a button: a click with no pointer (detail 0)
    return {
      background: getComputedStyle(document.body).backgroundColor,
      colours: document.getAnimations().filter((a) => /color/.test((a as CSSTransition).transitionProperty ?? "")).length,
    };
  });
  expect(after.background).toBe(rgb("#000000"));
  expect(after.colours).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(0);
});

test("a screen reader's activation (a click with no press before it) switches the theme too", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/lagos");
  await page.getByTestId("theme.toggle").hover(); // the physics are there, as they would be after a visit's first touch
  await expect(page.getByTestId("theme.toggle")).toHaveAttribute("data-ready", "");
  await page.getByTestId("theme.toggle").dispatchEvent("click", { detail: 1 });
  await expect(page.locator("body")).toHaveCSS("background-color", rgb("#000000"));
  // On the next page the physics are already loaded: Enter still switches.
  await page.getByTestId("tab.cinemas").click();
  await expect(page).toHaveURL(/\/lagos\/cinemas$/);
  await page.getByTestId("theme.toggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("body")).toHaveCSS("background-color", rgb("#ffffff"));
});

test.describe("on a phone, with no pointer to hover first", () => {
  test.use({ realClock: true }); // the physics load when the page is idle: a fake clock holds that back

  test("the first touch drag on the cord pulls it and switches the theme", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "touch drag through the DevTools protocol");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/lagos");
    // No hover, no focus: a phone's first touch must find the cord alive (Chime, 20 Nov 2026: "the cord is not moving").
    await expect(page.getByTestId("theme.toggle")).toHaveAttribute("data-ready", "", { timeout: 5000 });
    const bead = (await page.getByTestId("theme.toggle").boundingBox())!;
    const x = bead.x + bead.width / 2;
    const y = bead.y + bead.height / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + i * 6 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator("body")).toHaveCSS("background-color", rgb("#000000"));
  });
});
