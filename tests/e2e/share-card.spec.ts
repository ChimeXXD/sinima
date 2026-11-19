import { expect, test, type APIRequestContext } from "./test";
import { dataFile } from "./helpers";

// A link to Sinima pasted in WhatsApp or X shows a card (D-145, D-149). Read from the built HTML,
// as their crawlers read it (no script runs): og:image is an absolute https://sinima.com.ng address,
// and the file it names is in the build, a 1200 × 630 PNG. A film's page names its own card; every
// other page the site's.

const SITE = "https://sinima.com.ng";

/** The `content` of each `<meta property|name="…">` in a page's HTML, by key. */
async function metaTags(request: APIRequestContext, path: string): Promise<Record<string, string>> {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  const tags: Record<string, string> = {};
  for (const [tag] of (await response.text()).matchAll(/<meta\b[^>]*>/g)) {
    const key = tag.match(/\b(?:property|name)="([^"]+)"/)?.[1];
    const content = tag.match(/\bcontent="([^"]*)"/)?.[1];
    if (key && content !== undefined && !(key in tags)) tags[key] = content.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
  }
  return tags;
}

/** The PNG at a site address in the build: its width and height, read from its IHDR header. */
async function pngSize(request: APIRequestContext, url: string): Promise<{ width: number; height: number }> {
  expect(url.startsWith(`${SITE}/`), url).toBe(true);
  const response = await request.get(url.slice(SITE.length));
  expect(response.status(), url).toBe(200);
  const bytes = await response.body();
  expect(bytes.subarray(0, 8).toString("hex"), `${url} is a PNG`).toBe("89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function expectCard(request: APIRequestContext, path: string, image: string, title: string) {
  const tags = await metaTags(request, path);
  expect(tags["og:image"], path).toBe(`${SITE}${image}`);
  expect(tags["og:image:width"]).toBe("1200");
  expect(tags["og:image:height"]).toBe("630");
  expect(tags["og:image:alt"]).toBeTruthy();
  expect(tags["og:title"]).toBe(title);
  expect(tags["og:description"]).toBeTruthy();
  expect(tags["twitter:card"]).toBe("summary_large_image");
  expect(await pngSize(request, tags["og:image"]!)).toEqual({ width: 1200, height: 630 });
}

test("a film's page points at its own card, in the build as a 1200 × 630 PNG", async ({ request }) => {
  const lagos = await dataFile(request, "lagos");
  const shown = new Set(lagos.showings.map((showing) => showing.filmId));
  const film = lagos.films.find((candidate) => shown.has(candidate.id))!;
  await expectCard(request, `/lagos/film/${film.id}`, `/og/lagos/${film.id}.png`, `${film.title}: showtimes in Lagos · Sinima`);
});

test("an Abuja film's page points at Abuja's card", async ({ request }) => {
  const abuja = await dataFile(request, "abuja");
  const shown = new Set(abuja.showings.map((showing) => showing.filmId));
  const film = abuja.films.find((candidate) => shown.has(candidate.id))!;
  await expectCard(request, `/abuja/film/${film.id}`, `/og/abuja/${film.id}.png`, `${film.title}: showtimes in Abuja · Sinima`);
});

test("the home page and a sinima's page point at the site's card", async ({ request }) => {
  await expectCard(request, "/", "/og/site.png", "Sinima: what's on in Lagos & Abuja");
  const lagos = await dataFile(request, "lagos");
  const cinema = lagos.cinemas[0]!;
  await expectCard(request, `/lagos/cinema/${cinema.id}`, "/og/site.png", `${cinema.name} · Sinima`);
  await expectCard(request, "/lagos", "/og/site.png", "What's on in Lagos · Sinima");
});
