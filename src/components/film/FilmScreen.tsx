"use client";

import { Link, useCityPath, useCityRouter as useRouter } from "@/components/ui/CityLink";
import { useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/Actions";
import { AppFrame, BarBack, BarTitle } from "@/components/ui/AppFrame";
import { DayLoad, DaySentence } from "@/components/ui/DayParts";
import { DayRow, dayTiles } from "@/components/ui/DayRow";
import { Icon } from "@/components/ui/Icon";
import { PageNotice, TimeChip } from "@/components/ui/Status";
import { LogoSticker, TicketFaceSticker } from "@/components/ui/Stickers";
import { useDayPicker } from "@/components/ui/useDayPicker";
import { useSwapIn } from "@/components/ui/useSwapIn";
import { CITY_NAMES, type City } from "@/lib/city";
import { cityWords } from "@/lib/wording/city";
import { shareLink, useHash, useQuery, useSavedArea } from "@/lib/browser";
import { areaGroups, cinemasOn, startedEarlier, type CinemaTimes } from "@/lib/data/filmPage";
import { formatLabel } from "@/lib/data/format";
import type { Area } from "@/lib/data/load";
import { dayDates } from "@/lib/data/programme";
import { pageBanner, type ListData, type ListRow } from "@/lib/data/select";
import { minutesFromStart } from "@/lib/time/countdown";
import { eveningDayKey } from "@/lib/time/lagos";
import { useNow } from "@/lib/time/useNow";
import { dayWords } from "@/lib/wording/day";
import { areaTag, earlierLine, filmFacts, heroNote, noTimes, shareText, shortAddress, timesSubtitle, trailerLink } from "@/lib/wording/filmPage";
import { FilmHero } from "./FilmHero";
import { showingHash, useLazySheet } from "./useLazySheet";
import s from "./film.module.css";

// Film (Figma 185:3558): the poster sticker and Stay or Go, then every cinema showing it in the
// city on the day picked, by area: your area first, then the areas next to it. A time opens the
// showing sheet; a link ending #s=<cinema>@<start> opens one directly.

export function FilmScreen({ data, areas, city, bg }: { data: ListData; areas: Area[]; city: City; bg: { light: string; dark: string } }) {
  const cityName = CITY_NAMES[city];
  const words = cityWords(city);
  const cityHref = useCityPath();
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const router = useRouter();
  const film = data.films[0]!;
  // A shared link names its showing after the #; it opens once, until it is closed. A new link opens again.
  const hash = useHash();
  // Opened from Films on a later day, the page opens on that day (`?day=2026-11-21`, D-147); a
  // shared showing opens on its own day, so one on a later day is there to be found.
  const asked = useQuery("day");
  const sharedAt = /^#s=.+@(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/.exec(hash)?.[1];
  const days = useDayPicker(data, city, now, live, { filmId: film.id }, sharedAt ? eveningDayKey(sharedAt) : asked);
  const { day, current } = days;
  const view = days.view ?? { ...data, rows: [] };
  const swap = useSwapIn(day, days.status === "ready");
  const [typed, setTyped] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const areaName = (slug: string) => areas.find((area) => area.slug === slug)?.name ?? slug;
  const near = (slug: string) => areas.find((area) => area.slug === slug)?.neighbours ?? [];
  const saved = useSavedArea();
  const home = areas.find((area) => area.slug === saved) ?? null;

  // The picked day's rows first: a later day's showing is only in its own file (D-147).
  const linked = hash.startsWith("#s=") ? (view.rows.find((row) => showingHash(view, row) === hash) ?? data.rows.find((row) => showingHash(data, row) === hash) ?? null) : null;
  const sheet = useLazySheet(view, linked);

  const dates = dayDates(data.rows, now);
  const on = dayWords(day, current.date, live).on;
  const today = cinemasOn(data.rows, 0, now);
  const formats = [...new Set(data.rows.map((r) => formatLabel(r.format)).filter((label): label is string => label !== null))];
  const where = today.cinemas > 0 ? { cinemas: today.cinemas, city: cityName, on: dayWords(0, dates[0], live).on } : { cinemas: cinemasOn(data.rows, 1, now).cinemas, city: cityName, on: dayWords(1, dates[1], live).on };
  const facts = filmFacts(film, formats, where);
  const trailer = film.trailer ? trailerLink(film.title, film.trailer) : null;
  const groups = areaGroups(view.rows, day, now, live, (cinema) => view.cinemas[cinema]!.area, home, days.anchor);
  const earlier = live && day === 0 ? earlierLine(startedEarlier(data.rows, now).map(({ cinema, at }) => ({ name: data.cinemas[cinema]!.name, at })), cinemasOn(data.rows, 1, now)) : null;
  const banner = pageBanner(data, clock);
  const stay = film.stay.verdict === "stay" || film.stay.verdict === "probably-stay";

  async function shareFilm() {
    const done = await shareLink({ title: film.title, text: shareText({ film: film.title, city: cityName }), url: `${window.location.origin}${cityHref(`/film/${film.id}`)}` });
    if (done === "copied") {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  const bar = (
    <>
      <BarBack href="/" label={words.allFilms} testId="film.back" />
      <BarTitle>Film</BarTitle>
      <IconButton icon={copied ? "check" : "share-up"} label={copied ? "Link copied" : `Share ${film.title}`} onClick={() => void shareFilm()} testId="film.share" />
    </>
  );

  return (
    <AppFrame active="films" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} bar={bar}>
      <div className={s.layout}>
        <div className={s.filmColumn}>
          <Link href="/" className={s.crumb}>
            <Icon name="chevron-left" size={18} />
            {words.allFilms}
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
            {trailer && (
              // The trailer on YouTube (D-117), in a new tab like every link off the site.
              <Button kind="secondary" icon="external-link" href={trailer.href} testId="film.trailer">
                {trailer.text}
                <span className={s.hidden}>{trailer.more}</span>
              </Button>
            )}
          </div>
        </div>

        <section className={s.showings} aria-labelledby="film.times">
          <div className={s.heading}>
            <div>
              <h2 id="film.times">{words.times}</h2>
              <p>{timesSubtitle(current.date, home !== null)}</p>
            </div>
            <DayRow
              tiles={dayTiles(days.shown, live)}
              value={day}
              onChange={(next, how) => {
                if (next === day) return;
                swap(next > day ? 1 : -1, how);
                days.pick(next);
              }}
              onPress={days.press}
              testId="film.day"
            />
          </div>
          <DaySentence text={days.sentence} keep={days.keep} testId="film.listed" />
          <PageNotice banner={banner} now={clock} />
          {days.load && <DayLoad {...days.load} />}
          {!days.load && groups.length === 0 && (
            <p className={s.none} data-testid="film.none" data-swap>
              {noTimes(film.title, on, live && day === 0 && today.showings > 0)}
            </p>
          )}
          <div className={s.areas} data-swap>
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
                      <CinemaCard key={times.cinema} data={view} times={times} now={day === 0 ? clock : null} onOpen={sheet.openRow} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          {earlier && (
            <p className={s.earlier} data-testid="film.earlier" data-swap>
              {earlier}
            </p>
          )}
        </section>
      </div>

      {sheet.Sheet && <sheet.Sheet data={sheet.sheetData} row={sheet.row} open={sheet.open} now={clock} areaName={areaName} near={near} city={cityName} onPick={sheet.openRow} onClose={sheet.close} />}
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
