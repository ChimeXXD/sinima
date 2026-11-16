import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// DESIGN.md › Motion: every hover answers with a fade, never in one frame. A hover rule (inside
// `@media (hover: hover) and (pointer: fine)`) changes an element whose class must have a
// transition or animation somewhere in the same stylesheet.

const sheets = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? sheets(join(dir, entry.name)) : entry.name.endsWith(".module.css") ? [join(dir, entry.name)] : []));
/** Classes always used with another that carries the fade: `.primary` and `.secondary` sit on `.button`. */
const SHARED: Record<string, string[]> = { "actions.module.css": ["primary", "secondary"] };
const classes = (selector: string) => [...selector.matchAll(/\.([A-Za-z][\w-]*)/g)].map((match) => match[1]!);

function hoversWithoutFade(file: string): string[] {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const faded = new Set<string>(SHARED[file.split("/").at(-1)!] ?? []);
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (/\b(transition|animation)\b/.test(body!)) classes(selector!).forEach((name) => faded.add(name));
  const missing: string[] = [];
  for (const media of css.matchAll(/@media[^{]*hover:\s*hover[^{]*\{/g)) {
    const start = media.index! + media[0].length;
    let depth = 1;
    let end = start;
    for (; end < css.length && depth > 0; end++) {
      if (css[end] === "{") depth++;
      else if (css[end] === "}") depth--;
    }
    const block = css.slice(start, end - 1);
    for (const [, selector] of block.matchAll(/([^{}]+)\{[^{}]*\}/g))
      for (const part of selector!.split(",").filter((p) => p.includes(":hover"))) {
        const target = part.trim().split(/\s+|>/).at(-1)!;
        const names = classes(target).length ? classes(target) : classes(part);
        if (!names.some((name) => faded.has(name))) missing.push(`${file}: ${part.trim()}`);
      }
  }
  return missing;
}

describe("hovers fade", () => {
  it("every hover rule changes an element that has a transition", () => {
    expect(sheets("src/components").flatMap(hoversWithoutFade)).toEqual([]);
  });
});
