"use client";

import { useEffect } from "react";
import { motion } from "@/components/ui/motion";

/**
 * M10 (D-103): pull a sheet down to close it, as on an iPhone. While the finger is down the sheet
 * is the finger (1:1, a direct transform write, no React state); pulled up past its place it
 * stretches a fifth as far. Let go past a quarter of its height, or with a flick faster than
 * 0.11 px/ms, and it closes from where it is on its own close transition; otherwise it snaps back
 * on --dur-base --ease-out. It only takes over a pull that starts downward with the sheet scrolled
 * to its top, so its content still scrolls. Phones and iPads only: from 1200 px the sheet is a
 * centred dialog or a popover. Reduced motion: the pull still follows the finger; the close fades
 * (the sheet's own reduced-motion transition).
 */
export function useSwipeDown(ref: React.RefObject<HTMLDialogElement | null>, open: boolean): void {
  useEffect(() => {
    const sheet = ref.current;
    if (!sheet || !open) return;
    let pull: { from: number; pulling: boolean; samples: { y: number; t: number }[] } | null = null;

    const place = (y: number) => {
      sheet.style.transform = `translateY(${y}px)`;
      sheet.style.setProperty("--pull", String(Math.min(1, Math.max(0, y / sheet.offsetHeight))));
    };
    const settle = () => {
      sheet.removeAttribute("data-pulling");
      sheet.style.removeProperty("--pull");
      sheet.style.removeProperty("transform");
    };
    // The snap-back's own timing, dropped once it has run, or been cut short by a close (its
    // inline shorthand would otherwise take the sheet's open and close motion with it).
    const dropTiming = (event: TransitionEvent) => {
      if (event.target !== sheet || event.propertyName !== "transform") return;
      sheet.style.removeProperty("transition");
      sheet.removeEventListener("transitionend", dropTiming);
      sheet.removeEventListener("transitioncancel", dropTiming);
    };
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || matchMedia("(min-width: 1200px)").matches) return;
      pull = { from: event.touches[0]!.clientY, pulling: false, samples: [] };
    };
    const onMove = (event: TouchEvent) => {
      if (!pull) return;
      const dy = event.touches[0]!.clientY - pull.from;
      if (!pull.pulling) {
        // Scrolling up, or content scrolled down: the content scrolls, not the sheet.
        if (dy < 0 || sheet.scrollTop > 0) pull = null;
        if (!pull || dy === 0) return;
        pull.pulling = true;
        // A snap-back still settling leaves its inline transition: drop it so the sheet is the finger.
        sheet.style.removeProperty("transition");
        sheet.setAttribute("data-pulling", "");
      }
      event.preventDefault();
      const y = dy >= 0 ? dy : dy * 0.2;
      place(y);
      pull.samples = [...pull.samples.filter((sample) => event.timeStamp - sample.t < 100), { y, t: event.timeStamp }];
    };
    const onEnd = (event: TouchEvent) => {
      const done = pull;
      pull = null;
      if (!done?.pulling) return;
      // Only the last 100 ms before letting go count: a finger that stopped, then lifted, is not a flick.
      const recent = done.samples.filter((sample) => event.timeStamp - sample.t < 100);
      const first = recent[0];
      const last = recent.at(-1);
      const y = done.samples.at(-1)?.y ?? 0;
      const speed = first && last && last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      const m = motion();
      // Past a quarter, unless flicked back up (as on an iPhone); or a flick down from anywhere.
      if ((y > sheet.offsetHeight * 0.25 && speed > -0.11) || speed > 0.11) {
        // Closing from here: the close transition starts where the finger left the sheet. With
        // reduced motion it fades where it is, so it keeps its place until it has gone.
        sheet.removeAttribute("data-pulling");
        sheet.style.removeProperty("--pull");
        sheet.style.removeProperty("transition");
        if (!m.reduce) sheet.style.removeProperty("transform");
        sheet.close();
        return;
      }
      sheet.style.transition = `transform ${m.base}ms ${m.easeOut}`;
      settle();
      sheet.addEventListener("transitionend", dropTiming);
      sheet.addEventListener("transitioncancel", dropTiming);
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
      sheet.removeEventListener("transitionend", dropTiming);
      sheet.removeEventListener("transitioncancel", dropTiming);
      sheet.style.removeProperty("transition");
      // A sheet that was just let go of may still be fading where it was (reduced motion).
      if (sheet.open) settle();
      else setTimeout(settle, motion().base);
    };
  }, [ref, open]);
}
