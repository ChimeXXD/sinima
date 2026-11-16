"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { utcMs } from "@/lib/time/lagos";
import { offlineLine } from "@/lib/wording/offline";

// Offline (Figma Offline · Films 208:9731): with no connection the service worker (public/sw.js)
// serves the copy of each page saved the last time it loaded, and the page says so. The phone
// keeps only when it last loaded each page online (by path, since each page's copy is saved on its
// own), under ls.savedAt.

export const SAVED_AT_KEY = "ls.savedAt";

function subscribe(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/** True when the browser says it has no connection; false on the server and while online. */
export function useOffline(): boolean {
  return useSyncExternalStore(subscribe, () => !navigator.onLine, () => false);
}

type SavedAt = Record<string, string>;

function readAll(): SavedAt {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_AT_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as SavedAt) : {};
  } catch {
    return {}; // storage switched off, or not ours
  }
}

/** When this path was last loaded online, or null when unknown or not a UTC time (utcMs would throw). */
function readSavedAt(path: string): string | null {
  const at = readAll()[path];
  if (typeof at !== "string") return null;
  try {
    utcMs(at);
    return at;
  } catch {
    return null;
  }
}

/** The offline banner's words, or null while online or before the page knows the time (rule 3). Online, it notes when the page was loaded. */
export function useOfflineNotice(now: string | null): string | null {
  const offline = useOffline();
  const noted = useRef(false);
  // Once per page load: the time the service worker saved this page, near enough.
  useEffect(() => {
    if (offline || now === null || noted.current) return;
    noted.current = true;
    try {
      localStorage.setItem(SAVED_AT_KEY, JSON.stringify({ ...readAll(), [location.pathname]: now }));
    } catch {
      // not remembered: offline the banner just leaves out the time
    }
  }, [offline, now]);
  return offline && now !== null ? offlineLine(readSavedAt(location.pathname), now) : null;
}

/** The site's build files this page has loaded, by path. */
const builtFiles = () =>
  performance
    .getEntriesByType("resource")
    .map((entry) => new URL(entry.name))
    .filter((url) => url.origin === location.origin && url.pathname.startsWith("/_next/static/"))
    .map((url) => url.pathname);

/** Registers the service worker once the page has loaded (production builds only). */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // Once the worker is running, ask it to save this page: the first visit doesn't pass through it.
    const register = () =>
      void navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((ready) => {
          const save = () => ready.active?.postMessage({ save: location.pathname, files: builtFiles() });
          save();
          // Again once the parts loaded at idle (search, the city sheet) are in; saved ones are skipped.
          setTimeout(save, 4000);
        })
        .catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
}
