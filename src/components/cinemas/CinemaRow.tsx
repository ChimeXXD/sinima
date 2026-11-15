import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { FormatBadge } from "@/components/ui/Status";
import { LogoSticker } from "@/components/ui/Stickers";
import s from "./cinemas.module.css";

/**
 * One cinema on the Cinemas tab (Figma Cinemas › Cinema · …): its chain's logo sticker, the name,
 * "Next at 18:00 · 3 films tonight", then its area and formats. The whole row opens the cinema.
 */
export function CinemaRow({ href, name, chain, area, line, at, formats, testId }: { href: string; name: string; chain: string; area: string; line: { lead: string; time: string | null; rest: string }; /** The instant `line.time` shows. */ at: string | null; formats: string[]; testId: string }) {
  return (
    <Link href={href} className={s.row} data-testid={testId}>
      <span className={s.logo}>
        <LogoSticker chain={chain} scale={0.82} />
      </span>
      <span className={s.text}>
        <span className={s.name} data-testid="cinema.name">
          {name}
        </span>
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
      <Icon name="chevron-right" size={20} className={s.chevron} />
    </Link>
  );
}
