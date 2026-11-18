import { LogoSticker } from "@/components/ui/Stickers";
import { CITY_NAMES, type City } from "@/lib/city";
import { cinemasTitleNote } from "@/lib/wording/cinemas";
import s from "./hero.module.css";

// The Cinemas title (Figma Cinemas › Title, D-73): centred, the chains' logo stickers two on each
// side, the city circled by hand and the count under it. On a phone "Sinimas in" and "Lagos" are
// two lines; from an iPad, one. The stickers are decoration: the heading carries the words.
// Each city shows chains it has (D-120): Abuja has no Filmhouse or EbonyLife, so Nova takes
// Filmhouse's place, Silverbird EbonyLife's and The Jays the fourth (D-141).

const STICKERS: Record<City, [chain: string, place: string | undefined][]> = {
  lagos: [
    ["Filmhouse", s.filmhouse],
    ["Genesis", s.genesis],
    ["EbonyLife", s.ebonylife],
    ["Silverbird", s.silverbird],
  ],
  abuja: [
    ["Nova", s.filmhouse],
    ["Genesis", s.genesis],
    ["Silverbird", s.ebonylife],
    ["The Jays", s.silverbird],
  ],
};

export function CinemasHero({ city, count }: { city: City; count: number }) {
  return (
    <div className={s.hero}>
      <div className={s.art} aria-hidden="true" data-testid="cinemas.hero.art">
        {STICKERS[city].map(([chain, className]) => (
          <span key={chain} className={`${s.sticker} ${className}`}>
            <LogoSticker chain={chain} scale={0.9} tilt={0} />
          </span>
        ))}
      </div>
      <h1 className={s.title}>
        <span>Sinimas in</span>{" "}
        <span className={s.city}>
          {CITY_NAMES[city]}
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
