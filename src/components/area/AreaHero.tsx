import { TicketFaceSticker } from "@/components/ui/Stickers";
import { cinemaCount } from "@/lib/wording/cinemas";
import { nameWidth } from "./nameWidth";
import s from "./hero.module.css";

// Area › Title (Figma 198:6017, 198:6897, 198:7733): "Cinemas in Lekki", the area circled by hand,
// the ticket face sticker on the right with the count under it. On a phone "Cinemas" and "in Lekki"
// are two lines; from an iPad, one. A name too long to sit beside the sticker takes a line of its
// own, so the title never runs under it. The sticker is decoration: the heading carries the words.

/** The widest name (see nameWidth) that fits after "in" on a 390 phone, on a smaller phone, and after "Cinemas in" on an iPad. Checked by e2e for every area. */
const PHONE_FITS = 5550; // Lagos Island fits (Figma), Ikorodu Road doesn't
const NARROW_FITS = 5000;
const TABLET_FITS = 4500; // Maryland fits, Sangotedo doesn't

export function AreaHero({ area, count }: { area: string; count: number }) {
  const width = nameWidth(area);
  return (
    <div className={s.hero} data-long={width > PHONE_FITS || undefined} data-snug={width > NARROW_FITS || undefined} data-wide={width > TABLET_FITS || undefined}>
      <h1 className={s.title}>
        <span className={s.cinemas} data-word="">
          Cinemas
        </span>{" "}
        <span className={s.in} data-word="">
          in
        </span>{" "}
        <span className={s.name} data-testid="area.name" data-word="">
          {area}
          <svg className={s.circle} aria-hidden="true">
            <ellipse />
          </svg>
        </span>
      </h1>
      <span className={s.sticker} aria-hidden="true" data-testid="area.sticker">
        <TicketFaceSticker height={55.2} />
      </span>
      <p className={s.count} data-testid="area.count">
        {cinemaCount(count)}
      </p>
    </div>
  );
}
