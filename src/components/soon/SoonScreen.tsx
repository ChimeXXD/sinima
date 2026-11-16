"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Poster } from "@/components/Poster";
import { useLazySheet } from "@/components/film/useLazySheet";
import { Button } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { NoPoster, ShowingCard } from "@/components/ui/Cards";
import { PageNotice } from "@/components/ui/Status";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import { useAreaChoice, useSavedArea } from "@/lib/browser";
import { dayDates } from "@/lib/data/programme";
import { laterName, nextDayName, pageBanner, type ListData, type ListRow } from "@/lib/data/select";
import { chipAreas, keptRows, soonPage, type Quiet } from "@/lib/data/soonPage";
import { useCountdowns } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { freshness } from "@/lib/wording/freshness";
import { KEPT, bookLabel, dayNote, dayTitle, laterNote, quietWords, showingMeta, soonNote, type QuietInput } from "@/lib/wording/soon";
import { AreaChips, LaterList, QuietRows } from "./SoonParts";
import { SoonHero } from "./SoonHero";
import s from "./soon.module.css";

// Starting soon (Figma 204:7192 Default, 204:7931 Nothing in 2 hours): in your area, the showings
// in the next 2 hours as cards that count down and book on the cinema's own site, then the rest of
// tonight as rows. The showings kept with "Keep a countdown" lead the page. Nothing is "soon"
// until the browser has the time (rule 3): the page's own HTML lists the day, for all of Lagos.

const CITY = "Lagos"; // one city until the city layer (unit 13, O-16)

export type SoonArea = { slug: string; name: string; neighbours: string[] };

export function SoonScreen({ data, areas, bg }: { data: ListData; areas: SoonArea[]; bg: { light: string; dark: string } }) {
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const kept = useSavedArea();
  const [chosen, choose] = useAreaChoice(areas);
  const sheet = useLazySheet(data);
  const countdowns = useCountdowns();

  const area = (slug: string) => areas.find((candidate) => candidate.slug === slug);
  const areaName = (slug: string) => area(slug)?.name ?? slug;
  const near = (slug: string) => area(slug)?.neighbours ?? [];
  const placeArea = chosen ? (area(chosen) ?? null) : null;
  const place = placeArea?.name ?? CITY;
  // Sorting every row is kept off the keystrokes in the search box: only the data, place, clock or countdowns redo it.
  const page = useMemo(() => soonPage({ rows: data.rows, areaOf: (cinema) => data.cinemas[cinema]!.area, place: placeArea, now, live }), [data, placeArea, now, live]);
  const yours = useMemo(() => (live ? keptRows(data.rows, countdowns, { film: (film) => data.films[film]!.id, cinema: (cinema) => data.cinemas[cinema]!.id }, now) : []), [data, countdowns, now, live]);
  const chips = chipAreas(areas, kept);
  const banner = pageBanner(data, clock);

  const card = (row: ListRow, where: string) => {
    const film = data.films[row.film]!;
    const cinema = data.cinemas[row.cinema]!;
    const from = data.fresh[row.fresh]!;
    // Sample and old times can't be booked (D-25); a cinema that sells online but gave no link books on its own site (D-88).
    const bookable = clock !== null && freshness({ name: from.source, method: from.method }, from.fetchedAt, clock, from.via).bookable;
    const bookUrl = bookable ? (row.book ?? (cinema.online ? cinema.website : null)) : null;
    return (
      <ShowingCard
        key={`${row.cinema}-${row.film}-${row.at}`}
        title={film.title}
        cinema={cinema.name}
        meta={showingMeta(film, row.format)}
        poster={film.poster ? <Poster film={film} /> : <NoPoster title={film.title} />}
        startsAt={row.at}
        now={clock}
        bookUrl={bookUrl}
        bookLabel={bookLabel(film.title, row.at, cinema.chain)}
        onOpen={() => sheet.openRow(row)}
        oneLine
        testId={`${where}.${film.id}.${row.at}`}
      />
    );
  };

  return (
    <AppFrame active="soon" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg}>
      <SoonHero place={place} live={live} />
      <AreaChips chips={chips} allFirst={!areas.some((candidate) => candidate.slug === kept)} current={chosen} city={CITY} names={areaName} onPick={choose} />
      <PageNotice banner={banner} now={clock} className={s.notice} />

      {yours.length > 0 && (
        <section className={s.section} aria-labelledby="soon.kept" data-testid="section.kept">
          <div className={s.heading}>
            <h2 id="soon.kept">{KEPT.title}</h2>
            <p>{KEPT.note}</p>
          </div>
          <div className={s.cards}>{yours.map((row) => card(row, "kept"))}</div>
        </section>
      )}

      {!live && (
        <section className={s.section} aria-labelledby="soon.day" data-testid="section.day">
          <div className={s.heading}>
            <h2 id="soon.day">{dayTitle(dayDates(data.rows, now)[0])}</h2>
            <p>{dayNote({ count: page.day.length, place })}</p>
          </div>
          <LaterList data={data} rows={page.day} now={null} onOpen={sheet.openRow} testId="day.rows" />
        </section>
      )}

      {page.soon.length > 0 && (
        <section className={s.section} aria-labelledby="soon.soon" data-testid="section.soon">
          <div className={s.heading}>
            <h2 id="soon.soon">Next 2 hours</h2>
            <p>{soonNote({ count: page.soon.length, place })}</p>
          </div>
          <div className={s.cards}>{page.soon.map((row) => card(row, "soon"))}</div>
        </section>
      )}

      {page.quiet && <QuietBlock data={data} quiet={page.quiet} place={place} placeSlug={placeArea?.slug ?? null} now={now} areaName={areaName} onOpen={sheet.openRow} />}

      {page.later.length > 0 && (
        <section className={s.section} aria-labelledby="soon.later" data-testid="section.later">
          <div className={s.heading}>
            <h2 id="soon.later">{laterName(now)}</h2>
            <p>{laterNote({ count: page.later.length, place, last: page.later.at(-1)!.at })}</p>
          </div>
          <LaterList key={placeArea?.slug ?? "all"} data={data} rows={page.later} now={clock} onOpen={sheet.openRow} testId="later.rows" />
        </section>
      )}

      {sheet.Sheet && <sheet.Sheet data={sheet.sheetData} row={sheet.row} open={sheet.open} now={clock} areaName={areaName} near={near} city={CITY} onPick={sheet.openRow} onClose={sheet.close} />}
    </AppFrame>
  );
}

