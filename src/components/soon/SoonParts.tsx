"use client";

import { Link } from "@/components/ui/CityLink";
import { useEffect, useRef, useState } from "react";
import { Poster } from "@/components/Poster";
import { Chip } from "@/components/ui/Actions";
import { TimeChip } from "@/components/ui/Status";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import { formatLabel } from "@/lib/data/format";
import type { ListData, ListRow } from "@/lib/data/select";
import { rowLine, showMore } from "@/lib/wording/soon";
import s from "./soon.module.css";

// Starting soon's own pieces: the area chips, a "later" row (Figma Later · 20:00 Agbara Nla) and
// a list of them that shows six and then "Show 8 more".

const FIRST = 6;

/**
 * The area chips (Figma Area chips). With an area kept: it, the areas next to it, then All Lagos
 * (Figma); with none, All Lagos first, then every area. On a phone the row scrolls and fades at
 * its edge while there is more to scroll.
 */
export function AreaChips({ chips, allFirst, current, city, names, onPick }: { chips: string[]; allFirst: boolean; current: string | null; city: string; names: (slug: string) => string; onPick: (slug: string | null) => void }) {
  const row = useRef<HTMLDivElement>(null);
  const [end, setEnd] = useState(true);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const check = () => setEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    el.addEventListener("scroll", check, { passive: true });
    return () => (observer.disconnect(), el.removeEventListener("scroll", check));
  }, [chips.length]);
  const all = (
    <Chip key="all" selected={current === null} onClick={() => onPick(null)} testId="area.chip.all">
      All {city}
    </Chip>
  );
  return (
    <div className={s.chipsWrap} data-end={end || undefined}>
      <div ref={row} className={s.chips} role="group" aria-label="Area">
        {allFirst && all}
        {chips.map((slug) => (
          <Chip key={slug} selected={current === slug} onClick={() => onPick(slug)} testId={`area.chip.${slug}`}>
            {names(slug)}
          </Chip>
        ))}
        {!allFirst && all}
      </div>
    </div>
  );
}

/** One showing as a row: poster, title (to the film's page), cinema, and its time, which opens the showing sheet. */
export function LaterRow({ data, row, now, line, onOpen }: { data: ListData; row: ListRow; now: string | null; line?: string; onOpen: (row: ListRow) => void }) {
  const film = data.films[row.film]!;
  const cinema = data.cinemas[row.cinema]!;
  return (
    <div className={s.row} data-testid={`later.${film.id}.${row.at}`}>
      <span className={s.poster}>
        {film.poster ? (
          <Poster film={film} small />
        ) : (
          <span className={s.noPoster} data-testid="poster.none">
            <TicketFaceSticker height={25} />
          </span>
        )}
      </span>
      <div className={s.text}>
        <Link href={`/film/${film.id}`} className={s.rowTitle}>
          {film.title}
        </Link>
        <p className={s.rowLine}>{line ?? cinema.name}</p>
      </div>
      <TimeChip startsAt={row.at} format={formatLabel(row.format)} now={now} onOpen={() => onOpen(row)} testId={`time.${film.id}.${row.at}`} />
    </div>
  );
}

/** Rows, six at first, then "Show 8 more" shows the rest. */
export function LaterList({ data, rows, now, onOpen, testId }: { data: ListData; rows: ListRow[]; now: string | null; onOpen: (row: ListRow) => void; testId: string }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, FIRST);
  return (
    <>
      <div className={s.rows} data-testid={testId}>
        {shown.map((row) => (
          <LaterRow key={`${row.cinema}-${row.film}-${row.at}`} data={data} row={row} now={now} onOpen={onOpen} />
        ))}
      </div>
      {!all && rows.length > FIRST && (
        <button type="button" className={s.more} onClick={() => setAll(true)} data-testid={`${testId}.more`}>
          {showMore(rows.length - FIRST)}
        </button>
      )}
    </>
  );
}

/** The rows in the empty state, each with how long until it starts (Figma: "· starts in 50 min"). */
export function QuietRows({ data, rows, now, onOpen }: { data: ListData; rows: ListRow[]; now: string; onOpen: (row: ListRow) => void }) {
  return (
    <div className={s.quietRows} data-testid="quiet.rows">
      {rows.slice(0, 3).map((row) => (
        <LaterRow key={`${row.cinema}-${row.film}-${row.at}`} data={data} row={row} now={now} line={rowLine(data.cinemas[row.cinema]!.name, row.at, now)} onOpen={onOpen} />
      ))}
    </div>
  );
}
