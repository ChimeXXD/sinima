import { existsSync } from "node:fs";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { chromiumLauncher, politeBrowser, type BrowserPage, type Launcher } from "../../../../scripts/sources/browser.ts";

// The headless reader for listings built by script (D-77): the same rules as polite.ts. Our real
// bot name (never a browser's), robots.txt checked before the page is opened, 5 s between page
// loads to a host, 30 s to answer, a refusal is final and a redirect to another site is refused.
const UA = "SinimaBot/0.1 (+https://github.com/ChimeXXD/sinima)";

type FakePage = { status: number; location?: string; html?: string };

/** A fake browser and clock: records each page opened, each wait and what was launched. */
function fakeBrowser(pages: Record<string, FakePage>, robots: Record<string, { status: number; body: string }> = {}) {
  let clock = 0;
  const events: { what: string; url: string; at: number }[] = [];
  const launches: { userAgent: string }[] = [];
  const timeouts: number[] = [];
  let openPages = 0;
  let closed = false;
  const fetch = (async (url: string, init?: RequestInit) => {
    events.push({ what: `fetch ${new Headers(init?.headers).get("user-agent")}`, url, at: clock });
    const answer = robots[url] ?? { status: 200, body: "User-agent: *\nAllow: /" };
    return new Response(answer.body, { status: answer.status });
  }) as typeof globalThis.fetch;
  const launcher: Launcher = async (options) => {
    launches.push(options);
    return {
      async newPage(): Promise<BrowserPage> {
        openPages += 1;
        let shown: FakePage | null = null;
        return {
          async open(url, timeoutMs) {
            events.push({ what: "open", url, at: clock });
            timeouts.push(timeoutMs);
            shown = pages[url] ?? { status: 404 };
            return { status: shown.status, location: shown.location ?? null };
          },
          async settle(selector, timeoutMs) {
            events.push({ what: `settle ${selector}`, url: "", at: clock });
            timeouts.push(timeoutMs);
          },
          async html() {
            return shown?.html ?? "";
          },
          async close() {
            openPages -= 1;
          },
        };
      },
      async close() {
        closed = true;
      },
    };
  };
  const wait = async (ms: number) => {
    clock += ms;
  };
  const make = () => politeBrowser({ userAgent: UA, minGapMs: 5000, fetch, wait, now: () => clock, launcher });
  return { make, events, launches, timeouts, opened: () => events.filter((e) => e.what === "open").map((e) => e.url), openPages: () => openPages, closed: () => closed };
}

