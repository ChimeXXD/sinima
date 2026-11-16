import { useState } from "react";
import { bannerFor } from "@/lib/data/select";
import { useOfflineNotice } from "@/lib/offline";
import { countdown, countdownShare } from "@/lib/time/countdown";
import { formatTime, lateDay } from "@/lib/time/lagos";
import { isBeforeStart, showingState } from "@/lib/time/showingState";
import { shortCountdown } from "@/lib/wording/film";
import { countdownParts, spokenCountdown, spokenTime } from "@/lib/wording/showing";
import { Icon } from "./Icon";
import { TicketFace, TicketFaceSticker } from "./Stickers";
import c from "./countdown.module.css";
import m from "./started.module.css";
import s from "./status.module.css";

// 11 · Status (Figma 167:76): countdowns, times, formats, and where a time came from. Every word
// comes from lib/wording. Relative words need `now`, which is null in the static HTML (rule 3):
// then a countdown is not drawn at all, and a time shows only itself.

/**
 * M4 (D-103): true once a showing starts while its row is on screen (the clock moved past its
 * start), never when the page opens on a showing that has already started. It stays true for that
 * showing, so its one-off entrance runs once; another showing in the same place starts over.
 */
export function useJustStarted(startsAt: string, now: string | null): boolean {
  // An empty start (no showing, or a closed sheet) is never live, so it can't throw or count.
  const live = now !== null && startsAt !== "";
  const started = live && !isBeforeStart(showingState(startsAt, now));
  const [seen, setSeen] = useState({ startsAt, live, started, just: false });
  if (seen.startsAt !== startsAt || seen.live !== live || seen.started !== started) {
    const just = seen.startsAt === startsAt && seen.live && live && !seen.started && started;
    setSeen({ startsAt, live, started, just });
    return just;
  }
  return seen.just;
}

/**
 * M6 (D-103): how many times a countdown's number has changed since the page knew the time; 0
 * until the first change. Keys the number, so each change draws it anew and it rolls up.
 */
function useRolls(value: string | null): number {
  const [seen, setSeen] = useState({ value, rolls: 0 });
  if (seen.value !== value) {
    const rolls = seen.value !== null && value !== null ? seen.rolls + 1 : seen.rolls;
    setSeen({ value, rolls });
    return rolls;
  }
  return seen.rolls;
}

/** 11.1 Countdown pill, centred on a poster's bottom edge: "Starts in 5 min". */
export function CountdownPill({ startsAt, now }: { startsAt: string; now: string | null }) {
  const parts = now === null ? null : countdownParts(startsAt, now);
  const rolls = useRolls(parts?.value ?? null);
  if (!parts) return null;
  return (
    <span className={s.pill} data-testid="countdown-pill">
      <TicketFace height={16} />
      <span>
        <span className={s.lead}>{parts.lead}</span>{" "}
        <b key={rolls} className={rolls > 0 ? `${s.value} ${c.roll}` : s.value}>
          {parts.value}
        </b>
      </span>
    </span>
  );
}

/**
 * 11.2 Countdown badge on a Starting soon card: a ring that fills over the last 2 hours, then
 * "Starts in / 10 min". Once started: a grey dot and "Started / 3 min ago".
 */
export function CountdownBadge({ startsAt, now }: { startsAt: string; now: string | null }) {
  const just = useJustStarted(startsAt, now);
  const parts = now === null ? null : countdownParts(startsAt, now);
  const rolls = useRolls(parts?.value ?? null);
  if (!parts || now === null) return null;
  const started = !isBeforeStart(showingState(startsAt, now));
  return (
    <span className={s.badge} data-started={started || undefined} data-testid="countdown-badge">
      <span className={`${s.ring} ${c.glide}`} style={{ "--share": countdownShare(startsAt, now) } as React.CSSProperties} aria-hidden="true">
        {just && <span className={m.arc} />}
        {started ? <span className={just ? `${s.dot} ${m.dotIn}` : s.dot} /> : <TicketFace height={18} className={s.ringFace} />}
      </span>
      <span className={s.badgeText}>
        <span className={s.caption}>{parts.lead}</span>
        <b key={rolls} className={rolls > 0 ? `${s.badgeValue} ${c.roll}` : s.badgeValue}>
          {parts.value}
        </b>
      </span>
    </span>
  );
}

