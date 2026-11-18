"use client";

import { useState } from "react";
import { prefetchDay, useDayData, type DayStatus } from "@/components/ui/useDayData";
import { listedCount, shownDays, type ShownDay } from "@/lib/data/days";
import { anchorFor, type Day } from "@/lib/data/programme";
import type { ListData } from "@/lib/data/select";
import { TRY_AGAIN, dayFailed, dayLoading, listedSentence } from "@/lib/wording/day";

// The day row's state on a page (D-142, D-146, D-147, D-148): the days shown from now, the picked
// one, its list data (a later day's from its own file) and the words around it.

export type DayPicker = {
  shown: ShownDay[];
  /** The picked day; one that has gone (the page was left open past midnight) falls back to today. */
  current: ShownDay;
  day: Day;
  /** The page's "today" (anchorFor its own rows): a later day's rows are placed by it, not by themselves. */
  anchor: string;
  pick: (day: Day) => void;
  /** The picked day's list data; null while a later day's file is on its way or failed. */
  view: ListData | null;
  status: DayStatus;
  sentence: string | null;
  /** Whether any day shown is incomplete: the sentence's line stays so the list doesn't jump. */
  keep: boolean;
  load: { status: Exclude<DayStatus, "ready">; text: string; retry: string; onRetry: () => void } | null;
  press: (day: Day) => void;
};

/** `start` is a day's date the page was opened on (`?day=2026-11-21`), when it is one shown. */
export function useDayPicker(data: ListData, city: string, now: string, live: boolean, only: { filmId?: string; cinemaId?: string } = {}, start: string | null = null): DayPicker {
  const shown = shownDays(data.rows, data.days, now);
  // Kept by its date, not its place: past the evening's end the places move along one, and the
  // picked day stays the same day (or, gone, falls back to today).
  const [picked, setPicked] = useState<string | null>(null);
  const wanted = picked ?? start;
  const current = shown.find((candidate) => candidate.key === wanted) ?? shown[0]!;
  const pick = (day: Day) => setPicked(shown.find((candidate) => candidate.day === day)?.key ?? null);
  const { data: view, status, retry } = useDayData(data, city, current, only);
  const words = (day: ShownDay) => {
    const { listed, total } = listedCount(shown, day.day);
    return listedSentence({ listed, total, day: day.day, date: day.date, live });
  };
  const load =
    status === "ready"
      ? null
      : {
          status,
          text: status === "loading" ? dayLoading(current.day, current.date, live) : dayFailed({ day: current.day, date: current.date, live, offline: typeof navigator !== "undefined" && !navigator.onLine }),
          retry: TRY_AGAIN,
          onRetry: retry,
        };
  return {
    shown,
    current,
    day: current.day,
    anchor: anchorFor(data.rows, now),
    pick,
    view,
    status,
    sentence: words(current),
    keep: shown.some((day) => words(day) !== null),
    load,
    press: (day) => prefetchDay(city, shown.find((candidate) => candidate.day === day)),
  };
}