describe("politeBrowser", () => {
  it("names itself with our bot's own user agent, never a browser's", async () => {
    const net = fakeBrowser({ "https://reach.example/now-showing": { status: 200, html: "<ul>times</ul>" } });
    const render = net.make();
    expect(await render("https://reach.example/now-showing", { waitFor: "ul" })).toBe("<ul>times</ul>");
    expect(net.launches).toEqual([{ userAgent: UA }]);
    expect(net.events.filter((e) => e.what.startsWith("fetch")).every((e) => e.what === `fetch ${UA}`)).toBe(true);
    await render.close();
  });

  it("reads robots.txt before opening the page, and waits 5 s between page loads to one host", async () => {
    const net = fakeBrowser({
      "https://reach.example/a": { status: 200, html: "a" },
      "https://reach.example/b": { status: 200, html: "b" },
    });
    const render = net.make();
    await render("https://reach.example/a");
    await render("https://reach.example/b");
    expect(net.events.filter((e) => e.what !== "settle null").map((e) => e.url)).toEqual(["https://reach.example/robots.txt", "https://reach.example/a", "https://reach.example/b"]);
    const loads = net.events.filter((e) => e.what !== "settle null");
    const gaps = loads.slice(1).map((e, i) => e.at - loads[i]!.at);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(5000);
    await render.close();
  });

  it("waits for the selector it is given, else for the network to go quiet, with a 30 s limit", async () => {
    const net = fakeBrowser({ "https://reach.example/a": { status: 200, html: "a" } });
    const render = net.make();
    await render("https://reach.example/a", { waitFor: ".showtime" });
    await render("https://reach.example/a");
    expect(net.events.filter((e) => e.what.startsWith("settle")).map((e) => e.what)).toEqual(["settle .showtime", "settle null"]);
    expect(net.timeouts.every((ms) => ms === 30_000)).toBe(true);
    await render.close();
  });

  it("refuses a path robots.txt disallows, without opening it", async () => {
    const net = fakeBrowser({ "https://thc.example/api/times": { status: 200, html: "x" } }, { "https://thc.example/robots.txt": { status: 200, body: "User-agent: *\nDisallow: /api/" } });
    const render = net.make();
    await expect(render("https://thc.example/api/times")).rejects.toThrow(/robots\.txt/);
    expect(net.opened()).toEqual([]);
    await render.close();
  });

  it("takes a refusal as final: a 403 throws and is not opened again", async () => {
    const net = fakeBrowser({ "https://cinesync.example/times": { status: 403 } });
    const render = net.make();
    await expect(render("https://cinesync.example/times")).rejects.toThrow(/403.*final/);
    expect(net.opened()).toEqual(["https://cinesync.example/times"]);
    await render.close();
  });

  it("follows a redirect on the same site after checking it, and refuses one to another site without opening it", async () => {
    const net = fakeBrowser({
      "https://grand.example/": { status: 302, location: "/showtimes" },
      "https://grand.example/showtimes": { status: 200, html: "times" },
      "https://magnificent.example/": { status: 301, location: "https://elsewhere.example/times" },
    });
    const render = net.make();
    expect(await render("https://grand.example/")).toBe("times");
    await expect(render("https://magnificent.example/")).rejects.toThrow(/another site/);
    expect(net.opened()).toEqual(["https://grand.example/", "https://grand.example/showtimes", "https://magnificent.example/"]);
    await render.close();
  });

  it("launches one browser for the run only when a page is read, closes every page, and closes the browser", async () => {
    const net = fakeBrowser({ "https://reach.example/a": { status: 200, html: "a" }, "https://reach.example/gone": { status: 404 } });
    const unused = net.make();
    await unused.close();
    expect(net.launches).toEqual([]);
    const render = net.make();
    await render("https://reach.example/a");
    await expect(render("https://reach.example/gone")).rejects.toThrow(/404/);
    expect(net.launches).toHaveLength(1);
    expect(net.openPages()).toBe(0);
    await render.close();
    expect(net.closed()).toBe(true);
  });
});

// One real Chromium against a tiny local server (never the internet). Skipped where the browser is
// not installed, as in CI's unit step, which runs before `playwright install`.
const chromiumPath = await import("@playwright/test").then(({ chromium }) => chromium.executablePath()).catch(() => "");
describe.skipIf(!existsSync(chromiumPath))("politeBrowser with Chromium (local server)", () => {
  it("renders a page built by script, with our name, without images, and refuses a redirect to another site", async () => {
    const seen: { host: string; path: string; userAgent: string }[] = [];
    const server = createServer((request: IncomingMessage, response) => {
      const path = request.url ?? "/";
      seen.push({ host: request.headers.host ?? "", path, userAgent: request.headers["user-agent"] ?? "" });
      if (path === "/robots.txt") return response.end("User-agent: *\nDisallow: /private/");
      if (path === "/listing")
        return response.end(`<!doctype html><img src="/poster.png"><script>setTimeout(() => { document.body.insertAdjacentHTML("beforeend", '<ul id="times"><li>7:30 PM</li></ul>'); }, 150);</script>`);
      if (path === "/moved") return response.writeHead(302, { location: `http://localhost:${port}/listing` }).end();
      response.writeHead(404).end("not here");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const port = (server.address() as AddressInfo).port;
    const render = politeBrowser({ userAgent: UA, minGapMs: 0, launcher: chromiumLauncher });
    try {
      const html = await render(`http://127.0.0.1:${port}/listing`, { waitFor: "#times li" });
      expect(html).toContain("7:30 PM");
      expect(seen.find((r) => r.path === "/listing")?.userAgent).toBe(UA);
      expect(seen.some((r) => r.path === "/poster.png")).toBe(false);
      await expect(render(`http://127.0.0.1:${port}/moved`)).rejects.toThrow(/another site/);
      expect(seen.some((r) => r.host.startsWith("localhost"))).toBe(false);
      await expect(render(`http://127.0.0.1:${port}/private/times`)).rejects.toThrow(/robots\.txt/);
      await expect(render(`http://127.0.0.1:${port}/gone`)).rejects.toThrow(/404/);
    } finally {
      await render.close();
      await new Promise((done) => server.close(done));
    }
  }, 60_000);
});
