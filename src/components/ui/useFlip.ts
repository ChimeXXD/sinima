"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { motion } from "@/components/ui/motion";

/**
 * M3 (D-103): when a change moves things on the page, each element marked `data-flip="<id>"`
 * glides from where it was to where it is now (FLIP), so a cinema you let go of is seen travelling
 * from your cinemas to the others, and what was under it closes up instead of jumping. Moving on
 * screen: --ease-in-out, --dur-base, a little longer for a long way (at most 300 ms). An element
 * new to the page fades in. Reduced motion: no travel; what moved fades in where it now is.
 *
 * Returns `capture(lead)`: call it just before the change. `lead` is the element the visitor acted on:
 * it travels above the rest, so it never passes under the cards it crosses. `changed` is what the
 * change alters.
 */
export function useFlip(changed: unknown): (lead?: string) => void {
  const before = useRef<{ rects: Map<string, DOMRect>; lead?: string } | null>(null);

  useLayoutEffect(() => {
    const captured = before.current;
    before.current = null;
    if (!captured) return;
    const old = captured.rects;
    const m = motion();
    for (const el of document.querySelectorAll<HTMLElement>("[data-flip]")) {
      const was = old.get(el.dataset.flip!);
      const now = el.getBoundingClientRect();
      for (const running of el.getAnimations()) if (running.id === "flip") running.cancel();
      if (!was) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { id: "flip", duration: m.fast, easing: m.easeOut });
        continue;
      }
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      if (m.reduce) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { id: "flip", duration: m.fast, easing: m.easeOut });
        continue;
      }
      const duration = Math.min(300, m.base + Math.hypot(dx, dy) / 20);
      const travel = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { id: "flip", duration, easing: m.easeInOut });
      if (el.dataset.flip === captured.lead) {
        el.style.zIndex = "1";
        const settle = () => el.style.removeProperty("z-index");
        travel.onfinish = settle;
        travel.oncancel = settle;
      }
    }
  }, [changed]);

  return useCallback((lead?: string) => {
    const rects = new Map<string, DOMRect>();
    for (const el of document.querySelectorAll<HTMLElement>("[data-flip]")) rects.set(el.dataset.flip!, el.getBoundingClientRect());
    const captured = { rects, lead };
    before.current = captured;
    // A change that never happens (storage switched off) must not leave stale places for a later one.
    requestAnimationFrame(() => {
      if (before.current === captured) before.current = null;
    });
  }, []);
}
