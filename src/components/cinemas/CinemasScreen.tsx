"use client";

import { useCityRouter as useRouter } from "@/components/ui/CityLink";
import { useCallback, useState } from "react";
import { AppFrame, LogoNote } from "@/components/ui/AppFrame";
import { PageNotice } from "@/components/ui/Status";
import { Toast } from "@/components/ui/Toast";
import { useSwapIn } from "@/components/ui/useSwapIn";
import { CITY_NAMES, type City } from "@/lib/city";
import { rememberArea } from "@/lib/area";
import { useSavedArea } from "@/lib/browser";
import { cinemaSections, type CinemaSection } from "@/lib/data/cinemas";
import { formatCoverage } from "@/lib/data/films";
import type { FormatTag } from "@/lib/data/format";
import type { Area } from "@/lib/data/load";
import { byFilm, dayDates, formatsOf, showingOn, type Day } from "@/lib/data/programme";
import { laterName, pageBanner, type ListData } from "@/lib/data/select";
import { toggleSaved, useSaved } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { SAVED_TOAST } from "@/lib/wording/cinemaPage";
import { NO_TIMES_NOTE, cinemaLine, cinemasHeading } from "@/lib/wording/cinemas";
import { dayWords } from "@/lib/wording/day";
import { formatNote } from "@/lib/wording/films";
import { CinemaRow } from "./CinemaRow";
import { CinemasHero } from "./CinemasHero";
import { Pickers } from "./Pickers";
import s from "./cinemas.module.css";

// The Cinemas tab (Figma Cinemas 200:6415): every cinema in the city. With an area kept on this
// phone, its cinemas first, then the areas next to it, then the rest; choosing another area here
// keeps that one instead (D-91). The page's own HTML has no area and no relative words (rule 3).

export function CinemasScreen({ data, areas, city, bg }: { data: ListData; areas: Area[]; city: City; bg: { light: string; dark: string } }) {
  const cityName = CITY_NAMES[city];
  const clock = useNow();
  const live = clock !== null;
  const now = clock ?? data.at;
  const [day, setDay] = useState<Day>(0);
  const swap = useSwapIn(day);
  const [format, setFormat] = useState<FormatTag | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();
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

  const dates = dayDates(data.rows, now);
  const days: [string, string] = [dayWords(0, dates[0], live).name, dayWords(1, dates[1], live).name];
  const areaOf = (cinema: number) => data.cinemas[cinema]!.area;
  const sections = cinemaSections({ rows: data.rows, cinemas: data.cinemas.length, areaOf, day, now, live, format, home });
  const banner = pageBanner(data, clock);
  const coverage = format ? formatCoverage(data.rows, day, now, live, (cinema) => data.cinemas[cinema]!.chain) : null;
  const note = coverage ? formatNote(coverage.chains, coverage.silent) : null;
  const formats = formatsOf(data.rows).map((tag) => ({ tag, cinemas: new Set(showingOn(data.rows, day, now, tag, !live).map((row) => row.cinema)).size }));
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
    <AppFrame active="cinemas" search={{ value: search, onChange: setSearch, onSubmit: () => router.push(`/?q=${encodeURIComponent(search.trim())}`) }} bg={bg} footer={footer}>
      <CinemasHero city={city} count={data.cinemas.length} />
      <Pickers
        areas={areas}
        area={home?.slug ?? null}
        onArea={(slug) => (rememberArea(slug), setPicked(slug))}
        days={days}
        day={day}
        onDay={(next, how) => {
          if (next === day) return;
          swap(next > day ? 1 : -1, how);
          setDay(next);
        }}
        formats={formats}
        format={format}
        onFormat={setFormat}
      />
      <PageNotice banner={banner} now={clock} className={s.notice} />

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
                    line={cinemaLine({ next, films: byFilm(entry.rows).length, listed: entry.listed, when })}
                    at={next}
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
      {sections.length === 0 && (
        <p className={s.none} data-testid="cinemas.none" data-swap>
          {`No cinema is showing a film in ${format} ${dayWords(day, dates[day], live).on}.`}
        </p>
      )}
      {toast && <Toast stamp={toast} icon="heart" text={SAVED_TOAST} onUndo={() => (toggleSaved(toast), setToast(null))} onDone={hideToast} />}
    </AppFrame>
  );
}
