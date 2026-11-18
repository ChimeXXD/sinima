"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListData, ListRow } from "@/lib/data/select";

// The showing sheet, loaded when a time is first tapped: most visits to an area's or a cinema's
// page never open one (the page budget, D-21). The sheet reads only the tapped film's rows, so its
// "next times nearby" are for the same film.

/** A film page's link to one showing: #s=<cinema>@<start>. */
export const showingHash = (data: ListData, row: ListRow) => `#s=${data.cinemas[row.cinema]!.id}@${row.at}`;

type SheetPart = typeof import("./ShowingSheet").ShowingSheet;
let part: Promise<SheetPart> | null = null;
function loadSheet(): Promise<SheetPart> {
  part ??= import("./ShowingSheet").then((loaded) => loaded.ShowingSheet);
  part.catch(() => (part = null)); // a failed load is tried again on the next tap
  return part;
}

/** `linked` is a showing named in the page's address (a shared link): it opens once. */
export function useLazySheet(data: ListData, linked: ListRow | null = null) {
  const [Sheet, setSheet] = useState<SheetPart | null>(null);
  // The row with the list it came from: a later day's rows index that day's own films (D-147), so
  // the sheet keeps the list it was opened from even if the page moves to another day.
  const [picked, setPicked] = useState<{ row: ListRow; from: ListData } | null>(null);
  const [open, setOpen] = useState(false);
  const row = picked?.row ?? null;
  const sheetData = useMemo(() => (picked ? { ...picked.from, rows: picked.from.rows.filter((other) => other.film === picked.row.film) } : data), [data, picked]);
  const openRow = useCallback(
    (next: ListRow) => {
      setPicked({ row: next, from: data });
      void loadSheet().then((loaded) => (setSheet(() => loaded), setOpen(true)), () => {});
    },
    [data],
  );
  const opened = useRef<ListRow | null>(null);
  useEffect(() => {
    if (linked && opened.current !== linked) {
      opened.current = linked;
      openRow(linked);
    }
  }, [linked, openRow]);
  return { Sheet, row, open, sheetData, openRow, close: () => setOpen(false) };
}
