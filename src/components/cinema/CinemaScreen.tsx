"use client";

import { useCityRouter as useRouter, useCityPath } from "@/components/ui/CityLink";
import { useCallback, useRef, useState } from "react";
import { useLazySheet } from "@/components/film/useLazySheet";
import { Button, IconButton } from "@/components/ui/Actions";
import { AppFrame, BarBack, BarTitle, Crumb, LogoNote } from "@/components/ui/AppFrame";
import { DayLoad, DaySentence } from "@/components/ui/DayParts";
import { DayRow, dayTiles } from "@/components/ui/DayRow";
import { Icon } from "@/components/ui/Icon";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { PageNotice } from "@/components/ui/Notices";
import { LogoSticker } from "@/components/ui/Stickers";
import { Toast } from "@/components/ui/Toast";
import { pop } from "@/components/ui/motion";
import { useDayPicker } from "@/components/ui/useDayPicker";
import { useSwapIn } from "@/components/ui/useSwapIn";
import { CITY_NAMES, type City } from "@/lib/city";
import { cityWords } from "@/lib/wording/city";
import { shareLink, useHash } from "@/lib/browser";
import { cinemaFilms } from "@/lib/data/cinemaPage";
import { dayDates, formatsOf } from "@/lib/data/programme";
import { laterName, nextDayName, pageBanner, type ListData } from "@/lib/data/select";
import { toggleSaved, useSaved } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { SAVED_TOAST, dayOption, earlierLine, filmsNote, filmsTitle, noFilms, notListedYet, ticketsFooter } from "@/lib/wording/cinemaPage";
import { featuredFor, featuredTimes } from "@/lib/wording/featured";
import { bookOption } from "@/lib/wording/filmPage";
import { rowWarning } from "@/lib/wording/freshness";
import { FilmRow } from "./FilmRow";
import s from "./cinema.module.css";

// Cinema (Figma 202:7192): the cinema (logo, name, address, area and formats, Save and Book), then
// its films on the day, soonest first, each with its times; a time opens the showing sheet. Save
// keeps it on Your cinemas, on this phone only, and a toast says so. The page's own HTML has no
// relative words and no saved state (rule 3).

