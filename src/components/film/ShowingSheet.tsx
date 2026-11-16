"use client";

import { useCityPath } from "@/components/ui/CityLink";
import { useState } from "react";
import { OptionRow, Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { CountdownBadge, TimeChip, useJustStarted } from "@/components/ui/Status";
import m from "@/components/ui/started.module.css";
import { shareLink } from "@/lib/browser";
import { nextNearby } from "@/lib/data/filmPage";
import { formatLabel } from "@/lib/data/format";
import type { ListData, ListRow } from "@/lib/data/select";
import { buildIcs, icsFileName } from "@/lib/ics/ics";
import { countdownId, toggleCountdown, useCountdowns } from "@/lib/saved";
import { minutesFromStart } from "@/lib/time/countdown";
import { formatTime } from "@/lib/time/lagos";
import { isBeforeStart, showingState } from "@/lib/time/showingState";
import { bookOption, calendarLine, nextPlace, shareText, shortAddress, showingSubtitle, startedNotice, type BookCase } from "@/lib/wording/filmPage";
import { freshness } from "@/lib/wording/freshness";
import { showingHash } from "./useLazySheet";
import s from "./showing.module.css";

// Film › Showing sheet (Figma 189:3701; a centred dialog on desktop): one showing's time and
// cinema, its countdown, then Book on the cinema's own site, Add to calendar, Keep a countdown and
// Share. Once it has started (189:4253) it can't be booked: a note, the next times nearby, and
// Share this film (D-05).

type Props = { data: ListData; /** The last showing opened: it stays drawn while the sheet slides away. */ row: ListRow | null; open: boolean; now: string | null; areaName: (slug: string) => string; near: (slug: string) => string[]; city: string; onPick: (row: ListRow) => void; onClose: () => void };

export function ShowingSheet({ data, row, open, now, areaName, near, city, onPick, onClose }: Props) {
  const cityHref = useCityPath();
  const kept = useCountdowns();
  const [copied, setCopied] = useState<string | null>(null);
  // Closing the sheet resets it, so reopening a started showing doesn't replay its entrance.
  const just = useJustStarted(open ? (row?.at ?? "") : "", now);
  if (!row) return <Sheet open={false} onClose={onClose} title="" testId="showing.sheet">{null}</Sheet>;

  const film = data.films[row.film]!;
  const cinema = data.cinemas[row.cinema]!;
  const format = formatLabel(row.format);
  const upcoming = now === null || isBeforeStart(showingState(row.at, now));
  // "Link copied" belongs to the showing it was copied for.
  const was = (what: string) => copied === `${what}|${row.cinema}|${row.at}`;
  const filmUrl = () => `${window.location.origin}${cityHref(`/film/${film.id}`)}`;

  async function share(what: "showing" | "film") {
    const link =
      what === "showing"
        ? { title: film.title, text: shareText({ film: film.title, cinema: cinema.name, at: row!.at }), url: `${filmUrl()}${showingHash(data, row!)}` }
        : { title: film.title, text: shareText({ film: film.title, city }), url: filmUrl() };
    if ((await shareLink(link)) === "copied") setCopied(`${what}|${row!.cinema}|${row!.at}`);
  }

  return (
    <Sheet open={open} onClose={onClose} title={`${formatTime(row.at)} · ${cinema.name}`} subtitle={showingSubtitle(film.title, format, areaName(cinema.area))} testId="showing.sheet">
      {now !== null && (
        <div className={s.badge}>
          <CountdownBadge startsAt={row.at} now={now} />
        </div>
      )}
      {now === null ? null : upcoming ? (
        <>
          <Book data={data} row={row} now={now} />
          <OptionRow icon="calendar-plus" tone="soft" title="Add to calendar" desc={calendarLine(row.at, film.runtimeMin)} onClick={() => addToCalendar(data, row, now)} testId="showing.calendar" />
          <OptionRow
            icon="clock"
            tone="soft"
            title="Keep a countdown"
            desc="Shows on Starting soon until it begins."
            selected={kept.includes(countdownId(film.id, cinema.id, row.at))}
            onClick={() => toggleCountdown(countdownId(film.id, cinema.id, row.at), now)}
            testId="showing.keep"
          />
          <OptionRow icon="share-up" tone="soft" title="Share this showing" desc={was("showing") ? "Link copied." : "A link that opens on this exact time."} onClick={() => void share("showing")} testId="showing.share" />
        </>
      ) : (
        <Started data={data} row={row} now={now} areaName={areaName} near={near} city={city} just={just} onPick={onPick}>
          <OptionRow icon="share-up" tone="soft" title="Share this film" desc={was("film") ? "Link copied." : `A link to ${film.title}'s times in ${city}.`} onClick={() => void share("film")} className={just ? m.arrive : undefined} testId="showing.share-film" />
        </Started>
      )}
    </Sheet>
  );
}

/** The first row: Book on the cinema's own site, or why it can't be booked here (D-25, rule 5). */
function Book({ data, row, now }: { data: ListData; row: ListRow; now: string }) {
  const cinema = data.cinemas[row.cinema]!;
  const from = data.fresh[row.fresh]!;
  const fresh = freshness({ name: from.source, method: from.method }, from.fetchedAt, now, from.via);
  // A cinema that sells online but gave no link for this showing (Lagocine's rows have none) books on its own site.
  const bookAt = row.book ?? (cinema.online ? cinema.website : null);
  const book: BookCase =
    fresh.band === "sample"
      ? { kind: "sample", chain: cinema.chain }
      : !fresh.bookable
        ? { kind: "old", chain: cinema.chain, site: cinema.website !== null }
        : bookAt
          ? { kind: "book", chain: cinema.chain }
          : { kind: "door", chain: cinema.chain, address: cinema.address && shortAddress(cinema.address) };
  const { title, desc } = bookOption(book);
  // Old times send people to the cinema's own site to check, never to the source that read them (D-76).
  const href = book.kind === "book" ? bookAt : book.kind === "old" ? cinema.website : null;
  return href ? <OptionRow icon="external-link" title={title} desc={desc} href={href} testId="showing.book" /> : <OptionRow icon="external-link" tone="soft" title={title} desc={desc} testId="showing.book" />;
}

function addToCalendar(data: ListData, row: ListRow, now: string) {
  const film = data.films[row.film]!;
  const cinema = data.cinemas[row.cinema]!;
  const from = data.fresh[row.fresh]!;
  const sourceLine = freshness({ name: from.source, method: from.method }, from.fetchedAt, now, from.via).text;
  const showing = { id: `${cinema.id}_${film.id}_${row.at}`, film: film.title, cinema: cinema.name, address: cinema.address, startsAt: row.at, runtimeMin: film.runtimeMin, bookingUrl: row.book, sourceLine };
  const url = URL.createObjectURL(new Blob([buildIcs(showing, now)], { type: "text/calendar" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: icsFileName(showing) });
  document.body.append(link);
  link.click();
  link.remove();
  // Not at once: Safari on an iPhone can still be reading the file when the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** A started showing: why it can't be booked, and the next times nearby, each opening its own sheet. */
function Started({ data, row, now, areaName, near, city, just, onPick, children }: { data: ListData; row: ListRow; now: string; areaName: (slug: string) => string; near: (slug: string) => string[]; city: string; /** It started while the sheet was open (M4): the notice and next times fade in. */ just: boolean; onPick: (row: ListRow) => void; children: React.ReactNode }) {
  const areaOf = (cinema: number) => data.cinemas[cinema]!.area;
  const next = nextNearby(data.rows, row, now, areaOf, near);
  const which = next.rows.length === 0 ? "none" : next.near ? "near" : "city";
  return (
    <>
      <p className={just ? `${s.startedNote} ${m.arrive}` : s.startedNote} data-testid="showing.started">
        <Icon name="info" size={20} stroke={2} />
        {startedNotice(row.at, which, city)}
      </p>
      {next.rows.length > 0 && (
        <ul className={just ? `${s.nextList} ${m.arrive}` : s.nextList} data-testid="showing.next">
          {next.rows.map((other, i) => {
            const cinema = data.cinemas[other.cinema]!;
            const format = formatLabel(other.format);
            return (
              <li key={`${other.cinema}@${other.at}`} className={s.next}>
                <span className={s.nextTime}>
                  <TimeChip startsAt={other.at} format={null} now={now} soonest={i === 0 && minutesFromStart(other.at, now).minutes <= 60} onOpen={() => onPick(other)} testId={`next.${cinema.id}.${other.at}`} />
                </span>
                <span className={s.nextText}>
                  <span className={s.nextName}>{cinema.name}</span>
                  <span className={s.nextPlace}>{nextPlace({ same: other.cinema === row.cinema, area: areaName(cinema.area), format })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {children}
    </>
  );
}
