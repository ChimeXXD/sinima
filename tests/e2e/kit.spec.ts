import { expect, test, type Locator } from "./test";

// The shared components (build unit 2, D-82) on /kit, held to the Figma Design System page's sizes
// and to the rules that protect correctness. The kit runs on a fixed example clock (17:30).

const box = async (locator: Locator) => (await locator.boundingBox())!;
const near = (actual: number, figma: number) => expect(Math.abs(actual - figma), `${actual} vs Figma ${figma}`).toBeLessThanOrEqual(1);

test.beforeEach(async ({ page }) => {
  await page.goto("/kit");
  await expect(page.getByTestId("kit.status").getByTestId("countdown-pill")).toBeVisible(); // the page is running
});

test("relative words are never in the static HTML (rule 3)", async ({ request }) => {
  const html = await (await request.get("/kit")).text();
  expect(html).not.toMatch(/Starts in|Starting now|Started \d|Started just|\bago\b|in \d+ min/);
  // Nor a Book link: until the page knows the time it cannot know a showing has not started (D-05).
  expect(html).not.toContain('data-testid="time-pill.book"');
});

test("actions are Figma's sizes (7.1 to 7.4)", async ({ page }) => {
  near((await box(page.getByTestId("kit.button.primary"))).height, 49);
  near((await box(page.getByTestId("kit.button.secondary"))).height, 47);
  const icon = await box(page.getByTestId("kit.iconbutton"));
  near(icon.width, 40);
  near(icon.height, 40);
  near((await box(page.getByTestId("kit.chip"))).height, 40);
  near((await box(page.getByTestId("kit.segmented"))).height, 46);
  near((await box(page.getByTestId("kit.search"))).height, 48);
});

test("a disabled booking button cannot be followed", async ({ page }) => {
  const disabled = page.getByTestId("kit.button.disabled");
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  await expect(disabled).not.toHaveAttribute("href", /.+/);
  await expect(page.getByTestId("kit.button.primary")).toHaveAttribute("target", "_blank");
});

test("the chip toggles and the segmented control follows the arrow keys", async ({ page }) => {
  const chip = page.getByTestId("kit.chip");
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "false");

  const today = page.getByRole("radio", { name: "Today" });
  const tomorrow = page.getByRole("radio", { name: "Tomorrow" });
  await today.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tomorrow).toHaveAttribute("aria-checked", "true");
  await expect(tomorrow).toBeFocused();
  await expect(today).toHaveAttribute("tabindex", "-1");
});