export function CinemaScreen({ data, id, area, city, bg }: { data: ListData; id: string; area: { slug: string; name: string }; city: City; bg: { light: string; dark: string } }) {
  const cityName = CITY_NAMES[city];
  const words = cityWords(city);
  const cityHref = useCityPath();
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const days = useDayPicker(data, city, now, live, { cinemaId: id });
  const swap = useSwapIn(days.day, days.status === "ready");
  const [toast, setToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cinema = data.cinemas.find((candidate) => candidate.id === id)!;
  const near = () => [];
  // Nothing listed after today, tomorrow or any later day (D-146): today stands alone (Figma: Times
  // a day old). A day picked before its times went away (past midnight) falls back to today: the
  // row is gone.
  const me = data.cinemas.indexOf(cinema);
  const later = days.shown.some((shown) => (shown.day > 1 || shown.later) && shown.cinemas?.includes(me));
  const alone = live && !later && !cinemaFilms({ rows: data.rows, day: 0, now, live }).tomorrow;
  const day = alone ? 0 : days.day;
  const view = alone ? data : (days.view ?? { ...data, rows: [] });
  // A shared link names its showing after the #, as the old cinema page did: #s=<film>@<start>.
  const hash = useHash();
  const linked = hash.startsWith("#s=") ? (data.rows.find((row) => hash === `#s=${data.films[row.film]!.id}@${row.at}`) ?? null) : null;
  const sheet = useLazySheet(view, linked);
  const saved = useSaved().includes(id);
  const hideToast = useCallback(() => setToast(false), []);

  const films = cinemaFilms({ rows: view.rows, day, now, live, anchor: days.anchor });
  const dates = dayDates(data.rows, now);
  const date = alone ? dates[0] : days.current.date;
  const when = !live ? null : laterName(now) === "Later tonight" ? "tonight" : "today";
  const banner = pageBanner(data, clock);
  const warning = banner && banner.kind !== "sample" ? rowWarning(banner.kind) : null;
  const note = filmsNote({ day, live, total: films.total, left: films.left, warning });
  // A cinema whose times we can't read: the films its chain's home page features today (D-131).
  const featured = featuredFor(data, me, clock);
  const today = dayOption({ day: 0, date: dates[0], live });

  function save(event: React.MouseEvent<HTMLButtonElement>) {
    if (!saved) pop(event.currentTarget.querySelector("svg"));
    toggleSaved(id);
    setToast(!saved); // only saving says so; letting go is quiet
  }
  async function share() {
    const done = await shareLink({ title: cinema.name, text: `${cinema.name} · times on Sinima`, url: `${window.location.origin}${cityHref(`/cinema/${id}`)}` });
    if (done === "copied") {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  const bar = (
    <>
      <BarBack href="/cinemas" label={words.allCinemas} testId="cinema.back" />
      <BarTitle>Sinima</BarTitle>
      <IconButton icon={copied ? "check" : "share-up"} label={copied ? "Link copied" : `Share ${cinema.name}`} onClick={() => void share()} testId="cinema.share" />
    </>
  );
  const footer = (
    <>
      <p data-testid="footer.tickets">{ticketsFooter(cinema)}</p>
      <LogoNote />
    </>
  );

  return (
    <AppFrame active="cinemas" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} bar={bar} footer={footer}>
      <Crumb href="/cinemas">{words.allCinemas}</Crumb>
      <PageNotice banner={banner} now={clock} className={s.notice} />
      <div className={s.body}>
        <section className={s.info} aria-labelledby="cinema.title">
          <span className={s.logo}>
            <LogoSticker chain={cinema.chain} scale={94 / 72} tilt={7} />
          </span>
          <h1 id="cinema.title" className={s.title} data-testid="cinema.title">
            {cinema.name}
          </h1>
          {cinema.address && (
            <p className={s.address}>
              <Icon name="map-pin" size={18} className={s.pin} />
              <span data-testid="cinema.address">{cinema.address}</span>
            </p>
          )}
          <p className={s.tags} data-testid="cinema.tags">
            <span className={s.area}>{area.name}</span>
            <FormatBadge formats={formatsOf(data.rows)} />
          </p>
          <div className={s.actions}>
            <button type="button" className={s.save} aria-pressed={saved} onClick={save} data-testid="cinema.save">
              <Icon name="heart" size={18} />
              {saved ? "Saved" : "Save"}
              <span className={s.hidden}> {cinema.name} on Your sinimas</span>
            </button>
            {cinema.online && cinema.website && (
              <Button href={cinema.website} testId="cinema.book">
                {bookOption({ kind: "book", chain: cinema.chain }).title}
              </Button>
            )}
          </div>
        </section>

        <section className={s.films} aria-labelledby="films.title">
          <div className={s.heading}>
            <div>
              <h2 id="films.title" data-testid="films.title">
                {filmsTitle({ day, when, date })}
              </h2>
              {note && <p data-testid="films.note">{note}</p>}
            </div>
            {alone ? (
              <p className={s.alone}>
                <span className={s.today} data-testid="films.today">
                  {today}
                </span>
                <span data-testid="films.not-listed">{notListedYet(cinema.chain, dates[1])}</span>
              </p>
            ) : (
              <DayRow
                tiles={dayTiles(days.shown, live)}
                value={day}
                onChange={(next, how) => {
                  if (next === day) return;
                  swap(next > day ? 1 : -1, how);
                  days.pick(next);
                }}
                onPress={days.press}
                testId="films.day"
              />
            )}
          </div>
          {!alone && <DaySentence text={days.sentence} keep={days.keep} testId="films.listed" />}
          {warning && (
            <p className={s.warning} data-testid="films.warning">
              <Icon name="alert" size={18} />
              {warning}
            </p>
          )}
          {!alone && days.load && <DayLoad {...days.load} />}
          {!(days.load && !alone) && films.total === 0 && (
            <p className={s.none} data-testid="films.none" data-swap>
              {noFilms({ day, live, date })}
            </p>
          )}
          {featured && (
            <p className={s.none} data-testid="films.featured">
              {featured} {featuredTimes(cinema.chain)}
            </p>
          )}
          <div className={s.rows} data-swap>
            {films.films.map((times) => (
              <FilmRow
                key={times.film}
                film={view.films[times.film]!}
                times={times}
                now={day === 0 ? clock : null}
                earlier={times.earlier.length > 0 ? earlierLine(times.earlier.map((row) => row.at), times.next.map((row) => row.at), nextDayName(now)) : null}
                onOpen={sheet.openRow}
              />
            ))}
          </div>
        </section>
      </div>

      {sheet.Sheet && <sheet.Sheet data={sheet.sheetData} row={sheet.row} open={sheet.open} now={clock} areaName={() => area.name} near={near} city={cityName} onPick={sheet.openRow} onClose={sheet.close} />}
      {toast && <Toast icon="heart" text={SAVED_TOAST} onUndo={() => (toggleSaved(id), setToast(false))} onDone={hideToast} />}
    </AppFrame>
  );
}
