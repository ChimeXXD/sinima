import { expect, test } from "@playwright/test";

// The Figma tokens (D-82) as the browser actually renders them. Dark is a stand-in until it is designed.
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

for (const [scheme, bg, text] of [
  ["light", "#ffffff", "#18181b"],
  ["dark", "#000000", "#fafafa"],
] as const) {
  test(`the page uses the ${scheme} palette`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/lagos");
    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", rgb(bg));
    await expect(body).toHaveCSS("color", rgb(text));
    // The browser bar matches the page.
    await expect(page.locator(`meta[name="theme-color"][media*="${scheme}"]`)).toHaveAttribute("content", bg);
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

// D-58: a switch in the header, on a phone and on a computer, overrides the phone's setting and is
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

test("with no choice made, the page follows the phone's setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/lagos");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  await expect(page.getByTestId("theme.toggle")).toHaveAccessibleName("Switch to light mode");
});

// D-60 (after Rune Icons): the page changes at once, with no view transition; only the icon moves.
// It shows the theme on screen: a sun in light, a moon in dark. The new one grows in from small,
// blurred and faded, as the old one goes the same way. With reduced motion the icons only fade.
for (const reduced of [false, true]) {
  test(`switching changes the page at once and ${reduced ? "fades the icon (reduced motion)" : "blurs and grows the new icon in"}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto("/lagos");
    const toggle = page.getByTestId("theme.toggle");
    await expect(toggle.locator(".sun")).toHaveCSS("opacity", "1");
    await expect(toggle.locator(".moon")).toHaveCSS("opacity", "0");
    await page.evaluate(() => {
      (window as unknown as { transitions: number }).transitions = 0;
      if (document.startViewTransition) document.startViewTransition = () => { (window as unknown as { transitions: number }).transitions++; throw new Error("no view transition"); };
    });
    // Tap and read in the same task, so a slow runner cannot let the 200 ms icon transition finish first.
    const after = await toggle.evaluate((el: HTMLElement) => {
      el.click();
      const transitions = (a: Animation) => (a as CSSTransition).transitionProperty ?? "";
      return {
        background: getComputedStyle(document.body).backgroundColor,
        moving: el.querySelector(".moon")!.getAnimations().map(transitions).sort(),
        // Nothing else fades its colours across, so the page is never half in one theme and half in the other.
        colours: document.getAnimations().filter((a) => /color/.test(transitions(a))).length,
      };
    });
    // Right after the tap: the page is already dark, and the moon is part-way in.
    expect(after.background).toBe(rgb("#000000"));
    expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(0);
    expect(after.moving).toEqual(reduced ? ["opacity"] : ["filter", "opacity", "transform"]);
    expect(after.colours).toBe(0);
    await expect(toggle.locator(".moon")).toHaveCSS("opacity", "1");
    await expect(toggle.locator(".sun")).toHaveCSS("opacity", "0");
  });
}
