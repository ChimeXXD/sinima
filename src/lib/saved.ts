"use client";

import { useSyncExternalStore } from "react";

// Lists kept on this phone only: "Your cinemas" (the ids a visitor has hearted) and the showings
// they keep a countdown for (Figma Film › showing sheet: "Shows on Starting soon until it begins").

const EMPTY: string[] = [];

function idList(key: string) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

  function read(): string[] {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return EMPTY; // storage can be switched off
    }
    if (raw === cache.raw) return cache.ids;
    let ids: string[] = EMPTY;
    try {
      const parsed: unknown = JSON.parse(raw ?? "[]");
      if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string");
    } catch {
      // not a list: treat as none saved
    }
    cache = { raw, ids };
    return ids;
  }

  /** Adds the id, or removes it when it is already there. `keep` drops ids that no longer matter. */
  function toggle(id: string, keep: (id: string) => boolean = () => true): void {
    const ids = read().filter((other) => other === id || keep(other));
    const next = ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      return;
    }
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /** The ids; empty on the server and until the browser has taken over. */
  const use = () => useSyncExternalStore(subscribe, read, () => EMPTY);
  return { toggle, use };
}

const cinemas = idList("ls.cinemas");
const countdowns = idList("ls.countdowns");

/** Adds the cinema, or removes it when it is already saved. */
export const toggleSaved = (id: string) => cinemas.toggle(id);
/** The saved cinema ids. */
export const useSaved = cinemas.use;

/** A kept countdown's id: the film, the cinema and the start, e.g. "ramayana|filmhouse-oniru|2026-11-13T17:15:00Z". */
export const countdownId = (film: string, cinema: string, at: string) => `${film}|${cinema}|${at}`;
/** When a kept countdown's showing starts: what Starting soon counts down to. */
export const countdownStart = (id: string) => id.split("|")[2] ?? "";
/** Keeps or drops a countdown; showings that have started are dropped as it goes. */
export const toggleCountdown = (id: string, now: string) => countdowns.toggle(id, (other) => countdownStart(other) > now);
/** The kept countdowns. */
export const useCountdowns = countdowns.use;
