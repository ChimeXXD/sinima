import { expect, test } from "@playwright/test";
import { dataFile, freeze, sampleTime } from "./helpers";

// The old logo rows (D-56), still on an area's page until build unit 7 rebuilds it from Figma.
// The Cinemas tab itself is Figma's now: tests/e2e/cinemas-screen.spec.ts.

test("every logo loads and sits in the centre of its tile", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "10:00"));
  await page.goto("/area/lekki");
  const tiles = page.locator(".vlogo");
  expect(await tiles.count()).toBeGreaterThan(10);
  const off = await tiles.evaluateAll(async (els) => {
    const bad: string[] = [];
    for (const tile of els) {
      tile.scrollIntoView();
      const img = tile.querySelector("img")!;
      await img.decode().catch(() => bad.push(`${img.getAttribute("src")}: did not load`));
      const a = tile.getBoundingClientRect(), b = img.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) bad.push(`${img.getAttribute("src")}: ${dx.toFixed(1)}, ${dy.toFixed(1)}`);
    }
    return bad;
  });
  expect(off).toEqual([]);
});

test("where the times came from is said once, under the first list heading", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "18:00"));
  await page.goto("/area/lekki");
  await expect(page.getByTestId("fresh")).toHaveCount(1);
  await expect(page.getByTestId("group.area").getByTestId("fresh")).toHaveText("Sample data saved from Lagocine on 11 Nov");
});

for (const width of [390, 360, 320]) {
  test(`at ${width} px the filters are one row of three pickers, whole on screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/area/lekki");
    const pickers = page.locator('[data-testid^="pick."]');
    await expect(pickers).toHaveCount(3);
    const boxes = await pickers.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), left: r.left, right: r.right, height: r.height })));
    expect(new Set(boxes.map((b) => b.top)).size).toBe(1);
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(width);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByTestId("area.chip.all")).toBeHidden(); // the desktop chips are not on a phone
    // Each picker's words fit whole: no "All L…".
    const cut = await page.locator(".picker span").evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent));
    expect(cut).toEqual([]);
  });
}

test("the day picker opens a sheet; Tomorrow shows tomorrow and the picker says so", async ({ page, request }) => {
  await freeze(page, new Date((await dataFile(request, "all")).generatedAt)); // the data's first day, so tomorrow has times
  await page.goto("/area/lekki");
  await page.getByTestId("pick.day").click();
  const sheet = page.getByTestId("sheet.day");
  await expect(sheet).toBeVisible();
  await sheet.getByTestId("day.option.tomorrow").click();
  await expect(sheet).toBeHidden();
  await expect(page.getByTestId("pick.day")).toHaveText("Tomorrow");
  await expect(page.getByTestId("cinema.next").first()).toHaveText(/^First at /);
});
