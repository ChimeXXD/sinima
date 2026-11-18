import { expect, test, type Page } from "./test";
import { dataFile, freeze, live, sampleTime, shownClock, today } from "./helpers";

// Your cinemas as Figma draws it (Figma 206:8570 Default, 206:8921 None saved, build unit 10): the
// cinemas saved on this phone as folders, soonest first; with none, the way to keep one (D-61).

const keep = (page: Page, ids: string[]) => page.addInitScript((list) => localStorage.setItem("ls.cinemas", JSON.stringify(list)), ids);
const folders = (page: Page) => page.getByTestId("yours.folders").locator('[data-testid^="saved.folder."]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.slice(13)));

test("saved cinemas as folders, soonest first, each with its count and next time (Figma Default)", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const now = await sampleTime(request, "17:30");
  const ids = ["filmhouse-lekki-imax", "ozone-yaba", "ebonylife-vi", "genesis-maryland"];
  await keep(page, ids);
  await freeze(page, now);
  await page.goto("/lagos/yours");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your sinimas");
  await expect(page.getByTestId("yours.count")).toHaveText("4 saved on this phone");
  await expect(page.getByTestId("banner.sample")).toBeVisible();
  const left = today(all, now);
  const next = (id: string) => left.find((s) => s.cinemaId === id)!;
  const order = [...ids].sort((a, b) => next(a).startsAt.localeCompare(next(b).startsAt));
  expect(await folders(page)).toEqual(order);

  for (const id of ids) {
    const cinema = all.cinemas.find((c) => c.id === id)!;
    const folder = page.getByTestId(`saved.folder.${id}`);
    const count = left.filter((s) => s.cinemaId === id).length;
    await expect(folder).toHaveAttribute("href", `/lagos/cinema/${id}`);
    await expect(folder).toContainText(cinema.name);
    await expect(folder).toContainText(`· next ${shownClock(next(id).startsAt)}`);
    await expect(folder).toContainText(`${count} tonight`);
    await expect(folder.getByTestId("logo-sticker")).toHaveCount(1);
  }
  // The + and the dashed card open the list to tick cinemas from (D-106 f).
  await expect(page.getByTestId("yours.add-card")).toContainText("Add your sinimas");
  await expect(page.getByTestId("yours.add")).toHaveAccessibleName("Add sinimas in Lagos");
  await page.getByTestId("yours.add").click();
  await expect(page.getByTestId("yours.pick")).toBeVisible();
  await expect(page.getByTestId("footer.note")).toHaveText("Saved on this phone only, soonest first. Nothing is sent anywhere, and there's no account.");
  await expect(page.getByTestId("tab.yours")).toHaveAttribute("aria-current", "page");
});

test("the heart on a cinema's page keeps it here, after a reload too, and letting go empties the tab", async ({ page, request }) => {
  await freeze(page, await sampleTime(request, "18:00"));
  await page.goto("/lagos/cinema/grand-lekki");
  await page.getByTestId("cinema.save").click();
  await page.getByTestId("tab.yours").click();
  await expect(page).toHaveURL(/\/yours$/);
  expect(await folders(page)).toEqual(["grand-lekki"]);
  await page.reload();
  expect(await folders(page)).toEqual(["grand-lekki"]);
  await page.getByTestId("saved.folder.grand-lekki").click();
  await page.getByTestId("cinema.save").click();
  await page.getByTestId("tab.yours").click();
  await expect(page.getByTestId("yours.empty")).toBeVisible();
});

// The real clock: the words don't depend on it, and a frozen one stalls the client-side move to /cinemas.
test("none saved: the words, and the list to pick cinemas from (Figma None saved, D-106 f)", async ({ page }) => {
  await page.goto("/lagos/yours");
  await expect(page.getByTestId("yours.count")).toHaveText("None saved yet");
  const empty = page.getByTestId("yours.empty");
  await expect(empty.locator("h2")).toHaveText("Keep your usual sinimas here");
  await expect(empty.locator("h2 + p")).toHaveText("Tick the ones you go to, or tap the heart on any sinima. Their next times show up here first, and the tab bar counts them.");
  await expect(empty.getByTestId("logo-sticker")).toHaveCount(3);
  await expect(empty).toContainText("Saved on this phone only. Nothing is sent anywhere.");
  await expect(page.getByTestId("yours.add")).toHaveCount(0);
  await expect(page.getByTestId("banner.sample")).toHaveCount(0);
  await page.getByTestId("yours.browse").click();
  await expect(page.getByTestId("yours.pick")).toBeVisible();
});

test("a saved cinema with nothing more today stays, and says so; one we can't read says that", async ({ page, request }) => {
  const all = await dataFile(request, "lagos");
  const unread = all.cinemas.find((c) => !all.showings.some((s) => s.cinemaId === c.id));
  await keep(page, ["grand-lekki", ...(unread ? [unread.id] : [])]);
  await freeze(page, await sampleTime(request, "23:58"));
  await page.goto("/lagos/yours");
  const grand = page.getByTestId("saved.folder.grand-lekki");
  await expect(grand).toContainText("Lekki · nothing more today");
  await expect(grand).not.toContainText("tonight");
  if (unread) await expect(page.getByTestId(`saved.folder.${unread.id}`)).toContainText("times not available yet");
});

