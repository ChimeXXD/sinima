"use client";

import { useCityRouter as useRouter, useCityPath } from "@/components/ui/CityLink";
import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/Actions";
import { useLazySheet } from "@/components/film/useLazySheet";
import { AppFrame, BarBack, BarTitle, Crumb, LogoNote } from "@/components/ui/AppFrame";
import { PageNotice } from "@/components/ui/Status";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import { shareLink } from "@/lib/browser";
import { areaPage, type AreaCinema } from "@/lib/data/areaPage";
import { byFilm, dayDates, formatsOf } from "@/lib/data/programme";
import type { Area } from "@/lib/data/load";
import { laterName, nextDayName, pageBanner, type ListData } from "@/lib/data/select";
import { formatDate } from "@/lib/time/lagos";
import { useSaved } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { areaHeading, areaShareText, cardBody, cardLine, locality, nextAreaLine, quietTitle, quietWhy } from "@/lib/wording/areaPage";
import { NO_TIMES_NOTE } from "@/lib/wording/cinemas";
import { FOOTER_NOTE } from "@/lib/wording/films";
import { AreaHero } from "./AreaHero";
import { CinemaCard, NextAreaCard } from "./AreaCards";
import s from "./area.module.css";

// Area (Figma 200:6420): one area's cinemas. Those kept on this phone first ("Your cinemas in
// Lekki"), then the others soonest first with their next three times, then the areas next to it.
// Once nothing more starts here tonight, the page says so and the areas next to it lead. A time
// opens the showing sheet. The page's own HTML has no kept cinemas and no relative words (rule 3).

const CITY = "Lagos"; // one city until the city layer (unit 13, O-16)

export function AreaScreen({ data, areas, slug, bg }: { data: ListData; areas: Area[]; slug: string; bg: { light: string; dark: string } }) {
  const cityHref = useCityPath();
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const kept = useSaved();

  const area = areas.find((candidate) => candidate.slug === slug)!;
  const areaName = (other: string) => areas.find((candidate) => candidate.slug === other)?.name ?? other;
  const near = (other: string) => areas.find((candidate) => candidate.slug === other)?.neighbours ?? [];
  const page = areaPage({
    rows: data.rows,
    cinemas: data.cinemas.length,
    areaOf: (cinema) => data.cinemas[cinema]!.area,
    chainOf: (cinema) => data.cinemas[cinema]!.chain,
    home: area,
    saved: (cinema) => kept.includes(data.cinemas[cinema]!.id),
    now,
    live,
  });
  const when = !live ? null : laterName(now) === "Later tonight" ? "tonight" : "today";
  const nextDay = live && nextDayName(now) === "Today" ? "Later today" : "Tomorrow";
  const date = formatDate(dayDates(data.rows, now)[0]);
  const banner = pageBanner(data, clock);
  const unread = [...page.saved, ...page.others].some((entry) => !entry.listed);
  const sheet = useLazySheet(data);

  async function share() {
    const done = await shareLink({ title: `Cinemas in ${area.name}`, text: areaShareText(area.name, CITY), url: `${window.location.origin}${cityHref(`/area/${slug}`)}` });
    if (done === "copied") {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  const card = (entry: AreaCinema, saved: boolean) => {
    const cinema = data.cinemas[entry.cinema]!;
    const films = byFilm(entry.rows).length;
    const place = saved || entry.rows.length === 0 ? locality(cinema.address, area.name) : null;
    const tomorrow = entry.tomorrow.length > 0 ? { films: byFilm(entry.tomorrow).length, from: entry.tomorrow[0]!.at } : null;
    return (
      <CinemaCard
        key={cinema.id}
        cinema={cinema}
        entry={entry}
        films={data.films}
        now={clock}
        line={entry.listed ? cardLine({ films, formats: formatsOf(entry.rows), when, place, tomorrow: tomorrow?.from ?? null, next: nextDay }) : (place ?? "")}
        body={cardBody({ listed: entry.listed, when, tomorrow, date, next: nextDay })}
        saved={saved}
        onOpen={sheet.openRow}
      />
    );
  };

  const group = (key: string, heading: { title: string; note: string | null }, children: React.ReactNode, wide = false) => (
    <section key={key} className={s.group} aria-labelledby={`area.${key}`} data-testid={`group.${key}`}>
      <div className={s.heading}>
        <h2 id={`area.${key}`}>{heading.title}</h2>
        {heading.note && <p>{heading.note}</p>}
      </div>
      <div className={wide ? s.nextCards : s.cards}>{children}</div>
    </section>
  );

  const mine = page.saved.length > 0 && group("saved", areaHeading({ key: "saved", area: area.name }), page.saved.map((entry) => card(entry, true)));
  const others = page.others.length > 0 && group("area", areaHeading({ key: "area", area: area.name, afterSaved: page.saved.length > 0, quiet: page.quiet }), page.others.map((entry) => card(entry, false)));
  const next =
    page.next.length > 0 &&
    group(
      "next",
      areaHeading({ key: "next", area: area.name, quiet: page.quiet }),
      page.next.map((other) => (
        <NextAreaCard key={other.slug} slug={other.slug} name={areaName(other.slug)} chains={other.chains} line={nextAreaLine({ cinemas: other.cinemas, next: other.next && { at: other.next.at, name: data.cinemas[other.next.cinema]!.name }, listed: other.listed, when })} />
      )),
      true,
    );

  const bar = (
    <>
      <BarBack href="/cinemas" label={`All cinemas in ${CITY}`} testId="area.back" />
      <BarTitle>Area</BarTitle>
      <IconButton icon={copied ? "check" : "share-up"} label={copied ? "Link copied" : `Share cinemas in ${area.name}`} onClick={() => void share()} testId="area.share" />
    </>
  );

  const footer = (
    <>
      <p data-testid="footer.note">{FOOTER_NOTE}</p>
      {unread && <p data-testid="area.no-times">{NO_TIMES_NOTE}</p>}
      <LogoNote />
    </>
  );

  return (
    <AppFrame active="cinemas" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} bar={bar} footer={footer}>
      <Crumb href="/cinemas">All cinemas in {CITY}</Crumb>
      <AreaHero area={area.name} count={area.cinemas} />
      <PageNotice banner={banner} now={clock} className={s.notice} />
      {page.quiet && when ? (
        <>
          <div className={s.empty} data-testid="area.empty">
            <TicketFaceSticker height={64.4} className={s.emptyTicket} />
            <h2>{quietTitle(area.name, when)}</h2>
            <p>
              {quietWhy({
                last: page.last && { name: data.cinemas[page.last.cinema]!.name, at: page.last.at },
                cinemas: page.saved.length + page.others.length,
                neighbours: page.next.length,
                neighboursWithTimes: page.next.filter((other) => other.next !== null).length,
                when,
              })}
            </p>
          </div>
          {next}
          {mine}
          {others}
        </>
      ) : (
        <>
          {mine}
          {others}
          {next}
        </>
      )}

      {sheet.Sheet && <sheet.Sheet data={sheet.sheetData} row={sheet.row} open={sheet.open} now={clock} areaName={areaName} near={near} city={CITY} onPick={sheet.openRow} onClose={sheet.close} />}
    </AppFrame>
  );
}
