import { readFileSync } from "node:fs";
import { expect, test } from "./test";

// About and 404 as Figma draws them (Figma 208:9122 About, 208:9467 404; build unit 11).

type Registry = { sources: { id: string; name: string; status: string; cinemaIds?: string[]; permission?: { askedAt?: string | null; repliedAt?: string | null } }[] };
const registry = JSON.parse(readFileSync("data/sources.json", "utf8")) as Registry;

test("About: how it works, every source with cinemas and its real status, TMDB, and takedown (Figma)", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Sinima");
  await expect(page.getByRole("heading", { level: 3 })).toHaveText(["We read each sinima's public listings", "Old times say so", "You book on the sinima's own site"]);

  const listed = registry.sources.filter((s) => s.status !== "do-not-use" && (s.cinemaIds?.length ?? 0) > 0).sort((a, b) => b.cinemaIds!.length - a.cinemaIds!.length);
  const rows = page.getByTestId("about.sources").locator("tbody tr");
  await expect(rows).toHaveCount(listed.length);
  // Lagocine said yes on 11 Nov, so it is no longer "asked"; on the sample build it isn't in use (D-132).
  await expect(rows.first()).toHaveText(new RegExp(`^Lagocine\\s*${listed[0]!.cinemaIds!.length}\\s*Not used yet$`));
  // Each source is credited with a link to its own site, in a new tab (D-132).
  const lagocine = page.getByTestId("about.source.lagocine").getByRole("link", { name: "Lagocine" });
  await expect(lagocine).toHaveAttribute("href", "https://lagocine.com/");
  await expect(lagocine).toHaveAttribute("target", "_blank");
  // How each city is read, counted from the times the site is built on (D-122): the sample build
  // reads Lagos through Lagocine's saved page and Abuja through Silverbird's two saved Veezi pages.
  await expect(page.getByTestId("about.reading.lagos")).toHaveText(/^In Lagos, \d+ sinimas are read through Lagocine\. \d+ (has|have) no times online yet\.$/);
  await expect(page.getByTestId("about.reading.abuja")).toHaveText("In Abuja, 2 sinimas are read from their own sites. 3 have no times online yet.");
  await expect(page.getByTestId("about.source.filmhouse")).toContainText("Permission asked 11 Nov");
  // The site runs on saved samples, so no source is in use yet.
  await expect(page.getByTestId("about.sources")).not.toContainText("In use");
  await expect(page.getByTestId("about.source.genesis")).toContainText("Not used yet");

  await expect(page.getByTestId("about.tmdb")).toContainText("This product uses the TMDB API but is not endorsed or certified by TMDB.");
  await expect(page.getByTestId("about.removal")).toHaveAttribute("href", "https://github.com/ChimeXXD/sinima/issues");
  await expect(page.getByTestId("about.code")).toHaveAttribute("href", "https://github.com/ChimeXXD/sinima");
  await expect(page.getByTestId("footer.stickers")).toContainText("Fluent Emoji");
  await expect(page.getByTestId("footer.about")).toHaveCount(0);
});

test("every other page's footer leads to About", async ({ page }) => {
  for (const path of ["/lagos", "/lagos/cinemas", "/lagos/soon", "/lagos/yours", "/lagos/cinema/ebonylife-vi"]) {
    await page.goto(path);
    await expect(page.getByTestId("footer.about")).toHaveAttribute("href", "/about");
  }
});

test("an address the site doesn't have: the torn ticket, Figma's words and the way to Films (Figma 404)", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response!.status()).toBe(404);
  const notFound = page.getByTestId("notfound");
  await expect(notFound.locator("h1")).toHaveText("We can't find that page");
  await expect(notFound).toContainText("this one's not showing");
  await expect(notFound).toContainText("The link may be old, or the film has left the sinimas. Everything showing now is on Films.");
  await expect(page.getByTestId("notfound.home")).toHaveText("See what's on in Lagos");
  await page.getByTestId("notfound.home").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Lagos");
});

for (const width of [390, 360, 320]) {
  test(`at ${width} px About and 404 don't scroll sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/about", "/no-such-page"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), path).toBe(true);
    }
  });
}
