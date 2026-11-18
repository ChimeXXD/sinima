"use client";

import { useRef, useState } from "react";
import { afterPaint } from "@/components/ui/motion";
import type { ChangeHow } from "@/components/ui/useSwapIn";
import type { ShownDay } from "@/lib/data/days";
import type { Day } from "@/lib/data/programme";
import { tileWords } from "@/lib/wording/day";
import s from "./dayRow.module.css";

// Block · Day row (Figma 290:87, D-148): up to five date tiles in the segmented control's grey
// track, each the weekday small over the date large. The picked tile's raised thumb slides to it.

export type DayTile = { day: Day; weekday: string; date: string; label: string };

/** The tiles for the days shown: the weekday small, the date large, the whole day as its name. */
export const dayTiles = (shown: ShownDay[], live: boolean): DayTile[] => shown.map((day) => ({ day: day.day, ...tileWords(day.day, day.date, live) }));

/**
 * A radio group, as the Segmented control: arrow keys move the choice (no motion from the keys),
 * only the picked tile is in the tab order, and each tile's name is its whole day.
 */
export function DayRow({ tiles, value, onChange, onPress, testId }: { tiles: DayTile[]; value: Day; onChange: (next: Day, how: ChangeHow) => void; onPress?: (day: Day) => void; testId?: string }) {
  const [instant, setInstant] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // As the Segmented control (D-112 F3): the thumb answers the tap at once, and the screen's list
  // follows just after that frame is drawn. `pending` holds the tapped day until `value` moves on.
  const [pending, setPending] = useState<{ to: Day; from: Day } | null>(null);
  if (pending && pending.from !== value) setPending(null);
  const shown = pending && pending.from === value ? pending.to : value;
  const index = Math.max(0, tiles.findIndex((tile) => tile.day === shown));
  const change = (next: Day, how: ChangeHow) => {
    setPending({ to: next, from: value });
    afterPaint(() => onChange(next, how));
  };

  function onKeyDown(event: React.KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + tiles.length) % tiles.length;
    setInstant(true);
    onPress?.(tiles[next]!.day);
    change(tiles[next]!.day, "keys");
    refs.current[next]?.focus();
  }

  return (
    <div className={s.dayTrack} role="radiogroup" aria-label="Day" data-instant={instant || undefined} style={{ "--n": tiles.length, "--i": index } as React.CSSProperties} onKeyDown={onKeyDown} data-testid={testId}>
      <span className={s.dayThumb} aria-hidden="true" />
      {tiles.map((tile, i) => (
        <button
          key={tile.day}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={i === index}
          aria-label={tile.label}
          tabIndex={i === index ? 0 : -1}
          className={s.dayTile}
          onPointerDown={() => onPress?.(tile.day)}
          onClick={(event) => {
            // Enter or Space on a focused tile is a click with no pointer (detail 0): no motion.
            setInstant(event.detail === 0);
            if (tile.day !== shown) change(tile.day, event.detail === 0 ? "keys" : "tap");
          }}
          data-testid={testId && `${testId}.${i}`}
        >
          <span className={s.dayWeekday}>{tile.weekday}</span>
          <span className={s.dayDate}>{tile.date}</span>
        </button>
      ))}
    </div>
  );
}
