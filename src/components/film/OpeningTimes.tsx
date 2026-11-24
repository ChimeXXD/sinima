"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Actions";
import { DayRow } from "@/components/ui/DayRow";
import type { Opening } from "@/lib/data/comingPage";
import { openingGroups, type Home } from "@/lib/data/filmPage";
import type { ListRow } from "@/lib/data/select";
import { AreaList } from "./CinemaCard";
import s from "./film.module.css";

// A coming film's opening day already on sale (D-194, mockup/presales/ page 1): Times in the city as on
// any film's page, for that one day: its line, one day tile (Opens · Fri 18), then each area and its
// cinemas with their times. A time opens the usual sheet with the cinema's booking link. The times are
// the sinima's own, absolute; nothing here is relative to now (rule 3).

export function OpeningTimes({ opening, title, notice, calendar, home, areaName, onOpen }: {
  opening: Opening;
  title: string;
  notice: ReactNode;
  calendar: { label: string; href: string } | null;
  home: (Home & { name: string }) | null;
  areaName: (slug: string) => string;
  onOpen: (row: ListRow) => void;
}) {
  const { data } = opening;
  const groups = openingGroups(data.rows, (cinema) => data.cinemas[cinema]!.area, home);
  return (
    <section className={s.showings} aria-labelledby="film.times" data-testid="film.opening">
      <div className={s.heading}>
        <div>
          <h2 id="film.times">{title}</h2>
          <p>{opening.subtitle}</p>
        </div>
        <div className={s.openingDay}>
          <DayRow tiles={[{ day: 0, ...opening.tile }]} value={0} onChange={() => {}} testId="film.day" />
        </div>
      </div>
      {notice}
      <AreaList groups={groups} data={data} now={null} onOpen={onOpen} homeName={home?.name ?? ""} areaName={areaName} />
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
