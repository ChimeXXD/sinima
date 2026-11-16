"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { motion } from "@/components/ui/motion";

/** How a choice changed: a tap may animate, the arrow keys never do (no motion on keyboard actions). */
export type ChangeHow = "tap" | "keys";

/**
 * M1 (D-103): when the day changes by a tap, the new day's list slides 8 px in from the side the
 * Today | Tomorrow thumb moved to, and fades up. Purpose: the times swap in place and many rows
 * look alike, so without it the change is easy to miss. No exit, so the new times read at once.
 * Every element marked `data-swap` on the page enters together, after React has drawn the new day
 * (so a section the new day adds enters too). Reduced motion: a fade only.
 *
 * Returns `swap(direction, how)`: call it in the change handler before setting the new value.
 */
export function useSwapIn(value: unknown): (direction: 1 | -1, how: ChangeHow) => void {
  /** Set by a change: 1 or -1 slides in from that side, 0 (the arrow keys) only stops a running swap. */
  const pending = useRef<1 | -1 | 0 | null>(null);

  useLayoutEffect(() => {
    const direction = pending.current;
    pending.current = null;
    if (direction === null) return;
    // A tap mid-swap starts over from the new day; the arrow keys stop it, since they never animate.
    for (const el of document.querySelectorAll<HTMLElement>("[data-swap]")) for (const running of el.getAnimations()) if (running.id === "swap") running.cancel();
    if (direction === 0) return;
    const m = motion();
    const frames: Keyframe[] = m.reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: `translateX(${8 * direction}px)` }, { opacity: 1, transform: "none" }];
    const timing = { id: "swap", duration: m.reduce ? m.fast : m.base, easing: m.easeOut };
    for (const el of document.querySelectorAll<HTMLElement>("[data-swap]")) el.animate(frames, timing);
  }, [value]);

  return useCallback((direction: 1 | -1, how: ChangeHow) => {
    pending.current = how === "tap" ? direction : 0;
  }, []);
}
