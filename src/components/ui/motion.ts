// Motion tokens for the Web Animations API, which can't read var(): read once per animation from
// tokens.css, so a change there reaches script-driven motion too (D-82, D-103).

import { byKeys } from "./inputMode";

/** A duration token in ms. The build's CSS minifier may write "220ms" as ".22s". */
function ms(style: CSSStyleDeclaration, token: string): number {
  const value = style.getPropertyValue(token).trim();
  return Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
}

export function motion() {
  const root = getComputedStyle(document.documentElement);
  return {
    reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
    easeOut: root.getPropertyValue("--ease-out").trim(),
    easeInOut: root.getPropertyValue("--ease-in-out").trim(),
    fast: ms(root, "--dur-fast"),
    base: ms(root, "--dur-base"),
    page: ms(root, "--dur-page"),
  };
}

/**
 * M3 (D-103): the heart gives one small pop as it fills, so saving feels heard. Saving only, never
 * letting go, and none with reduced motion (the fill and the toast already say it).
 */
export function pop(el: Element | null | undefined): void {
  if (!el || byKeys()) return; // a key press: no pop (D-112 F5)
  const m = motion();
  if (m.reduce) return;
  // Easing on each keyframe, not the whole run: across the whole run the strong ease-out reached
  // the peak in about 22 ms, a one-frame jump (D-112 F1). Now it swells, then settles.
  el.animate([{ transform: "scale(1)", easing: m.easeOut }, { transform: "scale(1.25)", offset: 0.4, easing: m.easeInOut }, { transform: "scale(1)" }], { id: "pop", duration: m.base });
}

/**
 * D-112 F3: runs `work` once the browser has drawn what a tap just changed, so a heavy redraw (a
 * list) never holds back the tapped control's own answer. Background priority runs after rendering;
 * where the scheduler is missing (Safari), the next frame and then a task.
 */
export function afterPaint(work: () => void): void {
  const scheduler = (globalThis as { scheduler?: { postTask?: (task: () => void, options: { priority: string }) => Promise<unknown> } }).scheduler;
  if (scheduler?.postTask) void scheduler.postTask(work, { priority: "background" }).catch(() => {});
  else requestAnimationFrame(() => setTimeout(work, 0));
}

/**
 * D-112 N1: the Your cinemas count answers a save, 60 ms after the heart's pop, so the eye follows
 * the cinema to where it went: it pops in when it first appears, or swells when it goes up. Its
 * own `scale`, so the sticker keeps its tilt. Not from the keyboard; reduced motion: a fade.
 */
export function bump(el: Element | null, appeared: boolean): void {
  if (!el || byKeys()) return;
  const m = motion();
  if (m.reduce) return void el.animate([{ opacity: 0.4 }, { opacity: 1 }], { id: "bump", duration: m.fast });
  const frames: Keyframe[] = appeared
    ? [{ opacity: 0, scale: 0.5, easing: m.easeOut }, { opacity: 1, scale: 1.15, offset: 0.6, easing: m.easeInOut }, { scale: 1 }]
    : [{ scale: 1, easing: m.easeOut }, { scale: 1.3, offset: 0.4, easing: m.easeInOut }, { scale: 1 }];
  el.animate(frames, { id: "bump", duration: m.base, delay: 60, fill: "backwards" });
}
