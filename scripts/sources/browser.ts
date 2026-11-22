// How Sinima reads a listing that is built by script (D-77): a headless Chromium, under the same
// rules as polite.ts and through the same pieces. Our real bot name is the browser's user agent
// (never a browser-like one, never a stealth plugin), robots.txt is checked before a page is
// opened, page loads to a host are at least `minGapMs` apart, a page has 30 s to answer and 30 s
// to render, a refusal is final, and a redirect is checked hop by hop and refused if it leaves the
// site. Images, fonts and media are never downloaded. One browser per run, launched on the first
// page and closed by `close()`: the Mac and the job's runner are both short of memory. A page whose
// days are tabs a visitor taps (no address for each day) can have one control clicked once it has
// settled (D-125); a click is not a page load, and the page's own requests after it are the ones a
// visitor's tap would make.
import type { Page, Route } from "@playwright/test";
import { MAX_REDIRECTS, PAGE_TIMEOUT_MS, refusal, rulesFrom, type PoliteOptions, type PoliteRules } from "./polite.ts";

/**
 * The rendered HTML of a page, once `waitFor` is on it (or the network has gone quiet). With
 * `click`, the first control matching that selector is then clicked (a date tab), marked
 * `data-sinima-clicked` so the parser can see which one, and the page read once the network is
 * quiet again; when no control matches, the page is read as it is, for the parser to judge.
 */
export type RenderText = (url: string, opts?: { waitFor?: string; click?: string; steps?: Step[] }) => Promise<string>;

/**
 * What a visitor does on a page after it has settled, in order (D-176): `click` a control (a
 * cinema in a picker, a date), or `tap` each control matching a selector and note the address
 * each tap would open under the path `capture`, without opening it: the request is cancelled before
 * it leaves the browser. What each `tap` step found is added to the HTML as a
 * `<script type="application/json" data-sinima-taps="<label>">` block of `{ text, href }`. A `tap`
 * with `when` taps only while that selector is on the page (the day asked for is the one shown) and
 * otherwise notes `null`: a date that could not be picked must not lend its label to another day's times.
 */
export type Step = { click: string } | { tap: string; capture: string; label: string; when?: string };
export type Tapped = { text: string; href: string };

