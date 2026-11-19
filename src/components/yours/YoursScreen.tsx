"use client";

import { useCityRouter as useRouter } from "@/components/ui/CityLink";
import { useState } from "react";
import { Poster } from "@/components/Poster";
import { Button } from "@/components/ui/Actions";
import { AppFrame, LogoNote } from "@/components/ui/AppFrame";
import { CinemaFolder } from "@/components/ui/Cards";
import { Icon } from "@/components/ui/Icon";
import { PageNotice } from "@/components/ui/Notices";
import { LogoSticker, TicketFace, TicketFaceSticker } from "@/components/ui/Stickers";
import { CITY_NAMES, type City } from "@/lib/city";
import { pageBanner, type ListData } from "@/lib/data/select";
import { folderTint, yourCinemas } from "@/lib/data/yours";
import { useSaved } from "@/lib/saved";
import { useNow } from "@/lib/time/useNow";
import { ADD, EMPTY, FOOTER, NOTE, addLabel, folderLine, savedCount } from "@/lib/wording/yours";
import { PickCinemas } from "./PickCinemas";
import s from "./yours.module.css";

// Your cinemas (Figma 206:8570 Default, 206:8921 None saved): the cinemas saved on this phone as
// folders, soonest first, each with its showings still on tonight; a dashed card says how to add
// one. With none saved, the logo stickers and a way to the cinemas. What is saved lives on this
// phone only, so the page's own HTML lists nothing: the list waits for the browser (rule 3).

export function YoursScreen({ data, areas, city, bg }: { data: ListData; areas: { slug: string; name: string }[]; city: City; bg: { light: string; dark: string } }) {
  const cityName = CITY_NAMES[city];
  const clock = useNow();
  const live = clock !== null;
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [picking, setPicking] = useState(false); // the list the + opens (D-106 f)
  const ids = useSaved();
  const saved = ids.map((id) => data.cinemas.findIndex((cinema) => cinema.id === id)).filter((index) => index >= 0);
  const cinemas = yourCinemas({ rows: data.rows, saved, now: clock });
  const banner = pageBanner(data, clock);
  const areaName = (slug: string) => areas.find((area) => area.slug === slug)?.name ?? slug;

  const footer = (
    <>
      {live && saved.length > 0 && <p data-testid="footer.note">{FOOTER}</p>}
      <LogoNote />
    </>
  );

  return (
    <AppFrame active="yours" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} footer={footer}>
      <div className={s.titleRow}>
        <div className={s.title}>
          <h1>Your sinimas</h1>
          <p className={s.sub}>
            {live && <span data-testid="yours.count">{savedCount(saved.length)}</span>}
            <span className={s.hand} aria-hidden="true">
              {NOTE}
            </span>
          </p>
        </div>
        {live && saved.length > 0 && (
          <button type="button" className={s.add} aria-label={addLabel(cityName)} aria-haspopup="dialog" onClick={() => setPicking(true)} data-testid="yours.add">
            <Icon name="plus" size={20} />
          </button>
        )}
      </div>

      {live && saved.length > 0 && <PageNotice banner={banner} now={clock} className={s.notice} />}

      {cinemas.length > 0 && (
        <div className={s.folders} data-testid="yours.folders">
          {cinemas.map((entry) => {
            const cinema = data.cinemas[entry.cinema]!;
            return (
              <CinemaFolder
                key={cinema.id}
                href={`/cinema/${cinema.id}`}
                name={cinema.name}
                chain={cinema.chain}
                area={areaName(cinema.area)}
                next={entry.next?.at ?? null}
                tonight={entry.tonight}
                line={folderLine({ area: areaName(cinema.area), next: entry.next?.at ?? null, listed: entry.listed })}
                tint={folderTint(cinema.chain)}
                posters={entry.films.map((index) => {
                  const film = data.films[index]!;
                  // A film with no artwork: the ticket face on the accent tint, as in a film row (D-93 b).
                  return film.poster ? (
                    <Poster key={film.id} film={film} small />
                  ) : (
                    <span key={film.id} className={s.noPoster} data-testid="poster.none">
                      <TicketFace height={14} />
                    </span>
                  );
                })}
                testId={`saved.folder.${cinema.id}`}
              />
            );
          })}
          <button type="button" className={s.addCard} aria-haspopup="dialog" onClick={() => setPicking(true)} data-testid="yours.add-card">
            <svg className={s.dash} aria-hidden="true">
              <rect width="100%" height="100%" rx="23.25" />
            </svg>
            <TicketFaceSticker height={44} />
            <b>{ADD.title}</b>
            <span>{ADD.body}</span>
          </button>
        </div>
      )}

      {live && saved.length === 0 && (
        <section className={s.empty} aria-labelledby="yours.empty" data-testid="yours.empty">
          <span className={s.stickers} aria-hidden="true">
            <LogoSticker chain="Filmhouse" scale={1.1} tilt={10} />
            <LogoSticker chain="Genesis" scale={1.1} tilt={-8} />
            <LogoSticker chain="EbonyLife" scale={1.1} tilt={4} />
          </span>
          <h2 id="yours.empty">{EMPTY.title}</h2>
          <p>{EMPTY.body}</p>
          <Button onClick={() => setPicking(true)} testId="yours.browse">
            {EMPTY.action}
          </Button>
          <p className={s.small}>{EMPTY.note}</p>
        </section>
      )}
      <PickCinemas open={picking} onClose={() => setPicking(false)} cinemas={data.cinemas} areas={areas} city={cityName} />
    </AppFrame>
  );
}
