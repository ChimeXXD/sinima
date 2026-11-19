import { bannerFor } from "@/lib/data/select";
import { useOfflineNotice } from "@/lib/offline";
import { Icon } from "./Icon";
import { TicketFaceSticker } from "./Stickers";
import s from "./status.module.css";

// 11 · Status (Figma 167:76): the page's notices and where a time came from, apart from the
// countdowns and times in Status.tsx, so a page with no times doesn't carry those (the page budget,
// D-21). Every word comes from lib/wording.

/** 11.4 Sample note, shown while saved fixtures power the page (rule 8). */
export function SampleNote() {
  return <Notice kind="sample" text={bannerFor(["sample"])!.text} />;
}

/**
 * The page's one notice: sample data in the Sample note's style; times a day old or older as Figma's
 * stale banner (Cinema › Times a day old), with the alert icon.
 */
export function Notice({ kind, text }: { kind: string; text: string }) {
  if (kind === "sample") {
    return (
      <p role="status" className={s.sample} data-testid={`banner.${kind}`}>
        {text}
      </p>
    );
  }
  return (
    <p role="status" className={s.banner} data-testid={`banner.${kind}`}>
      <Icon name="alert" size={20} className={s.bannerIcon} />
      {text}
    </p>
  );
}

/**
 * The page's notice: offline, Figma's offline banner comes first (Offline · Films), and the sample
 * or old-times banner stays under it: sample data and old times are never hidden (rules 2 and 8).
 * `now` is the page's clock (null in the static HTML); `className` wraps the notices in the screen's box.
 */
export function PageNotice({ banner, now, className }: { banner: { kind: string; text: string } | null; now: string | null; className?: string }) {
  const offline = useOfflineNotice(now);
  if (!offline && !banner) return null;
  const notices = (
    <>
      {offline && <OfflineNotice text={offline} />}
      {banner && <Notice kind={banner.kind} text={banner.text} />}
    </>
  );
  return className ? <div className={`${className} ${offline && banner ? s.stack : ""}`}>{notices}</div> : notices;
}

/** Offline (Figma 208:9731): navy, the wifi-off icon, when the times on screen were saved. */
export function OfflineNotice({ text }: { text: string }) {
  return (
    <p role="status" className={s.offline} data-testid="banner.offline">
      <Icon name="wifi-off" size={20} className={s.bannerIcon} />
      {text}
    </p>
  );
}

/** 11.4 Where a time came from, in words from lib/wording/freshness.ts (rule 2). */
export function Freshness({ text }: { text: string }) {
  return (
    <p className={s.fresh} data-testid="freshness">
      <TicketFaceSticker height={18} />
      {text}
    </p>
  );
}
