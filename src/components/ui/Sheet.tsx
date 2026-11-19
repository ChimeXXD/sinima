"use client";

import { useEffect, useRef, useState } from "react";
import { onBackdrop } from "@/lib/browser";
import { isSiteFile } from "./Actions";
import { Icon, type IconName } from "./Icon";
import { useSwipeDown } from "./useSwipeDown";
import s from "./sheet.module.css";

// 12 · Overlays (Figma 167:80): the Ghost pop-up. A sheet floating 8 px in from the screen's edges
// on phones and iPads; a centred dialog, 440 wide, on desktop. Escape, the close button and a tap
// on the scrim all close it.
//
// `picker` is the Cinemas pickers' sheet (Figma Cinemas › Area picker open): tighter, no close
// button, 640 wide on an iPad. On a computer the pickers drop the Spring dropdown instead (D-109 c,
// SpringMenu). Escape and the scrim close it.
//
// `side` is for a long list (Your cinemas › Add): on a computer it is a panel down the right edge,
// sliding in from it, in place of the centred dialog (D-133). Below 1200 px (phones, iPads upright)
// it stays the sheet.

export function Sheet({ open, onClose, title, subtitle, lead, children, className, testId = "sheet", picker, side }: { open: boolean; onClose: () => void; title: string; subtitle?: string; /** Beside the title: the Home Screen guide's app icon sticker (D-162). */ lead?: React.ReactNode; children: React.ReactNode; className?: string; testId?: string; /** The picker the sheet opens from. */ picker?: React.RefObject<HTMLElement | null>; /** On a computer, a panel down the right edge (D-133). */ side?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useSwipeDown(ref, open);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={[s.sheet, picker && s.picker, side && s.side, className].filter(Boolean).join(" ")}
      aria-labelledby={`${testId}.title`}
      data-testid={testId}
      onClose={(event) => {
        // Only this dialog's own close: a dialog inside it closing must not close it too.
        if (event.target === event.currentTarget) onClose();
      }}
      onClick={(event) => onBackdrop(event) && event.currentTarget.close()}
    >
      <div className={s.head}>
        {lead}
        <div className={s.titles}>
          <h2 id={`${testId}.title`} className={s.title}>
            {title}
          </h2>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
        {!picker && (
          <button type="button" className={s.close} aria-label="Close" onClick={() => ref.current?.close()} data-testid={`${testId}.close`}>
            <Icon name="x" size={16} stroke={2.4} />
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}

type OptionRowProps = { icon: IconName; /** In place of the icon tile: the city sheet's sticker. */ lead?: React.ReactNode; title: string; desc?: string; selected?: boolean; tone?: "primary" | "soft"; /** Extra classes, e.g. a one-off entrance. */ className?: string; testId?: string } & ({ href: string; onClick?: never } | { href?: never; onClick: () => void } | { href?: never; onClick?: never });

/**
 * 12.1 Option row: an icon tile, a title and a line under it. A link (to another site, in a new
 * tab; to a file of this site, in place), a button, or with neither just a statement; a picked option is tinted and ticked. The
 * tile is the action colour, or the soft tint for the quieter rows of a sheet (Figma Film). Only a
 * row given `selected` is a toggle (aria-pressed); the others are plain buttons.
 */
export function OptionRow({ icon, lead, title, desc, selected, tone = "primary", className, testId, href, onClick }: OptionRowProps) {
  // D-112 N3: a tick added by a tap pops in; ticks already there, or brought by the saved list
  // arriving, don't.
  const [tapped, setTapped] = useState(false);
  const box = className ? `${s.option} ${className}` : s.option;
  const inner = (
    <>
      {lead ?? (
        <span className={s.tile} data-tone={tone}>
          <Icon name={icon} size={22} stroke={2.2} />
        </span>
      )}
      <span className={s.text}>
        <span className={s.optionTitle}>{title}</span>
        {desc && <span className={s.desc}>{desc}</span>}
      </span>
      {selected && (
        <span className={tapped ? `${s.check} ${s.checkIn}` : s.check} aria-hidden="true">
          <Icon name="check" size={14} stroke={3} />
        </span>
      )}
    </>
  );
  if (href === undefined && onClick === undefined) {
    return (
      <div className={box} data-testid={testId}>
        {inner}
      </div>
    );
  }
  // A file of this site (a calendar file, D-160) opens in place, so the phone hands it to its calendar.
  const elsewhere = href !== undefined && !isSiteFile(href);
  return href !== undefined ? (
    <a className={box} href={href} target={elsewhere ? "_blank" : undefined} rel={elsewhere ? "noopener" : undefined} data-selected={selected || undefined} data-testid={testId}>
      {inner}
    </a>
  ) : (
    <button type="button" className={box} aria-pressed={selected} data-selected={selected || undefined} onClick={() => (setTapped(!selected), onClick())} data-testid={testId}>
      {inner}
    </button>
  );
}
