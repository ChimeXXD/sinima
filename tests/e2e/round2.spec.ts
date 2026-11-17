import { expect, test, type Page } from "./test";

// D-109: Chime's review, round 2. On a computer the pickers and "Lagos ⌄" drop the Spring dropdown
// under their trigger (which stays visible), the chevron turns up, the highlight follows the
// pointer, and a pick rolls into the trigger. The toast is a lighter blue; the bulb sits in its shade.

const desktop = async (page: Page, path: string) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(path);
};
const rotation = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).rotate);
/** The highlight's box, inside the menu. */
const highlight = (page: Page, menu: string) => page.getByTestId(menu).locator("[data-hl]").evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { y: Math.round(r.top), h: Math.round(r.height), opacity: Number(getComputedStyle(el).opacity) };
});

test("the day menu: under the picker, chevron up, the highlight follows the pointer, a pick rolls in and closes it", async ({ page }) => {
  await desktop(page, "/lagos/cinemas");
  const picker = page.getByTestId("pick.day");
  const menu = page.getByTestId("sheet.day");
  await picker.click();
  await expect(menu).toHaveAttribute("data-state", "open");
  // The picker is still in view, above the menu: a click on it lands on it, not on a scrim.
  const at = (await picker.boundingBox())!;
  expect(await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.closest("[data-testid]")?.getAttribute("data-testid"), [at.x + at.width / 2, at.y + at.height / 2])).toBe("pick.day");
  await expect(picker).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => rotation(page, '[data-testid="pick.day"] span:has(> svg)')).toBe("180deg");

  // The highlight starts on the picked day and moves to the hovered one.
  const today = (await page.getByTestId("day.option.today").boundingBox())!;
  expect((await highlight(page, "sheet.day")).y).toBe(Math.round(today.y));
  await page.getByTestId("day.option.tomorrow").hover();
  const tomorrow = (await page.getByTestId("day.option.tomorrow").boundingBox())!;
  await expect.poll(async () => (await highlight(page, "sheet.day")).y).toBe(Math.round(tomorrow.y));

  await page.getByTestId("day.option.tomorrow").click();
  await expect(menu).toHaveAttribute("data-state", "closed");
  await expect(picker).toHaveAttribute("aria-expanded", "false");
  await expect(picker.locator("[data-roll]")).toHaveText("Tomorrow");
  await expect.poll(() => rotation(page, '[data-testid="pick.day"] span:has(> svg)')).toBe("none");
});

test("keys: Enter opens the menu at once, arrows move, Enter picks, Escape closes and gives focus back", async ({ page }) => {
  await desktop(page, "/lagos/cinemas");
  await page.getByTestId("pick.format").focus();
  await page.keyboard.press("Enter");
  const menu = page.getByTestId("sheet.format");
  await expect(menu).toHaveAttribute("data-state", "open"); // no motion on a key press
  await expect(menu).toBeFocused();
  expect(await rotation(page, '[data-testid="pick.format"] span:has(> svg)')).toBe("180deg"); // the chevron too, at once
  expect(await page.getByTestId("sheet.format").locator("[data-hl]").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid"); // the focus ring
  await page.keyboard.press("ArrowDown");
  const second = await menu.getByRole("option").nth(1).getAttribute("id");
  await expect(menu).toHaveAttribute("aria-activedescendant", second!);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("data-state", "closed");
  await expect(page.getByTestId("pick.format")).toBeFocused();

  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("data-state", "closed");
  await expect(page.getByTestId("pick.format")).not.toHaveAttribute("aria-label", "Format: Any");
  await expect(page.getByTestId("pick.format").locator("[data-roll]")).toHaveCount(0); // a key pick doesn't roll
});

test("a click outside closes the menu; a second click on the picker closes it too", async ({ page }) => {
  await desktop(page, "/lagos/cinemas");
  const menu = page.getByTestId("sheet.area");
  await page.getByTestId("pick.area").click();
  await expect(menu).toHaveAttribute("data-state", "open");
  await page.getByRole("heading", { level: 1 }).click({ position: { x: 4, y: 4 } });
  await expect(menu).toHaveAttribute("data-state", "closed");
  await page.getByTestId("pick.area").click();
  await expect(menu).toHaveAttribute("data-state", "open");
  await page.getByTestId("pick.area").click();
  await expect(menu).toHaveAttribute("data-state", "closed");
});

test("on a computer “Lagos ⌄” drops the city menu under the pill, which stays in view", async ({ page }) => {
  await desktop(page, "/lagos");
  const pill = page.getByTestId("search.city");
  await pill.click();
  const menu = page.getByTestId("city");
  await expect(menu).toHaveAttribute("data-state", "open");
  await expect.poll(() => pill.evaluate((el) => getComputedStyle(el).transform)).toBe("none"); // its press has settled
  const at = (await pill.boundingBox())!;
  const box = (await menu.boundingBox())!;
  expect(Math.round(box.y - (at.y + at.height))).toBe(8);
  await expect(pill).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("city.lagos")).toHaveAttribute("aria-selected", "true");
  // Each city's line counts its own cinemas and names its areas (D-120).
  await expect(page.getByTestId("city.lagos")).toContainText("22 cinemas in Lekki, Victoria Island, Ikeja and 9 more areas");
  await expect(page.getByTestId("city.abuja")).toContainText("5 cinemas in Central Business District, Jabi, Lugbe and 1 more area");
  await expect(menu).toContainText("To see both cities at once, search: results are grouped by city.");
  await page.getByTestId("city.abuja").click();
  await expect(page).toHaveURL(/\/abuja$/);
});