test("the phone tab bar floats 24 px from the bottom, centred, with the count sticker (9.1)", async ({ page }) => {
  const nav = await box(page.getByTestId("nav"));
  near(844 - (nav.y + nav.height), 24);
  near(nav.x + nav.width / 2, 195);
  near((await box(page.getByTestId("tab.films"))).height, 52);
  const cinemas = await box(page.getByTestId("tab.cinemas"));
  near(cinemas.width, 50);
  near(cinemas.height, 50);
  await expect(page.getByTestId("nav.count")).toHaveText("4");
  // Icon-only tabs keep their names for screen readers.
  await expect(page.getByRole("link", { name: "Starting soon" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Your cinemas, 4 saved" })).toBeVisible();
});

test("on desktop every tab is labelled in a 52 px pill that hugs its tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const nav = await box(page.getByTestId("nav"));
  near(nav.height, 52);
  expect(nav.width).toBeLessThan(600);
  await expect(page.getByTestId("tab.cinemas")).toContainText("Cinemas");
});

test("a started showing has no booking link; one still to start books on the cinema's site (D-05)", async ({ page }) => {
  const upcoming = page.getByTestId("kit.showing.upcoming");
  await expect(upcoming.getByTestId("countdown-badge")).toHaveText(/Starts in\s*10 min/);
  await expect(upcoming.getByTestId("time-pill.book")).toHaveAttribute("href", "https://filmhouseng.com");

  const started = page.getByTestId("kit.showing.started");
  await expect(started.getByTestId("countdown-badge")).toHaveText(/Started\s*3 min ago/);
  await expect(started.getByTestId("time-pill")).toContainText("No booking");
  await expect(started.locator("a")).toHaveCount(0);
});

test("showing cards in a row are one height", async ({ page }) => {
  const a = await box(page.getByTestId("kit.showing.upcoming"));
  const b = await box(page.getByTestId("kit.showing.started"));
  near(a.height, b.height);
});

test("time chips: soonest counts down, a started one is struck through and not a button (11.3b)", async ({ page }) => {
  const chips = page.getByTestId("kit.timechips").getByTestId("time-chip");
  await expect(chips.nth(1)).toContainText("in 30 min");
  await expect(chips.nth(1)).toHaveAccessibleName("6:00 PM, IMAX, starts in 30 minutes");
  await expect(chips.nth(2)).toContainText("Started 5 min ago");
  expect(await chips.nth(2).evaluate((el) => el.tagName)).toBe("SPAN");
  near((await box(chips.nth(0))).height, 44);
});

test("the sheet floats 8 px in on a phone and closes with Escape and the close button", async ({ page }) => {
  await page.getByTestId("kit.sheet.open").click();
  const sheet = page.getByTestId("kit.sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAccessibleName("5:40 PM · EbonyLife Cinemas");
  await page.waitForTimeout(500); // the rise ends at 450 ms
  const b = await box(sheet);
  near(b.x, 8);
  near(390 - (b.x + b.width), 8);
  near(844 - (b.y + b.height), 8);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await page.getByTestId("kit.sheet.open").click();
  await page.getByTestId("kit.sheet.close").click();
  await expect(sheet).toBeHidden();
});

test("on desktop the sheet is a centred dialog, 440 wide", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByTestId("kit.sheet.open").click();
  await page.waitForTimeout(300);
  const b = await box(page.getByTestId("kit.sheet"));
  near(b.width, 440);
  near(b.x + b.width / 2, 720);
});

test("every logo fits inside its sticker tile, square and tall logos included (13.3)", async ({ page }) => {
  for (const sticker of await page.getByTestId("kit.stickers").getByTestId("logo-sticker").all()) {
    const tile = await box(sticker);
    const img = await box(sticker.locator("img"));
    expect(img.x).toBeGreaterThanOrEqual(tile.x - 1);
    expect(img.y).toBeGreaterThanOrEqual(tile.y - 1);
    expect(img.x + img.width).toBeLessThanOrEqual(tile.x + tile.width + 1);
    expect(img.y + img.height).toBeLessThanOrEqual(tile.y + tile.height + 1);
  }
});

test("worst-case data stays inside its card and the page never scrolls sideways", async ({ page }) => {
  for (const width of [360, 390, 834, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `at ${width}`).toBeLessThanOrEqual(width);
    for (const id of ["kit.worst.film", "kit.worst.showing", "kit.worst.folder"]) {
      const card = await box(page.getByTestId(id));
      const overflow = await page.getByTestId(id).evaluate((el) => [...el.querySelectorAll("*")].some((child) => child.scrollWidth > child.clientWidth + 1 && getComputedStyle(child).overflow === "visible"));
      expect(card.width, `${id} at ${width}`).toBeGreaterThan(0);
      expect(overflow, `${id} at ${width}`).toBe(false);
    }
  }
  // A started showing with no booking page still says so, and a chain with no logo shows no sticker.
  await expect(page.getByTestId("kit.worst.showing").getByTestId("time-pill")).toContainText("No booking");
  await expect(page.getByTestId("kit.worst.folder").getByTestId("logo-sticker")).toHaveCount(0);
});

test("on a 360 px phone the tab bar fits whichever tab is open (Figma: 336 at most)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const nav = page.getByTestId("nav");
  for (const id of ["films", "cinemas", "soon", "yours"]) {
    // Make each tab the open one in turn, as its own page would.
    await nav.evaluate((el, open) => el.querySelectorAll("a").forEach((a) => (a.dataset.testid === `tab.${open}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"))), id);
    const bar = await box(nav);
    const last = await box(page.getByTestId("tab.yours"));
    expect(bar.width, id).toBeLessThanOrEqual(336);
    expect(last.x + last.width, id).toBeLessThanOrEqual(bar.x + bar.width - 6);
  }
});

// Figma's bar has about 1 px to spare at 360 with "Starting soon" open. Text drawn a little wider
// (GitHub's Linux runner drew it 8 px wider; a phone's larger text does the same) must not push the
// last tab out of the bar: the open tab's name gives way instead.
test("on a 360 px phone the tab bar still holds every tab when the open tab's name is drawn wider", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addStyleTag({ content: "[data-testid='nav'] [data-label] { letter-spacing: 1px; }" });
  const nav = page.getByTestId("nav");
  for (const id of ["films", "cinemas", "soon", "yours"]) {
    await nav.evaluate((el, open) => el.querySelectorAll("a").forEach((a) => (a.dataset.testid === `tab.${open}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"))), id);
    const bar = await box(nav);
    const last = await box(page.getByTestId("tab.yours"));
    const open = await box(page.getByTestId(`tab.${id}`));
    expect(bar.width, id).toBeLessThanOrEqual(336);
    expect(last.x + last.width, id).toBeLessThanOrEqual(bar.x + bar.width - 6);
    expect(open.width, `${id}: the open tab still shows part of its name`).toBeGreaterThan(80);
  }
});

test("each segment of the day switch has a 44 px touch area", async ({ page }) => {
  const segment = page.getByRole("radio", { name: "Tomorrow" });
  const area = await segment.evaluate((el) => {
    const after = getComputedStyle(el, "::after");
    return el.getBoundingClientRect().height - parseFloat(after.top) - parseFloat(after.bottom);
  });
  expect(area).toBeGreaterThanOrEqual(44);
});

test("after midnight a time says its day in small type, and keeps the pill and chip shapes", async ({ page }) => {
  const chip = page.getByTestId("kit.timechips").getByTestId("time-chip").nth(3);
  await expect(chip).toHaveText(/12:30\sAM\s*Sat\s*IMAX/);
  await expect(chip).toHaveAccessibleName("12:30 AM on Saturday, IMAX, starts in 7 hours");
  near((await box(chip)).height, 44);
  const pill = page.getByTestId("kit.latepill").getByTestId("time-pill");
  await expect(pill.getByTestId("late-day")).toHaveText("Sat");
  near((await box(pill)).height, 46);
  // The time keeps Figma's Time style; the day is the smaller caption.
  expect(await pill.getByTestId("late-day").evaluate((el) => getComputedStyle(el).fontSize)).toBe("12px");
});
