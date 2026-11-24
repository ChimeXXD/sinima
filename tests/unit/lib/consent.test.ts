import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_KEY, bannerDue, counts, getConsent, onConsent, readConsent, setConsent } from "@/lib/consent";

// Counting visits (D-191): asked once, kept on the phone, and nothing is counted without a yes.

/** A phone's storage: a Map, or one that throws (a private tab with storage switched off). */
function storage(blocked = false) {
  const kept = new Map<string, string>();
  const fail = () => {
    throw new Error("SecurityError");
  };
  return {
    kept,
    getItem: blocked ? fail : (key: string) => kept.get(key) ?? null,
    setItem: blocked ? fail : (key: string, value: string) => void kept.set(key, value),
  };
}
function use(store: ReturnType<typeof storage>) {
  vi.stubGlobal("localStorage", store);
  vi.stubGlobal("window", { addEventListener: () => {}, removeEventListener: () => {} });
}
afterEach(() => vi.unstubAllGlobals());

describe("readConsent", () => {
  it("reads yes and no, and anything else as not asked yet", () => {
    expect(readConsent("yes")).toBe("yes");
    expect(readConsent("no")).toBe("no");
    expect(readConsent(null)).toBeNull();
    expect(readConsent("maybe")).toBeNull();
    expect(readConsent("")).toBeNull();
  });
});

describe("bannerDue", () => {
  it("asks only when there is no answer and the answer can be kept", () => {
    expect(bannerDue(null, true)).toBe(true);
    expect(bannerDue("yes", true)).toBe(false);
    expect(bannerDue("no", true)).toBe(false);
    // Storage switched off: an answer couldn't be kept, so asking would come back on every page.
    expect(bannerDue(null, false)).toBe(false);
  });
});

describe("counts", () => {
  it("counts only after a yes, and only on Vercel", () => {
    expect(counts("yes", true)).toBe(true);
    expect(counts("no", true)).toBe(false);
    expect(counts(null, true)).toBe(false);
    expect(counts("yes", false)).toBe(false);
  });
});

describe("the answer kept on the phone", () => {
  it("is stored under ls.count and read back", () => {
    const store = storage();
    use(store);
    expect(getConsent()).toEqual({ consent: null, storage: true });
    expect(setConsent("yes")).toBe(true);
    expect(store.kept.get(CONSENT_KEY)).toBe("yes");
    expect(getConsent()).toEqual({ consent: "yes", storage: true });
  });
  it("tells whoever listens when it changes on this page", () => {
    use(storage());
    const heard: (string | null)[] = [];
    const stop = onConsent((consent) => heard.push(consent));
    setConsent("no");
    setConsent("yes");
    stop();
    setConsent("no");
    expect(heard).toEqual(["no", "yes"]);
  });
  it("with storage switched off: not asked, nothing kept, nothing counted", () => {
    use(storage(true));
    expect(getConsent()).toEqual({ consent: null, storage: false });
    expect(setConsent("yes")).toBe(false);
  });
});
