"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Actions";
import { DayRow } from "@/components/ui/DayRow";
import { useSwapIn } from "@/components/ui/useSwapIn";
import type { Opening } from "@/lib/data/comingPage";
import { openingGroups, type Home } from "@/lib/data/filmPage";
import type { Day } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";
import { AreaList } from "./CinemaCard";
import s from "./film.module.css";

// A coming film's times already on sale (D-194, mockup/presales/ page 1): Times in the city as on any
// film's page: the picked day's line, a tile for each day on sale (Opens · Fri 18, then Sat 19 …, D-199),
// then each area and its cinemas with their times. A time opens the usual sheet with the cinema's booking
// link. The times are the sinima's own, absolute; nothing here is relative to now (rule 3).

export function OpeningTimes({ opening, title, notice, calendar, home, areaName, onOpen }: {
  opening: Opening;
  title: string;
  notice: ReactNode;
  calendar: { label: string; href: string } | null;
  home: (Home & { name: string }) | null;
  areaName: (slug: string) => string;
  onOpen: (row: ListRow) => void;
}) {
  const { data, days } = opening;
  const [day, setDay] = useState<Day>(0);
  const swap = useSwapIn(day);
  // Rows are soonest first and each day's follow the day before's: the picked day's are a slice.
  const start = days.slice(0, day).reduce((sum, each) => sum + each.count, 0);
  const rows = data.rows.slice(start, start + days[day]!.count);
  const groups = openingGroups(rows, (cinema) => data.cinemas[cinema]!.area, home);
  return (
    <section className={s.showings} aria-labelledby="film.times" data-testid="film.opening">
      <div className={s.heading}>
        <div>
          <h2 id="film.times">{title}</h2>
          <p>{days[day]!.subtitle}</p>
        </div>
        {/* One tile keeps page 1's narrow row (D-194); several take the width any film's day row does. */}
        <div className={days.length === 1 ? s.openingDay : undefined}>
          <DayRow
            tiles={days.map((each, index) => ({ day: index as Day, ...each.tile }))}
            value={day}
            onChange={(next, how) => {
              if (next === day) return;
              swap(next > day ? 1 : -1, how);
              setDay(next);
            }}
            testId="film.day"
          />
        </div>
      </div>
      {notice}
      <AreaList groups={groups} data={data} now={null} onOpen={onOpen} homeName={home?.name ?? ""} areaName={areaName} swap />
      {calendar && (
        <div className={s.openingCalendar}>
          <Button kind="secondary" icon="calendar-plus" href={calendar.href} testId="coming.calendar">
            {calendar.label}
          </Button>
        </div>
      )}
    </section>
  );
}
