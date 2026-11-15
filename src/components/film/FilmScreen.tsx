"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IconButton, Segmented } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { Icon } from "@/components/ui/Icon";
import { Notice, TimeChip } from "@/components/ui/Status";
import { LogoSticker, TicketFaceSticker } from "@/components/ui/Stickers";
import { shareLink, useHash, useSavedArea } from "@/lib/browser";
import { areaGroups, cinemasOn, startedEarlier, type CinemaTimes } from "@/lib/data/filmPage";
import { formatLabel } from "@/lib/data/format";
import type { Area } from "@/lib/data/load";
import { dayDates, type Day } from "@/lib/data/programme";
import { pageBanner, type ListData, type ListRow } from "@/lib/data/select";
import { minutesFromStart } from "@/lib/time/countdown";
import { useNow } from "@/lib/time/useNow";
import { dayWords } from "@/lib/wording/day";
import { areaTag, earlierLine, filmFacts, heroNote, noTimes, shareText, shortAddress, timesSubtitle } from "@/lib/wording/filmPage";
import { FilmHero } from "./FilmHero";
import { ShowingSheet, showingHash } from "./ShowingSheet";
import s from "./film.module.css";

// Film (Figma 185:3558): the poster sticker and Stay or Go, then every cinema showing it in the
// city on the day picked, by area: your area first, then the areas next to it. A time opens the
// showing sheet; a link ending #s=<cinema>@<start> opens one directly.

const CITY = "Lagos"; // one city until the city layer (unit 13, O-16)

export function FilmScreen({ data, areas, bg }: { data: ListData; areas: Area[]; bg: { light: string; dark: string } }) {
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const router = useRouter();
  const [day, setDay] = useState<Day>(0);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<ListRow | null>(null);
  const [open, setOpen] = useState(false);
  const [closedHash, setClosedHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const film = data.films[0]!;
  const areaName = (slug: string) => areas.find((area) => area.slug === slug)?.name ?? slug;
  const near = (slug: string) => areas.find((area) => area.slug === slug)?.neighbours ?? [];
  const saved = useSavedArea();
  const home = areas.find((area) => area.slug === saved) ?? null;

  // A shared link names its showing after the #; it opens once, until it is closed. A new link opens again.
  const hash = useHash();
  const linked = hash !== closedHash && hash.startsWith("#s=") ? (data.rows.find((row) => showingHash(data, row) === hash) ?? null) : null;
  const row = picked ?? linked;

  const dates = dayDates(data.rows, now);
  const names = [dayWords(0, dates[0], live).name, dayWords(1, dates[1], live).name];
  const on = dayWords(day, dates[day], live).on;
  const today = cinemasOn(data.rows, 0, now);
  const formats = [...new Set(data.rows.map((r) => formatLabel(r.format)).filter((label): label is string => label !== null))];
  const where = today.cinemas > 0 ? { cinemas: today.cinemas, city: CITY, on: dayWords(0, dates[0], live).on } : { cinemas: cinemasOn(data.rows, 1, now).cinemas, city: CITY, on: dayWords(1, dates[1], live).on };
  const facts = filmFacts(film, formats, where);
  const groups = areaGroups(data.rows, day, now, live, (cinema) => data.cinemas[cinema]!.area, home);
  const earlier = live && day === 0 ? earlierLine(startedEarlier(data.rows, now).map(({ cinema, at }) => ({ name: data.cinemas[cinema]!.name, at })), cinemasOn(data.rows, 1, now)) : null;
  const banner = pageBanner(data, clock);
  const stay = film.stay.verdict === "stay" || film.stay.verdict === "probably-stay";

  const openRow = (next: ListRow) => {
    setPicked(next);
    setOpen(true);
  };
  async function shareFilm() {
    const done = await shareLink({ title: film.title, text: shareText({ film: film.title, city: CITY }), url: `${window.location.origin}/film/${film.id}` });
    if (done === "copied") {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  const bar = (
    <>
      <Link href="/" className={s.round} aria-label={`All films in ${CITY}`} data-testid="film.back">
        <Icon name="chevron-left" size={20} />
      </Link>
      <span className={s.barTitle}>Film</span>
      <IconButton icon={copied ? "check" : "share-up"} label={copied ? "Link copied" : `Share ${film.title}`} onClick={() => void shareFilm()} testId="film.share" />
    </>
  );

  return (
    <AppFrame active="films" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} areas={areas.map((area) => area.slug)} bar={bar}>
      <div className={s.layout}>
        <div className={s.filmColumn}>
          <Link href="/" className={s.crumb}>
            <Icon name="chevron-left" size={18} />
            All films in {CITY}
          </Link>
          <FilmHero film={film} note={heroNote(film.stay.verdict, formats)} />
          <div className={s.details}>
            <h1 className={s.title} data-testid="film.title">
              {film.title}
            </h1>
            <p className={s.facts} data-testid="film.facts">
              {facts.map((fact, i) => (
                <span key={i}>
                  {i > 0 && <span className={s.dot} aria-hidden="true">·</span>}
                  {fact}
                </span>
              ))}
            </p>
            <p className={s.stay} data-verdict={stay ? "stay" : "quiet"}>
              <TicketFaceSticker height={26} className={s.stayTicket} />
              <span data-testid="credits.chip">{film.stay.chip}</span>
            </p>
            <p className={s.stayDetail} data-testid="credits.detail">
              {film.stay.detail}
            </p>
          </div>
        </div>

        <section className={s.showings} aria-labelledby="film.times">
          <div className={s.heading}>
            <div>
              <h2 id="film.times">Times in {CITY}</h2>
              <p>{timesSubtitle(dates[day], home !== null)}</p>
            </div>
            <Segmented label="Day" options={names} value={names[day]!} onChange={(name) => setDay(names.indexOf(name) === 1 ? 1 : 0)} testId="film.day" />
          </div>
          {banner && <Notice kind={banner.kind} text={banner.text} />}
          {groups.length === 0 && (
            <p className={s.none} data-testid="film.none">
              {noTimes(film.title, on, live && day === 0 && today.showings > 0)}
            </p>
          )}
          <div className={s.areas}>
            {groups.map((group) => {
              const tag = areaTag(group.tag, home?.name ?? "");
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
                      <CinemaCard key={times.cinema} data={data} times={times} now={day === 0 ? clock : null} onOpen={openRow} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          {earlier && (
            <p className={s.earlier} data-testid="film.earlier">
              {earlier}
            </p>
          )}
        </section>
      </div>

      <ShowingSheet
        data={data}
        row={row}
        open={open || linked !== null}
        now={clock}
        areaName={areaName}
        near={near}
        city={CITY}
        onPick={openRow}
        onClose={() => {
          setOpen(false);
          // Keep the linked showing drawn while the sheet slides away.
          setPicked((last) => last ?? linked);
          setClosedHash(hash);
        }}
      />
    </AppFrame>
  );
}

/** One cinema's times: its name, address when known, logo sticker, and a chip per time. */
function CinemaCard({ data, times, now, onOpen }: { data: ListData; times: CinemaTimes; now: string | null; onOpen: (row: ListRow) => void }) {
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
