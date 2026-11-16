"use client";

import { useEffect, useRef } from "react";
import { onBackdrop } from "@/lib/browser";
import { Icon, type IconName } from "./Icon";
import { useSwipeDown } from "./useSwipeDown";
import s from "./sheet.module.css";

// 12 · Overlays (Figma 167:80): the Ghost pop-up. A sheet floating 8 px in from the screen's edges
// on phones and iPads; a centred dialog, 440 wide, on desktop. Escape, the close button and a tap
// on the scrim all close it.
//
// `picker` is the Cinemas pickers' sheet (Figma Cinemas › Area picker open): tighter, no close
// button, 640 wide on an iPad, and on desktop a popover over its picker, 10 px below the picker's
// top, growing from that corner. Escape and the scrim close it.

export function Sheet({ open, onClose, title, subtitle, children, className, testId = "sheet", picker }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; className?: string; testId?: string; /** The picker the sheet opens from. */ picker?: React.RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  useSwipeDown(ref, open);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    // The popover sits over its picker, and stays there when the page scrolls or the window
    // resizes; it moves left only when it would run past the window's right edge.
    const place = () => {
      const at = picker?.current?.getBoundingClientRect();
      if (!at) return;
      dialog.style.setProperty("--at-top", `${at.top + 10}px`);
      dialog.style.setProperty("--at-left", `${Math.max(8, Math.min(at.left, window.innerWidth - dialog.offsetWidth - 8))}px`);
    };
    if (!dialog.open) dialog.showModal();
    place();
    if (!picker) return;
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open, picker]);

  return (
    <dialog
      ref={ref}
      className={[s.sheet, picker && s.picker, className].filter(Boolean).join(" ")}
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
 * tab), a button, or with neither just a statement; a picked option is tinted and ticked. The
 * tile is the action colour, or the soft tint for the quieter rows of a sheet (Figma Film). Only a
 * row given `selected` is a toggle (aria-pressed); the others are plain buttons.
 */
export function OptionRow({ icon, lead, title, desc, selected, tone = "primary", className, testId, href, onClick }: OptionRowProps) {
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
        <span className={s.check} aria-hidden="true">
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
  return href !== undefined ? (
    <a className={box} href={href} target="_blank" rel="noopener" data-selected={selected || undefined} data-testid={testId}>
      {inner}
    </a>
  ) : (
    <button type="button" className={box} aria-pressed={selected} data-selected={selected || undefined} onClick={onClick} data-testid={testId}>
      {inner}
    </button>
  );
}
