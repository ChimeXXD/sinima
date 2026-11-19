"use client";

import { useState } from "react";
import { Poster } from "@/components/Poster";
import { Button, Chip } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { FilmCard, NoPoster } from "@/components/ui/Cards";
import { DayLoad, DaySentence } from "@/components/ui/DayParts";
import { DayRow, dayTiles } from "@/components/ui/DayRow";
import { PageNotice } from "@/components/ui/Notices";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import { useDayPicker } from "@/components/ui/useDayPicker";
import { dayHref } from "@/lib/data/days";
import { useSwapIn, type ChangeHow } from "@/components/ui/useSwapIn";
import { filmSections, formatCoverage, lastStart, type FilmSection } from "@/lib/data/films";
import type { FormatTag } from "@/lib/data/format";
import { formatChoices, formatsOf, showingOn, type Day } from "@/lib/data/programme";
import { matchesTitle } from "@/lib/data/search";
import { laterName, pageBanner, type ListData } from "@/lib/data/select";
import { useQuery } from "@/lib/browser";
import { CITY_NAMES, type City } from "@/lib/city";
import { useNow } from "@/lib/time/useNow";
import { dayWords } from "@/lib/wording/day";
import { filmMeta } from "@/lib/wording/film";
import { COMING_SECTION, formatNote, noFilms, nothingMoreToday, sectionWords } from "@/lib/wording/films";
import type { ComingCard } from "@/lib/data/comingPage";
import { ComingRow } from "./ComingRow";
import { FilmsHero } from "./FilmsHero";
import s from "./films.module.css";

// Films, the home page (Figma Films, D-55): what's on in the city, as posters. Today: the films
// starting in the next 2 hours, then later tonight. Relative words and the countdowns wait for the
// clock (rule 3); until then the day is one list under its date.

