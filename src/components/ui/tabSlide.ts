"use client";

import { useLayoutEffect } from "react";
import { motion } from "@/components/ui/motion";

// M9 (D-103), D-106 g and D-109 b: moving from page to page, the new page's content slides 40 px in and
// fades up, so pages read as places with a direction. Between the four tabs it comes from the side
// of the tab that was tapped (Cinemas is to the right of Films); going deeper (into a cinema, an
// area, a film) from the right; going back up (the back button, a crumb, the browser's back) from
// the left. Films ↔ a film's page is left to the poster travelling between them (M11). Core
// navigation, so it is quick and small: a tap or click only (a key press opens the page as it is),
// and nothing with reduced motion. The tab bar and header stay still. The move is kept here, in the
// page's script, for the next page to read.

let pending: { direction: 1 | -1; at: number } | null = null;
/** The page the visitor is on, for the browser's back and forward, which say only where they went. */
let current = "";

const depth = (path: string) => path.split(/[?#]/)[0]!.split("/").filter(Boolean).length;
const isFilmsHome = (path: string) => /^\/(lagos|abuja)\/?$/.test(path.split(/[?#]/)[0]!);
const isFilm = (path: string) => /\/film\//.test(path);
/** Films ↔ a film's page: the poster travels between them (M11), and a slide would pull it aside. */
const posterTravels = (from: string, to: string) => (isFilm(to) && isFilmsHome(from)) || (isFilm(from) && isFilmsHome(to));
/** A key press, or a click that opens a new browser tab and leaves this page as it is. */
const notATap = (event: React.MouseEvent) => event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

/**
 * D-112 C8, F6: after the first move inside the site, hero stickers and the film poster no longer
 * press on as each page arrives (html[data-arrived]): the page's slide, or the poster's travel, is
 * the one move. A page opened fresh still gets them.
 */
const arrived = () => {
  document.documentElement.dataset.arrived = "";
};

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    arrived();
    const to = window.location.pathname;
    pending = current && current !== to && !posterTravels(current, to) ? { direction: depth(to) > depth(current) ? 1 : -1, at: Date.now() } : null;
  });
}

/** On any link inside the site: deeper slides in from the right, back up from the left. */
export function linkTapped(to: string, event: React.MouseEvent): void {
  const from = window.location.pathname;
  const path = to.split(/[?#]/)[0]!;
  // A new browser tab (a modifier click) leaves this page as it is.
  if (path !== from && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) arrived();
  pending = notATap(event) || path === from || posterTravels(from, path) ? null : { direction: depth(path) >= depth(from) ? 1 : -1, at: Date.now() };
}

/** A move made from the keyboard (Enter in search): the page arrives as it is, with no slide. */
export function keyMoved(to: string): void {
  if (to.split(/[?#]/)[0] !== window.location.pathname) arrived();
  pending = null;
}

/** On a tab's click (after its link's): between tabs, the side of the tab that was tapped. */
export function tabTapped(from: number, to: number, event: React.MouseEvent): void {
  if (notATap(event) || from === to || !pending) return void (pending = null);
  pending = { ...pending, direction: to > from ? 1 : -1 };
}

/** On a page's first draw: slide its content in if a tap brought it here just now. */
export function useTabSlide(content: React.RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const move = pending;
    pending = null;
    // Any page after the first (a link, the back button, a search or city change by the router).
    if (current) arrived();
    current = window.location.pathname;
    // A page that took more than a few seconds to arrive is a page load, not a move.
    if (!move || Date.now() - move.at > 3000 || !content.current) return;
    const m = motion();
    if (m.reduce) return;
    // A page is a large surface, like a sheet: 40 px over 300 ms, so the move reads (12 px over 220 ms
    // was over before the eye saw it, D-109 b). Still under the sheet's 450.
    content.current.animate([{ opacity: 0, transform: `translateX(${40 * move.direction}px)` }, { opacity: 1, transform: "none" }], { id: "tab", duration: m.page, easing: m.easeOut });
  }, [content]);
}
