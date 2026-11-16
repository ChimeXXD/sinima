import { expect, test, type BrowserContext } from "./test";

// Where are you watching? (Figma 162:215, 162:262, 162:302; D-65, build unit 12): a first visit is
// asked for its location as "/" opens, only to pick the city; elsewhere or no answer offers Lagos.

const at = (context: BrowserContext, latitude: number, longitude: number) => Promise.all([context.grantPermissions(["geolocation"]), context.setGeolocation({ latitude, longitude })]);

test("found in Abuja: Abuja is picked, and Continue keeps it and opens Abuja (Figma Found you in Abuja)", async ({ page, context }) => {
  await at(context, 9.0765, 7.4777); // Wuse
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where are you watching?");
  await expect(page.getByTestId("where.status")).toHaveText("found you in Abuja!");
  await expect(page.getByTestId("where.abuja")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("where.lagos")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("where.lagos")).toContainText("Lekki, Victoria Island, Ikeja, Surulere, Yaba and 7 more areas");
  await page.getByTestId("where.continue").click();
  await expect(page).toHaveURL(/\/abuja$/);
  expect(await page.evaluate(() => localStorage.getItem("ls.city"))).toBe("abuja");
  // The next visit to "/" opens Abuja at once.
  await page.goto("/");
  await expect(page).toHaveURL(/\/abuja$/);
});

test("found in Lagos: Continue with Lagos", async ({ page, context }) => {
  await at(context, 6.4474, 3.4553); // Lekki
  await page.goto("/");
  await expect(page.getByTestId("where.status")).toHaveText("found you in Lagos!");
  await expect(page.getByTestId("where.continue")).toHaveText("Continue with Lagos");
  await page.getByTestId("where.continue").click();
  await expect(page).toHaveURL(/\/lagos$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
});

test("elsewhere: Lagos is offered, and saying so (Figma Elsewhere or no answer → Lagos)", async ({ page, context }) => {
  await at(context, 51.5072, -0.1276); // London
  await page.goto("/");
  await expect(page.getByTestId("where.status")).toHaveText("We couldn't place you in Lagos or Abuja, so here's Lagos. Switch any time in the search bar.");
  await expect(page.getByTestId("where.lagos")).toHaveAttribute("aria-pressed", "true");
  // A tap picks by hand.
  await page.getByTestId("where.abuja").click();
  await expect(page.getByTestId("where.continue")).toHaveText("Continue with Abuja");
});

test("no answer (location not allowed) offers Lagos too", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("where.status")).toContainText("so here's Lagos");
  await expect(page.getByTestId("where.continue")).toHaveText("Continue with Lagos");
});

test.describe("before the page runs", () => {
  test.use({ javaScriptEnabled: false });
  test("the page's own HTML asks the question, with nothing picked yet", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where are you watching?");
    await expect(page.getByTestId("where.continue")).toHaveText("Continue");
    await expect(page.getByTestId("where.continue")).toHaveAttribute("aria-disabled", "true");
  });
});
