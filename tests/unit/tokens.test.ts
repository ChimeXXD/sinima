import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import figma from "../../docs/design/figma-tokens.json";
import { hasHardCodedColour } from "../../scripts/check-tokens.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const css = readFileSync(join(ROOT, "src", "styles", "tokens.css"), "utf8");

/** The value a custom property is declared with in tokens.css, or undefined. */
function declared(name: string): string | undefined {
  const m = css.match(new RegExp(`${name.replace(/[-]/g, "\\-")}:\\s*([^;]+);`));
  return m?.[1]?.trim();
}

// Semantic colours are written `--name: light-dark(#light, #dark);`. Figma holds the light mode only.
const colours = new Map<string, { light: string; dark: string }>();
for (const m of css.matchAll(/(--[\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi)) {
  colours.set(m[1]!, { light: m[2]!.toLowerCase(), dark: m[3]!.toLowerCase() });
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
function pair(fg: string, bg: string, mode: "light" | "dark"): number {
  const f = colours.get(fg);
  const b = colours.get(bg);
  if (!f || !b) throw new Error(`missing token: ${fg} or ${bg}`);
  return contrast(f[mode], b[mode]);
}

describe("tokens match the Figma design system (D-66, D-82)", () => {
  it("declares every primitive colour with Figma's value", () => {
    const wrong = Object.entries(figma.primitives).filter(([name, hex]) => declared(name)?.toLowerCase() !== hex);
    expect(wrong).toEqual([]);
  });

  it("declares every semantic colour with Figma's light value, and a dark value", () => {
    const wrong = Object.entries(figma.semantic).filter(([name, t]) => colours.get(name)?.light !== t.light);
    expect(wrong.map(([name]) => name)).toEqual([]);
  });

  it("declares every space and radius in px", () => {
    const wrong = Object.entries(figma.size).filter(([name, px]) => declared(name) !== `${px}px`);
    expect(wrong).toEqual([]);
  });

  it("declares every text style as a font shorthand with Figma's weight, size, line height and family", () => {
    const wrong = Object.entries(figma.text).filter(([name, t]) => {
      const v = declared(`--type-${name.toLowerCase().replace("/", "-")}`);
      const family = t.family === "Urbanist" ? "var(--font-sans)" : "var(--font-hand)";
      return v !== `${t.weight} ${t.size}px/${t.lineHeight} ${family}`;
    });
    expect(wrong.map(([name]) => name)).toEqual([]);
    // CSS's font shorthand has no letter-spacing, so a style that tracks carries it separately.
    const tracked = Object.entries(figma.text).filter(([, t]) => t.letterSpacingEm !== 0);
    for (const [name, t] of tracked) expect(declared(`--type-${name.toLowerCase().replace("/", "-")}-tracking`), name).toBe(`${t.letterSpacingEm}em`);
  });

  it("declares every shadow and blur with Figma's values", () => {
    const wrong = Object.entries(figma.effects).filter(([name, value]) => declared(`--fx-${name.toLowerCase().replace("/", "-")}`) !== value);
    expect(wrong.map(([name]) => name)).toEqual([]);
  });

  it("uses Urbanist for text and Story Script for handwritten notes", () => {
    expect(declared("--font-sans")).toMatch(/^"Urbanist"/);
    expect(declared("--font-hand")).toMatch(/^"Story Script"/);
  });

  it("names the motion curves the skills require (ease-out to enter, never ease-in)", () => {
    expect(declared("--ease-out")).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
    expect(declared("--ease-in-out")).toBe("cubic-bezier(0.77, 0, 0.175, 1)");
    expect(declared("--ease-drawer")).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
  });
});

// Figma's own pairs that miss WCAG AA (4.5:1) in light mode. Built exactly as designed, waiting for
// Chime's call (O-17). Remove a pair from here once it is fixed; the test below then holds it to AA.
const KNOWN_LOW = new Set(["--text-on-action on --action-primary", "--text-accent on --bg-page", "--text-secondary on --bg-surface"]);

describe("contrast (WCAG 2.1)", () => {
  it.each(["light", "dark"] as const)("keeps body text at AAA (7:1) in %s", (mode) => {
    expect(pair("--text-primary", "--bg-page", mode)).toBeGreaterThanOrEqual(7);
    expect(pair("--text-primary", "--bg-surface", mode)).toBeGreaterThanOrEqual(7);
  });

  it.each(["light", "dark"] as const)("keeps all other text at AA (4.5:1) in %s, apart from the known Figma pairs", (mode) => {
    const pairs: [string, string][] = [
      ["--text-secondary", "--bg-page"], ["--text-secondary", "--bg-surface"],
      ["--text-body-strong", "--bg-page"], ["--text-body-strong", "--bg-surface"],
      ["--text-on-action", "--action-primary"], ["--text-on-action", "--action-secondary"],
      ["--text-accent", "--bg-page"], ["--text-brand-deep", "--bg-accent-soft"],
      ["--color-stale", "--bg-page"], ["--color-stale", "--bg-surface"], // the old-data warning (rule 2)
    ];
    const low = pairs
      .filter(([fg, bg]) => pair(fg, bg, mode) < 4.5)
      .map(([fg, bg]) => `${fg} on ${bg}`)
      .filter((p) => !(mode === "light" && KNOWN_LOW.has(p)));
    expect(low).toEqual([]);
  });

  it.each(["light", "dark"] as const)("keeps the focus ring at 3:1 against the page and the surface in %s", (mode) => {
    expect(pair("--color-focus", "--bg-page", mode)).toBeGreaterThanOrEqual(3);
    expect(pair("--color-focus", "--bg-surface", mode)).toBeGreaterThanOrEqual(3);
  });

  it("still finds each known low pair low, so a fix is noticed and the exception removed", () => {
    for (const p of KNOWN_LOW) {
      const [fg, bg] = p.split(" on ") as [string, string];
      expect(pair(fg, bg, "light"), p).toBeLessThan(4.5);
    }
  });
});

describe("check-tokens: colours outside tokens.css", () => {
  it.each([
    'color: #fff;',
    '<p style={{ background: "rgb(0 0 0)" }}>',
    '<p className="text-red-500">',
    '<div className="bg-white border-slate-200">',
    '<p className="hover:text-blue-700/50">',
    "color: red;",
    "border-bottom: 1px solid black;",
    '<p style={{ color: "white" }}>',
    '<p className="bg-[tomato]">',
  ])("flags %s", (line) => {
    expect(hasHardCodedColour(line)).toBe(true);
  });

  it.each([
    '<p className="mt-2 text-text-muted">Being built.</p>',
    '<a className="bg-book text-book-text rounded-full">Book</a>',
    "background: var(--color-surface);",
    "white-space: nowrap;",
    "<p>Read from Filmhouse's site 2 hours ago</p>",
    "outline: 2px solid var(--color-focus);",
    '<a href="/film/black-phone#times">',
    "color: currentColor;",
    "background: transparent;",
  ])("allows %s", (line) => {
    expect(hasHardCodedColour(line)).toBe(false);
  });
});
