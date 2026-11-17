import { expect, test } from "./test";
import { dataFile, freeze, sampleTime } from "./helpers";

// Trailers (D-117): a film whose TMDB entry lists a YouTube trailer has "Watch the trailer" on its
// page, opening YouTube in a new tab; a film with none has no button.

test("a film with a trailer links to it on YouTube, in a new tab; a film without has none", async ({ page, request }) => {
  const all = (await dataFile(request, "lagos")) as unknown as { films: { id: string; title: string; trailerKey?: string | null }[] };
  const withTrailer = all.films.find((film) => film.trailerKey);
  const without = all.films.find((film) => !film.trailerKey);
  expect(withTrailer && without).toBeTruthy();
  await freeze(page, await sampleTime(request, "12:00"));

  await page.goto(`/lagos/film/${withTrailer!.id}`);
  const trailer = page.getByTestId("film.trailer");
  await expect(trailer).toHaveAttribute("href", `https://www.youtube.com/watch?v=${withTrailer!.trailerKey}`);
  await expect(trailer).toHaveAttribute("target", "_blank");
  await expect(trailer).toHaveAttribute("rel", "noopener");
  await expect(trailer).toHaveAccessibleName(`Watch the trailer for ${withTrailer!.title} on YouTube`);
  await expect(trailer).toBeVisible();

  await page.goto(`/lagos/film/${without!.id}`);
  await expect(page.getByTestId("film.title")).toBeVisible();
  await expect(page.getByTestId("film.trailer")).toHaveCount(0);
});
