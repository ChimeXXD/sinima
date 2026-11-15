"use client";

import { useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import type { FormatTag } from "@/lib/data/format";
import type { Day } from "@/lib/data/programme";
import { PICKER_SHEETS, cinemaCount, pickerValue } from "@/lib/wording/cinemas";
import s from "./pickers.module.css";

// The Cinemas tab's pickers (Figma Cinemas › Pickers, Area picker open): Area, Day and Format in
// one row, each opening a sheet on a phone and an iPad and a popover over it on desktop. On a
// phone the row scrolls under a fade at its edge.

type Which = "area" | "day" | "format";
export type AreaChoice = { slug: string; name: string; cinemas: number };

/** A choice in a picker's sheet: the picked one tinted and ticked. */
function Option({ icon, label, count, selected, onPick, testId }: { icon?: IconName; label: string; count?: string; selected: boolean; onPick: () => void; testId: string }) {
  return (
    <button type="button" className={s.option} aria-pressed={selected} data-selected={selected || undefined} onClick={onPick} data-testid={testId}>
      {icon && <Icon name={icon} size={18} className={s.optionIcon} />}
      <span className={s.optionLabel}>{label}</span>
      {count && <span className={s.count}>{count}</span>}
      {selected && <Icon name="check" size={18} className={s.check} />}
    </button>
  );
}

export function Pickers(props: { areas: AreaChoice[]; area: string | null; onArea: (slug: string) => void; days: [string, string]; day: Day; onDay: (day: Day) => void; formats: { tag: FormatTag; cinemas: number }[]; format: FormatTag | null; onFormat: (tag: FormatTag | null) => void }) {
  const { areas, area, onArea, days, day, onDay, formats, format, onFormat } = props;
  const [open, setOpen] = useState<Which | null>(null);
  const refs = { area: useRef<HTMLButtonElement>(null), day: useRef<HTMLButtonElement>(null), format: useRef<HTMLButtonElement>(null) };
  const name = areas.find((candidate) => candidate.slug === area)?.name ?? null;
  const values: Record<Which, string> = { area: pickerValue.area(name), day: days[day], format: pickerValue.format(format) };
  const labels: Record<Which, string> = { area: "Area", day: "Day", format: "Format" };
  const pick = (choose: () => void) => () => (choose(), setOpen(null));

  const sheet = (which: Which, children: React.ReactNode) => (
    <Sheet open={open === which} onClose={() => setOpen(null)} title={PICKER_SHEETS[which].title} subtitle={PICKER_SHEETS[which].subtitle} picker={refs[which]} testId={`sheet.${which}`}>
      <div className={s.options}>
        {children}
      </div>
    </Sheet>
  );

  return (
    <>
      <div className={s.wrap}>
        <div className={s.row} role="group" aria-label="Filters">
          {(["area", "day", "format"] as const).map((which) => (
            <button key={which} ref={refs[which]} type="button" className={s.picker} aria-haspopup="dialog" aria-expanded={open === which} aria-label={`${labels[which]}: ${values[which]}`} onClick={() => setOpen(which)} data-testid={`pick.${which}`}>
              <span className={s.label}>{labels[which]}</span>
              <span className={s.value}>{values[which]}</span>
              <Icon name="chevron-down" size={16} className={s.down} />
            </button>
          ))}
        </div>
      </div>
      {sheet(
        "area",
        areas.map((candidate) => <Option key={candidate.slug} icon="map-pin" label={candidate.name} count={cinemaCount(candidate.cinemas)} selected={candidate.slug === area} onPick={pick(() => onArea(candidate.slug))} testId={`sheet.area.${candidate.slug}`} />),
      )}
      {sheet(
        "day",
        ([0, 1] as const).map((option) => <Option key={option} label={days[option]} selected={day === option} onPick={pick(() => onDay(option))} testId={`day.option.${option === 0 ? "today" : "tomorrow"}`} />),
      )}
      {sheet(
        "format",
        <>
          <Option label="Any format" selected={format === null} onPick={pick(() => onFormat(null))} testId="format.option.any" />
          {formats.map(({ tag, cinemas }) => (
            <Option key={tag} label={tag} count={cinemaCount(cinemas)} selected={format === tag} onPick={pick(() => onFormat(tag))} testId={`format.option.${tag}`} />
          ))}
        </>,
      )}
    </>
  );
}