/** What the rules need from one browser tab. The real one is below; tests use a fake. */
export type BrowserPage = {
  /** Requests `url` as the page itself, without following a redirect, and shows it unless it is one. */
  open: (url: string, timeoutMs: number) => Promise<{ status: number; location: string | null }>;
  /** Waits until `selector` is on the page, or with none until the network has been quiet a moment. */
  settle: (selector: string | null, timeoutMs: number) => Promise<void>;
  /** Clicks the first control matching `selector`, marked, and waits for the network to go quiet; false when there is none. */
  click: (selector: string, timeoutMs: number, force?: boolean) => Promise<boolean>;
  /** Whether anything on the page matches `selector` now. */
  has: (selector: string) => Promise<boolean>;
  /** Taps each enabled control matching `selector`, noting the same-site address under `capture` each tap would open, unopened. */
  tapAll: (selector: string, capture: string, timeoutMs: number) => Promise<Tapped[]>;
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
        if (opts.click !== undefined) await page.click(opts.click, PAGE_TIMEOUT_MS);
        let found = "";
        for (const step of opts.steps ?? []) {
          if ("click" in step) await page.click(step.click, PAGE_TIMEOUT_MS, true);
          else {
            const taps = step.when === undefined || (await page.has(step.when)) ? await page.tapAll(step.tap, step.capture, PAGE_TIMEOUT_MS) : null;
            found += `<script type="application/json" data-sinima-taps="${step.label}">${JSON.stringify(taps).replace(/</g, "\\u003c")}</script>`;
          }
        }
        return (await page.html()) + found;
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

/** After a click: time for the request it starts to begin, then how long the network must stay quiet. */
const CLICK_GRACE_MS = 300;
const QUIET_MS = 500;
/** How long a tap has to ask for the page it opens before it is taken as opening none. */
const TAP_WAIT_MS = 2500;

/** What a visitor's eye needs and a listing does not: never downloaded. */
const BLOCKED = new Set(["image", "font", "media"]);

/** One normalised address, so the page we asked for is recognised when the browser requests it. */
const sameUrl = (a: string, b: string) => new URL(a).href.replace(/#.*$/, "") === new URL(b).href.replace(/#.*$/, "");

/** Playwright's Chromium (a dev dependency already, for the e2e tests). Loaded only when a page is read. */
export const chromiumLauncher: Launcher = async ({ userAgent }) => {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  // A service worker's requests would pass the route below unseen, so the page gets none. The page is
  // read as a visitor in Lagos: Reach's sites draw each time in the visitor's own clock, and on the
  // refresh job's UTC machine Viva's 11:15 AM read as 10:15 AM (Chime, 21 Nov 2026).
  const context = await browser.newContext({ userAgent, serviceWorkers: "block", timezoneId: "Africa/Lagos", locale: "en-NG" });
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

  // Requests the page has in flight, so a click can wait until what it asked for has arrived.
  let inFlight = 0;
  page.on("request", () => (inFlight += 1));
  const settled = () => (inFlight = Math.max(0, inFlight - 1));
  page.on("requestfinished", settled);
  page.on("requestfailed", settled);

  /** Resolves once nothing has been in flight for QUIET_MS (after a short grace for the request a click starts). */
  async function quiet(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    await page.waitForTimeout(CLICK_GRACE_MS);
    let since = Date.now();
    while (Date.now() - since < QUIET_MS) {
      if (Date.now() > deadline) throw Object.assign(new Error(`The page was still loading ${timeoutMs / 1000} s after the click. Not read.`), { name: "TimeoutError" });
      if (inFlight > 0) since = Date.now();
      await page.waitForTimeout(50);
    }
  }

  // Once `tapAll` has run: same-site requests under its path are answered here, never sent, and noted
  // while a tap waits for its own (`seen`); one arriving later is still never sent, and noted nowhere.
  let capture: { path: string; seen: string[] | null } | null = null;
  let site: string | null = null; // the origin of the page asked for, kept after it has loaded
  await page.route("**/*", async (route, request) => {
    if (BLOCKED.has(request.resourceType())) return route.abort();
    if (capture !== null && site !== null) {
      const url = new URL(request.url());
      if (url.origin === site && url.pathname.startsWith(capture.path)) {
        capture.seen?.push(url.pathname);
        // Answered here with 204, never sent: a 204 leaves the page where it is (an aborted
        // navigation would swap it for an error page and lose the next time to tap).
        return route.fulfill({ status: 204, body: "" });
      }
    }
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
      site = new URL(url).origin;
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
    async click(selector, timeoutMs, force = false) {
      const control = page.locator(selector).first();
      if ((await control.count()) === 0) return false;
      await control.evaluate((element) => element.setAttribute("data-sinima-clicked", ""));
      await control.click({ timeout: timeoutMs, force });
      await quiet(timeoutMs);
      return true;
    },
    has: async (selector) => (await page.locator(selector).count()) > 0,
    async tapAll(selector, path, timeoutMs) {
      const controls = page.locator(selector);
      const found: Tapped[] = [];
      for (let i = 0; i < (await controls.count()); i += 1) {
        const control = controls.nth(i);
        if (await control.isDisabled()) continue; // a showing that has started, or is sold out
        const seen: string[] = [];
        capture = { path, seen };
        await control.dispatchEvent("click");
        const deadline = Date.now() + Math.min(timeoutMs, TAP_WAIT_MS);
        while (seen.length === 0 && Date.now() < deadline) await page.waitForTimeout(50);
        capture = { path, seen: null };
        // A tap that opened nothing in time ends the step: its page asked for late would be taken
        // for the next tap's (the verifier, 22 Nov 2026).
        if (seen[0] === undefined) break;
        found.push({ text: (await control.innerText()).replace(/\s+/g, " ").trim(), href: seen[0] });
      }
      return found;
    },
    html: () => page.content(),
    close: () => page.close(),
  };
}
