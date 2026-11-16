import { nameWidth } from "@/components/area/nameWidth";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import s from "./hero.module.css";

// Starting soon › Title (Figma 204:7192 phone 390 × 132; 204:8247 iPad, 204:9053 desktop, 114
// tall): "Starting soon in Lekki", the place circled by hand, the ticket face sticker on the right
// and "next 2 hours" under it. On a phone "Starting soon" and "in Lekki" are two lines; from an
// iPad, one. A name too long to sit beside the sticker goes lower, so it never runs under it.

/** The widest name (see area/nameWidth) that fits after "in" on a phone (390 down to 320), and on the iPad's one line (Lekki, as Figma). Checked by e2e for every area. */
const PHONE_FITS = 4500; // Maryland fits, Sangotedo doesn't (its circle meets "next 2 hours")
const TABLET_FITS = 2200; // Lekki fits, Yaba doesn't

/** `live`: the browser has the time; until then the page lists the day, so it doesn't say "next 2 hours" (rule 3). */
export function SoonHero({ place, live }: { place: string; live: boolean }) {
  const width = nameWidth(place);
  return (
    <div className={s.hero} data-long={width > PHONE_FITS || undefined} data-wide={width > TABLET_FITS || undefined}>
      <h1 className={s.title} data-testid="soon.title">
        <span className={s.lead} data-word="">
          Starting soon
        </span>{" "}
        <span className={s.line}>
          <span data-word="">in</span>{" "}
          <span className={s.name} data-testid="soon.place" data-word="">
            {place}
            <svg className={s.circle} aria-hidden="true">
              <ellipse />
            </svg>
          </span>
        </span>
      </h1>
      <span className={s.sticker} aria-hidden="true" data-testid="soon.sticker">
        <TicketFaceSticker height={59.8} />
      </span>
      {live && (
        <p className={s.note} aria-hidden="true" data-testid="soon.note">
          next 2 hours
        </p>
      )}
    </div>
  );
}
