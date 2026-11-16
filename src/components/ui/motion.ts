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
