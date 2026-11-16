import { Link } from "@/components/ui/CityLink";
import { Poster } from "@/components/Poster";
import { TimeChip } from "@/components/ui/Status";
import { TicketFace, TicketFaceSticker } from "@/components/ui/Stickers";
import { soonest } from "@/lib/data/areaPage";
import type { FilmTimes } from "@/lib/data/cinemaPage";
import { formatLabel } from "@/lib/data/format";
import type { ListFilm, ListRow } from "@/lib/data/select";
import { filmMeta } from "@/lib/wording/film";
import s from "./cinema.module.css";

// Cinema › Film row (Figma 201:6415 "Film · Street Fighter"): the poster, the title, runtime and
// rating, Stay or Go when a source says stay, then the times. A film whose times have all started
// says when, and when it shows next, in place of the times.

export function FilmRow({ film, times, now, earlier, onOpen }: { film: ListFilm; times: FilmTimes; /** The clock, today only (rule 3). */ now: string | null; earlier: string | null; onOpen: (row: ListRow) => void }) {
  const first = soonest(times.rows, now);
  const stay = film.stay.verdict === "stay" || film.stay.verdict === "probably-stay";
  return (
    <article className={s.film} aria-labelledby={`film.${film.id}`} data-testid={`film.card.${film.id}`}>
      <span className={s.poster}>
        {film.poster ? (
          <Poster film={film} small />
        ) : (
          <span className={s.noPoster} data-testid="poster.none">
            <TicketFace height={22} />
          </span>
        )}
      </span>
      <div className={s.filmText}>
        <h3 id={`film.${film.id}`} className={s.filmTitle}>
          <Link href={`/film/${film.id}`}>{film.title}</Link>
        </h3>
        <p className={s.meta}>{filmMeta(film)}</p>
        {stay && (
          <p className={s.stay}>
            <TicketFaceSticker height={18} />
            <span data-testid="credits.chip">{film.stay.chip}</span>
          </p>
        )}
        {times.rows.length > 0 ? (
          <div className={s.times}>
            {times.rows.map((row) => (
              <TimeChip key={`${row.at}|${row.format}`} startsAt={row.at} format={formatLabel(row.format)} now={now} soonest={first.has(row)} onOpen={() => onOpen(row)} testId={`time.${film.id}.${row.at}`} />
            ))}
          </div>
        ) : (
          earlier && (
            <p className={s.earlier} data-testid="film.earlier">
              {earlier}
            </p>
          )
        )}
      </div>
    </article>
  );
}
