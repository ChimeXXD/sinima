"use client";

import { useCallback, useState } from "react";
import { AppFrame, LogoNote } from "@/components/ui/AppFrame";
import { PageNotice } from "@/components/ui/Notices";
import { Toast } from "@/components/ui/Toast";
import { DayLoad, DaySentence } from "@/components/ui/DayParts";
import { useDayPicker } from "@/components/ui/useDayPicker";
import { useSwapIn } from "@/components/ui/useSwapIn";
import { CITY_NAMES, type City } from "@/lib/city";
import { rememberArea } from "@/lib/area";
import { useSavedArea } from "@/lib/browser";
import { cinemaSections, type CinemaSection } from "@/lib/data/cinemas";
import { fold } from "@/lib/data/search";
import { formatCoverage } from "@/lib/data/films";
import { formatTag, type FormatTag } from "@/lib/data/format";
import type { Area } from "@/lib/data/load";
import { byFilm, formatChoices, formatsOf, showingOn } from "@/lib/data/programme";
import { laterName, pageBanner, type ListData } from "@/lib/data/select";
import { toggleSaved, useSaved } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { SAVED_TOAST } from "@/lib/wording/cinemaPage";
import { NO_TIMES_NOTE, cinemaLine, cinemasHeading } from "@/lib/wording/cinemas";
import { featuredFor } from "@/lib/wording/featured";
import { dayWords, weekdayName } from "@/lib/wording/day";
import { formatNote } from "@/lib/wording/films";
import { CinemaRow } from "./CinemaRow";
import { CinemasHero } from "./CinemasHero";
import { Pickers, dayChoiceId } from "./Pickers";
import s from "./cinemas.module.css";

// The Cinemas tab (Figma Cinemas 200:6415): every cinema in the city. With an area kept on this
// phone, its cinemas first, then the areas next to it, then the rest; choosing another area here
// keeps that one instead (D-91). The page's own HTML has no area and no relative words (rule 3).

