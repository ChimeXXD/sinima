"use client";

import { Link } from "@/components/ui/CityLink";
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
