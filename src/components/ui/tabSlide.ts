"use client";

import { useLayoutEffect } from "react";
import { motion } from "@/components/ui/motion";

// M9 (D-103): moving between the four tabs, the new page's content slides 12 px in from the side
// of the tab that was tapped (Cinemas is to the right of Films, so it comes from the right) and
// fades up, so the tabs read as places side by side. Core navigation, so it is quick and small:
// a tap only (a key press opens the page as it is), and nothing with reduced motion. The tab bar
// itself stays still. The tap is kept here, in the page's script, for the next page to read.

let pending: { direction: 1 | -1; at: number } | null = null;

/** On a tab's click: remember which way the visitor moved, unless it came from the keyboard. */
export function tabTapped(from: number, to: number, event: React.MouseEvent): void {
  // A modified click opens a new tab and leaves this page as it is: nothing to slide here.
  const elsewhere = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  pending = from === to || event.detail === 0 || elsewhere ? null : { direction: to > from ? 1 : -1, at: Date.now() };
}

/** On a page's first draw: slide its content in if a tab tap brought it here just now. */
export function useTabSlide(content: React.RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const tap = pending;
    pending = null;
    // A page that took more than a few seconds to arrive is a page load, not a move between tabs.
    if (!tap || Date.now() - tap.at > 3000 || !content.current) return;
    const m = motion();
    if (m.reduce) return;
    content.current.animate([{ opacity: 0, transform: `translateX(${12 * tap.direction}px)` }, { opacity: 1, transform: "none" }], { id: "tab", duration: m.base, easing: m.easeOut });
  }, [content]);
}
