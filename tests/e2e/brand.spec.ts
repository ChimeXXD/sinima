import { expect, test } from "./test";

// The Ticket S logo (D-42) in the header, the browser tab, the home screen and the manifest.
test("the header shows the Ticket S mark beside the name", async ({ page, request }) => {
  await page.goto("/lagos");
  const brand = page.getByTestId("wordmark");
  await expect(brand).toHaveText("Sinima");
  // Figma's lockup (D-82): the ticket face, then the wordmark (since D-112 a static svg painted
  // through a mask, so its paths aren't in every page's script).
  const mark = brand.locator("svg").first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute("aria-hidden", "true"); // the name beside it is the label
  // The ticket is one cut shape: the notches and tear-line dots are holes, not painted circles.
  await expect(mark.locator("path").first()).toHaveAttribute("fill-rule", "evenodd");
  const word = brand.locator("span[aria-hidden]").first();
  await expect(word).toBeVisible();
  expect(await word.evaluate((el) => getComputedStyle(el).maskImage)).toContain("/brand/wordmark.svg");
  expect((await request.get("/brand/wordmark.svg")).ok()).toBe(true);
});

test("the tab icon, home-screen icon and manifest icons all load", async ({ page, request }) => {
  await page.goto("/lagos");
  const hrefs = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((els) => els.map((e) => (e as HTMLLinkElement).href));
  expect(hrefs.some((h) => h.endsWith(".svg"))).toBe(true);
  expect(hrefs.some((h) => h.includes("apple-touch-icon"))).toBe(true);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest.webmanifest");
  const manifest = await (await request.get(manifestHref!)).json();
  expect(manifest.name).toBe("Sinima");
  expect(manifest.display).toBe("standalone");
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

  for (const url of [...hrefs, ...manifest.icons.map((i: { src: string }) => i.src)]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
    expect(res.headers()["content-type"], url).toMatch(/^image\//);
  }
});

test("PNG icons are the size they claim", async ({ page }) => {
  await page.goto("/lagos");
  for (const [src, size] of [["/icons/icon-192.png", 192], ["/icons/icon-512.png", 512], ["/icons/icon-maskable-512.png", 512], ["/icons/apple-touch-icon.png", 180]] as const) {
    const dims = await page.evaluate(async (s) => {
      const img = new Image();
      img.src = s;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, src);
    expect(dims, src).toEqual([size, size]);
  }
});

test("the tab icon is Figma's favicon: the blue ticket face with its eyes, not the old black square (D-106 a)", async ({ request }) => {
  const svg = await (await request.get("/icons/icon.svg")).text();
  expect(svg).toContain('fill="#5B8DEF"');
  expect(svg).toContain('fill="#0B1B3F"');
  expect(svg).not.toContain("#0a0a0a");
});

test("the Cinemas tab draws Figma's store icon, awning and all (D-106 e)", async ({ page }) => {
  await page.goto("/lagos");
  expect(await page.getByTestId("tab.cinemas").locator("svg path").count()).toBe(5);
});

test("the ticket sticker's die-cut outline is whole: nothing it draws touches the edge of its picture (D-106 b)", async ({ page }) => {
  await page.goto("/about");
  const touching = await page.evaluate(async () => {
    const img = new Image();
    img.src = "/stickers/ticket.svg";
    await img.decode();
    const canvas = Object.assign(document.createElement("canvas"), { width: img.naturalWidth * 4, height: img.naturalHeight * 4 });
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let edge = 0;
    for (let x = 0; x < width; x++) for (const y of [0, height - 1]) edge += data[(y * width + x) * 4 + 3]!;
    for (let y = 0; y < height; y++) for (const x of [0, width - 1]) edge += data[(y * width + x) * 4 + 3]!;
    return edge;
  });
  expect(touching).toBe(0);
});
