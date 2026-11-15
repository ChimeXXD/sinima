import { bannerFor } from "@/lib/data/select";
import { countdown, countdownShare } from "@/lib/time/countdown";
import { formatTime, lateDay } from "@/lib/time/lagos";
import { isBeforeStart, showingState } from "@/lib/time/showingState";
import { shortCountdown } from "@/lib/wording/film";
import { countdownParts, spokenCountdown, spokenTime } from "@/lib/wording/showing";
import { Icon } from "./Icon";
import { TicketFace, TicketFaceSticker } from "./Stickers";
import s from "./status.module.css";

// 11 · Status (Figma 167:76): countdowns, times, formats, and where a time came from. Every word
// comes from lib/wording. Relative words need `now`, which is null in the static HTML (rule 3):
// then a countdown is not drawn at all, and a time shows only itself.

/** 11.1 Countdown pill, centred on a poster's bottom edge: "Starts in 5 min". */
export function CountdownPill({ startsAt, now }: { startsAt: string; now: string | null }) {
  const parts = now === null ? null : countdownParts(startsAt, now);
  if (!parts) return null;
  return (
    <span className={s.pill} data-testid="countdown-pill">
      <TicketFace height={16} />
      <span>
        <span className={s.lead}>{parts.lead}</span> <b className={s.value}>{parts.value}</b>
      </span>
    </span>
  );
}

/**
 * 11.2 Countdown badge on a Starting soon card: a ring that fills over the last 2 hours, then
 * "Starts in / 10 min". Once started: a grey dot and "Started / 3 min ago".
 */
export function CountdownBadge({ startsAt, now }: { startsAt: string; now: string | null }) {
  const parts = now === null ? null : countdownParts(startsAt, now);
  if (!parts || now === null) return null;
  const started = !isBeforeStart(showingState(startsAt, now));
  return (
    <span className={s.badge} data-started={started || undefined} data-testid="countdown-badge">
      <span className={s.ring} style={{ "--share": countdownShare(startsAt, now) } as React.CSSProperties} aria-hidden="true">
        {started ? <span className={s.dot} /> : <TicketFace height={18} className={s.ringFace} />}
      </span>
      <span className={s.badgeText}>
        <span className={s.caption}>{parts.lead}</span>
        <b className={s.badgeValue}>{parts.value}</b>
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
  const started = now !== null && !isBeforeStart(showingState(startsAt, now));
  return (
    <span className={s.timePill} data-started={started || undefined} data-testid="time-pill">
      <span className={s.when}>
        <span className={s.hidden}>{spokenTime(startsAt)}</span>
        <span className={s.time} aria-hidden="true">
          {formatTime(startsAt)}
        </span>
        <LateDay startsAt={startsAt} />
      </span>
      {started ? (
        <span className={s.caption}>No booking</span>
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
 * The soonest says "in 30 min"; a started one is struck through, says "Started 5 min ago", and is
 * not a button (D-05). Read out as one sentence: "18:00, IMAX, starts in 30 minutes".
 */
export function TimeChip({ startsAt, format, now, soonest = false, onOpen }: { startsAt: string; format: string | null; now: string | null; soonest?: boolean; onOpen: () => void }) {
  const started = now !== null && !isBeforeStart(showingState(startsAt, now));
  const time = formatTime(startsAt);
  const spoken = now === null ? null : spokenCountdown(startsAt, now);
  const label = [spokenTime(startsAt), format, spoken].filter(Boolean).join(", ");
  if (started) {
    return (
      <span className={s.chip} data-state="started" data-testid="time-chip">
        <span className={s.hidden}>{label}</span>
        <s className={s.chipTime} aria-hidden="true">
          {time}
        </s>
        <LateDay startsAt={startsAt} />
        <span className={s.chipNote} aria-hidden="true">
          {countdown(startsAt, now!)}
        </span>
      </span>
    );
  }
  const soon = soonest && now !== null;
  const note = soon ? shortCountdown(startsAt, now) : format;
  return (
    <button type="button" className={s.chip} data-state={soon ? "soonest" : undefined} aria-label={label} onClick={onOpen} data-testid="time-chip">
      <span className={s.chipTime}>{time}</span>
      <LateDay startsAt={startsAt} />
      {note && <span className={s.chipNote}>{note}</span>}
    </button>
  );
}

/**
 * After midnight, the day in small type right after the time ("00:30 Sat"), so the time keeps its
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
  return (
    <p role="status" className={s.sample} data-testid="banner.sample">
      {bannerFor(["sample"])!.text}
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
