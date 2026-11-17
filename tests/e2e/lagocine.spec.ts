import { expect, test } from "./test";
import { dataFile } from "./helpers";

// Lagocine's one condition for using its showtimes (Paul Sergent, 11 Nov 2026): "a clear link on
// every page that says « If you want to see all showtimes in Lagos, it's on Lagocine »" (D-129).

test("every page links to Lagocine with its owner's own words, in a new tab", async ({ page, request }) => {
  const lagos = await dataFile(request, "lagos");
  const film = lagos.films[0]!.id;
  const cinema = lagos.cinemas[0]!.id;
  const area = lagos.cinemas[0]!.area;
  const pages = ["/lagos", "/lagos/cinemas", "/lagos/soon", "/lagos/yours", `/lagos/film/${film}`, `/lagos/cinema/${cinema}`, `/lagos/area/${area}`, "/abuja", "/abuja/cinemas", "/about"];
  for (const path of pages) {
    await page.goto(path);
    const link = page.getByTestId("footer.lagocine");
    await expect(link, path).toHaveText("If you want to see all showtimes in Lagos, it's on Lagocine");
    await expect(link, path).toHaveAttribute("href", "https://lagocine.com/");
    await expect(link, path).toHaveAttribute("target", "_blank");
    await expect(link, path).toHaveAttribute("rel", "noopener");
  }
});
