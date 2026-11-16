"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { useDesktop } from "@/components/ui/useDesktop";
import type { ChangeHow } from "@/components/ui/useSwapIn";
import type { FormatTag } from "@/lib/data/format";
import type { Day } from "@/lib/data/programme";
import { PICKER_SHEETS, cinemaCount, pickerValue } from "@/lib/wording/cinemas";
import s from "./pickers.module.css";

// The Cinemas tab's pickers (Figma Cinemas › Pickers, Area picker open): Area, Day and Format in
// one row, each opening a sheet on a phone and an iPad, and on a computer the Spring dropdown under
// it, the picker still in view (D-109 c). Its chevron turns up while it is open, and a value picked
// by tap rolls into it. On a phone the row scrolls under a fade at its edge.

export type Which = "area" | "day" | "format";

// The computer's menus are loaded only on a computer, as the page starts: a phone never downloads them.
type MenusModule = typeof import("./PickerMenus").default;
let menusModule: Promise<MenusModule> | null = null;
/** Loads them once; a failed load is tried again on the next tap of a picker. */
const loadMenus = (done: (menus: MenusModule) => void) =>
  void (menusModule ??= import("./PickerMenus").then((module) => module.default)).then(done, () => (menusModule = null));
export type AreaChoice = { slug: string; name: string; cinemas: number };

/** A choice in a picker's sheet: the picked one tinted and ticked. */
function Option({ icon, label, count, selected, onPick, testId }: { icon?: IconName; label: string; count?: string; selected: boolean; onPick: (event: React.MouseEvent) => void; testId: string }) {
  return (
    <button type="button" className={s.option} aria-pressed={selected} data-selected={selected || undefined} onClick={onPick} data-testid={testId}>
      {icon && <Icon name={icon} size={18} className={s.optionIcon} />}
      <span className={s.optionLabel}>{label}</span>
      {count && <span className={s.count}>{count}</span>}
      {selected && <Icon name="check" size={18} className={s.check} />}
    </button>
  );
}

export type PickersProps = { areas: AreaChoice[]; area: string | null; onArea: (slug: string) => void; days: [string, string]; day: Day; onDay: (day: Day, how: ChangeHow) => void; formats: { tag: FormatTag; cinemas: number }[]; format: FormatTag | null; onFormat: (tag: FormatTag | null) => void };

export function Pickers(props: PickersProps) {
  const { areas, area, onArea, days, day, onDay, formats, format, onFormat } = props;
  const [open, setOpen] = useState<Which | null>(null);
  const [rolled, setRolled] = useState<Which | null>(null);
  /** Opened with Enter or Space: the menu appears at once (no motion on keyboard actions). */
  const [keys, setKeys] = useState(false);
  const desktop = useDesktop();
  const [Menus, setMenus] = useState<MenusModule | null>(null);
  const fetchMenus = () => loadMenus((loaded) => setMenus(() => loaded));
  useEffect(() => {
    if (desktop) loadMenus((loaded) => setMenus(() => loaded));
  }, [desktop]);
  const refs = { area: useRef<HTMLButtonElement>(null), day: useRef<HTMLButtonElement>(null), format: useRef<HTMLButtonElement>(null) };
  const name = areas.find((candidate) => candidate.slug === area)?.name ?? null;
  const values: Record<Which, string> = { area: pickerValue.area(name), day: days[day], format: pickerValue.format(format) };
  const labels: Record<Which, string> = { area: "Area", day: "Day", format: "Format" };
  // Enter or Space on an option is a click with no pointer (detail 0): the change it makes doesn't animate.
  const pick = (choose: (how: ChangeHow) => void) => (event: React.MouseEvent) => (choose(event.detail === 0 ? "keys" : "tap"), setOpen(null));
  const close = (refocus: boolean) => {
    if (refocus && open) refs[open].current?.focus();
    setOpen(null);
  };
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
            <button
              key={which}
              ref={refs[which]}
              type="button"
              className={s.picker}
              aria-haspopup={desktop ? "listbox" : "dialog"}
              aria-expanded={open === which}
              aria-label={`${labels[which]}: ${values[which]}`}
              onClick={(event) => {
                if (desktop && !Menus) fetchMenus();
                setRolled(null); // the last pick's roll is spent: a later change from elsewhere doesn't roll
                setKeys(event.detail === 0);
                setOpen((now) => (now === which && desktop ? null : which));
              }}
              data-testid={`pick.${which}`}
            >
              <span className={s.label}>{labels[which]}</span>
              {/* Keyed by its value, so a value picked by tap rolls in (D-109 c); never on first draw. */}
              <span key={values[which]} className={s.value} data-roll={rolled === which || undefined}>
                {values[which]}
              </span>
              <Icon name="chevron-down" size={16} className={s.down} />
            </button>
          ))}
        </div>
      </div>
      {desktop ? (
        Menus && <Menus {...props} open={open} triggers={refs} instant={keys} onRolled={setRolled} onClose={close} />
      ) : (
        <>
          {sheet(
            "area",
            areas.map((candidate) => <Option key={candidate.slug} icon="map-pin" label={candidate.name} count={cinemaCount(candidate.cinemas)} selected={candidate.slug === area} onPick={pick(() => onArea(candidate.slug))} testId={`sheet.area.${candidate.slug}`} />),
          )}
          {sheet(
            "day",
            ([0, 1] as const).map((option) => <Option key={option} label={days[option]} selected={day === option} onPick={pick((how) => onDay(option, how))} testId={`day.option.${option === 0 ? "today" : "tomorrow"}`} />),
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
      )}
    </>
  );
}