test("on a phone the pickers still open a sheet, and the chevron turns while it is open", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.day").click();
  await expect(page.getByTestId("sheet.day")).toBeVisible();
  await expect.poll(() => rotation(page, '[data-testid="pick.day"] span:has(> svg)')).toBe("180deg");
});

test("the toast is the lighter blue; an error tone is a deep red, not pure red", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await page.getByTestId("cinema.keep").first().click();
  const toast = page.getByTestId("toast");
  await expect(toast).toHaveAttribute("data-tone", "info");
  const colours = await page.evaluate(() => {
    const probe = document.createElement("div");
    document.body.append(probe);
    const read = (value: string) => ((probe.style.background = value), getComputedStyle(probe).backgroundColor);
    const out = { info: read("var(--toast-info)"), blue600: read("var(--p-blue-600)"), error: read("var(--toast-error)") };
    probe.remove();
    return out;
  });
  expect(await toast.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(colours.blue600);
  expect(colours.info).toBe(colours.blue600);
  expect(colours.error).not.toBe("rgb(255, 0, 0)");
});

test("the bulb is drawn before the shade, so the shade hides its top half", async ({ page }) => {
  await page.goto("/lagos");
  const order = await page.getByTestId("theme.toggle").locator("xpath=..").evaluate((cord) => [...cord.querySelectorAll("[data-lamp] > *")].map((el) => el.tagName + (el.hasAttribute("data-bulb") ? ".bulb" : "")));
  expect(order[0]).toBe("circle.bulb");
});

test("in dark mode the highlight stands apart from the menu", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await desktop(page, "/lagos/cinemas");
  await page.getByTestId("pick.day").click();
  const menu = page.getByTestId("sheet.day");
  await expect(menu).toHaveAttribute("data-state", "open");
  const [bg, hl] = await menu.evaluate((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el.querySelector("[data-hl]")!).backgroundColor]);
  expect(hl).not.toBe(bg);
});

// The test browser is a touch phone, where hovers are off; the stylesheets are checked for the token
// in tests/unit (no tint mixed by hand), and the menu's highlight here.
test("the menu highlight is the one lighter hover fill (D-110)", async ({ page }) => {
  await desktop(page, "/lagos/cinemas");
  const fills = await page.evaluate(() => {
    const probe = document.createElement("div");
    document.body.append(probe);
    const read = (value: string) => ((probe.style.background = ""), (probe.style.background = value), getComputedStyle(probe).backgroundColor);
    const out = { hover: read("var(--hover-fill)"), surface: read("var(--bg-surface)") };
    probe.remove();
    return out;
  });
  await page.getByTestId("pick.day").click();
  await expect(page.getByTestId("sheet.day")).toHaveAttribute("data-state", "open");
  expect(await page.getByTestId("sheet.day").locator("[data-hl]").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(fills.hover);
  expect(fills.hover).not.toBe(fills.surface);
});
