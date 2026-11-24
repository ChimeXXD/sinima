"use client";

import { Link } from "@/components/ui/CityLink";
import { Icon } from "@/components/ui/Icon";
import { TimeChip } from "@/components/ui/Status";
import { LogoSticker } from "@/components/ui/Stickers";
import type { AreaGroup, CinemaTimes } from "@/lib/data/filmPage";
import { formatLabel } from "@/lib/data/format";
import type { ListData, ListRow } from "@/lib/data/select";
import { minutesFromStart } from "@/lib/time/countdown";
import { areaTag, shortAddress } from "@/lib/wording/filmPage";
import s from "./film.module.css";

/** One cinema's times: its name, address when known, logo sticker, and a chip per time. */
export function CinemaCard({ data, times, now, onOpen }: { data: ListData; times: CinemaTimes; now: string | null; onOpen: (row: ListRow) => void }) {
  const cinema = data.cinemas[times.cinema]!;
  const first = now === null ? null : times.rows.find((row) => minutesFromStart(row.at, now).state !== "started");
  return (
    <article className={s.cinema} data-testid={`venue.${cinema.id}`}>
      <div className={s.cinemaHead}>
        <div className={s.cinemaText}>
          <Link href={`/cinema/${cinema.id}`} className={s.cinemaName}>
            {cinema.name}
          </Link>
          {cinema.address && <p className={s.address}>{shortAddress(cinema.address)}</p>}
        </div>
        <LogoSticker chain={cinema.chain} scale={52 / 72} />
      </div>
      <div className={s.times}>
        {times.rows.map((row) => (
          <TimeChip
            key={row.at}
            startsAt={row.at}
            format={formatLabel(row.format)}
            now={now}
            soonest={row === first && now !== null && minutesFromStart(row.at, now).minutes <= 60}
            onOpen={() => onOpen(row)}
            testId={`time.${cinema.id}.${row.at}`}
          />
        ))}
      </div>
    </article>
  );
}

/** A day's cinemas by area (your area, then those next to it, then the rest), each with its times. Shared by any day and a coming film's opening day (D-194). */
export function AreaList({ groups, data, now, onOpen, homeName, areaName, swap }: { groups: AreaGroup[]; data: ListData; now: string | null; onOpen: (row: ListRow) => void; homeName: string; areaName: (slug: string) => string; swap?: boolean }) {
  return (
    <div className={s.areas} data-swap={swap || undefined}>
      {groups.map((group) => {
        const tag = areaTag(group.tag, homeName);
        return (
          <section key={group.area} className={s.area} data-wide={group.cinemas.length > 1 || undefined} aria-labelledby={`area.${group.area}`} data-testid={`area.${group.area}`}>
            <h3 id={`area.${group.area}`} className={s.areaName}>
              <Icon name="map-pin" size={18} />
              {areaName(group.area)}
              {tag && (
                <span className={s.tag} data-tag={group.tag}>
                  {tag}
                </span>
              )}
            </h3>
            <div className={s.cinemas}>
              {group.cinemas.map((times) => (
                <CinemaCard key={times.cinema} data={data} times={times} now={now} onOpen={onOpen} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
