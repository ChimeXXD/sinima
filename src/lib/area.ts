/** Where the chosen area is kept: on this phone only, as its slug (SPEC §6). */
export const AREA_KEY = "ls.area";

/** Remembers the area on this phone only; null forgets it. */
export function rememberArea(slug: string | null) {
  try {
    if (slug) localStorage.setItem(AREA_KEY, slug);
    else localStorage.removeItem(AREA_KEY);
  } catch {
    // Storage can be switched off: the choice just is not remembered.
  }
}

/** The light or dark choice, on this device only, when it overrides the phone's setting (D-58). */
export const THEME_KEY = "ls.theme";
