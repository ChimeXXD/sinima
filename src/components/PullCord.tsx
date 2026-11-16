"use client";

import { useEffect, useRef } from "react";
import s from "./pullCord.module.css";

// R10 (D-106 i, D-107): the light switch is Design Bookmark's Pull cord (designbookmark.com/motion#
// db-pull-cord), made small for the header: a lamp on a wire from the top of the page, and a cord
// with a bead. The cord is a chain of points with weight kept at length by soft links, so it hangs,
// swings and whips like a rope; held, the bead follows the finger until the cord is tight, then
// stretches like rubber and tugs the lamp, which leans toward the pull. A pull past the click turns
// the light on or off. A tap pulls it too; Enter or Space switch at once (no motion on a key
// press, or a screen reader's activation). This draws it hanging at rest; its physics
// (pullCordPhysics.ts) loads only when the cord is pointed at, pressed or focused, so a visit that
// never touches it never downloads it (D-104, D-108).

const WIRE = 14; // the header's top padding on a phone; the physics measures the real one
const SHADE = 11;
const REST = { x: 22 + 6, top: WIRE + SHADE - 2, bead: WIRE + SHADE - 2 + 25 };

type Physics = { pull: () => void; detach: () => void };
type Module = typeof import("./pullCordPhysics");
let physics: Promise<Module> | null = null;
/** The physics once it has arrived: the next page's cord comes alive at once, with no gap. */
let loaded: Module | null = null;
const loadPhysics = () => (physics ??= import("./pullCordPhysics").then((module) => (loaded = module)));

/**
 * `on`: the light is on (the light theme). `onFlip(bulb)` turns it: `bulb` is the bulb's place on
 * the screen, where the new theme opens from; null for a key press (at once). `label`, `testId`: for the control.
 */
export function PullCord({ on, onFlip, label, testId, className }: { on: boolean | null; onFlip: (bulb: { x: number; y: number } | null) => void; label: string; testId: string; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const grab = useRef<HTMLButtonElement>(null);
  // The latest onFlip, for the cord's own handlers (set after each render, never during it).
  const flip = useRef(onFlip);
  useEffect(() => {
    flip.current = onFlip;
  });

  useEffect(() => {
    const root = box.current!;
    const button = grab.current!;
    let alive: Physics | null = loaded ? loaded.attachCord(root, button, flip) : null;
    let gone = false;
    /** Pressed before the physics arrived: it pulls once it does. */
    let early = false;
    let pressedAt = -Infinity;
    const wake = () => {
      if (alive) return;
      void loadPhysics().then((module) => {
        if (gone || alive) return;
        alive = module.attachCord(root, button, flip);
        if (early) alive.pull();
        early = false;
      });
    };
    // A press before the physics arrived is a tap: the cord's own handlers weren't there to see it,
    // so it pulls once the physics does (never lost if that lands mid-tap).
    const press = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pressedAt = performance.now();
      if (!alive) early = true;
      wake();
    };
    // A click no press came before: Enter or Space (detail 0), or a screen reader's activation. The
    // theme changes at once, with no pull and no light (no motion on keyboard actions).
    const clicked = (event: MouseEvent) => {
      if (event.detail !== 0 && performance.now() - pressedAt < 1500) return; // a tap: the cord pulls
      early = false;
      flip.current(null);
    };
    button.addEventListener("pointerenter", wake);
    button.addEventListener("focus", wake);
    button.addEventListener("pointerdown", press);
    button.addEventListener("click", clicked);
    return () => {
      gone = true;
      button.removeEventListener("pointerenter", wake);
      button.removeEventListener("focus", wake);
      button.removeEventListener("pointerdown", press);
      button.removeEventListener("click", clicked);
      alive?.detach();
    };
  }, []);

  return (
    <span ref={box} className={className ? `${s.cord} ${className}` : s.cord} data-on={on ?? undefined}>
      <svg className={s.art} width="44" height={WIRE + 80} style={{ top: -WIRE }} aria-hidden="true" focusable="false">
        <path data-wire className={s.line} d={`M22 0L22 ${WIRE}`} />
        <path data-cord className={s.line} d={`M${REST.x} ${REST.top}L${REST.x} ${REST.bead}`} />
        <g data-lamp transform={`translate(0 ${WIRE})`}>
          {/* The bulb first, so the shade hides its top half, as in the reference (D-109 e). */}
          <circle data-bulb className={s.bulb} r="4" transform={`translate(22 ${SHADE})`} />
          <rect className={s.cap} x="19" y="-3" width="6" height="4" rx="1.5" />
          <path className={s.shade} d={`M11 ${SHADE} Q11 0 22 0 Q33 0 33 ${SHADE} Z`} />
        </g>
        <rect data-bead className={s.bead} x="-3.5" y="-1.5" width="7" height="12" rx="3.5" transform={`translate(${REST.x} ${REST.bead})`} />
      </svg>
      <button ref={grab} type="button" className={s.grab} style={{ transform: `translate(${REST.x - 22}px, ${REST.bead - WIRE - 26}px)` }} aria-label={label} data-testid={testId} />
    </span>
  );
}
