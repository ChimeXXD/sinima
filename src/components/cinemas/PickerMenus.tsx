"use client";

import { SpringMenu, type MenuOption } from "@/components/ui/SpringMenu";
import type { ChangeHow } from "@/components/ui/useSwapIn";
import { PICKER_SHEETS, cinemaCount } from "@/lib/wording/cinemas";
import type { PickersProps, Which } from "./Pickers";

// The pickers on a computer (D-109 c): each drops the Spring dropdown under it, with the same
// choices as its sheet on a phone. Loaded by Pickers only at a computer's width.

type Option = MenuOption & { choose: (how: ChangeHow) => void };

export default function PickerMenus({ open, triggers, instant, onRolled, onClose, ...p }: PickersProps & { open: Which | null; triggers: Record<Which, React.RefObject<HTMLButtonElement | null>>; instant: boolean; onRolled: (which: Which | null) => void; onClose: (refocus: boolean) => void }) {
  const menu = (which: Which, options: Option[], columns: 1 | 2, width: number) => (
    <SpringMenu
      open={open === which}
      anchor={triggers[which]}
      instant={instant}
      options={options}
      columns={columns}
      width={width}
      label={PICKER_SHEETS[which].title}
      onPick={(id, byKey) => {
        const option = options.find((candidate) => candidate.id === id)!;
        if (option.selected) return;
        option.choose(byKey ? "keys" : "tap");
        onRolled(byKey ? null : which);
      }}
      onClose={onClose}
      testId={`sheet.${which}`}
    />
  );
  return (
    <>
      {menu(
        "area",
        p.areas.map((area) => ({ id: area.slug, label: area.name, count: cinemaCount(area.cinemas), selected: area.slug === p.area, testId: `sheet.area.${area.slug}`, choose: () => p.onArea(area.slug) })),
        2,
        640,
      )}
      {menu(
        "day",
        ([0, 1] as const).map((day) => ({ id: String(day), label: p.days[day], selected: p.day === day, testId: `day.option.${day === 0 ? "today" : "tomorrow"}`, choose: (how: ChangeHow) => p.onDay(day, how) })),
        1,
        240,
      )}
      {menu(
        "format",
        [{ id: "any", label: "Any format", selected: p.format === null, testId: "format.option.any", choose: () => p.onFormat(null) }, ...p.formats.map(({ tag, cinemas }) => ({ id: tag, label: tag, count: cinemaCount(cinemas), selected: p.format === tag, testId: `format.option.${tag}`, choose: () => p.onFormat(tag) }))],
        1,
        260,
      )}
    </>
  );
}
