"use client";

import { useCityRouter as useRouter, useCityPath } from "@/components/ui/CityLink";
import { useCallback, useRef, useState } from "react";
import { useLazySheet } from "@/components/film/useLazySheet";
import { Button, IconButton, Segmented } from "@/components/ui/Actions";
import { AppFrame, BarBack, BarTitle, Crumb, LogoNote } from "@/components/ui/AppFrame";
import { Icon } from "@/components/ui/Icon";
import { FormatBadge, PageNotice } from "@/components/ui/Status";
import { LogoSticker } from "@/components/ui/Stickers";
import { Toast } from "@/components/ui/Toast";
import { shareLink, useHash } from "@/lib/browser";
import { cinemaFilms } from "@/lib/data/cinemaPage";
import { dayDates, formatsOf, type Day } from "@/lib/data/programme";
import { laterName, nextDayName, pageBanner, type ListData } from "@/lib/data/select";
import { toggleSaved, useSaved } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { SAVED_TOAST, dayOption, earlierLine, filmsNote, filmsTitle, noFilms, notListedYet, ticketsFooter } from "@/lib/wording/cinemaPage";
import { bookOption } from "@/lib/wording/filmPage";
import { rowWarning } from "@/lib/wording/freshness";
import { FilmRow } from "./FilmRow";
import s from "./cinema.module.css";

// Cinema (Figma 202:7192): the cinema (logo, name, address, area and formats, Save and Book), then
// its films on the day, soonest first, each with its times; a time opens the showing sheet. Save
// keeps it on Your cinemas, on this phone only, and a toast says so. The page's own HTML has no
// relative words and no saved state (rule 3).

const CITY = "Lagos"; // one city until the city layer (unit 13, O-16)

export function CinemaScreen({ data, id, area, bg }: { data: ListData; id: string; area: { slug: string; name: string }; bg: { light: string; dark: string } }) {
  const cityHref = useCityPath();
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [picked, setDay] = useState<Day>(0);
  const [toast, setToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A shared link names its showing after the #, as the old cinema page did: #s=<film>@<start>.
  const hash = useHash();
  const linked = hash.startsWith("#s=") ? (data.rows.find((row) => hash === `#s=${data.films[row.film]!.id}@${row.at}`) ?? null) : null;
  const sheet = useLazySheet(data, linked);
  const saved = useSaved().includes(id);
  const hideToast = useCallback(() => setToast(false), []);

  const cinema = data.cinemas.find((candidate) => candidate.id === id)!;
  const near = () => [];
  // Nothing listed for tomorrow: today stands alone (Figma: Times a day old). Tomorrow, if it was
  // picked before its times went away (past midnight), falls back to today: the toggle is gone.
  const onPicked = cinemaFilms({ rows: data.rows, day: picked, now, live });
  const alone = live && !onPicked.tomorrow;
  const day: Day = alone ? 0 : picked;
  const films = day === picked ? onPicked : cinemaFilms({ rows: data.rows, day, now, live });
  const dates = dayDates(data.rows, now);
  const when = !live ? null : laterName(now) === "Later tonight" ? "tonight" : "today";
  const banner = pageBanner(data, clock);
  const warning = banner && banner.kind !== "sample" ? rowWarning(banner.kind) : null;
  const options = [dayOption({ day: 0, date: dates[0], live }), dayOption({ day: 1, date: dates[1], live })] as const;

  function save() {
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
      <BarBack href="/cinemas" label={`All cinemas in ${CITY}`} testId="cinema.back" />
      <BarTitle>Cinema</BarTitle>
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
      <Crumb href="/cinemas">All cinemas in {CITY}</Crumb>
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
              <span className={s.hidden}> {cinema.name} on Your cinemas</span>
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
                {filmsTitle({ day, when, date: dates[day] })}
              </h2>
              <p data-testid="films.note">{filmsNote({ day, live, total: films.total, left: films.left, warning })}</p>
            </div>
            {alone ? (
              <p className={s.alone}>
                <span className={s.today} data-testid="films.today">
                  {options[0]}
                </span>
                <span data-testid="films.not-listed">{notListedYet(cinema.chain, dates[1])}</span>
              </p>
            ) : (
              <Segmented label="Day" options={options} value={options[day]} onChange={(name) => setDay(name === options[1] ? 1 : 0)} testId="films.day" />
            )}
          </div>
          {warning && (
            <p className={s.warning} data-testid="films.warning">
              <Icon name="alert" size={18} />
              {warning}
            </p>
          )}
          {films.total === 0 && (
            <p className={s.none} data-testid="films.none">
              {noFilms({ day, live, date: dates[day] })}
            </p>
          )}
          <div className={s.rows}>
            {films.films.map((times) => (
              <FilmRow
                key={times.film}
                film={data.films[times.film]!}
                times={times}
                now={day === 0 ? clock : null}
                earlier={times.earlier.length > 0 ? earlierLine(times.earlier.map((row) => row.at), times.next.map((row) => row.at), nextDayName(now)) : null}
                onOpen={sheet.openRow}
              />
            ))}
          </div>
        </section>
      </div>

      {sheet.Sheet && <sheet.Sheet data={sheet.sheetData} row={sheet.row} open={sheet.open} now={clock} areaName={() => area.name} near={near} city={CITY} onPick={sheet.openRow} onClose={sheet.close} />}
      {toast && <Toast icon="heart" text={SAVED_TOAST} onUndo={() => (toggleSaved(id), setToast(false))} onDone={hideToast} />}
    </AppFrame>
  );
}
