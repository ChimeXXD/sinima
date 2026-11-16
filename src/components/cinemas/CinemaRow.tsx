"use client";

import { useRef, useState } from "react";
import { Link } from "@/components/ui/CityLink";
import { Icon } from "@/components/ui/Icon";
import { afterPaint, pop } from "@/components/ui/motion";
import { FormatBadge } from "@/components/ui/Status";
import { LogoSticker } from "@/components/ui/Stickers";
import s from "./cinemas.module.css";

/**
 * One cinema on the Cinemas tab (Figma Cinemas › Cinema · …): its chain's logo sticker, the name,
 * "Next at 6:00 PM · 3 films tonight", then its area and formats. The whole row opens the cinema; the
 * heart beside the arrow keeps it on Your cinemas without opening it (D-106 f). A button can't sit
 * in a link, so the link is stretched over the row and the heart sits above it.
 *
 * D-112 F3: the heart fills and pops the moment it's tapped; the save itself (which redraws the
 * whole list, slow on a cheap phone) runs just after that frame is drawn. `shown` holds the tapped
 * state until `saved` moves on from where it was.
 */
export function CinemaRow({ href, name, chain, area, line, at, formats, saved, onSave, testId }: { href: string; name: string; chain: string; area: string; line: { lead: string; time: string | null; rest: string }; /** The instant `line.time` shows. */ at: string | null; formats: string[]; saved: boolean; /** Keep or let go (the heart has already popped). */ onSave: () => void; testId: string }) {
  const [shown, setShown] = useState<{ to: boolean; from: boolean } | null>(null);
  // `saved` has moved on (the tap was kept, or Undo or another screen changed it): it speaks again.
  if (shown && shown.from !== saved) setShown(null);
  const pressed = shown && shown.from === saved ? shown.to : saved;
  // A save waiting for its frame: a second tap before it runs cancels it (two toggles are none),
  // rather than queueing a second save that reads the same stale list.
  const queued = useRef(false);
  const tap = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!pressed) pop(event.currentTarget.querySelector("svg"));
    setShown({ to: !pressed, from: saved });
    queued.current = !queued.current;
    if (!queued.current) return;
    afterPaint(() => {
      if (!queued.current) return;
      queued.current = false;
      onSave();
    });
  };
  return (
    <div className={s.row} data-testid={testId}>
      <span className={s.logo}>
        <LogoSticker chain={chain} scale={0.82} />
      </span>
      <span className={s.text}>
        <Link href={href} className={s.open}>
          <span className={s.name} data-testid="cinema.name">
            {name}
          </span>
        </Link>
        <span className={s.next} data-quiet={at === null || undefined} data-testid="cinema.next">
          {line.lead}
          {at !== null && (
            <>
              {" "}
              <time dateTime={at}>{line.time}</time>
            </>
          )}
          {line.rest}
        </span>
        <span className={s.tags} data-testid="cinema.tags">
          <span className={s.area}>{area}</span>
          {formats.length > 0 && <FormatBadge formats={formats} />}
        </span>
      </span>
      <button type="button" className={s.keep} aria-pressed={pressed} aria-label={pressed ? `Remove ${name} from your cinemas` : `Save ${name} to your cinemas`} onClick={tap} data-testid="cinema.keep">
        <Icon name="heart" size={20} />
      </button>
      <Icon name="chevron-right" size={20} className={s.chevron} />
    </div>
  );
}
