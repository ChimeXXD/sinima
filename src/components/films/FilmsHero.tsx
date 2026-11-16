"use client";

import { useContext } from "react";
import { OpenCity } from "@/components/ui/AppFrame";
import { useDesktop } from "@/components/ui/useDesktop";
import { DrinkSticker, TicketFaceSticker } from "@/components/ui/Stickers";
import s from "./hero.module.css";

// The Films title with its stickers (Figma Films › Sticker hero). On phones and iPads the stickers
// hold to the left and right edges, as Figma's iPad frame is the phone's widened on the right; on
// desktop they gather round the centred title. All decoration: the heading carries the words.

const Sticker = ({ name, className }: { name: "clapper" | "popcorn" | "glasses"; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser
  <img className={`${s.sticker} ${className ?? ""}`} src={`/stickers/${name}.png`} alt="" decoding="async" fetchPriority="low" />
);

export function FilmsHero({ city, live }: { city: string; live: boolean }) {
  const picker = useContext(OpenCity);
  const desktop = useDesktop();
  return (
    <div className={s.hero}>
      <div className={s.art} aria-hidden="true">
        <Sticker name="clapper" className={s.clapper} />
        <Sticker name="popcorn" className={s.popcorn} />
        <Sticker name="glasses" className={s.glasses} />
        <DrinkSticker width={47} className={`${s.sticker} ${s.drink}`} />
        <TicketFaceSticker height={60} className={`${s.sticker} ${s.ticket}`} />
        {/* "tonight!" depends on the clock (rule 3), and sits only beside today's list. */}
        {live && (
          <>
            <span className={s.note}>tonight!</span>
            <svg className={s.arrow} viewBox="0 0 42 15" fill="none">
              <path d="M0.75 14.25C12.75 2.25 26.0833 -1.75 40.75 2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </>
        )}
      </div>
      <h1 className={s.title} data-testid="films.title">
        <span>What&apos;s on in</span>{" "}
        {/* "Lagos ⌄" opens the city sheet (Figma Search and city). */}
        <button type="button" className={s.city} aria-haspopup={desktop ? "listbox" : "dialog"} aria-expanded={picker.from === "title"} onClick={(event) => picker.open(event, "title")} data-testid="films.city">
          {city}
          <svg className={s.circle} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="50" cy="50" rx="48.5" ry="47" fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className={s.chevron} aria-hidden="true">
            <svg viewBox="0 0 22 22" fill="none">
              <path d="M5.5 8.25L11 13.75L16.5 8.25" stroke="currentColor" strokeWidth="2.38333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h1>
    </div>
  );
}
