"use client";

import { useSyncExternalStore } from "react";

const DESKTOP = "(min-width: 1200px)";

/** A computer's width (D-86), where pickers drop a menu instead of raising a sheet. False before hydration. */
export function useDesktop(): boolean {
  return useSyncExternalStore(
    (change) => {
      const query = matchMedia(DESKTOP);
      query.addEventListener("change", change);
      return () => query.removeEventListener("change", change);
    },
    () => matchMedia(DESKTOP).matches,
    () => false,
  );
}
