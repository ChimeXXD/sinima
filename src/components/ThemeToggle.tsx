"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/area";
import { PullCord } from "./PullCord";

type Theme = "light" | "dark";
const CHANGED = "sinima:theme";
/** The latest switch, so an older one's frames cannot turn transitions back on under a newer one. */
let cut = 0;
/** The latest light-switch transition, so an older one ending cannot take a newer one's classes away. */
let lit = 0;

function subscribe(listener: () => void): () => void {
  window.addEventListener(CHANGED, listener);
  return () => window.removeEventListener(CHANGED, listener);
}
/** The theme on screen: dark only when chosen here; the phone's own setting is not read (D-143). */
function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
/** The browser bar takes the page colour. */
function paintBar(theme: Theme, bg: { light: string; dark: string }) {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = bg[theme];
  });
}

/** A spring, "stiffness damping" from 0 to 1, sampled into a CSS linear() curve and its settle time. */
function springCurve(k: number, c: number): { easing: string; duration: number } {
  const points: number[] = [];
  let x = 0;
  let v = 0;
  const dt = 1 / 120;
  for (let t = 0; t < 2; t += dt) {
    v += (-k * (x - 1) - c * v) * dt;
    x += v * dt;
    points.push(x);
    if (t > 0.1 && Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.01) break;
  }
  const every = Math.max(1, Math.round(points.length / 40));
  const kept = points.filter((_, i) => i % every === 0);
  return { easing: `linear(0, ${kept.map((p) => p.toFixed(3)).join(", ")}, 1)`, duration: Math.round(points.length * dt * 1000) };
}

/**
 * The light and dark switch in the header (D-58). The page is light until pulled (D-143), then keeps
 * the choice on this device; layout.tsx applies a kept choice before the page is drawn. It is Design
 * Bookmark's pull cord (D-106 i): pulled past its click, the new theme opens as a circle from the
 * bulb (turning the light on) or closes back into it (off), on their light's springs, 120/21
 * opening and 170/27 closing (D-107, superseding D-60's instant change). Reduced motion, or a
 * browser without view transitions: the page changes at once.
 */
export function ThemeToggle({ bg, className }: { bg: { light: string; dark: string }; className?: string }) {
  const theme = useSyncExternalStore(subscribe, current, () => null);
  useEffect(() => paintBar(current(), bg), [bg]);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const apply = () => {
    // Other transitions are off until the new theme has been drawn, so nothing fades its colours
    // across and the page is never half in one theme (theme-switch.css).
    const root = document.documentElement;
    const mine = ++cut;
    root.classList.add("theme-cut");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (mine === cut) root.classList.remove("theme-cut");
    }));
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be switched off: the choice holds until the page is left.
    }
    paintBar(next, bg);
    window.dispatchEvent(new Event(CHANGED));
  };
  const flip = (bulb: { x: number; y: number } | null) => {
    // A key press (no bulb), reduced motion, or no view transitions: the page changes at once.
    if (!bulb || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    const light = next === "light";
    const root = document.documentElement;
    const mine = ++lit;
    // A pull while the last one is still opening skips that one: only this one's direction stays.
    root.classList.remove("light-on", "light-off");
    root.classList.add("light-switch", light ? "light-on" : "light-off");
    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      const far = Math.hypot(Math.max(bulb.x, innerWidth - bulb.x), Math.max(bulb.y, innerHeight - bulb.y)) + 24;
      const curve = light ? springCurve(120, 21) : springCurve(170, 27);
      const circles = [`circle(0px at ${bulb.x}px ${bulb.y}px)`, `circle(${far}px at ${bulb.x}px ${bulb.y}px)`];
      root.animate({ clipPath: light ? circles : circles.reverse() }, { duration: curve.duration, easing: curve.easing, pseudoElement: light ? "::view-transition-new(root)" : "::view-transition-old(root)", fill: "both" });
    }, () => {});
    const done = () => {
      if (mine === lit) root.classList.remove("light-switch", "light-on", "light-off");
    };
    transition.finished.then(done, done);
  };
  return <PullCord on={theme === null ? null : theme === "light"} onFlip={flip} label={theme ? `Switch to ${next} mode` : "Switch between light and dark mode"} testId="theme.toggle" className={className} />;
}
