// How Sinima reads a cleared source (D-77): our real bot name, robots.txt obeyed for the paths we
// fetch, at most one request per `minGapMs` to a host, and a refusal is final. A 403 is a "no":
// it is never retried and never worked around.

export type FetchText = (url: string) => Promise<string>;

/** A listing that moves once or twice is normal; more is a loop. */
export const MAX_REDIRECTS = 3;
/** How long a page may take to answer (and, in the browser, to render) before the read fails. */
export const PAGE_TIMEOUT_MS = 30_000;

type Rule = { allow: boolean; pattern: string };
type Group = { agents: string[]; rules: Rule[] };

function parseRobots(text: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let afterAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const found = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(raw.replace(/#.*/, "").trim());
    if (!found) continue;
    const field = (found[1] as string).toLowerCase();
    const value = (found[2] as string).trim();
    if (field === "user-agent") {
      // Consecutive User-agent lines share one group.
      if (!current || !afterAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      afterAgent = true;
      continue;
    }
    afterAgent = false;
    // An empty Disallow allows everything, so it adds no rule.
    if (current && (field === "allow" || field === "disallow") && value !== "") current.rules.push({ allow: field === "allow", pattern: value });
  }
  return groups;
}

/** "/movies/*\/select-tickets" and "/*.json$" as a regular expression for a path. */
function patternToRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/**
 * Whether robots.txt lets `userAgent` read `path` (RFC 9309): the group naming our bot if there is
 * one, else the one for everyone; the longest matching rule wins, and Allow wins a tie.
 */
export function robotsAllows(robotsTxt: string, userAgent: string, path: string): boolean {
  const token = (userAgent.split("/")[0] ?? "").trim().toLowerCase();
  const groups = parseRobots(robotsTxt);
  // An empty "User-agent:" names no one; it must not stand in for our bot.
  const ours = groups.filter((group) => group.agents.some((agent) => agent !== "" && agent !== "*" && token.startsWith(agent)));
  const rules = (ours.length > 0 ? ours : groups.filter((group) => group.agents.includes("*"))).flatMap((group) => group.rules);
  let best: Rule | null = null;
  for (const rule of rules) {
    if (!patternToRegex(rule.pattern).test(path)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) best = rule;
  }
  return best?.allow ?? true;
}

export type PoliteOptions = {
  userAgent: string;
  minGapMs: number;
  fetch?: typeof globalThis.fetch;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
};

/** The rules one run shares between its readers, so the gap to a host holds whichever reader asks. */
export type PoliteRules = {
  userAgent: string;
  /** Waits until `minGapMs` has passed since the last request to `host`, then counts this one. */
  pace: (host: string) => Promise<void>;
  /** One paced request with our name, no redirect followed, 30 s to answer. */
  request: (url: string) => Promise<Response>;
  /** Throws unless `url` is on the same site as `from` and robots.txt lets us read its path. */
  check: (url: string, from: string) => Promise<void>;
};

export function politeRules(options: PoliteOptions): PoliteRules {
  const { userAgent, minGapMs, fetch = globalThis.fetch, wait = (ms) => new Promise((done) => setTimeout(done, ms)), now = Date.now } = options;
  const lastAt = new Map<string, number>();
  const robots = new Map<string, Promise<string>>();

  async function pace(host: string): Promise<void> {
    const last = lastAt.get(host);
    if (last !== undefined && last + minGapMs > now()) await wait(last + minGapMs - now());
    lastAt.set(host, now());
  }

  async function request(url: string): Promise<Response> {
    await pace(new URL(url).host);
    // A server that never answers fails the run in 30 s, not at the job's 15-minute limit.
    // Redirects are followed by hand, so each hop is checked before it is requested (below).
    return fetch(url, { headers: { "user-agent": userAgent }, redirect: "manual", signal: AbortSignal.timeout(PAGE_TIMEOUT_MS) });
  }

  function robotsFor(origin: string): Promise<string> {
    let text = robots.get(origin);
    if (!text) {
      text = request(`${origin}/robots.txt`).then((response) => {
        // No robots.txt (any 4xx) allows everything; a server error means we can't tell, so we stop.
        if (response.status >= 500) throw new Error(`${origin}/robots.txt answered ${response.status}, so we can't tell what it allows. Nothing read.`);
        return response.ok ? response.text() : "";
      });
      robots.set(origin, text);
    }
    return text;
  }

  /** A page or a redirect's target, checked before it is requested: the same site, and a path robots.txt allows. */
  async function check(url: string, from: string): Promise<void> {
    const { origin, pathname, search } = new URL(url);
    if (origin !== new URL(from).origin) throw new Error(`${from} redirected to another site (${origin}). Not read.`);
    if (!robotsAllows(await robotsFor(origin), userAgent, pathname + search)) throw new Error(`${url}: robots.txt asks bots not to read this path. Not read.`);
  }

  return { userAgent, pace, request, check };
}

/** The rules given, or new ones for this reader alone. */
export const rulesFrom = (options: PoliteOptions | { rules: PoliteRules }): PoliteRules => ("rules" in options ? options.rules : politeRules(options));

/** A page that answered with anything but success, with the status it answered. Never retried (D-77). */
export class PageError extends Error {
  readonly url: string;
  readonly status: number;
  constructor(url: string, status: number) {
    super(`${url} answered ${status}. A refusal is final: not retried (D-77).`);
    this.name = "PageError";
    this.url = url;
    this.status = status;
  }
}

/** The error for a page that answered with anything but success: a refusal is final (D-77). */
export const refusal = (url: string, status: number) => new PageError(url, status);

/** Statuses that say one page is not there, rather than "no" from the site. */
const MISSING = new Set([404, 410]);

/**
 * Whether a failed page is one page gone (404, 410) or slow (it did not answer in time), which a
 * reader of many pages may skip. A refusal (401, 403, 429), a robots.txt rule or anything else is
 * not: it stops the source's whole read (D-77).
 */
export function pageMissingOrSlow(error: unknown): boolean {
  if (error instanceof PageError) return MISSING.has(error.status);
  return error instanceof Error && error.name === "TimeoutError";
}

/** A reader for one run. Calls are expected one after another, as refresh makes them. */
export function politeFetcher(options: PoliteOptions | { rules: PoliteRules }): FetchText {
  const { request, check } = rulesFrom(options);
  return async (start) => {
    let url = start;
    await check(url, url);
    for (let hop = 0; ; hop += 1) {
      const response = await request(url);
      const location = response.status >= 300 && response.status < 400 ? response.headers.get("location") : null;
      if (location === null) {
        if (!response.ok) throw refusal(url, response.status);
        return response.text();
      }
      if (hop === MAX_REDIRECTS) throw new Error(`${start} redirected more than ${MAX_REDIRECTS} times. Not read.`);
      const next = new URL(location, url).href;
      await check(next, url);
      url = next;
    }
  };
}
