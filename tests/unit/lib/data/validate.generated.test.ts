import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { withShowingIds } from "@/lib/data/showingId";
import type { ShowtimesFile } from "@/lib/data/types";
import { validateShowtimes } from "@/lib/data/validate";

// The files `npm run refresh` last wrote, when there are any (they are not committed while the
// site runs on sample data, D-45). Older files may log showings that have since ended; they must
// still be sound. An area's file leaves out each showing's usual id (D-156), so each file is
// checked as a reader sees it, with the ids put back.
const root = join(import.meta.dirname, "../../../..");
const areaDir = join(root, "public/data/area");
const paths = [
  join(root, "data/showtimes.json"),
  join(root, "public/data/all.json"),
  ...(existsSync(areaDir) ? readdirSync(areaDir).map((name) => join(areaDir, name)) : []),
].filter((path) => existsSync(path));

describe.skipIf(paths.length === 0)("the data files on disk", () => {
  it.each(paths.map((path) => [path.slice(root.length + 1), path]))("%s validates", (_, path) => {
    const result = validateShowtimes(withShowingIds(JSON.parse(readFileSync(path, "utf8")) as ShowtimesFile));
    expect(result.ok ? [] : result.errors).toEqual([]);
  });
});
