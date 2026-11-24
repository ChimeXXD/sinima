import { test as base } from "@playwright/test";
import { CONSENT_KEY } from "../../src/lib/consent";
import { sampleTime } from "./helpers";

// Every e2e test runs on a fixed clock (CLAUDE.md, Working style): noon on the sample day, so the
// tests pass at any hour. On the real clock, a run late in the evening found no films left to start
// and failed (16 Nov). A test that wants another time sets its own clock, which replaces this one:
// `page.clock.install({ time })`, `freeze()`, or `page.clock.install()` for the real clock.
// Pages from a context a test opens itself (`browser.newContext()`) keep the real clock, and a file
// whose pages need real timers (the service worker saving files a few seconds in) says
// `test.use({ realClock: true })`: a fake clock holds those timers back.

export * from "@playwright/test";

// Every page also opens as a visitor who answered the Cookie bite banner (D-191) with No thanks, so it
// never covers what a test taps; consent.spec.ts sets `consent: null` to meet it. A test's own answer
// is kept: only a phone with none gets "no".

export const test = base.extend<{ realClock: boolean; consent: "yes" | "no" | null; sampleNoon: void; answered: void }>({
  realClock: [false, { option: true }],
  consent: ["no", { option: true }],
  answered: [
    async ({ page, consent }, use) => {
      if (consent)
        await page.addInitScript(
          ([key, value]) => {
            try {
              if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
            } catch {}
          },
          [CONSENT_KEY, consent] as const,
        );
      await use();
    },
    { auto: true },
  ],
  sampleNoon: [
    async ({ page, request, realClock }, use) => {
      if (!realClock) await page.clock.install({ time: await sampleTime(request, "12:00") });
      await use();
    },
    { auto: true },
  ],
});
