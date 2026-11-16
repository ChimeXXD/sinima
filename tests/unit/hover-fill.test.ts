import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// D-110: every hover fill is the one token, half as dark as round 2's; no stylesheet mixes its own
// grey from the text colour.
const sheets = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? sheets(join(dir, entry.name)) : entry.name.endsWith(".module.css") ? [join(dir, entry.name)] : []));

describe("hover fills", () => {
  it("the token mixes 2 % of the text colour into the surface and raised, 1 % into the page (D-111)", () => {
    const tokens = readFileSync("src/styles/tokens.css", "utf8");
    expect(tokens).toContain("--hover-fill: color-mix(in srgb, var(--bg-surface), var(--text-primary) 2%);");
    expect(tokens).toContain("--hover-fill-page: color-mix(in srgb, var(--bg-page), var(--text-primary) 1%);");
    expect(tokens).toContain("--hover-fill-raised: color-mix(in srgb, var(--bg-raised), var(--text-primary) 2%);");
  });
  it("no component stylesheet mixes its own grey from the surface, raised or page colour", () => {
    const own = sheets("src/components").filter((file) => /color-mix\(in srgb, var\(--bg-(surface|raised|page)\), var\(--text-primary\)/.test(readFileSync(file, "utf8")));
    expect(own).toEqual([]);
  });
});