test.describe("before the page knows the time", () => {
  test.use({ javaScriptEnabled: false });
  test("the page's own HTML lists no saved cinemas and no empty state: both live on the phone (rule 3)", async ({ page }) => {
    await page.goto("/lagos/yours");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your sinimas");
    await expect(page.getByTestId("yours.folders")).toHaveCount(0);
    await expect(page.getByTestId("yours.empty")).toHaveCount(0);
  });
});

test("folders are 165 wide: 2 to a row on a phone, then in one row with the add card below (iPad) or beside them (desktop)", async ({ page, request }) => {
  await keep(page, ["filmhouse-lekki-imax", "ozone-yaba", "ebonylife-vi", "genesis-maryland"]);
  await freeze(page, await sampleTime(request, "17:30"));
  for (const [width, perRow, cardWidth, addBeside] of [[390, 2, 358, false], [834, 4, 770, false], [1440, 4, 200, true]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/lagos/yours");
    const boxes = await page.locator('[data-testid^="saved.folder."]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) })));
    expect(boxes.every((b) => b.w === 165)).toBe(true);
    expect(new Set(boxes.map((b) => b.y)).size).toBe(4 / perRow);
    const add = (await page.getByTestId("yours.add-card").boundingBox())!;
    expect(Math.round(add.width)).toBe(cardWidth);
    expect(Math.round(add.y) === boxes[0]!.y).toBe(addBeside);
  }
});

for (const width of [390, 360, 320]) {
  test(`at ${width} px nothing scrolls sideways, and the + and the add card are at least 44 px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 800 });
    await keep(page, ["filmhouse-lekki-imax", "ozone-yaba", "ebonylife-vi", "genesis-maryland"]);
    await freeze(page, await sampleTime(request, "17:30"));
    await page.goto("/lagos/yours");
    await expect(page.getByTestId("yours.folders")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const id of ["yours.add", "yours.add-card"]) expect((await page.getByTestId(id).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
}

test("the list ticks cinemas on and off Your cinemas at once, grouped by area (D-106 f)", async ({ page }) => {
  await page.goto("/lagos/yours");
  await page.getByTestId("yours.browse").click();
  const sheet = page.getByTestId("yours.pick");
  await expect(sheet).toHaveAccessibleName("Add your sinimas");
  await expect(sheet.getByRole("heading", { name: "Lekki" })).toBeVisible();
  await sheet.getByTestId("pick.grand-lekki").click();
  await sheet.getByTestId("pick.ebonylife-vi").click();
  await expect(sheet.getByTestId("pick.grand-lekki")).toHaveAttribute("aria-pressed", "true");
  await sheet.getByTestId("pick.ebonylife-vi").click(); // and off again
  await expect(sheet.getByTestId("pick.ebonylife-vi")).toHaveAttribute("aria-pressed", "false");
  await sheet.getByTestId("yours.pick.done").click();
  await expect(sheet).toBeHidden();
  expect(await folders(page)).toEqual(["grand-lekki"]);
});

test("a heart on each row of the Cinemas tab keeps a cinema without opening it (D-106 f)", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  const row = page.getByTestId("cinema.card.grand-lekki");
  const heart = row.getByTestId("cinema.keep");
  await expect(heart).toHaveAccessibleName("Save Grand Cinemas Lekki to your sinimas");
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Saved to Your sinimas. Only on this phone.")).toBeVisible();
  await expect(page).toHaveURL(/\/lagos\/cinemas$/); // still here
  expect(await page.evaluate(() => localStorage.getItem("ls.cinemas"))).toBe(JSON.stringify(["grand-lekki"]));
  await row.getByTestId("cinema.name").click(); // the rest of the row still opens the cinema
  await expect(page).toHaveURL(/\/lagos\/cinema\/grand-lekki$/);
});

test("on a computer the list is a panel down the right edge, full height, sliding in from it (D-133)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await keep(page, ["ebonylife-vi"]); // with a cinema kept, the list opens from the + (Chime's recording)
  await page.goto("/lagos/yours");
  await live(page);
  await page.addStyleTag({ content: ":root { --dur-sheet: 10s; }" }); // slow, so its first frame can be read
  await page.getByTestId("yours.add").click();
  const sheet = page.getByTestId("yours.pick");
  await expect(sheet).toHaveAttribute("open", ""); // opened: its 10 s slide has begun
  // It comes in from the right edge: its first frame is one width and 8 off to the right, not lower or smaller.
  const from = await sheet.evaluate((el) => {
    const slide = el.getAnimations().find((a) => (a as CSSTransition).transitionProperty === "transform");
    if (!slide) return null;
    slide.pause();
    slide.currentTime = 0;
    const transform = getComputedStyle(el).transform;
    slide.finish();
    return transform;
  });
  expect(from).toBe("matrix(1, 0, 0, 1, 448, 0)");
  // Settled: 8 in from the top, right and bottom, 440 wide.
  await expect.poll(async () => JSON.stringify(await sheet.boundingBox())).toBe(JSON.stringify({ x: 1440 - 8 - 440, y: 8, width: 440, height: 900 - 16 }));
});
