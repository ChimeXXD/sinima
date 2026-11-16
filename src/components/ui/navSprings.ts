"use client";

// R9 (D-106 h): the nav moves like Design Bookmark's Bottom bar (designbookmark.com/motion#db-
// bottom-bar), in Sinima's own look. The blue highlight's place and width follow the picked tab on
// a spring (340/28); on the phone and iPad bar the picked tab's name opens on its own spring
// (300/26) while the old one closes, so the pill stretches as it goes; the picked icon squashes and
// pops (520/14, from 0.72). Springs are "stiffness damping", stepped as in their motion.js. Each
// page draws its own nav, so the springs live here, in the page's script, and the next page's nav
// carries on from where the last one was. Reduced motion: the same moves, critically damped (no
// overshoot). Nothing here blocks a tap: a new pick just moves the springs' targets.
//
// D-112 F2: each frame reads first (the tabs' boxes, as the browser last laid them out) and then
// only writes, and each name's open width is read once per pick, so a frame never makes the browser
// lay the bar out again mid-script (up to five times a frame on a slow phone before).

import { critical, spring, step, type Spring } from "./spring";

const still = (s: Spring) => Math.abs(s.x - s.t) < 0.05 && Math.abs(s.v) < 0.05;

export type NavParts = { nav: HTMLElement; hl: HTMLElement; tabs: { id: string; el: HTMLElement; label: HTMLElement; icon: SVGSVGElement | null }[] };
/** Each tab's left padding, read once: the picked tab's right padding is that plus 4 (plus 2 below 360 px, Figma). */
const pads = new WeakMap<HTMLElement, number>();

const state = {
  /** "bar" (phone and iPad: only the picked tab is named) or "pill" (desktop: every tab named). */
  layout: "" as "" | "bar" | "pill",
  active: "",
  X: spring(0, 340, 28),
  W: spring(0, 340, 28),
  names: new Map<string, Spring>(),
  pops: new Map<string, Spring>(),
};
let parts: NavParts | null = null;
let frame = 0;
let last = 0;
/** Each name's open width, read once when the springs are aimed (it doesn't change while they move). */
const fulls = new Map<string, number>();
/** The tabs' boxes and the pill's height and top, as last laid out: read at the start of a frame. */
let boxes: { left: number; width: number }[] = [];
let band = { top: 0, height: 0 };

function tune(s: Spring, reduce: boolean) {
  if (reduce) critical(s);
}

/** The width a tab's name takes when open: its text (without the padding the spring draws) plus the 8 px gap before it. */
const fullName = (label: HTMLElement) => label.scrollWidth - (Number.parseFloat(label.style.paddingLeft) || 0) + 8;

function render() {
  if (!parts) return;
  const bar = state.layout === "bar";
  for (const tab of parts.tabs) {
    const pop = state.pops.get(tab.id);
    if (tab.icon && pop) tab.icon.style.transform = `scale(${pop.x.toFixed(4)})`;
    if (!bar) continue;
    const name = state.names.get(tab.id)!;
    const full = fulls.get(tab.id) || 1;
    const w = Math.max(0, name.x);
    const open = Math.min(1, Math.max(0, w / full));
    tab.label.style.width = `${w.toFixed(2)}px`;
    tab.label.style.paddingLeft = `${(open * 8).toFixed(2)}px`;
    tab.label.style.opacity = Math.min(1, Math.max(0, open * 1.4 - 0.4)).toFixed(3);
    const pad = pads.get(tab.el) ?? 14;
    tab.el.style.paddingRight = `${(pad + open * (pad < 14 ? 2 : 4)).toFixed(2)}px`; // Figma: 18 picked, 14 not (14 and 12 below 360 px)
  }
  parts.hl.style.transform = `translateX(${state.X.x.toFixed(2)}px)`;
  parts.hl.style.width = `${state.W.x.toFixed(2)}px`;
  parts.hl.style.top = `${band.top}px`;
  parts.hl.style.height = `${band.height}px`;
  // Each tab's words are white exactly as far as the pill is over them, so the picked tab never
  // shows white on the bar before the pill arrives, nor the old one grey on the pill as it leaves.
  // The boxes are this frame's start, a frame behind the names: too little to see.
  parts.tabs.forEach((tab, i) => {
    const box = boxes[i];
    if (!box?.width) return;
    const over = Math.max(0, Math.min(state.X.x + state.W.x, box.left + box.width) - Math.max(state.X.x, box.left)) / box.width;
    tab.el.style.color = `color-mix(in srgb, var(--text-on-action) ${Math.round(over * 100)}%, var(--text-secondary))`;
  });
}

/** Settled: the tabs' colours go back to the stylesheet (hover and all). */
function settle() {
  for (const tab of parts?.tabs ?? []) tab.el.style.removeProperty("color");
}

