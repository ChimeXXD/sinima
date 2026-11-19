import { Poster } from "@/components/Poster";
import { NoPoster } from "@/components/ui/Cards";
import { PosterTravel } from "@/components/ui/PosterTravel";
import type { Leaf } from "@/lib/data/comingPage";
import type { ListFilm } from "@/lib/data/select";
import s from "./hero.module.css";

// Film › Poster sticker hero (390 × 330 at every size): the poster as a tilted die-cut sticker,
// 3D glasses and popcorn stickers, and a handwritten note. All decoration: the title says the film.

const Sticker = ({ name, className }: { name: "glasses" | "popcorn"; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser
  <img className={`${s.sticker} ${className ?? ""}`} src={`/stickers/${name}.png`} alt="" decoding="async" fetchPriority="low" />
);

/** `leaf`: a coming film's calendar leaf on the poster's corner (D-151). */
export function FilmHero({ film, note, leaf = null }: { film: ListFilm; note: string | null; leaf?: Leaf | null }) {
  return (
    <div className={s.hero} aria-hidden="true" data-testid="film.hero">
      <PosterTravel film={film.id}>
        <div className={s.poster}>{film.poster ? <Poster film={film} eager /> : <NoPoster title={film.title} />}</div>
      </PosterTravel>
      {leaf && (
        <span className={s.leafAt}>
          <span className={s.comingLeaf} data-testid="coming.leaf">
            <small>{leaf.month}</small>
            <b>{leaf.day}</b>
          </span>
        </span>
      )}
      <Sticker name="glasses" className={s.glasses} />
      <Sticker name="popcorn" className={s.popcorn} />
      {note && (
        <span className={s.note} data-testid="film.note">
          {note}
        </span>
      )}
    </div>
  );
}