/**
 * 11.3 Time pill, full width at the bottom of a showing card. Bookable: the time and a round Book
 * link to the cinema's own page. Started, or with no booking page: the time alone, and "No booking"
 * once started (D-05: a started showing is never bookable). Until the page knows the time (`now`
 * null, the static HTML) it cannot know the showing has not started, so there is no Book link yet.
 */
export function TimePill({ startsAt, now, bookUrl, bookLabel }: { startsAt: string; now: string | null; bookUrl: string | null; bookLabel: string }) {
  const just = useJustStarted(startsAt, now);
  const started = now !== null && !isBeforeStart(showingState(startsAt, now));
  return (
    <span className={just ? `${s.timePill} ${m.anchor}` : s.timePill} data-started={started || undefined} data-testid="time-pill">
      <span className={s.when}>
        <span className={s.hidden}>{spokenTime(startsAt)}</span>
        <span className={s.time} aria-hidden="true">
          {formatTime(startsAt)}
        </span>
        <LateDay startsAt={startsAt} />
      </span>
      {started ? (
        <>
          <span className={just ? `${s.caption} ${m.arrive}` : s.caption}>No booking</span>
          {just && bookUrl && (
            <span className={`${s.book} ${m.bookGone}`} aria-hidden="true">
              <Icon name="arrow-up-right" size={16} stroke={2.4} />
            </span>
          )}
        </>
      ) : (
        bookUrl &&
        now !== null && (
          <a className={s.book} href={bookUrl} target="_blank" rel="noopener" aria-label={bookLabel} data-testid="time-pill.book">
            <Icon name="arrow-up-right" size={16} stroke={2.4} />
          </a>
        )
      )}
    </span>
  );
}

/**
 * 11.3b Time chip: a start time in the lists on Film and Cinema pages; it opens the showing sheet.
 * The soonest says "in 30 min" after its format; a started one is struck through, says "Started 5 min ago", and is
 * not a button (D-05). Read out as one sentence: "6:00 PM, IMAX, starts in 30 minutes".
 */
export function TimeChip({ startsAt, format, now, soonest = false, onOpen, testId = "time-chip" }: { startsAt: string; format: string | null; now: string | null; soonest?: boolean; onOpen: () => void; testId?: string }) {
  const just = useJustStarted(startsAt, now);
  const started = now !== null && !isBeforeStart(showingState(startsAt, now));
  const time = formatTime(startsAt);
  const spoken = now === null ? null : spokenCountdown(startsAt, now);
  const label = [spokenTime(startsAt), format, spoken].filter(Boolean).join(", ");
  if (started) {
    return (
      <span className={s.chip} data-state="started" data-testid={testId}>
        <span className={s.hidden}>{label}</span>
        <s className={just ? `${s.chipTime} ${m.drawn}` : s.chipTime} aria-hidden="true">
          <time dateTime={startsAt}>{time}</time>
          {just && <span className={m.line} />}
        </s>
        <LateDay startsAt={startsAt} />
        <span className={just ? `${s.chipNote} ${m.arrive}` : s.chipNote} aria-hidden="true">
          {countdown(startsAt, now!)}
        </span>
      </span>
    );
  }
  const soon = soonest && now !== null;
  // Figma Film: "IMAX · in 30 min" on the soonest, "IMAX" on the others.
  const note = [format, soon ? shortCountdown(startsAt, now) : null].filter(Boolean).join(" · ") || null;
  return (
    <button type="button" className={s.chip} data-state={soon ? "soonest" : undefined} aria-label={label} onClick={onOpen} data-testid={testId}>
      <time dateTime={startsAt} className={s.chipTime}>
        {time}
      </time>
      <LateDay startsAt={startsAt} />
      {note && <span className={s.chipNote}>{note}</span>}
    </button>
  );
}

/**
 * After midnight, the day in small type right after the time ("12:30 AM Sat"), so the time keeps its
 * Figma style and width. Screen readers hear the full sentence from spokenTime instead.
 */
function LateDay({ startsAt }: { startsAt: string }) {
  const day = lateDay(startsAt);
  return day === null ? null : (
    <span className={s.day} aria-hidden="true" data-testid="late-day">
      {day}
    </span>
  );
}

/** 11.4 Format badge on a poster: "IMAX · 4D". */
export function FormatBadge({ formats }: { formats: string[] }) {
  return formats.length > 0 ? <span className={s.format}>{formats.join(" · ")}</span> : null;
}

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
