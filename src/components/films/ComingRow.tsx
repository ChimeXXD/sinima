import { Poster } from "@/components/Poster";
import { NoPoster } from "@/components/ui/Cards";
import { Link } from "@/components/ui/CityLink";
import { PosterTravel } from "@/components/ui/PosterTravel";
import type { ComingCard } from "@/lib/data/comingPage";
import c from "@/components/ui/cards.module.css";
import h from "@/components/ui/hover.module.css";
import s from "./films.module.css";

// Films › Coming soon's cards (D-144, D-151, mockup/coming-soon): the Films card's poster and title,
// "Opens Fri 18 Dec", the sinima's name, and a calendar leaf on the poster. The words come made from
// the build (lib/data/comingPage): dates the sinima gave, never relative to now (rule 3). Each card is
// one link (one stop for a keyboard), and its data is a short tuple: Films holds the page budget's
// last kilobyte (D-153).

/** A sideways row on a phone, the Now showing grid from an iPad. */
export function ComingRow({ cards }: { cards: ComingCard[] }) {
  return (
    <div className={`${s.grid} ${s.comingRow}`}>
      {cards.map(([id, title, poster, opens, sinimas, month, day]) => (
        <Link key={id} href={`/film/${id}`} className={`${c.film} ${h.host}`}>
          <span className={c.posterArea}>
            <PosterTravel film={id}>
              <span className={`${c.poster} ${h.poster}`}>{poster ? <Poster film={{ poster }} /> : <NoPoster title={title} />}</span>
            </PosterTravel>
            {day && (
              // Decoration: the line under the title says the date.
              <span className={`${s.comingLeaf} ${h.poster}`} aria-hidden="true" data-testid="coming.leaf">
                <small>{month}</small>
                <b>{day}</b>
              </span>
            )}
          </span>
          <h3 className={c.filmTitle}>{title}</h3>
          <p className={c.stats}>
            <b>{opens}</b>
          </p>
          <p className={`${c.meta} ${s.comingSinima}`}>{sinimas}</p>
        </Link>
      ))}
    </div>
  );
}
