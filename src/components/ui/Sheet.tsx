"use client";

import { useEffect, useRef } from "react";
import { onBackdrop } from "@/lib/browser";
import { Icon, type IconName } from "./Icon";
import s from "./sheet.module.css";

// 12 · Overlays (Figma 167:80): the Ghost pop-up. A sheet floating 8 px in from the screen's edges
// on phones and iPads; a centred dialog, 440 wide, on desktop. Escape, the close button and a tap
// on the scrim all close it.

export function Sheet({ open, onClose, title, subtitle, children, testId = "sheet" }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; testId?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={s.sheet}
      aria-labelledby={`${testId}.title`}
      data-testid={testId}
      onClose={(event) => {
        // Only this dialog's own close: a dialog inside it closing must not close it too.
        if (event.target === event.currentTarget) onClose();
      }}
      onClick={(event) => onBackdrop(event) && event.currentTarget.close()}
    >
      <div className={s.head}>
        <div className={s.titles}>
          <h2 id={`${testId}.title`} className={s.title}>
            {title}
          </h2>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
        <button type="button" className={s.close} aria-label="Close" onClick={() => ref.current?.close()} data-testid={`${testId}.close`}>
          <Icon name="x" size={16} stroke={2.4} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

type OptionRowProps = { icon: IconName; title: string; desc?: string; selected?: boolean; tone?: "primary" | "soft"; testId?: string } & ({ href: string; onClick?: never } | { href?: never; onClick: () => void } | { href?: never; onClick?: never });

/**
 * 12.1 Option row: an icon tile, a title and a line under it. A link (to another site, in a new
 * tab), a button, or with neither just a statement; a picked option is tinted and ticked. The
 * tile is the action colour, or the soft tint for the quieter rows of a sheet (Figma Film). Only a
 * row given `selected` is a toggle (aria-pressed); the others are plain buttons.
 */
export function OptionRow({ icon, title, desc, selected, tone = "primary", testId, href, onClick }: OptionRowProps) {
  const inner = (
    <>
      <span className={s.tile} data-tone={tone}>
        <Icon name={icon} size={22} stroke={2.2} />
      </span>
      <span className={s.text}>
        <span className={s.optionTitle}>{title}</span>
        {desc && <span className={s.desc}>{desc}</span>}
      </span>
      {selected && (
        <span className={s.check} aria-hidden="true">
          <Icon name="check" size={14} stroke={3} />
        </span>
      )}
    </>
  );
  if (href === undefined && onClick === undefined) {
    return (
      <div className={s.option} data-testid={testId}>
        {inner}
      </div>
    );
  }
  return href !== undefined ? (
    <a className={s.option} href={href} target="_blank" rel="noopener" data-selected={selected || undefined} data-testid={testId}>
      {inner}
    </a>
  ) : (
    <button type="button" className={s.option} aria-pressed={selected} data-selected={selected || undefined} onClick={onClick} data-testid={testId}>
      {inner}
    </button>
  );
}
