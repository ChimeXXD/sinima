import { expect, test } from "@playwright/test";

// Chime's review, 12 Nov 2026 (D-55): Films comes first. A visitor has a film in mind, picks it, then
// sees every cinema showing it.
// D-61: a fourth tab, Your cinemas, holds the hearted cinemas.
test("the site opens on Films, and the tabs read Films, Cinemas, Starting soon, Your cinemas on every page", async ({ page }) => {
  await page.goto("/lagos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
  await expect(page.getByTestId("tab.films")).toHaveAttribute("aria-current", "page");
  for (const path of ["/lagos", "/lagos/cinemas", "/lagos/area/lekki", "/lagos/soon", "/lagos/yours", "/lagos/film/ramayana", "/lagos/cinema/ebonylife-vi"]) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("link")).toHaveText(["Films", "Cinemas", "Starting soon", "Your cinemas"]);
  }
  await page.getByTestId("tab.cinemas").click();
  await expect(page).toHaveURL(/\/cinemas$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cinemas in Lagos");
});

// D-91: the Cinemas tab keeps the saved area on its own page: that area's cinemas come first.
test("a saved area puts its cinemas first on the Cinemas tab", async ({ page }) => {
  await page.goto("/lagos/cinemas");
  await page.getByTestId("pick.area").click();
  await page.getByTestId("sheet.area.ikeja").click();
  await page.goto("/lagos");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
  await page.getByTestId("tab.cinemas").click();
  await expect(page).toHaveURL(/\/cinemas$/);
  await expect(page.getByTestId("group.area").getByRole("heading", { level: 2 })).toHaveText("In Ikeja");
});

// The phone's search (open over the page, matches, no match, Escape): tests/e2e/search.spec.ts. The
// old search box went with the old frame in build unit 10.

for (const width of [390, 360, 320]) {
  test(`at ${width} px every area chip is whole on screen, none cut off or covered`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/lagos/soon"); // the Cinemas tab uses pickers on a phone since D-56, and a film's page has no chips since D-88; Starting soon still has them
    // With no area kept: All Lagos and every area, in a row that scrolls sideways (Figma, build unit 9).
    const chips = page.locator('[data-testid^="area.chip."]');
    await expect(chips).toHaveCount(13); // All Lagos and 12 areas
    const cut = await chips.evaluateAll((els) =>
      els.filter((el) => {
        // The chips can sit low on a page; bring each into view first, or a point below the
        // window reads as "covered" (it did in CI, where the font sets a little wider).
        el.scrollIntoView({ block: "center" });
        const box = el.getBoundingClientRect();
        if (box.left < 0 || box.right > window.innerWidth) return true;
        // The middle of each edge (2 px in; the corners are rounded off) must be this chip, not
        // something drawn over it or a scrolling row's clipped edge.
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        return [[box.left + 2, y], [box.right - 2, y], [x, box.top + 2], [x, box.bottom - 2]].some(([px, py]) => !el.contains(document.elementFromPoint(px!, py!)));
      }).map((el) => el.getAttribute("data-testid")),
    );
    expect(cut).toEqual([]);
  });
}

for (const width of [360, 320]) {
  test(`at ${width} px each tab name stays on one line`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/lagos");
    // A wrapped name still fits in the 44 px tab, so count the lines of text, not the tab's height.
    const wrapped = await page.getByRole("navigation", { name: "Sections" }).getByRole("link").evaluateAll((els) =>
      els.filter((el) => {
        // The text only: a tab may also hold an icon, which is not a line of its name.
        const texts = [...el.querySelectorAll("*"), el].flatMap((node) => [...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent!.trim()));
        return texts.some((text) => {
          const range = document.createRange();
          range.selectNodeContents(text);
          return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size > 1;
        });
      }).map((el) => el.textContent),
    );
    expect(wrapped).toEqual([]);
  });
}
