import { Button } from "@/components/ui/Actions";
import type { DayStatus } from "@/components/ui/useDayData";
import s from "./actions.module.css";

// Around the Day row (D-146, D-147): the sentence under it and the line in place of a later day's
// list while it comes. Apart from DayRow, as Sinimas has these without the tiles (its Day is a menu).

/**
 * Under the row (D-146): "7 of 21 sinimas have put up Saturday's times so far." When some day
 * shown is incomplete, the line keeps its height on the days that are not, so the list below
 * doesn't jump as the day changes.
 */
export function DaySentence({ text, keep, className, testId }: { text: string | null; keep: boolean; className?: string; testId?: string }) {
  if (!text && !keep) return null;
  return (
    <p className={`${s.daySentence} ${className ?? ""}`} aria-live="polite" data-testid={testId}>
      {text}
    </p>
  );
}

/** In place of the list while a later day's file is on its way, or when it couldn't be fetched. */
export function DayLoad({ status, text, retry, onRetry }: { status: Exclude<DayStatus, "ready">; text: string; retry: string; onRetry: () => void }) {
  return (
    <div className={s.dayLoad} role="status" data-testid={`day.${status}`}>
      <p>{text}</p>
      {status === "failed" && (
        <Button kind="secondary" onClick={onRetry} testId="day.retry">
          {retry}
        </Button>
      )}
    </div>
  );
}
