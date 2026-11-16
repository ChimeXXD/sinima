import { describe, expect, it } from "vitest";
import { politeFetcher, robotsAllows } from "../../../../scripts/sources/polite.ts";

// The reading rule (D-77): our real bot name, robots.txt obeyed for the paths we fetch, at most one
// request per 5 s per host, and a refusal is final: never retried, never worked around.
const UA = "SinimaBot/0.1 (+https://github.com/ChimeXXD/sinima)";

describe("robotsAllows", () => {
  it("allows everything when robots.txt allows all or says nothing", () => {
    expect(robotsAllows("User-agent: *\nAllow: /\nSitemap: https://lagocine.com/sitemap.xml", UA, "/day/2026-11-16/")).toBe(true);
    expect(robotsAllows("", UA, "/anything")).toBe(true);
  });

  it("refuses a disallowed path, and lets the longest rule win", () => {
    const robots = "User-agent: *\nDisallow: /api/\nDisallow: /movies/*/select-tickets\nAllow: /api/public/";
    expect(robotsAllows(robots, UA, "/api/showtimes")).toBe(false);
    expect(robotsAllows(robots, UA, "/api/public/list")).toBe(true);
    expect(robotsAllows(robots, UA, "/movies/clayface/select-tickets")).toBe(false);
    expect(robotsAllows(robots, UA, "/movies/clayface/")).toBe(true);
  });

  it("follows a group written for our bot over the one for everyone", () => {
    const robots = "User-agent: *\nAllow: /\n\nUser-agent: SinimaBot\nDisallow: /";
    expect(robotsAllows(robots, UA, "/day/2026-11-16/")).toBe(false);
  });

  it("does not take an empty User-agent line for our bot", () => {
    const robots = "User-agent: *\nDisallow: /\n\nUser-agent:\nAllow: /";
    expect(robotsAllows(robots, UA, "/day/2026-11-16/")).toBe(false);
  });

  it("reads a $ as the end of the path", () => {
    expect(robotsAllows("User-agent: *\nDisallow: /*.json$", UA, "/data.json")).toBe(false);
    expect(robotsAllows("User-agent: *\nDisallow: /*.json$", UA, "/data.json/page")).toBe(true);
  });
});

/** A fake network and clock: records each request and each wait. */
function fakeNet(pages: Record<string, { status: number; body: string; location?: string }>) {
  const requests: { url: string; userAgent: string | null; at: number }[] = [];
  const waits: number[] = [];
  let clock = 0;
  const fetch = (async (url: string, init?: RequestInit) => {
    const page = pages[url] ?? { status: 404, body: "" };
    requests.push({ url, userAgent: new Headers(init?.headers).get("user-agent"), at: clock });
    return new Response(page.status >= 300 && page.status < 400 ? null : page.body, { status: page.status, headers: page.location ? { location: page.location } : {} });
  }) as typeof globalThis.fetch;
  const wait = async (ms: number) => {
    waits.push(ms);
    clock += ms;
  };
  return { fetch, wait, now: () => clock, requests, waits };
}

describe("politeFetcher", () => {
  it("reads robots.txt first, names itself, and waits 5 s between requests to one host", async () => {
    const net = fakeNet({
      "https://lagocine.com/robots.txt": { status: 200, body: "User-agent: *\nAllow: /" },
      "https://lagocine.com/day/2026-11-16/": { status: 200, body: "<html>16</html>" },
      "https://lagocine.com/day/2026-11-17/": { status: 200, body: "<html>17</html>" },
    });
    const get = politeFetcher({ userAgent: UA, minGapMs: 5000, fetch: net.fetch, wait: net.wait, now: net.now });
    expect(await get("https://lagocine.com/day/2026-11-16/")).toBe("<html>16</html>");
    expect(await get("https://lagocine.com/day/2026-11-17/")).toBe("<html>17</html>");
    expect(net.requests.map((r) => r.url)).toEqual(["https://lagocine.com/robots.txt", "https://lagocine.com/day/2026-11-16/", "https://lagocine.com/day/2026-11-17/"]);
    expect(net.requests.every((r) => r.userAgent === UA)).toBe(true);
    const gaps = net.requests.slice(1).map((r, i) => r.at - net.requests[i]!.at);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(5000);
  });

  it("refuses a path robots.txt disallows, without requesting it", async () => {
    const net = fakeNet({ "https://www.filmhouseng.com/robots.txt": { status: 200, body: "User-agent: *\nDisallow: /api/" } });
    const get = politeFetcher({ userAgent: UA, minGapMs: 5000, fetch: net.fetch, wait: net.wait, now: net.now });
    await expect(get("https://www.filmhouseng.com/api/showtimes")).rejects.toThrow(/robots\.txt/);
    expect(net.requests.map((r) => r.url)).toEqual(["https://www.filmhouseng.com/robots.txt"]);
  });

  it("checks a redirect before following it: another site or a disallowed path is never requested", async () => {
    const net = fakeNet({
      "https://example.com/robots.txt": { status: 200, body: "User-agent: *\nDisallow: /private/" },
      "https://example.com/list": { status: 301, body: "", location: "/private/x" },
      "https://example.com/away": { status: 302, body: "", location: "https://other.example/list" },
    });
    const get = politeFetcher({ userAgent: UA, minGapMs: 5000, fetch: net.fetch, wait: net.wait, now: net.now });
    await expect(get("https://example.com/list")).rejects.toThrow(/robots\.txt/);
    await expect(get("https://example.com/away")).rejects.toThrow(/another site/);
    expect(net.requests.map((r) => r.url)).not.toContain("https://example.com/private/x");
    expect(net.requests.map((r) => r.url)).not.toContain("https://other.example/list");
  });

  it("follows an allowed redirect on the same site, 5 s after the first request", async () => {
    const net = fakeNet({
      "https://example.com/robots.txt": { status: 404, body: "" },
      "https://example.com/day": { status: 301, body: "", location: "https://example.com/day/" },
      "https://example.com/day/": { status: 200, body: "<html>day</html>" },
    });
    const get = politeFetcher({ userAgent: UA, minGapMs: 5000, fetch: net.fetch, wait: net.wait, now: net.now });
    expect(await get("https://example.com/day")).toBe("<html>day</html>");
    const [, first, second] = net.requests;
    expect(second!.url).toBe("https://example.com/day/");
    expect(second!.at - first!.at).toBeGreaterThanOrEqual(5000);
  });

  it("stops at a refusal (403) and does not ask again", async () => {
    const net = fakeNet({
      "https://example.com/robots.txt": { status: 404, body: "" },
      "https://example.com/list": { status: 403, body: "Access Denied" },
    });
    const get = politeFetcher({ userAgent: UA, minGapMs: 5000, fetch: net.fetch, wait: net.wait, now: net.now });
    await expect(get("https://example.com/list")).rejects.toThrow(/403/);
    expect(net.requests.filter((r) => r.url === "https://example.com/list")).toHaveLength(1);
  });
});
