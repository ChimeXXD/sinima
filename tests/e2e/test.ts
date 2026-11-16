import { test as base } from "@playwright/test";
import { sampleTime } from "./helpers";

// Every e2e test runs on a fixed clock (CLAUDE.md, Working style): noon on the sample day, so the
// tests pass at any hour. On the real clock, a run late in the evening found no films left to start
// and failed (16 Nov). A test that wants another time sets its own clock, which replaces this one:
// `page.clock.install({ time })`, `freeze()`, or `page.clock.install()` for the real clock.
// Pages from a context a test opens itself (`browser.newContext()`) keep the real clock, and a file
// whose pages need real timers (the service worker saving files a few seconds in) says
// `test.use({ realClock: true })`: a fake clock holds those timers back.

export * from "@playwright/test";

export const test = base.extend<{ realClock: boolean; sampleNoon: void }>({
  realClock: [false, { option: true }],
  sampleNoon: [
    async ({ page, request, realClock }, use) => {
      if (!realClock) await page.clock.install({ time: await sampleTime(request, "12:00") });
      await use();
    },
    { auto: true },
  ],
});