/** Reads only: where the picked tab stands (the pill's target) and every tab's box. */
function measure() {
  if (!parts) return;
  // Sub-pixel: the tabs' widths are fractional, and whole pixels leave the pill a pixel off.
  const nav = parts.nav.getBoundingClientRect();
  const rects = parts.tabs.map((tab) => tab.el.getBoundingClientRect());
  const offset = nav.left + parts.nav.clientLeft;
  boxes = rects.map((rect) => ({ left: rect.left - offset, width: rect.width }));
  const at = rects[parts.tabs.findIndex((candidate) => candidate.id === state.active)];
  if (!at) return;
  state.X.t = at.left - offset;
  state.W.t = at.width;
  band = { top: at.top - nav.top - parts.nav.clientTop, height: at.height };
}

function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  const springs = [state.X, state.W, ...state.names.values(), ...state.pops.values()];
  // Read, then step, then write: nothing written before the reads, so they force no layout.
  measure();
  for (let i = 0; i < 4; i++) for (const s of springs) step(s, dt / 4);
  const done = springs.every(still);
  // "Still" allows a small leftover (an icon could stop at 0.97 of its size): land each spring exactly.
  if (done) for (const s of springs) Object.assign(s, { x: s.t, v: 0 });
  render();
  if (done) settle();
  frame = done ? 0 : requestAnimationFrame(loop);
}
function run() {
  if (frame || !parts) return;
  last = performance.now();
  frame = requestAnimationFrame(loop);
}

/** Points every spring at `id`'s tab; the picked icon pops if the pick is new. */
function aim(id: string) {
  if (!parts) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const tab of parts.tabs) {
    if (!state.names.has(tab.id)) state.names.set(tab.id, spring(0, 300, 26));
    if (!state.pops.has(tab.id)) state.pops.set(tab.id, spring(1, 520, 14));
    const name = state.names.get(tab.id)!;
    fulls.set(tab.id, fullName(tab.label));
    name.t = tab.id === id ? fulls.get(tab.id)! : 0;
    tune(name, reduce);
    tune(state.pops.get(tab.id)!, reduce);
  }
  tune(state.X, reduce);
  tune(state.W, reduce);
  if (id !== state.active) {
    const pop = state.pops.get(id)!;
    if (!reduce) Object.assign(pop, { x: 0.72, v: 6 });
  }
  state.active = id;
}

/**
 * A nav has been drawn. The first nav of a visit snaps into place; a nav drawn after a move between
 * pages starts where the last one was and springs to its own tab.
 */
export function navMounted(next: NavParts, active: string): () => void {
  parts = next;
  for (const tab of next.tabs) pads.set(tab.el, Number.parseFloat(getComputedStyle(tab.el).paddingLeft));
  const layout = matchMedia("(min-width: 1200px)").matches ? "pill" : "bar";
  const fresh = state.layout !== layout || !state.active || snapNext;
  snapNext = false;
  state.layout = layout;
  next.nav.setAttribute("data-live", "");
  aim(active);
  if (fresh) {
    for (const name of state.names.values()) Object.assign(name, { x: name.t, v: 0 });
    for (const pop of state.pops.values()) Object.assign(pop, { x: 1, v: 0, t: 1 });
    render(); // the names at their sizes first, so the tab is measured as it will stand
    measure();
    Object.assign(state.X, { x: state.X.t, v: 0 });
    Object.assign(state.W, { x: state.W.t, v: 0 });
  }
  render();
  if (fresh) settle();
  run();
  const resize = () => {
    // Across 1200 px the nav changes shape (bar ↔ pill): the bar's own styles go, and every spring
    // lands at once in the new layout.
    const now = matchMedia("(min-width: 1200px)").matches ? "pill" : "bar";
    if (now !== state.layout) {
      state.layout = now;
      for (const tab of next.tabs) {
        for (const prop of ["width", "padding-left", "opacity"]) tab.label.style.removeProperty(prop);
        tab.el.style.removeProperty("padding-right");
        pads.set(tab.el, Number.parseFloat(getComputedStyle(tab.el).paddingLeft));
      }
      aim(state.active);
      for (const name of state.names.values()) Object.assign(name, { x: name.t, v: 0 });
    }
    measure();
    Object.assign(state.X, { x: state.X.t, v: 0 });
    Object.assign(state.W, { x: state.W.t, v: 0 });
    render();
  };
  window.addEventListener("resize", resize);
  return () => {
    window.removeEventListener("resize", resize);
    if (parts === next) {
      parts = null;
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

let snapNext = false;

/** A tab was tapped: start moving now, on this page's nav, before the next page arrives. A key press doesn't move (no motion on keyboard actions): the next nav snaps. */
export function navPicked(id: string, byKey = false): void {
  if (byKey) {
    snapNext = true;
    return;
  }
  aim(id);
  run();
}
