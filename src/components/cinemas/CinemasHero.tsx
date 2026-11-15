import { LogoSticker } from "@/components/ui/Stickers";
import { cinemasTitleNote } from "@/lib/wording/cinemas";
import s from "./hero.module.css";

// The Cinemas title (Figma Cinemas › Title, D-73): centred, the chains' logo stickers two on each
// side, the city circled by hand and the count under it. On a phone "Cinemas in" and "Lagos" are
// two lines; from an iPad, one. The stickers are decoration: the heading carries the words.

const STICKERS = [
  ["Filmhouse", s.filmhouse],
  ["Genesis", s.genesis],
  ["EbonyLife", s.ebonylife],
  ["Silverbird", s.silverbird],
] as const;

export function CinemasHero({ city, count }: { city: string; count: number }) {
  return (
    <div className={s.hero}>
      <div className={s.art} aria-hidden="true">
        {STICKERS.map(([chain, className]) => (
          <span key={chain} className={`${s.sticker} ${className}`}>
            <LogoSticker chain={chain} scale={0.9} tilt={0} />
          </span>
        ))}
      </div>
      <h1 className={s.title}>
        <span>Cinemas in</span>{" "}
        <span className={s.city}>
          {city}
          <svg className={s.circle} aria-hidden="true">
            <ellipse />
          </svg>
        </span>
      </h1>
      <p className={s.note} data-testid="cinemas.count">
        {cinemasTitleNote(count)}
      </p>
    </div>
  );
}
