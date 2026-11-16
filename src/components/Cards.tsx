"use client";

import { pageBanner, type ListData, type ListRow } from "@/lib/data/select";
import { freshness } from "@/lib/wording/freshness";

/** Where a cinema's times came from, in words. Sample wording needs no clock. */
export function sourceLine(data: ListData, row: ListRow, now: string | null): string | null {
  const from = data.fresh[row.fresh]!;
  if (now === null && from.method !== "fixture") return null;
  return freshness({ name: from.source, method: from.method }, from.fetchedAt, now ?? from.fetchedAt, from.via).text;
}

/** The one notice a page shows: sample data, or times that are a day old or older. */
export function Banner({ data, now }: { data: ListData; now: string | null }) {
  const banner = pageBanner(data, now);
  return banner ? (
    <p role="status" className="banner" data-testid={`banner.${banner.kind}`}>
      {banner.text}
    </p>
  ) : null;
}