/** `coming`: Coming soon's cards (D-151); none in a city with no coming film, and then no section. */
export function FilmsScreen({ data, city, bg, coming = [] }: { data: ListData; city: City; bg: { light: string; dark: string }; coming?: ComingCard[] }) {
  const cityName = CITY_NAMES[city];
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const days = useDayPicker(data, city, now, live);
  const { day, current } = days;
  // The picked day's rows: the page's own, or a later day's file once it has come (D-147).
  const view = days.view ?? { ...data, rows: [] };
  const swap = useSwapIn(day, days.status === "ready");
  const changeDay = (next: Day, how: ChangeHow) => {
    if (next === day) return;
    swap(next > day ? 1 : -1, how);
    days.pick(next);
  };
  const [format, setFormat] = useState<FormatTag | null>(null);
  // Search on another page sends its text here as ?q=; typing here takes over.
  const sent = useQuery("q");
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? sent ?? "";

  const on = dayWords(day, current.date, live).on;
  const sections = filmSections(view.rows, day, now, live, format, days.anchor)
    .map((section) => ({ ...section, films: section.films.filter((entry) => !query.trim() || matchesTitle(view.films[entry.film]!.title, query)) }))
    .filter((section) => section.films.length > 0);
  const coverage = format ? formatCoverage(view.rows, day, now, live, (cinema) => view.cinemas[cinema]!.chain, days.anchor) : null;
  const note = coverage ? formatNote(coverage.chains, coverage.silent) : null;
  const choices = formatChoices(view.rows, day, now, live, format, days.anchor);

  const banner = pageBanner(data, clock);

  const words = (section: FilmSection) =>
    section.key === "later"
      ? sectionWords({ key: "later", count: section.films.length, later: laterName(now) })
      : section.key === "format"
        ? sectionWords({ key: "format", count: section.films.length, format: format!, on, city: cityName })
        : section.key === "soon"
          ? sectionWords({ key: "soon", count: section.films.length })
          : sectionWords({ key: "day", count: section.films.length, on, live });

  return (
    <AppFrame active="films" search={{ value: query, onChange: setTyped }} bg={bg}>
      <FilmsHero city={cityName} live={live && day === 0 && sections.length > 0} />
      <div className={s.controls}>
        <DayRow tiles={dayTiles(days.shown, live)} value={day} onChange={changeDay} onPress={days.press} testId="films.day" />
        {choices.length > 0 && (
          <div className={s.chips} role="group" aria-label="Format">
            <Chip selected={format === null} onClick={() => setFormat(null)} testId="format.any">
              Any format
            </Chip>
            {choices.map((tag) => (
              <Chip key={tag} selected={format === tag} onClick={() => setFormat(format === tag ? null : tag)} testId={`format.${tag}`}>
                {tag}
              </Chip>
            ))}
          </div>
        )}
        <PageNotice banner={banner} now={clock} className={s.notice} />
      </div>
      <DaySentence text={days.sentence} keep={days.keep} className={s.sentence} testId="films.listed" />

      {sections.map((section) => {
        const { title, note: line } = words(section);
        return (
          <section key={section.key} className={s.section} aria-labelledby={`films.${section.key}`} data-testid={`section.${section.key}`} data-swap>
            <div className={s.heading}>
              <h2 id={`films.${section.key}`}>{title}</h2>
              <p>{line}</p>
            </div>
            <div className={s.grid}>
              {section.films.map((entry) => {
                const film = view.films[entry.film]!;
                return (
                  <FilmCard
                    film={film.id}
                    key={film.id}
                    // A later day opens the film's page on that day (D-147).
                    href={dayHref(`/film/${film.id}`, current)}
                    title={film.title}
                    meta={filmMeta(film)}
                    poster={film.poster ? <Poster film={film} /> : <NoPoster title={film.title} />}
                    formats={formatsOf(entry.rows)}
                    next={entry.next}
                    cinemas={entry.cinemas}
                    now={day === 0 ? clock : null}
                    nextWord={live ? "Next" : "From"}
                    testId={`film.card.${film.id}`}
                  />
                );
              })}
            </div>
            {section.key === "format" && note && <p className={s.formatNote}>{note}</p>}
          </section>
        );
      })}

      {days.load && <DayLoad {...days.load} />}
      {!days.load && sections.length === 0 && <Empty data={data} cityName={cityName} day={day} now={now} live={live} format={format} query={query.trim()} on={on} onTomorrow={() => changeDay(1, "tap")} />}
      {/* Coming films have no showings and so no format; a search or a format narrows the page to showings.
          Drawn once the page runs (`live`), from the data the page carries anyway: the section sits below
          Now showing, and leaving it out of the HTML keeps Films inside its budget (D-153). */}
      {live && coming.length > 0 && !query.trim() && !format && (
        <section className={s.section} aria-labelledby="films.coming" data-testid="section.coming">
          <div className={s.heading}>
            <h2 id="films.coming">{COMING_SECTION.title}</h2>
            <p>{COMING_SECTION.note}</p>
            <span className={`${s.hand} ${s.comingHand}`} aria-hidden="true">
              {COMING_SECTION.hand}
            </span>
          </div>
          <ComingRow cards={coming} />
        </section>
      )}
    </AppFrame>
  );
}

function Empty({ data, cityName, day, now, live, format, query, on, onTomorrow }: { data: ListData; cityName: string; day: Day; now: string; live: boolean; format: FormatTag | null; query: string; on: string; onTomorrow: () => void }) {
  if (query || format || day !== 0 || !live) {
    const text = noFilms({ query, format, on });
    return (
      <p className={s.none} data-testid="films.none" data-swap>
        {text}
      </p>
    );
  }
  const tomorrow = showingOn(data.rows, 1, now);
  const words = nothingMoreToday({ city: cityName, last: lastStart(data.rows, now), tomorrowFilms: new Set(tomorrow.map((row) => row.film)).size, tomorrowFirst: tomorrow[0]?.at ?? null });
  return (
    <div className={s.empty} data-testid="films.empty" data-swap>
      <TicketFaceSticker height={74} />
      <h2>{words.title}</h2>
      <p>{words.body}</p>
      {words.action && (
        <Button onClick={onTomorrow} testId="films.tomorrow">
          {words.action}
        </Button>
      )}
      <span className={s.hand} aria-hidden="true">
        {words.note}
      </span>
    </div>
  );
}
