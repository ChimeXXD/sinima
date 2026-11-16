// Motion tokens for the Web Animations API, which can't read var(): read once per animation from
// tokens.css, so a change there reaches script-driven motion too (D-82, D-103).

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
 * D-109: a trigger opened with Enter or Space (a click with no pointer, detail 0) is marked, so its
 * chevron turns at once: no motion on keyboard actions.
 */
export function markKeys(event: React.MouseEvent<HTMLElement>): void {
  event.currentTarget.toggleAttribute("data-keys", event.detail === 0);
}

/**
 * M3 (D-103): the heart gives one small pop as it fills, so saving feels heard. Saving only, never
 * letting go, and none with reduced motion (the fill and the toast already say it).
 */
export function pop(el: Element | null | undefined): void {
  if (!el) return;
  const m = motion();
  if (m.reduce) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)", offset: 0.4 }, { transform: "scale(1)" }], { id: "pop", duration: m.base, easing: m.easeOut });
}
