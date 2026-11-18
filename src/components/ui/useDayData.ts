"use client";

import { useEffect, useState } from "react";
import { dayFileUrl, type ShownDay } from "@/lib/data/days";
import type { ListData } from "@/lib/data/select";

// A later day's times (D-147): fetched from `/data/<city>/<date>.json` when a visitor picks that
// day, never before (a tile pressed starts it a moment early), by code loaded only then (laterDay.ts).
// Each file is fetched once a visit; the service worker keeps it for offline.

const later = () => import("@/lib/data/laterDay");

/** Starts fetching a later day's file as its tile is pressed, before the tap lands. */
export function prefetchDay(city: string, shown: ShownDay | undefined) {
  if (shown?.later) later().then(({ fetchDay }) => fetchDay(dayFileUrl(city, shown.key))).catch(() => {});
}

export type DayStatus = "ready" | "loading" | "failed";

/** Drops the failed days, so each is fetched again. */
const forgetFailed = <T,>(all: Record<string, T | "failed">) => Object.fromEntries(Object.entries(all).filter(([, value]) => value !== "failed")) as Record<string, T | "failed">;

/**
 * The picked day's list data: the page's own for today and tomorrow, the day's file for a later
 * day. `data` is null until a later day's file has come. `retry` fetches a failed one again, and
 * so does the phone coming back online.
 */
export function useDayData(page: ListData, city: string, shown: ShownDay | undefined, only: { filmId?: string; cinemaId?: string } = {}): { data: ListData | null; status: DayStatus; retry: () => void } {
  const [got, setGot] = useState<Record<string, ListData | "failed">>({});
  const key = shown?.later ? shown.key : null;
  const current = key === null ? undefined : got[key];
  const { filmId, cinemaId } = only;

  useEffect(() => {
    if (key === null || current !== undefined) return;
    later()
      .then(async ({ fetchDay, laterDayData }) => laterDayData(await fetchDay(dayFileUrl(city, key)), page, { filmId, cinemaId }))
      .then(
        (data) => setGot((all) => ({ ...all, [key]: data })),
        () => setGot((all) => ({ ...all, [key]: "failed" })),
      );
  }, [key, current, city, page, filmId, cinemaId]);

  const retry = () => setGot(forgetFailed);
  useEffect(() => {
    if (current !== "failed") return;
    const again = () => setGot(forgetFailed);
    window.addEventListener("online", again);
    return () => window.removeEventListener("online", again);
  }, [current]);

  if (key === null) return { data: page, status: "ready", retry };
  if (current === undefined) return { data: null, status: "loading", retry };
  if (current === "failed") return { data: null, status: "failed", retry };
  return { data: current, status: "ready", retry };
}
