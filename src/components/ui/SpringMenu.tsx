"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { critical, spring, step, type Spring } from "./spring";
import s from "./springMenu.module.css";

// D-109 c: Design Bookmark's Spring dropdown (designbookmark.com/motion#db-spring-dropdown), in
// Sinima's look, for the pickers and "Lagos ⌄" on a computer. It opens under its trigger, which
// stays in view (no scrim): the menu's height is a spring (300/23), so it drops with a little
// overshoot as it widens from 90 %; the rows fall in 45 ms apart (300/24), the sixth
// onward together, so the last starts by 275 ms (D-112 C4); the hover highlight has a
// stiff leading edge (620/36) and a soft trailing one (200/20), so it stretches between rows; a pick
// draws its tick (260/26) and the menu folds away 0.24 s later. Keys: arrows move the highlight at
// once (no motion on keyboard actions), Enter picks, Escape closes; so does a press outside it.

export type MenuOption = { id: string; label: string; desc?: string; count?: string; lead?: React.ReactNode; selected: boolean; testId: string };

type Rows = { el: HTMLElement; tick: SVGPathElement | null; s: Spring; k: Spring }[];

export function SpringMenu({ open, anchor, instant = false, options, columns = 1, width, label, footer, onPick, onClose, testId }: { open: boolean; /** The trigger: the menu hangs 8 px under it. */ anchor: React.RefObject<HTMLElement | null>; /** Opened by a key: it appears at once. */ instant?: boolean; options: MenuOption[]; columns?: 1 | 2; /** px; at least the trigger's width. */ width?: number; label: string; /** A line under the choices, not one of them. */ footer?: string; onPick: (id: string, byKey: boolean) => void; onClose: (refocus: boolean) => void; testId: string }) {
  const menu = useRef<HTMLDivElement>(null);
  const engine = useRef<{ setOpen: (open: boolean, byKey: boolean) => void; picked: (id: string) => void; hover: (i: number, snap: boolean) => void; current: () => number } | null>(null);
  const byKey = useRef(false);
  const closing = useRef(false);
  /** The fold after a pick; cleared if the menu closes another way first, so it never closes a later menu. */
  const fold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The latest onClose, read when it is called: a parent's new function each render must not reopen the menu.
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });

  // The springs: one set per mounted menu, driven by its own loop while anything moves.
  useLayoutEffect(() => {
    const el = menu.current!;
    const hl = el.querySelector<HTMLElement>("[data-hl]")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tune = (sp: Spring, k: number, c: number) => {
      sp.k = k;
      sp.c = c;
      if (reduce) critical(sp);
    };
    const H = spring(0, 300, 23);
    const O = spring(0, 400, 34);
    const HO = spring(0, 400, 32);
    const T = spring(0, 620, 36);
    const B = spring(0, 620, 36);
    const L = spring(0, 620, 36);
    const R = spring(0, 620, 36);
    [H, O, HO, T, B, L, R].forEach((sp) => reduce && critical(sp));
    let rows: Rows = [];
    let isOpen = false;
    let hov = -1;
    let full = 0;
    let frame = 0;
    let last = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const collect = () => {
      rows = [...el.querySelectorAll<HTMLElement>("[data-row]")].map((row, i) => rows[i]?.el === row ? rows[i]! : { el: row, tick: row.querySelector<SVGPathElement>("[data-tick] path"), s: spring(0, 300, 24), k: spring(row.getAttribute("aria-selected") === "true" ? 1 : 0, 260, 26) });
      rows.forEach((row) => reduce && (critical(row.s), critical(row.k)));
    };
    const box = (i: number) => {
      const row = rows[i]!.el;
      return { t: row.offsetTop, b: row.offsetTop + row.offsetHeight, l: row.offsetLeft, r: row.offsetLeft + row.offsetWidth };
    };
    const springs = () => [H, O, HO, T, B, L, R, ...rows.flatMap((row) => [row.s, row.k])];
    const render = () => {
      const h = Math.max(0, H.x);
      const o = Math.min(1, Math.max(0, O.x));
      el.style.height = `${h.toFixed(2)}px`;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = h < 1 ? "hidden" : "visible";
      el.style.transform = `scaleX(${(0.9 + 0.1 * Math.min(1.06, Math.max(0, h / (full || 1)))).toFixed(4)})`;
      for (const row of rows) {
        const a = Math.min(1, Math.max(0, row.s.x));
        row.el.style.opacity = a.toFixed(3);
        row.el.style.transform = `translateY(${((row.s.x - 1) * 14).toFixed(2)}px)`;
        if (row.tick) row.tick.style.strokeDashoffset = (22 * (1 - Math.min(1, Math.max(0, row.k.x)))).toFixed(2);
      }
      hl.style.opacity = (Math.min(1, Math.max(0, HO.x)) * o).toFixed(3);
      const t = Math.min(T.x, B.x - 16);
      const l = Math.min(L.x, R.x - 16);
      hl.style.transform = `translate(${l.toFixed(2)}px, ${t.toFixed(2)}px)`;
      hl.style.width = `${Math.max(16, R.x - l).toFixed(2)}px`;
      hl.style.height = `${Math.max(16, B.x - t).toFixed(2)}px`;
    };
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const all = springs();
      for (let i = 0; i < 4; i++) for (const sp of all) step(sp, dt / 4);
      render();
      const still = all.every((sp) => Math.abs(sp.x - sp.t) < 0.01 && Math.abs(sp.v) < 0.01);
      if (still) for (const sp of all) Object.assign(sp, { x: sp.t, v: 0 });
      if (still) render();
      // At rest it says so ("open" or "closed"), for tests and for anyone inspecting it.
      el.dataset.state = still ? (isOpen ? "open" : "closed") : "moving";
      frame = still ? 0 : requestAnimationFrame(loop);
    };
    const run = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const snap = () => {
      for (const sp of springs()) Object.assign(sp, { x: sp.t, v: 0 });
      render();
      el.dataset.state = isOpen ? "open" : "closed";
    };
    const hover = (i: number, now: boolean) => {
      if (i < 0 || i >= rows.length || i === hov) return;
      const to = box(i);
      if (now || hov < 0) {
        Object.assign(T, { x: to.t, t: to.t, v: 0 });
        Object.assign(B, { x: to.b, t: to.b, v: 0 });
        Object.assign(L, { x: to.l, t: to.l, v: 0 });
        Object.assign(R, { x: to.r, t: to.r, v: 0 });
      } else {
        // The edge facing the move leads, stiff; the far edge trails, soft: the highlight stretches.
        const from = box(hov);
        tune(to.t > from.t ? B : T, 620, 36);
        tune(to.t > from.t ? T : B, 200, 20);
        tune(to.l > from.l ? R : L, 620, 36);
        tune(to.l > from.l ? L : R, 200, 20);
        if (to.t === from.t) [T, B].forEach((edge) => tune(edge, 620, 36));
        if (to.l === from.l) [L, R].forEach((edge) => tune(edge, 620, 36));
        Object.assign(T, { t: to.t });
        Object.assign(B, { t: to.b });
        Object.assign(L, { t: to.l });
        Object.assign(R, { t: to.r });
      }
      hov = i;
      HO.t = 1;
      el.setAttribute("aria-activedescendant", rows[i]!.el.id);
      run();
    };
    const setOpen = (next: boolean, keys: boolean) => {
      timers.splice(0).forEach(clearTimeout);
      isOpen = next;
      collect();
      el.style.height = "auto";
      full = el.scrollHeight;
      el.style.height = `${Math.max(0, H.x)}px`;
      H.t = next ? full : 0;
      O.t = next ? 1 : 0;
      const n = rows.length;
      rows.forEach((row, i) => {
        const go = () => (row.s.t = isOpen ? 1 : 0);
        if (keys || reduce) go();
        else timers.push(setTimeout(go, next ? 50 + Math.min(i, 5) * 45 : (n - 1 - i) * 20));
      });
      if (next) {
        // The tick starts where the selection is now: it may have changed while the menu was closed.
        for (const row of rows) {
          const on = row.el.getAttribute("aria-selected") === "true" ? 1 : 0;
          Object.assign(row.k, { x: on, t: on, v: 0 });
        }
        hov = -1;
        hover(Math.max(0, rows.findIndex((row) => row.el.getAttribute("aria-selected") === "true")), true);
      } else {
        hov = -1;
        HO.t = 0;
        el.removeAttribute("aria-activedescendant");
      }
      if (keys) snap();
      else run();
    };
    const picked = (id: string) => {
      collect();
      for (const row of rows) row.k.t = row.el.dataset.id === id ? 1 : 0;
      run();
    };
    engine.current = { setOpen, picked, hover, current: () => hov };
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Open and close, placed under the trigger; it follows the trigger when the page scrolls.
  useEffect(() => {
    const el = menu.current!;
    const trigger = anchor.current;
    if (!open || !trigger) {
      engine.current?.setOpen(false, byKey.current);
      return;
    }
    closing.current = false;
    byKey.current = instant;
    const place = () => {
      // The trigger's box at rest: it may still be springing back from its press (scaled about its centre).
      const r = trigger.getBoundingClientRect();
      const at = { left: (r.left + r.right - trigger.offsetWidth) / 2, bottom: (r.top + r.bottom + trigger.offsetHeight) / 2, width: trigger.offsetWidth };
      const w = Math.max(at.width, width ?? 0);
      el.style.width = `${w}px`;
      el.style.top = `${at.bottom + 8}px`;
      el.style.left = `${Math.max(8, Math.min(at.left, window.innerWidth - w - 8))}px`;
    };
    place();
    engine.current?.setOpen(true, instant);
    el.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (el.contains(event.target as Node) || trigger.contains(event.target as Node)) return;
      byKey.current = false;
      close.current(false);
    };
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
      window.removeEventListener("pointerdown", outside);
      clearTimeout(fold.current);
    };
  }, [open, anchor, instant, width]);
  useEffect(() => () => clearTimeout(fold.current), []);

  const choose = (id: string, keys: boolean) => {
    if (closing.current) return;
    closing.current = true;
    byKey.current = keys;
    engine.current?.picked(id);
    onPick(id, keys);
    // The tick draws, then the menu folds away (a key press: at once).
    fold.current = setTimeout(() => close.current(true), keys ? 0 : 240);
  };
  const onKey = (event: React.KeyboardEvent) => {
    const e = engine.current;
    if (!e) return;
    const step = event.key === "ArrowDown" ? columns : event.key === "ArrowUp" ? -columns : event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step) {
      event.preventDefault();
      e.hover(Math.min(options.length - 1, Math.max(0, e.current() + step)), true);
    } else if ((event.key === "Enter" || event.key === " ") && e.current() > -1) {
      event.preventDefault();
      choose(options[e.current()]!.id, true);
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      byKey.current = true;
      // Focus goes back to the trigger: Escape stays there, and Tab moves on from it, not from the
      // end of the page, where the menu is portalled.
      close.current(true);
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div ref={menu} className={s.menu} role="listbox" aria-label={label} aria-describedby={footer ? `${testId}.footer` : undefined} tabIndex={-1} data-columns={columns} onKeyDown={onKey} data-testid={testId} data-state="closed">
      <i className={s.hl} data-hl aria-hidden="true" />
      {options.map((option, i) => (
        <div
          key={option.id}
          id={`${testId}.${option.id}`}
          className={s.row}
          role="option"
          aria-selected={option.selected}
          data-row
          data-id={option.id}
          onPointerEnter={() => engine.current?.hover(i, false)}
          onPointerMove={() => engine.current?.hover(i, false)}
          onClick={() => choose(option.id, false)}
          data-testid={option.testId}
        >
          {option.lead}
          <span className={s.text}>
            <b>{option.label}</b>
            {option.desc && <small>{option.desc}</small>}
          </span>
          {option.count && <span className={s.count}>{option.count}</span>}
          <svg className={s.tick} data-tick viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
      ))}
      {footer && <p id={`${testId}.footer`} className={s.footer} role="presentation">{footer}</p>}
    </div>,
    document.body,
  );
}
