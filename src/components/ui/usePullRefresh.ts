"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { PULL_REFRESH } from "@/lib/wording/films";

// Pull to refresh (D-161) for the app added to the Home Screen, which has no pull to refresh of its
// own. Only there is the gesture's code fetched (pullRefresh.ts), so a page in the browser carries
// none of it (the page budget, D-21). A refresh reads the page's data again in place (Next's
// router.refresh), so the page doesn't blink white as a reload would.

/** True for the app opened from the Home Screen: an iPhone says so through navigator.standalone. */
export const isStandalone = () => matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** The longest the spinner waits for the page's data before the page springs home all the same. */
const GIVE_UP_MS = 8000;

export function usePullRefresh(moves: React.RefObject<HTMLElement | null>[]) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const waiting = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!pending && waiting.current) {
      waiting.current();
      waiting.current = null;
    }
  }, [pending]);
  useEffect(() => {
    if (!isStandalone()) return;
    let detach: (() => void) | null = null;
    let gone = false;
    const refresh = () =>
      new Promise<void>((done) => {
        waiting.current = done;
        setTimeout(done, GIVE_UP_MS);
        start(() => router.refresh());
      });
    import("./pullRefresh").then(
      ({ attachPullRefresh }) => {
        const els = moves.map((ref) => ref.current).filter((el): el is HTMLElement => el !== null);
        if (!gone && els.length > 0) detach = attachPullRefresh({ moves: els, refresh, words: PULL_REFRESH });
      },
      () => {}, // offline before it ever loaded: the page works without it
    );
    return () => {
      gone = true;
      detach?.();
    };
    // Once per page: the refs and the router stay the same for its life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
