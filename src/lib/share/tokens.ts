import { readFileSync } from "node:fs";
import { join } from "node:path";

// Build time only. The share cards are drawn by next/og (Satori), which can't read CSS variables, so
// each colour and shadow is read from tokens.css as its light value (the cards are light, like the
// app by default, D-143) instead of being typed a second time. Colours live in that one file.

let declared: Map<string, string> | undefined;

/** Every `--name: value;` in tokens.css, first declaration wins (the light :root one). */
function declarations(css = readFileSync(join(process.cwd(), "src", "styles", "tokens.css"), "utf8")): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of css.replace(/\/\*[^]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!found.has(name!)) found.set(name!, value!.trim());
  }
  return found;
}

/** Splits "a, b" at its top-level commas: "light-dark(var(--x), color-mix(…, …))" → two parts. */
function args(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "(") depth++;
    else if (inner[i] === ")") depth--;
    else if (inner[i] === "," && depth === 0) {
      parts.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...parts, inner.slice(start).trim()];
}

const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
/** Fails the build on a colour this reader can't mix (short hex, a colour function) instead of drawing "#NaN". */
function hex6(value: string): string {
  if (!HEX.test(value)) throw new Error(`tokens.css: "${value}" is not #rrggbb, which a share card needs`);
  return value;
}
const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex6(hex).slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** `color-mix(in srgb, A p%, B)`: A weighted p, B the rest. */
function mix(a: string, p: number, b: string): string {
  const [ca, cb] = [channels(a), channels(b)];
  return toHex(ca.map((c, i) => c * p + cb[i]! * (1 - p)));
}

function resolve(value: string, tokens: Map<string, string>, seen = 0): string {
  if (seen > 20) throw new Error(`tokens.css: "${value}" refers to itself`);
  const call = value.match(/^([\w-]+)\((.*)\)$/s);
  if (!call) return value;
  const [, fn, inner] = call;
  const parts = args(inner!);
  if (fn === "var") {
    const next = tokens.get(parts[0]!);
    if (next === undefined) throw new Error(`tokens.css: no ${parts[0]}`);
    return resolve(next, tokens, seen + 1);
  }
  if (fn === "light-dark") return resolve(parts[0]!, tokens, seen + 1);
  if (fn === "color-mix" && parts[0] === "in srgb") {
    const [a, pct] = parts[1]!.split(/\s+(?=[\d.]+%$)/);
    const p = pct ? parseFloat(pct) / 100 : 0.5;
    return mix(resolve(a!, tokens, seen + 1), p, resolve(parts[2]!, tokens, seen + 1));
  }
  throw new Error(`tokens.css: can't read "${value}" for a share card`);
}

/** A token's light value: "text-accent" → its hex; a shadow token → its shadow as written. */
export function lightToken(name: string, css?: string): string {
  const tokens = css === undefined ? (declared ??= declarations()) : declarations(css);
  const value = tokens.get(`--${name}`);
  if (value === undefined) throw new Error(`tokens.css: no --${name}`);
  return resolve(value, tokens);
}

/** A hex colour at an opacity, as #rrggbbaa (Satori draws it; CSS's color-mix it does not). */
export const withAlpha = (hex: string, alpha: number) => `${hex6(hex).slice(0, 7)}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
