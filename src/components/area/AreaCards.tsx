import { Link } from "@/components/ui/CityLink";
import { Icon } from "@/components/ui/Icon";
import { TimeChip } from "@/components/ui/Status";
import { LogoSticker } from "@/components/ui/Stickers";
import { soonest, type AreaCinema } from "@/lib/data/areaPage";
import { formatLabel } from "@/lib/data/format";
import type { ListCinema, ListFilm, ListRow } from "@/lib/data/select";
import h from "@/components/ui/hover.module.css";
import s from "./area.module.css";

// Area › Cinema card (Figma 198:6073) and Area · <neighbour> (198:6319).

/** Figma shows a cinema's next three times; the rest are on its own page. */
const SHOWN = 3;
/** The neighbour card's logos: Figma's tilts, left to right. */
const TILTS = [-8, 6, -3];

type CardProps = {
  cinema: ListCinema;
  entry: AreaCinema;
  films: ListFilm[];
  /** The clock, once the page knows it (rule 3). */
  now: string | null;
  line: string;
  /** In place of the times, when there are none to show. */
  body: string;
  /** Under it, for a cinema with no times: its chain's featured films (D-131). */
  featured?: string | null;
  saved: boolean;
  /** The filled heart lets the cinema go (kept cards only). */
  onLetGo?: () => void;
  onOpen: (row: ListRow) => void;
};

/** One cinema: its logo, name and line, its next three times with their films, and a link to all of them. */
export function CinemaCard({ cinema, entry, films, now, line, body, featured = null, saved, onLetGo, onOpen }: CardProps) {
  const rows = entry.rows.slice(0, SHOWN);
  const first = soonest(entry.rows, now);
  return (
    <article className={s.card} aria-labelledby={`cinema.${cinema.id}`} data-testid={`cinema.card.${cinema.id}`} data-flip={cinema.id}>
      <div className={s.head}>
        <span className={s.logo}>
          <LogoSticker chain={cinema.chain} scale={0.8} />
        </span>
        <div className={s.text}>
          <h3 id={`cinema.${cinema.id}`} className={s.name} data-testid="cinema.name">
            {cinema.name}
          </h3>
          <p className={s.line} data-testid="cinema.line">
            {line}
          </p>
        </div>
        {saved && (
          <button type="button" className={s.heart} aria-pressed="true" aria-label={`Remove ${cinema.name} from your sinimas`} onClick={onLetGo} data-testid="cinema.save">
            <Icon name="heart" size={18} />
          </button>
        )}
      </div>
      {rows.length > 0 ? (
        <ul className={s.showings}>
          {rows.map((row) => (
            <li key={`${row.at}|${row.film}|${row.format}`} className={s.showing} data-testid={`row.${row.at}`}>
              <span className={s.cell}>
                <TimeChip startsAt={row.at} format={formatLabel(row.format)} now={now} soonest={first.has(row)} onOpen={() => onOpen(row)} testId={`time.${cinema.id}.${row.at}`} />
              </span>
              <span className={s.film} data-testid="showing.film">
                {films[row.film]!.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className={s.none} data-testid="cinema.none">
            {body}
          </p>
          {featured && (
            <p className={s.featured} data-testid="cinema.featured">
              {featured}
            </p>
          )}
        </>
      )}
      <Link href={`/cinema/${cinema.id}`} className={s.more} data-testid="cinema.all">
        All times
        <Icon name="arrow-right" size={16} />
        <span className={s.hidden}> at {cinema.name}</span>
      </Link>
    </article>
  );
}

/** A neighbouring area: up to three chains' logos, its name and line; the whole card opens the area. */
export function NextAreaCard({ slug, name, line, chains }: { slug: string; name: string; line: string; chains: string[] }) {
  return (
    <Link href={`/area/${slug}`} className={`${s.nextCard} ${h.lift}`} data-testid={`next.card.${slug}`} data-flip={`next.${slug}`}>
      <span className={s.logos} aria-hidden="true">
        {chains.map((chain, i) => (
          <span key={chain} className={s.stacked}>
            <LogoSticker chain={chain} scale={0.625} tilt={TILTS[i]} />
          </span>
        ))}
      </span>
      <span className={s.text}>
        <span className={s.name}>{name}</span>
        <span className={s.nextLine} data-testid="next.line">
          {line}
        </span>
      </span>
      <span className={s.more}>
        Show all
        <Icon name="arrow-right" size={16} />
      </span>
    </Link>
  );
}
