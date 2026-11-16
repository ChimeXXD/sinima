import { Link } from "@/components/ui/CityLink";
import { Icon } from "@/components/ui/Icon";
import { FormatBadge } from "@/components/ui/Status";
import { LogoSticker } from "@/components/ui/Stickers";
import s from "./cinemas.module.css";

/**
 * One cinema on the Cinemas tab (Figma Cinemas › Cinema · …): its chain's logo sticker, the name,
 * "Next at 18:00 · 3 films tonight", then its area and formats. The whole row opens the cinema; the
 * heart beside the arrow keeps it on Your cinemas without opening it (D-106 f). A button can't sit
 * in a link, so the link is stretched over the row and the heart sits above it.
 */
export function CinemaRow({ href, name, chain, area, line, at, formats, saved, onSave, testId }: { href: string; name: string; chain: string; area: string; line: { lead: string; time: string | null; rest: string }; /** The instant `line.time` shows. */ at: string | null; formats: string[]; saved: boolean; /** Keep or let go; gets the heart's icon to pop on keeping. */ onSave: (icon: SVGSVGElement | null) => void; testId: string }) {
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
      <button type="button" className={s.keep} aria-pressed={saved} aria-label={saved ? `Remove ${name} from your cinemas` : `Save ${name} to your cinemas`} onClick={(event) => onSave(event.currentTarget.querySelector("svg"))} data-testid="cinema.keep">
        <Icon name="heart" size={20} />
      </button>
      <Icon name="chevron-right" size={20} className={s.chevron} />
    </div>
  );
}