/** Figma Nothing in 2 hours: a ticket, what else there is, tomorrow here, and a handwritten note. */
function QuietBlock({ data, quiet, place, placeSlug, now, areaName, onOpen }: { data: ListData; quiet: Quiet; place: string; placeSlug: string | null; now: string; areaName: (slug: string) => string; onOpen: (row: ListRow) => void }) {
  const named = (row: ListRow) => ({ at: row.at, film: data.films[row.film]!.title, cinema: data.cinemas[row.cinema]!.name });
  const input: QuietInput =
    quiet.kind === "later"
      ? { kind: "later", next: named(quiet.next) }
      : quiet.kind === "nearby"
        ? { kind: "nearby", areas: quiet.areas.map(areaName), left: quiet.rows.length }
        : { kind: "city", areas: quiet.areas.map(areaName), left: quiet.rows.length, tomorrow: quiet.tomorrow && named(quiet.tomorrow) };
  const words = quietWords({ place, city: CITY, when: laterName(now) === "Later tonight" ? "tonight" : "today", next: nextDayName(now), quiet: input });
  const rows = quiet.kind === "later" ? [] : quiet.rows;
  return (
    <section className={s.quiet} aria-labelledby="soon.quiet" data-testid="soon.quiet">
      <TicketFaceSticker height={69} className={s.quietTicket} />
      <h2 id="soon.quiet">{words.title}</h2>
      <p>{words.body}</p>
      {rows.length > 0 && <QuietRows data={data} rows={rows} now={now} onOpen={onOpen} />}
      {words.tomorrow && <p className={s.tomorrow}>{words.tomorrow}</p>}
      {words.action && placeSlug && (
        <Button href={`/area/${placeSlug}`} testId="soon.tomorrow">
          {words.action}
        </Button>
      )}
      {words.note && (
        <span className={s.hand} aria-hidden="true">
          {words.note}
        </span>
      )}
    </section>
  );
}
