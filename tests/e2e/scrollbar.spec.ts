import { sampleTime } from "./helpers";
import { expect, test } from "./test";

// D-134: on a computer every scrollbar is Sinima's own (a 6 px pill in a 12 px gutter, no track),
// not the system's grey bar (Chime's recording of the desktop list, 17 Nov). The phone project
// emulates a touch phone, whose overlay bars take no room, so this opens a plain desktop browser,
// and headless Chromium hides every scrollbar unless told not to.

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test("on a computer the list's scrollbar is Sinima's own 12 px gutter, not the system's bar", async ({ browser, request }) => {
  // A context here takes the phone project's settings unless told otherwise: no touch, not a phone.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });
  await context.addInitScript(() => localStorage.setItem("ls.cinemas", JSON.stringify(["ebonylife-vi"])));
  const page = await context.newPage();
  await page.clock.install({ time: await sampleTime(request, "12:00") }); // a new context keeps the real clock
  await page.goto("/lagos/yours");
  await expect(page.locator("html[data-now]")).toBeAttached();
  await page.getByTestId("yours.add").click();
  const sheet = page.getByTestId("yours.pick");
  await expect(sheet).toHaveAttribute("open", "");
  const gutter = await sheet.evaluate((el) => (el as HTMLElement).offsetWidth - (el as HTMLElement).clientWidth);
  expect(gutter).toBe(12);
  await context.close();
});
