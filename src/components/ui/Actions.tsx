"use client";

import { Link } from "@/components/ui/CityLink";
import { useRef, useState } from "react";
import { afterPaint } from "@/components/ui/motion";
import type { ChangeHow } from "@/components/ui/useSwapIn";
import { Icon, type IconName } from "./Icon";
import s from "./actions.module.css";

// 7 · Actions (Figma 167:60): things people press.

type ButtonProps = {
  kind?: "primary" | "secondary";
  icon?: IconName;
  disabled?: boolean;
  children: React.ReactNode;
  testId?: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick?: () => void });

/**
 * 7.1 Button. With `href` it is a link: a page of this site opens in place; another site (booking
 * always goes to the cinema's own site, rule 5) opens in a new tab. A disabled link loses its
 * href, so it cannot be followed.
 */
export function Button({ kind = "primary", icon, disabled = false, children, testId, href, onClick }: ButtonProps) {
  const className = `${s.button} ${s[kind]}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={18} stroke={2} />}
      {children}
    </>
  );
  if (href !== undefined) {
    return disabled ? (
      <a className={className} aria-disabled="true" role="link" data-testid={testId}>
        {inner}
      </a>
    ) : /^\/(?!\/)/.test(href) ? (
      <Link className={className} href={href} data-testid={testId}>
        {inner}
      </Link>
    ) : (
      <a className={className} href={href} target="_blank" rel="noopener" data-testid={testId}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={className} aria-disabled={disabled || undefined} onClick={disabled ? undefined : onClick} data-testid={testId}>
      {inner}
    </button>
  );
}

/** 7.2 Icon button: 40 round, a 20 px icon. Always named for screen readers. */
export function IconButton({ icon, label, onClick, testId }: { icon: IconName; label: string; onClick?: () => void; testId?: string }) {
  return (
    <button type="button" className={s.iconButton} aria-label={label} onClick={onClick} data-testid={testId}>
      {/* D-112 N2: a ✓ that takes its place (a link copied) swaps in; going back is quiet. */}
      <Icon key={icon} name={icon} size={20} stroke={2} className={icon === "check" ? s.swapIn : undefined} />
    </button>
  );
}

/** 7.3 Chip: a format or area filter that is on or off. */
export function Chip({ selected = false, disabled = false, onClick, children, testId }: { selected?: boolean; disabled?: boolean; onClick?: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button type="button" className={s.chip} aria-pressed={selected} disabled={disabled} onClick={onClick} data-testid={testId}>
      {children}
    </button>
  );
}

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
