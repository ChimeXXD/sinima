import { describe, expect, it } from "vitest";
import { lightToken, withAlpha } from "@/lib/share/tokens";

// The share cards read their colours from tokens.css (build time), as the light theme.

describe("lightToken", () => {
  it("reads light-dark's light value", () => {
    expect(lightToken("text-accent")).toBe("#3b82f6");
    expect(lightToken("bg-page")).toBe("#ffffff");
  });

  it("follows var() into the palette", () => {
    expect(lightToken("poster-1")).toBe(lightToken("p-folder-blue"));
  });

  it("mixes color-mix(in srgb) the way the browser does", () => {
    const css = ":root { --a: #ff0000; --b: #0000ff; --m: color-mix(in srgb, var(--a) 25%, var(--b)); }";
    expect(lightToken("m", css)).toBe("#4000bf");
  });

  it("returns a shadow as written", () => {
    expect(lightToken("fx-sticker-large")).toBe("0 9px 9.6px #5d5d5d40");
  });

  it("fails loudly on a missing token", () => {
    expect(() => lightToken("no-such-token")).toThrow(/no --no-such-token/);
  });
});

describe("withAlpha", () => {
  it("adds an alpha byte", () => {
    expect(withAlpha("#0b1b3f", 0.72)).toBe("#0b1b3fb8");
  });
});
