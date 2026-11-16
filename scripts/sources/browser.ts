// How Sinima reads a listing that is built by script (D-77): a headless Chromium, under the same
// rules as polite.ts and through the same pieces. Our real bot name is the browser's user agent
// (never a browser-like one, never a stealth plugin), robots.txt is checked before a page is
// opened, page loads to a host are at least `minGapMs` apart, a page has 30 s to answer and 30 s
// to render, a refusal is final, and a redirect is checked hop by hop and refused if it leaves the
// site. Images, fonts and media are never downloaded. One browser per run, launched on the first
// page and closed by `close()`: the Mac and the job's runner are both short of memory.
import type { Page, Route } from "@playwright/test";
import { MAX_REDIRECTS, PAGE_TIMEOUT_MS, refusal, rulesFrom, type PoliteOptions, type PoliteRules } from "./polite.ts";

/** The rendered HTML of a page, once `waitFor` is on it (or the network has gone quiet). */
export type RenderText = (url: string, opts?: { waitFor?: string }) => Promise<string>;

/** What the rules need from one browser tab. The real one is below; tests use a fake. */
export type BrowserPage = {
  /** Requests `url` as the page itself, without following a redirect, and shows it unless it is one. */
  open: (url: string, timeoutMs: number) => Promise<{ status: number; location: string | null }>;
  /** Waits until `selector` is on the page, or with none until the network has been quiet a moment. */
  settle: (selector: string | null, timeoutMs: number) => Promise<void>;
  html: () => Promise<string>;
  close: () => Promise<void>;
};
export type Launcher = (options: { userAgent: string }) => Promise<{ newPage: () => Promise<BrowserPage>; close: () => Promise<void> }>;

export function politeBrowser(options: (PoliteOptions | { rules: PoliteRules }) & { launcher?: Launcher }): RenderText & { close: () => Promise<void> } {
  const rules = rulesFrom(options);
  const launcher = options.launcher ?? chromiumLauncher;
  let browser: ReturnType<Launcher> | null = null;

  const render: RenderText = async (start, opts = {}) => {
    browser ??= launcher({ userAgent: rules.userAgent });
    const page = await (await browser).newPage();
    try {
      let url = start;
      await rules.check(url, url);
      for (let hop = 0; ; hop += 1) {
        await rules.pace(new URL(url).host);
        const { status, location } = await page.open(url, PAGE_TIMEOUT_MS);
        if (status >= 300 && status < 400 && location !== null) {
          if (hop === MAX_REDIRECTS) throw new Error(`${start} redirected more than ${MAX_REDIRECTS} times. Not read.`);
          const next = new URL(location, url).href;
          await rules.check(next, url);
          url = next;
          continue;
        }
        if (status < 200 || status >= 300) throw refusal(url, status);
        await page.settle(opts.waitFor ?? null, PAGE_TIMEOUT_MS);
        return await page.html();
      }
    } finally {
      await page.close();
    }
  };

  async function close(): Promise<void> {
    const launched = browser;
    browser = null;
    // A launch that failed has nothing to close; its error was already thrown to the reader.
    if (launched) await launched.then((open) => open.close(), () => undefined);
  }
  return Object.assign(render, { close });
}

/** What a visitor's eye needs and a listing does not: never downloaded. */
const BLOCKED = new Set(["image", "font", "media"]);

/** One normalised address, so the page we asked for is recognised when the browser requests it. */
const sameUrl = (a: string, b: string) => new URL(a).href.replace(/#.*$/, "") === new URL(b).href.replace(/#.*$/, "");

/** Playwright's Chromium (a dev dependency already, for the e2e tests). Loaded only when a page is read. */
export const chromiumLauncher: Launcher = async ({ userAgent }) => {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  // A service worker's requests would pass the route below unseen, so the page gets none.
  const context = await browser.newContext({ userAgent, serviceWorkers: "block" });
  return {
    newPage: async () => chromiumPage(await context.newPage()),
    close: () => browser.close(),
  };
};

async function chromiumPage(page: Page): Promise<BrowserPage> {
  let asked: string | null = null;
  let answer: { status: number; location: string | null } | null = null;
  let failure: unknown = null;

  // The page itself is requested here, without following a redirect, so the rules can check each
  // hop before it is requested (the browser would follow one on its own, unseen by a route).
  async function openOnce(route: Route): Promise<void> {
    asked = null;
    try {
      const response = await route.fetch({ maxRedirects: 0, timeout: PAGE_TIMEOUT_MS });
      const status = response.status();
      answer = { status, location: response.headers()["location"] ?? null };
      // A redirect is not shown: the rules decide whether to open its target.
      if (status >= 300 && status < 400) return route.fulfill({ status: 200, contentType: "text/html", body: "" });
      return route.fulfill({ response });
    } catch (error) {
      failure = error;
      return route.abort();
    }
  }

  await page.route("**/*", async (route, request) => {
    if (BLOCKED.has(request.resourceType())) return route.abort();
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      if (asked !== null && sameUrl(request.url(), asked)) return openOnce(route);
      // The page moving itself somewhere else by script: we read only the page we asked for.
      return route.abort();
    }
    return route.continue();
  });

  return {
    async open(url, timeoutMs) {
      asked = url;
      answer = null;
      failure = null;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      } catch (error) {
        throw failure ?? error;
      }
      if (failure !== null) throw failure;
      if (answer === null) throw new Error(`${url}: the browser did not request the page. Not read.`);
      return answer;
    },
    async settle(selector, timeoutMs) {
      if (selector === null) await page.waitForLoadState("networkidle", { timeout: timeoutMs });
      else await page.waitForSelector(selector, { state: "attached", timeout: timeoutMs });
    },
    html: () => page.content(),
    close: () => page.close(),
  };
}
