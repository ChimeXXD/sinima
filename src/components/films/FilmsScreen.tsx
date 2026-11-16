"use client";

import { useState } from "react";
import { Poster } from "@/components/Poster";
import { Button, Chip, Segmented } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { FilmCard, NoPoster } from "@/components/ui/Cards";
import { PageNotice } from "@/components/ui/Status";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import { useSwapIn, type ChangeHow } from "@/components/ui/useSwapIn";
import { filmSections, formatCoverage, lastStart, type FilmSection } from "@/lib/data/films";
import type { FormatTag } from "@/lib/data/format";
import { dayDates, formatsOf, showingOn, type Day } from "@/lib/data/programme";
import { matchesTitle } from "@/lib/data/search";
import { laterName, pageBanner, type ListData } from "@/lib/data/select";
import { useQuery } from "@/lib/browser";
import { useNow } from "@/lib/time/useNow";
import { dayWords } from "@/lib/wording/day";
import { filmMeta } from "@/lib/wording/film";
import { formatNote, noFilms, nothingMoreToday, sectionWords } from "@/lib/wording/films";
import { FilmsHero } from "./FilmsHero";
import s from "./films.module.css";

// Films, the home page (Figma Films, D-55): what's on in the city, as posters. Today: the films
// starting in the next 2 hours, then later tonight. Relative words and the countdowns wait for the
// clock (rule 3); until then the day is one list under its date.

const CITY = "Lagos"; // one city until the city layer (unit 13, O-16)

export function FilmsScreen({ data, bg }: { data: ListData; bg: { light: string; dark: string } }) {
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const [day, setDay] = useState<Day>(0);
  const swap = useSwapIn(day);
  const changeDay = (next: Day, how: ChangeHow) => {
    if (next === day) return;
    swap(next > day ? 1 : -1, how);
    setDay(next);
  };
  const [format, setFormat] = useState<FormatTag | null>(null);
  // Search on another page sends its text here as ?q=; typing here takes over.
  const sent = useQuery("q");
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? sent ?? "";

  const dates = dayDates(data.rows, now);
  const names = [dayWords(0, dates[0], live).name, dayWords(1, dates[1], live).name];
  const on = dayWords(day, dates[day], live).on;
  const sections = filmSections(data.rows, day, now, live, format)
    .map((section) => ({ ...section, films: section.films.filter((entry) => !query.trim() || matchesTitle(data.films[entry.film]!.title, query)) }))
    .filter((section) => section.films.length > 0);
  const coverage = format ? formatCoverage(data.rows, day, now, live, (cinema) => data.cinemas[cinema]!.chain) : null;
  const note = coverage ? formatNote(coverage.chains, coverage.silent) : null;

  const banner = pageBanner(data, clock);

  const words = (section: FilmSection) =>
    section.key === "later"
      ? sectionWords({ key: "later", count: section.films.length, later: laterName(now) })
      : section.key === "format"
        ? sectionWords({ key: "format", count: section.films.length, format: format!, on, city: CITY })
        : section.key === "soon"
          ? sectionWords({ key: "soon", count: section.films.length })
          : sectionWords({ key: "day", count: section.films.length, on, live });

  return (
    <AppFrame active="films" search={{ value: query, onChange: setTyped }} bg={bg}>
      <FilmsHero city={CITY} live={live && day === 0 && sections.length > 0} />
      <div className={s.controls}>
        <Segmented label="Day" options={names} value={names[day]!} onChange={(name, how) => changeDay(names.indexOf(name) === 1 ? 1 : 0, how)} testId="films.day" />
        <div className={s.chips} role="group" aria-label="Format">
          <Chip selected={format === null} onClick={() => setFormat(null)} testId="format.any">
            Any format
          </Chip>
          {formatsOf(data.rows).map((tag) => (
            <Chip key={tag} selected={format === tag} onClick={() => setFormat(format === tag ? null : tag)} testId={`format.${tag}`}>
              {tag}
            </Chip>
          ))}
        </div>
        <PageNotice banner={banner} now={clock} className={s.notice} />
      </div>

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
                const film = data.films[entry.film]!;
                return (
                  <FilmCard
                    film={film.id}
                    key={film.id}
                    href={`/film/${film.id}`}
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

      {sections.length === 0 && <Empty data={data} day={day} now={now} live={live} format={format} query={query.trim()} on={on} onTomorrow={() => changeDay(1, "tap")} />}
    </AppFrame>
  );
}

function Empty({ data, day, now, live, format, query, on, onTomorrow }: { data: ListData; day: Day; now: string; live: boolean; format: FormatTag | null; query: string; on: string; onTomorrow: () => void }) {
  if (query || format || day === 1 || !live) {
    const text = noFilms({ query, format, on });
    return (
      <p className={s.none} data-testid="films.none" data-swap>
        {text}
      </p>
    );
  }
  const tomorrow = showingOn(data.rows, 1, now);
  const words = nothingMoreToday({ city: CITY, last: lastStart(data.rows, now), tomorrowFilms: new Set(tomorrow.map((row) => row.film)).size, tomorrowFirst: tomorrow[0]?.at ?? null });
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
