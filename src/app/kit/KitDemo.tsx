"use client";

import { useState } from "react";
import { Button, Chip, IconButton, Segmented } from "@/components/ui/Actions";
import { CinemaFolder, FilmCard, NoPoster, ShowingCard, type FolderTint } from "@/components/ui/Cards";
import { SearchBar, type CityChoice } from "@/components/ui/SearchBar";
import { SectionNav } from "@/components/ui/SectionNav";
import { OptionRow, Sheet } from "@/components/ui/Sheet";
import { CountdownBadge, CountdownPill, FormatBadge, Freshness, SampleNote, TimeChip, TimePill } from "@/components/ui/Status";
import { CitySticker, DrinkSticker, LogoSticker, NotFoundTicket, TicketFace, TicketFaceSticker } from "@/components/ui/Stickers";
import { countdown } from "@/lib/time/countdown";
import { useNow } from "@/lib/time/useNow";
import { freshness } from "@/lib/wording/freshness";
import s from "./kit.module.css";

// Figma's example values. The clock is fixed at 17:30 in Lagos, and, as on every page, relative
// words appear only once the page is running (rule 3).
const NOW = "2026-11-06T16:30:00Z";
const at = (minutes: number) => new Date(Date.parse(NOW) + minutes * 60_000).toISOString().replace(".000Z", "Z");
const film = (id: string, title: string) => ({ id, title, poster: null, rating: null, runtimeMin: null, stay: { chip: "", detail: "" } });
const RAMAYANA = film("ramayana-rise-of-a-legend", "Ramayana: Rise of a Legend");
const STREET = film("street-fighter", "Street Fighter");
const CLAYFACE = film("clayface", "Clayface");
const FOLDERS: [string, string, string, number, FolderTint][] = [
  ["EbonyLife Cinemas", "EbonyLife", "Victoria Island", 7, "blue"],
  ["Filmhouse Lekki IMAX", "Filmhouse", "Lekki", 3, "violet"],
  ["Genesis Deluxe Maryland Mall", "Genesis", "Maryland", 6, "pink"],
  ["Ozone Cinemas Yaba", "Ozone", "Yaba", 7, "green"],
];
const CHAINS = ["EbonyLife", "Filmhouse", "Genesis", "Ozone", "Silverbird", "Blue Pictures", "Filmworld", "Grand", "Magnificent", "Sky", "THC", "Viva", "Nova"];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className={s.section} aria-labelledby={id} data-testid={`kit.${id}`}>
      <h2 id={id} className={s.heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function KitDemo() {
  const now = useNow() === null ? null : NOW;
  const [day, setDay] = useState<"Today" | "Tomorrow">("Today");
  const [imax, setImax] = useState(true);
  const [city, setCity] = useState<CityChoice>("lagos");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(false);
  const [picked, setPicked] = useState(0);

  return (
    <main className={s.page}>
      <h1 className={s.h1}>Components</h1>
      <p className={s.note}>The shared pieces of the site with Figma&apos;s example values. The times are examples, not real showings.</p>

      <Section id="actions" title="7 · Actions">
        <div className={s.row}>
          <Button icon="external-link" href="https://ebonylifecinemas.com" testId="kit.button.primary">
            Book on EbonyLife&apos;s site
          </Button>
          <Button kind="secondary" icon="external-link" onClick={() => {}} testId="kit.button.secondary">
            Book on EbonyLife&apos;s site
          </Button>
          <Button icon="external-link" href="https://ebonylifecinemas.com" disabled testId="kit.button.disabled">
            Book on EbonyLife&apos;s site
          </Button>
          <IconButton icon="sun" label="Switch theme" testId="kit.iconbutton" />
        </div>
        <div className={s.row}>
          <Chip selected={imax} onClick={() => setImax(!imax)} testId="kit.chip">
            IMAX
          </Chip>
          <Chip>4D</Chip>
          <Chip disabled>MX4D</Chip>
          <Segmented label="Day" options={["Today", "Tomorrow"] as const} value={day} onChange={setDay} testId="kit.segmented" />
        </div>
      </Section>

      <Section id="inputs" title="8 · Inputs">
        <div className={s.stack}>
          <SearchBar city={city} value={query} onChange={setQuery} onCity={() => setCity(city === "lagos" ? "abuja" : city === "abuja" ? "both" : "lagos")} testId="kit.search" />
        </div>
      </Section>

      <Section id="navigation" title="9 · Navigation">
        <SectionNav active="films" saved={4} hrefs={{ films: "/kit", cinemas: "/kit", soon: "/kit", yours: "/kit" }} />
      </Section>

      <Section id="cards" title="10 · Cards">
        <div className={s.grid}>
          <FilmCard href="/film/ramayana-rise-of-a-legend" title={RAMAYANA.title} meta="3 h 21 min" poster={<NoPoster title={RAMAYANA.title} />} formats={["IMAX", "4D"]} next={at(5)} cinemas={4} now={now} testId="kit.filmcard" />
        </div>
        <div className={s.grid}>
          <ShowingCard title={STREET.title} cinema="Filmhouse Surulere" meta="2 h 0 min · 15" poster={<NoPoster title={STREET.title} />} startsAt={at(10)} now={now} bookUrl="https://filmhouseng.com" bookLabel="Book Street Fighter at 17:40 on Filmhouse's site" testId="kit.showing.upcoming" />
          <ShowingCard title={CLAYFACE.title} cinema="Filmhouse Surulere" meta="1 h 49 min · 18" poster={<NoPoster title={CLAYFACE.title} />} startsAt={at(-3)} now={now} bookUrl="https://filmhouseng.com" bookLabel="Book Clayface on Filmhouse's site" testId="kit.showing.started" />
        </div>
        <div className={s.grid}>
          {FOLDERS.map(([name, chain, area, tonight, tint]) => (
            <CinemaFolder key={name} href="/kit" name={name} chain={chain} area={area} next={at(10)} tonight={tonight} tint={tint} posters={[<NoPoster key="a" title={RAMAYANA.title} />, <NoPoster key="b" title={STREET.title} />, <NoPoster key="c" title={CLAYFACE.title} />]} testId={`kit.folder.${chain}`} />
          ))}
        </div>
      </Section>

      <Section id="worst" title="Worst case">
        <div className={s.grid}>
          <FilmCard href="/kit" title="Ramayana: Rise of a Legend, Part Two: The Return of the King of Ayodhya" meta="3 h 21 min · 18" poster={<NoPoster title={RAMAYANA.title} />} formats={["IMAX", "4DX", "ScreenX", "MX4D"]} next={at(1)} cinemas={1} now={now} testId="kit.worst.film" />
          <ShowingCard title="Spider-Man: Across the Spider-Verse (Original Version with Subtitles)" cinema="Genesis Deluxe Cinemas Maryland Mall Ikeja" meta="2 h 20 min · PG" poster={<NoPoster title={STREET.title} />} startsAt={at(0)} now={now} bookUrl={null} bookLabel="" testId="kit.worst.showing" />
          <CinemaFolder href="/kit" name="Genesis Deluxe Cinemas Lekki Phase One Admiralty Way" chain="Unknown chain" area="Eti-Osa and Lekki Phase One" next={null} tonight={128} tint="pink" posters={[]} testId="kit.worst.folder" />
        </div>
      </Section>

      <Section id="status" title="11 · Status">
        <div className={s.row}>
          <CountdownPill startsAt={at(5)} now={now} />
          <CountdownBadge startsAt={at(10)} now={now} />
          <CountdownBadge startsAt={at(-3)} now={now} />
        </div>
        <div className={s.row}>
          <span className={s.pillBox}>
            <TimePill startsAt={at(70)} now={now} bookUrl="https://filmhouseng.com" bookLabel="Book 18:40 on Filmhouse's site" />
          </span>
          <span className={s.pillBox} data-testid="kit.latepill">
            <TimePill startsAt={at(420)} now={now} bookUrl="https://filmhouseng.com" bookLabel="Book 00:30 on Saturday on Filmhouse's site" />
          </span>
          <span className={s.pillBox}>
            <TimePill startsAt={at(-3)} now={now} bookUrl="https://filmhouseng.com" bookLabel="Book on Filmhouse's site" />
          </span>
        </div>
        <div className={s.row} data-testid="kit.timechips">
          <TimeChip startsAt={at(90)} format="IMAX" now={now} onOpen={() => setSheet(true)} />
          <TimeChip startsAt={at(30)} format="IMAX" now={now} soonest onOpen={() => setSheet(true)} />
          <TimeChip startsAt={at(-5)} format="IMAX" now={now} onOpen={() => setSheet(true)} />
          <TimeChip startsAt={at(420)} format="IMAX" now={now} onOpen={() => setSheet(true)} />
        </div>
        <div className={s.row}>
          <FormatBadge formats={["IMAX", "4D"]} />
          <SampleNote />
          {now && <Freshness text={freshness({ name: "EbonyLife's site", method: "public-page" }, at(-120), now).text} />}
        </div>
      </Section>

      <Section id="overlays" title="12 · Overlays">
        <div className={s.row}>
          <Button kind="secondary" onClick={() => setSheet(true)} testId="kit.sheet.open">
            Open the sheet
          </Button>
        </div>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="17:40 · EbonyLife Cinemas" subtitle={["Ramayana", "Lekki", now && countdown(at(10), now)].filter(Boolean).join(" · ")} testId="kit.sheet">
          <OptionRow icon="external-link" title="Book on EbonyLife's site" desc="Opens their booking page." selected={picked === 0} onClick={() => setPicked(0)} testId="kit.option.book" />
          <OptionRow icon="calendar-plus" title="Remind me" desc="Adds it to your calendar." selected={picked === 1} onClick={() => setPicked(1)} testId="kit.option.remind" />
        </Sheet>
      </Section>

      <Section id="stickers" title="13 · Stickers">
        <div className={s.row}>
          <TicketFace />
          <TicketFaceSticker />
          <DrinkSticker />
          <CitySticker city="lagos" />
          <CitySticker city="abuja" />
        </div>
        <div className={s.row}>
          {CHAINS.map((chain) => (
            <LogoSticker key={chain} chain={chain} />
          ))}
        </div>
        <NotFoundTicket />
      </Section>
    </main>
  );
}