export function CinemasScreen({ data, areas, city, bg }: { data: ListData; areas: Area[]; city: City; bg: { light: string; dark: string } }) {
  const cityName = CITY_NAMES[city];
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const days = useDayPicker(data, city, now, live);
  const { day, current } = days;
  const view = days.view ?? { ...data, rows: [] };
  const swap = useSwapIn(day, days.status === "ready");
  const [format, setFormat] = useState<FormatTag | null>(null);
  const [search, setSearch] = useState("");
  const saved = useSavedArea();
  // Picking an area keeps it on this phone; until the store answers, the pick shows at once.
  const [picked, setPicked] = useState<string | null>(null);
  // Keeping a cinema from its row (D-106 f): the heart pops and, as on the cinema's page, a toast says so.
  const kept = useSaved();
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  // The row's heart has already filled and popped (D-112 F3): this keeps it.
  const keep = (id: string) => {
    const saving = !kept.includes(id);
    toggleSaved(id);
    setToast(saving ? id : null);
  };
  const home = areas.find((area) => area.slug === (picked ?? saved)) ?? null;

  const choices = days.shown.map((shown) => ({ day: shown.day, label: dayWords(shown.day, shown.date, live).name, id: dayChoiceId(shown.day, shown.key) }));
  const areaOf = (cinema: number) => data.cinemas[cinema]!.area;
  // A later day's rows are only that day's (D-147): a sinima with times on another day is still listed.
  // A sinima listing only a later day has times too: "nothing today", not "not available" (D-146).
  const alsoListed = days.shown.flatMap((shown) => shown.cinemas ?? []);
  const all = days.load ? [] : cinemaSections({ rows: view.rows, known: data.rows, alsoListed, cinemas: data.cinemas.length, areaOf, day, now, live, format, home, anchor: days.anchor });
  // The search finds cinemas here: each section keeps the cinemas whose name or area has what was typed.
  const wanted = fold(search.trim());
  const sections = wanted ? all.map((section) => ({ ...section, cinemas: section.cinemas.filter((entry) => { const cinema = data.cinemas[entry.cinema]!; return fold(`${cinema.name} ${areas.find((area) => area.slug === cinema.area)?.name ?? cinema.area}`).includes(wanted); }) })).filter((section) => section.cinemas.length > 0) : all;
  const banner = pageBanner(data, clock);
  const coverage = format ? formatCoverage(view.rows, day, now, live, (cinema) => data.cinemas[cinema]!.chain, days.anchor) : null;
  const note = coverage ? formatNote(coverage.chains, coverage.silent) : null;
  const onDay = showingOn(view.rows, day, now, null, !live, days.anchor);
  const formats = formatChoices(view.rows, day, now, live, format, days.anchor).map((tag) => ({ tag, cinemas: new Set(onDay.filter((row) => formatTag(row.format) === tag).map((row) => row.cinema)).size }));
  const unread = sections.some((section) => section.cinemas.some((entry) => !entry.listed));
  const when = !live ? null : day === 1 ? "tomorrow" : laterName(now) === "Later tonight" ? "tonight" : "today";

  const heading = (section: CinemaSection) =>
    section.key === "area"
      ? cinemasHeading({ key: "area", area: home!.name, count: section.cinemas.length })
      : section.key === "next"
        ? cinemasHeading({ key: "next", area: home!.name, neighbours: home!.neighbours.filter((slug) => section.cinemas.some((entry) => areaOf(entry.cinema) === slug)).map((slug) => areas.find((area) => area.slug === slug)?.name ?? slug) })
        : section.key === "rest"
          ? cinemasHeading({ key: "rest", city: cityName })
          : cinemasHeading({ key: "all", count: section.cinemas.length, format });

  const footer = (
    <>
      {unread && <p data-testid="cinemas.no-times">{NO_TIMES_NOTE}</p>}
      <LogoNote />
    </>
  );

  return (
    <AppFrame active="cinemas" search={{ value: search, onChange: setSearch, cinemas: true }} bg={bg} footer={footer}>
      <CinemasHero city={city} count={data.cinemas.length} />
      <Pickers
        areas={areas}
        area={home?.slug ?? null}
        onArea={(slug) => (rememberArea(slug), setPicked(slug))}
        days={choices}
        day={day}
        onDay={(next, how) => {
          if (next === day) return;
          swap(next > day ? 1 : -1, how);
          days.pick(next);
        }}
        formats={formats}
        format={format}
        onFormat={setFormat}
      />
      <DaySentence text={days.sentence} keep={days.keep} className={s.sentence} testId="cinemas.listed" />
      <PageNotice banner={banner} now={clock} className={s.notice} />
      {days.load && <DayLoad {...days.load} />}

      {sections.map((section) => {
        const { title, note: line } = heading(section);
        return (
          <section key={section.key} className={s.group} aria-labelledby={`cinemas.${section.key}`} data-testid={`group.${section.key}`} data-swap>
            <div className={s.heading}>
              <h2 id={`cinemas.${section.key}`}>{title}</h2>
              <p>{line}</p>
            </div>
            <div className={s.rows}>
              {section.cinemas.map((entry) => {
                const cinema = data.cinemas[entry.cinema]!;
                const next = entry.rows[0]?.at ?? null;
                return (
                  <CinemaRow
                    key={cinema.id}
                    href={`/cinema/${cinema.id}`}
                    name={cinema.name}
                    chain={cinema.chain}
                    area={areas.find((area) => area.slug === cinema.area)?.name ?? cinema.area}
                    line={cinemaLine({ next, films: byFilm(entry.rows).length, listed: entry.listed, when, weekday: day > 1 ? weekdayName(current.date) : undefined })}
                    at={next}
                    featured={day === 0 ? featuredFor(data, entry.cinema, clock) : null}
                    formats={formatsOf(entry.rows)}
                    saved={kept.includes(cinema.id)}
                    onSave={() => keep(cinema.id)}
                    testId={`cinema.card.${cinema.id}`}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
      {format && note && (
        <p className={s.formatNote} data-testid="format.left-out">
          {note}
        </p>
      )}
      {!days.load && wanted && sections.length === 0 && (
        <p className={s.none} data-testid="cinemas.no-match">
          {`No sinima matches “${search.trim()}”.`}
        </p>
      )}
      {!days.load && !wanted && sections.length === 0 && (
        <p className={s.none} data-testid="cinemas.none" data-swap>
          {`No sinima is showing a film in ${format} ${dayWords(day, current.date, live).on}.`}
        </p>
      )}
      {toast && <Toast stamp={toast} icon="heart" text={SAVED_TOAST} onUndo={() => (toggleSaved(toast), setToast(null))} onDone={hideToast} />}
    </AppFrame>
  );
}
