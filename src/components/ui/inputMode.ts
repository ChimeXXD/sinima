// D-112 F4, F5, C7: no motion on keyboard actions. The page says which input came last on <html>
// (data-input="keys" or "pointer"), written only when it changes, so CSS can turn a transition off
// for a key press (a sheet opened with Enter or closed with Escape, the search panel reached with
// Tab, a chevron) and scripts can ask `byKeys()` (the heart's pop, letting go, Show more).

let mode: "keys" | "pointer" = "pointer";

function set(next: "keys" | "pointer") {
  if (next === mode) return;
  mode = next;
  document.documentElement.dataset.input = next;
}

if (typeof window !== "undefined") {
  // Capture, so the mode is set before the handlers the key or press triggers.
  window.addEventListener("keydown", (event) => event.key !== "Shift" && set("keys"), true);
  window.addEventListener("pointerdown", () => set("pointer"), true);
}

/** The last input was a key: whatever it set off happens at once. */
export const byKeys = (): boolean => mode === "keys";
