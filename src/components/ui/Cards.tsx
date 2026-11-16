import { Link } from "@/components/ui/CityLink";
import { minutesFromStart } from "@/lib/time/countdown";
import { isBeforeStart, showingState } from "@/lib/time/showingState";
import { filmNextLine } from "@/lib/wording/film";
import { NO_POSTER } from "@/lib/wording/films";
import { cinemaNextLine, showingsTonight } from "@/lib/wording/showing";
import { Icon } from "./Icon";
import { CountdownBadge, CountdownPill, FormatBadge, TimePill } from "./Status";
import { LogoSticker, TicketFaceSticker } from "./Stickers";
import s from "./cards.module.css";

// 10 · Cards (Figma 167:72): films, showings and saved cinemas. Posters come in as `poster`, so
// a card never decides where artwork comes from.

/**
 * 10.1 Film card. Poster 2:3 with the format badge top left and the countdown pill on its bottom
 * edge (only within the hour); then the title (2 lines at most), runtime · rating, and the stats
 * line "Next 17:40 · 4 cinemas".
 */
export function FilmCard(props: { href: string; title: string; meta: string; poster: React.ReactNode; formats: string[]; next: string | null; cinemas: number; now: string | null; nextWord?: "Next" | "From"; testId?: string }) {
  const { href, title, meta, poster, formats, next, cinemas, now, nextWord, testId } = props;
  const soon = next !== null && now !== null && isBeforeStart(showingState(next, now)) && minutesFromStart(next, now).minutes <= 60; // as the old card
  const stats = next === null ? null : filmNextLine(next, cinemas, nextWord);
  return (
    <article className={s.film} data-testid={testId}>
      <Link href={href} className={s.posterArea} aria-label={title} tabIndex={-1}>
        <span className={s.poster}>{poster}</span>
        <span className={s.formatAt}>
          <FormatBadge formats={formats} />
        </span>
        {soon && (
          <span className={s.pillAt}>
            <CountdownPill startsAt={next} now={now} />
          </span>
        )}
      </Link>
      <h3 className={s.filmTitle}>
        <Link href={href}>{title}</Link>
      </h3>
      <p className={s.meta}>{meta}</p>
      {stats && (
        <p className={s.stats}>
          <b>
            <time dateTime={next!}>{stats.next}</time>
          </b>
          <span className={s.dot} aria-hidden="true">
            ·
          </span>
          <span>{stats.where}</span>
        </p>
      )}
    </article>
  );
}

/**
 * 10.2 Showing card (Starting soon). Cards in a row share a height: the info grows and the time
 * pill sits at the bottom. Once started the poster dims, the badge says so, and there is no
 * booking (D-05).
 */
export function ShowingCard(props: { title: string; cinema: string; meta: string; poster: React.ReactNode; startsAt: string; now: string | null; bookUrl: string | null; bookLabel: string; testId?: string; /** Opens the showing sheet: a tap anywhere on the card but Book. */ onOpen?: () => void; /** One line each for the title, cinema and meta, as on the Starting soon screen. */ oneLine?: boolean }) {
  const { title, cinema, meta, poster, startsAt, now, bookUrl, bookLabel, testId, onOpen, oneLine } = props;
  const started = now !== null && !isBeforeStart(showingState(startsAt, now));
  return (
    <article className={s.showing} data-started={started || undefined} data-one-line={oneLine || undefined} data-testid={testId}>
      <div className={s.showingPoster}>
        <span className={s.poster}>{poster}</span>
        <span className={s.badgeAt}>
          <CountdownBadge startsAt={startsAt} now={now} />
        </span>
      </div>
      <div className={s.info}>
        <h3 className={s.showingTitle}>
          {onOpen ? (
            <button type="button" className={s.open} onClick={onOpen}>
              {title}
            </button>
          ) : (
            title
          )}
        </h3>
        <p className={s.cinema}>
          <Icon name="map-pin" size={14} />
          <span className={s.cinemaName}>{cinema}</span>
        </p>
        <p className={s.meta}>{meta}</p>
      </div>
      {/* No Book link until the clock is known: the static HTML cannot tell whether it has started (D-05). */}
      <TimePill startsAt={startsAt} now={now} bookUrl={bookUrl} bookLabel={bookLabel} />
    </article>
  );
}

/**
 * A poster face for a film with no artwork yet (Figma: Tele X Zikora): the title large on the
 * accent tint, a ticket sticker, and "Poster not listed yet". Never an empty box (D-49).
 */
export function NoPoster({ title }: { title: string }) {
  return (
    <div className={s.noPoster} data-testid="poster.none">
      <span className={s.noPosterNote}>
        {NO_POSTER[0]}
        <br />
        {NO_POSTER[1]}
      </span>
      <TicketFaceSticker height={46} className={s.noPosterTicket} />
      <b className={s.noPosterTitle}>{title}</b>
    </div>
  );
}

export type FolderTint = "blue" | "violet" | "pink" | "green";

/**
 * 10.3 Cinema folder (Keepsy): the cinema's next films as tilted poster stickers in a tinted
 * folder, a frosted front with the chain's logo sticker and tonight's count. Name and
 * "Lekki · next 17:40" sit under it.
 */
export function CinemaFolder(props: { href: string; name: string; chain: string; area: string; next: string | null; tonight: number; posters: React.ReactNode[]; tint: FolderTint; testId?: string; /** The line under the name, in place of "Lekki · next 17:40". */ line?: string }) {
  const { href, name, chain, area, next, tonight, posters, tint, testId } = props;
  const line = props.line ?? cinemaNextLine(area, next);
  // With nothing left tonight the count goes; the line under the name says why.
  const count = tonight > 0 ? showingsTonight(tonight) : null;
  return (
    <Link href={href} className={s.folderCard} aria-label={[name, line, count].filter(Boolean).join(", ")} style={{ "--tint": `var(--p-folder-${tint})` } as React.CSSProperties} data-testid={testId}>
      <span className={s.folder} aria-hidden="true">
        <span className={s.back} />
        <span className={s.tab} />
        {posters.slice(0, 3).map((poster, i) => (
          <span key={i} className={s.folderPoster} data-n={i}>
            {poster}
          </span>
        ))}
        <span className={s.front}>
          <span className={s.logoAt}>
            <LogoSticker chain={chain} scale={0.78} />
          </span>
          {count && <span className={s.count}>{count}</span>}
        </span>
      </span>
      <span className={s.folderName}>{name}</span>
      <span className={s.folderMeta}>{line}</span>
    </Link>
  );
}
