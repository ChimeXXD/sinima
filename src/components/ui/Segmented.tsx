"use client";

import { useRef, useState } from "react";
import { afterPaint } from "@/components/ui/motion";
import type { ChangeHow } from "@/components/ui/useSwapIn";
import s from "./segmented.module.css";

// 7.4 (Figma 167:60). The pages' Today | Tomorrow became the Day row (D-148); the kit keeps this
// one, in a file of its own so no page carries it (the page budget, D-21).

/**
 * 7.4 Segmented control, e.g. Today | Tomorrow. A radio group: arrow keys move the choice, and
 * only the picked segment is in the tab order.
 */
export function Segmented<T extends string>({ options, value, onChange, label, testId }: { options: readonly T[]; value: T; onChange: (next: T, how: ChangeHow) => void; label: string; testId?: string }) {
  const [instant, setInstant] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // D-112 F3: the thumb answers the tap at once, and the screen's list (a big redraw on a slow
  // phone) follows just after that frame is drawn: 10 ms to the thumb instead of 90 at 8x CPU. Not a
  // React transition: on Films that would take a view-transition snapshot of the page each time.
  // `pending` holds the tapped option until `value` moves on from where it was.
  const [pending, setPending] = useState<{ to: T; from: T } | null>(null);
  // `value` has moved on (the tap landed, or something else changed it): it speaks again.
  if (pending && pending.from !== value) setPending(null);
  const shown = pending && pending.from === value ? pending.to : value;
  const index = Math.max(0, options.indexOf(shown));
  const change = (next: T, how: ChangeHow) => {
    setPending({ to: next, from: value });
    afterPaint(() => onChange(next, how));
  };

  function onKeyDown(event: React.KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    setInstant(true);
    change(options[next]!, "keys");
    refs.current[next]?.focus();
  }

  return (
    <div className={s.segmented} role="radiogroup" aria-label={label} data-instant={instant || undefined} style={{ "--n": options.length, "--i": index } as React.CSSProperties} onKeyDown={onKeyDown} data-testid={testId}>
      <span className={s.thumb} aria-hidden="true" />
      {options.map((option, i) => (
        <button
          key={option}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          className={s.segment}
          onClick={(event) => {
            setInstant(event.detail === 0);
            // Enter or Space on a focused segment is a click with no pointer (detail 0): no motion.
            change(option, event.detail === 0 ? "keys" : "tap");
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
