import { existsSync } from "node:fs";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { chromiumLauncher, politeBrowser, type BrowserPage, type Launcher } from "../../../../scripts/sources/browser.ts";
import { filmDateSelector, pickedDateSelector } from "../../../../scripts/sources/reach.ts";

// The headless reader for listings built by script (D-77): the same rules as polite.ts. Our real
// bot name (never a browser's), robots.txt checked before the page is opened, 5 s between page
// loads to a host, 30 s to answer, a refusal is final and a redirect to another site is refused.
const UA = "SinimaBot/0.1 (+https://github.com/ChimeXXD/sinima)";

/** `tabs`: what the page shows after a control (by selector) is clicked. `shows`: the selectors on the page as it opens. */
type FakePage = { status: number; location?: string; html?: string; tabs?: Record<string, string>; taps?: Record<string, { text: string; href: string }[]>; shows?: string[] };

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
          async click(selector, timeoutMs, force) {
            events.push({ what: `click${force ? "!" : ""} ${selector}`, url: "", at: clock });
            timeouts.push(timeoutMs);
            const after = shown?.tabs?.[selector];
            if (after === undefined) return false;
            shown = { ...shown!, html: after };
            return true;
          },
          async has(selector) {
            events.push({ what: `has ${selector}`, url: "", at: clock });
            return shown?.shows?.includes(selector) ?? false;
          },
          async tapAll(selector, capture, timeoutMs) {
            events.push({ what: `tap ${selector} ${capture}`, url: "", at: clock });
            timeouts.push(timeoutMs);
            return shown?.taps?.[selector] ?? [];
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

  // A day a visitor picks by tapping its tab (Sky, THC, EbonyLife, Magnificent): one page load,
  // then the click, after the page has settled.
  it("clicks the control it is given once the page has settled, and reads the page after it", async () => {
    const net = fakeBrowser({ "https://sky.example/showtimes": { status: 200, html: "today", tabs: { "button:text-is('Nov 18th')": "tomorrow" } } });
    const render = net.make();
    expect(await render("https://sky.example/showtimes", { click: "button:text-is('Nov 18th')" })).toBe("tomorrow");
    expect(net.events.filter((e) => !e.what.startsWith("fetch")).map((e) => e.what)).toEqual(["open", "settle null", "click button:text-is('Nov 18th')"]);
    expect(net.timeouts.every((ms) => ms === 30_000)).toBe(true);
    // No such control on the page (no tab for that day): the page as it is, for the parser to judge.
    expect(await render("https://sky.example/showtimes", { click: "button:text-is('Nov 21st')" })).toBe("today");
    expect(net.opened()).toEqual(["https://sky.example/showtimes", "https://sky.example/showtimes"]);
    await render.close();
  });

  it("runs a visitor's steps in order: clicks, then taps each time and adds what each tap would open (D-176)", async () => {
    const film = "https://web.vivacinemas.com/movies/039f28cf";
    const fake = fakeBrowser({ [film]: { status: 200, html: "<main>film</main>", taps: { "section button": [{ text: "11:15 AM Screen 3", href: "/book/b05cc3a0" }] } } });
    const render = fake.make();
    const html = await render(film, { steps: [{ click: 'text="Viva Ikeja"' }, { click: 'text="Sat 21"' }, { tap: "section button", capture: "/book/", label: "2026-11-21" }] });
    expect(fake.events.map((e) => e.what).filter((w) => !w.startsWith("fetch") && w !== "open")).toEqual(["settle null", 'click! text="Viva Ikeja"', 'click! text="Sat 21"', "tap section button /book/"]);
    expect(html).toBe('<main>film</main><script type="application/json" data-sinima-taps="2026-11-21">[{"text":"11:15 AM Screen 3","href":"/book/b05cc3a0"}]</script>');
    expect(fake.opened()).toEqual([film]);
    await render.close();
  });

  // 21 Nov 2026: Viva's page could not be moved to Sunday, so Saturday's times were noted as Sunday's.
  it("taps a step's controls only while its `when` is on the page, and otherwise notes null", async () => {
    const film = "https://web.vivacinemas.com/movies/039f28cf";
    const fake = fakeBrowser({ [film]: { status: 200, html: "<main>film</main>", shows: ["picked Sat"], taps: { "section button": [{ text: "11:15 AM Screen 3", href: "/book/b05cc3a0" }] } } });
    const render = fake.make();
    const html = await render(film, { steps: [{ tap: "section button", capture: "/book/", label: "2026-11-21", when: "picked Sat" }, { click: "Sun" }, { tap: "section button", capture: "/book/", label: "2026-11-22", when: "picked Sun" }] });
    expect(fake.events.map((e) => e.what).filter((w) => w.startsWith("tap"))).toEqual(["tap section button /book/"]);
    expect(html).toBe('<main>film</main><script type="application/json" data-sinima-taps="2026-11-21">[{"text":"11:15 AM Screen 3","href":"/book/b05cc3a0"}]</script><script type="application/json" data-sinima-taps="2026-11-22">null</script>');
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

  // Reach's sites (Viva, Nova, Ozone, Sky) draw each time in the visitor's own clock. Read from a
  // runner on UTC, Viva Ikeja's 11:15 AM came out as 10:15 AM (Chime, 21 Nov 2026): the reader must
  // be a visitor in Lagos whatever the machine's zone (run this with TZ=UTC, as the refresh job does).
  it("reads a page as a visitor in Lagos: times a page draws in the visitor's clock are Lagos times", async () => {
    const server = createServer((request: IncomingMessage, response) => {
      const path = request.url ?? "/";
      if (path === "/robots.txt") return response.end("User-agent: *\nAllow: /");
      if (path === "/showtimes")
        return response.end(
          `<!doctype html><ul id="times"></ul><script>document.getElementById("times").innerHTML = "<li>" + new Date("2026-11-21T10:15:00Z").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + "</li>";</script>`,
        );
      response.writeHead(404).end("not here");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const port = (server.address() as AddressInfo).port;
    const render = politeBrowser({ userAgent: UA, minGapMs: 0, launcher: chromiumLauncher });
    try {
      expect(await render(`http://127.0.0.1:${port}/showtimes`, { waitFor: "#times li" })).toContain("11:15 AM");
    } finally {
      await render.close();
      await new Promise((done) => server.close(done));
    }
  }, 60_000);

  // Viva's and Nova's film pages (D-176): a time tapped opens /book/<showing>; the reader notes that
  // address and cancels the request, so the booking page is never asked for. A past time is disabled.
  it("taps each time and notes the booking address it would open, without the request reaching the site", async () => {
    const seen: string[] = [];
    const server = createServer((request: IncomingMessage, response) => {
      const path = request.url ?? "/";
      seen.push(path);
      if (path === "/robots.txt") return response.end("User-agent: *\nAllow: /");
      if (path === "/movies/f1")
        return response.end(
          `<!doctype html><section><h3>Viva Ikeja</h3><button disabled>11:15 AM Screen 3</button><button onclick="location.href='/book/b2'">2:00 PM Screen 2</button><button onclick="fetch('/book/b3?_rsc=1')">4:50 PM Screen 2</button></section>`,
        );
      response.writeHead(404).end("not here");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const port = (server.address() as AddressInfo).port;
    const render = politeBrowser({ userAgent: UA, minGapMs: 0, launcher: chromiumLauncher });
    try {
      const html = await render(`http://127.0.0.1:${port}/movies/f1`, { waitFor: "section", steps: [{ tap: "section button", capture: "/book/", label: "today" }] });
      const block = /data-sinima-taps="today">(.*?)<\/script>/.exec(html)?.[1];
      expect(JSON.parse(block!)).toEqual([
        { text: "2:00 PM Screen 2", href: "/book/b2" },
        { text: "4:50 PM Screen 2", href: "/book/b3" },
      ]);
      expect(seen.some((path) => path.startsWith("/book/"))).toBe(false);
    } finally {
      await render.close();
      await new Promise((done) => server.close(done));
    }
  }, 60_000);

  // Viva's film page (22 Nov 2026): a strip of date slides ("Sun22 Nov"), the picked one lit yellow, and
  // a tap on a slide's weekday shows that day's times. With the pattern's backslash single, no date
  // matched, the page stayed on Sunday, and Sunday's times were noted as Monday's. Sunday's time opens its
  // booking page as a page of its own: the next date must still be tappable after it (22 Nov 2026).
  it("moves a film page to each day before tapping its times, and notes null for a day it cannot pick", async () => {
    const page = `<!doctype html><div class="swiper"><div class="swiper-slide bg-grad-yellow" data-d="sun"><span>Sun</span><span>22 Nov</span></div><div class="swiper-slide" data-d="mon"><span>Mon</span><span>23 Nov</span></div></div>
<section><h3>Viva Ikeja</h3><div id="t"></div></section><script>
const times = { sun: "<button onclick=\\"location.href = '/book/s1'\\">11:15 AM Screen 3</button>", mon: "<button onclick=\\"fetch('/book/m1?_rsc=1')\\">12:05 PM Screen 3</button>" };
const pick = (d) => { document.querySelectorAll(".swiper-slide").forEach((s) => s.classList.toggle("bg-grad-yellow", s.dataset.d === d)); document.getElementById("t").innerHTML = times[d]; };
document.querySelectorAll(".swiper-slide span").forEach((span) => (span.onclick = () => pick(span.parentElement.dataset.d)));
pick("sun");
</script>`;
    const server = createServer((request: IncomingMessage, response) => {
      const path = request.url ?? "/";
      if (path === "/robots.txt") return response.end("User-agent: *\nAllow: /");
      if (path === "/movies/f1") return response.end(page);
      response.writeHead(404).end("not here");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const port = (server.address() as AddressInfo).port;
    const render = politeBrowser({ userAgent: UA, minGapMs: 0, launcher: chromiumLauncher });
    const sun = { year: 2026, month: 11, day: 22 };
    const mon = { year: 2026, month: 11, day: 23 };
    const tue = { year: 2026, month: 11, day: 24 };
    const tap = (label: string, day: typeof sun) => ({ tap: "section button", capture: "/book/", label, when: pickedDateSelector(day) });
    try {
      const html = await render(`http://127.0.0.1:${port}/movies/f1`, {
        waitFor: "section button",
        steps: [{ click: filmDateSelector(sun) }, tap("sun", sun), { click: filmDateSelector(mon) }, tap("mon", mon), { click: filmDateSelector(tue) }, tap("tue", tue)],
      });
      const block = (label: string) => JSON.parse(new RegExp(`data-sinima-taps="${label}">(.*?)</script>`).exec(html)![1]!);
      expect(block("sun")).toEqual([{ text: "11:15 AM Screen 3", href: "/book/s1" }]);
      expect(block("mon")).toEqual([{ text: "12:05 PM Screen 3", href: "/book/m1" }]);
      expect(block("tue")).toBeNull();
    } finally {
      await render.close();
      await new Promise((done) => server.close(done));
    }
  }, 60_000);

  // A tap that opens nothing in time ends its step: what it asked for late would pass for the next tap's.
  it("stops tapping a step after a tap that opens nothing", async () => {
    const server = createServer((request: IncomingMessage, response) => {
      const path = request.url ?? "/";
      if (path === "/robots.txt") return response.end("User-agent: *\nAllow: /");
      if (path === "/movies/f1") return response.end(`<!doctype html><section><button>11:15 AM Screen 3</button><button onclick="fetch('/book/b2?_rsc=1')">2:00 PM Screen 2</button></section>`);
      response.writeHead(404).end("not here");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const port = (server.address() as AddressInfo).port;
    const render = politeBrowser({ userAgent: UA, minGapMs: 0, launcher: chromiumLauncher });
    try {
      const html = await render(`http://127.0.0.1:${port}/movies/f1`, { waitFor: "section", steps: [{ tap: "section button", capture: "/book/", label: "today" }] });
      expect(/data-sinima-taps="today">(.*?)<\/script>/.exec(html)?.[1]).toBe("[]");
    } finally {
      await render.close();
      await new Promise((done) => server.close(done));
    }
  }, 60_000);

  // A date tab that loads its day's times when tapped, as Sky's and EbonyLife's pages do.
  it("clicks a tab, waits for what it loads, and marks the control it clicked", async () => {
    const server = createServer((request: IncomingMessage, response) => {
      const path = request.url ?? "/";
      if (path === "/robots.txt") return response.end("User-agent: *\nAllow: /");
      if (path === "/day/18") return setTimeout(() => response.end("<li>8:15 PM (18th)</li>"), 300);
      if (path === "/showtimes")
        return response.end(
          `<!doctype html><button id="t17">Nov 17th</button><button id="t18">Nov 18th</button><ul id="times"><li>7:30 PM (17th)</li></ul>` +
            `<script>document.getElementById("t18").onclick = () => fetch("/day/18").then((r) => r.text()).then((t) => { document.getElementById("times").innerHTML = t; });</script>`,
        );
      response.writeHead(404).end("not here");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const port = (server.address() as AddressInfo).port;
    const render = politeBrowser({ userAgent: UA, minGapMs: 0, launcher: chromiumLauncher });
    try {
      const tomorrow = await render(`http://127.0.0.1:${port}/showtimes`, { click: "button:text-is('Nov 18th')" });
      expect(tomorrow).toContain("8:15 PM (18th)");
      expect(tomorrow).not.toContain("7:30 PM (17th)");
      expect(tomorrow).toMatch(/<button id="t18" data-sinima-clicked="">Nov 18th<\/button>/);
      const none = await render(`http://127.0.0.1:${port}/showtimes`, { click: "button:text-is('Nov 21st')" });
      expect(none).toContain("7:30 PM (17th)");
      expect(none).not.toContain("data-sinima-clicked");
    } finally {
      await render.close();
      await new Promise((done) => server.close(done));
    }
  }, 60_000);
});
