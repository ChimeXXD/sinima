"use client";

import { useEffect, useState } from "react";
import { bannerDue, getConsent } from "@/lib/consent";
import { isStandalone } from "./usePullRefresh";

// The Home Screen guide (D-162) for a phone's or tablet's browser. Its code loads only there, a
// moment after the page is up (the page budget, D-21); the Home Screen app loads pull to refresh
// instead (D-161). Chrome on Android offers its own install once, early: it is kept here, before the
// guide's code arrives, so the guide's button can offer it in one tap.

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export type InstallOffer = { ask: () => Promise<boolean> };

let held: PromptEvent | null = null;
/** The guide, once up, hears an offer Chrome makes later on (it can come after the guide's code). */
const heard = new Set<() => void>();
if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // the guide offers it, not Chrome's own bar
    held = event as PromptEvent;
    heard.forEach((tell) => tell());
  });
}

/** Calls `tell` whenever Chrome makes a new install offer; returns the way to stop. */
export function onInstallOffer(tell: () => void): () => void {
  heard.add(tell);
  return () => heard.delete(tell);
}

/** Chrome's install offer, while it has one: `ask` shows its box and says whether it was accepted. Each offer works once: a second ask (a double tap), or a box Chrome refuses to show, is a no. */
export function installOffer(): InstallOffer | null {
  const event = held;
  if (!event) return null;
  let asked = false;
  return {
    ask: async () => {
      if (asked) return false;
      asked = true;
      if (held === event) held = null;
      try {
        await event.prompt();
        return (await event.userChoice).outcome === "accepted";
      } catch {
        return false;
      }
    },
  };
}

type Guide = typeof import("@/components/home/HomeScreenGuide").default;

/** The guide, once loaded: only in a browser (not the Home Screen app), only with a finger (a phone or tablet). */
export function useHomeGuide(): { Guide: Guide } | null {
  const [guide, setGuide] = useState<{ Guide: Guide } | null>(null);
  useEffect(() => {
    if (isStandalone() || !matchMedia("(pointer: coarse)").matches) return;
    // Not while the Cookie bite banner still waits for an answer: one ask at a time (D-191).
    const { consent, storage } = getConsent();
    if (bannerDue(consent, storage)) return;
    let gone = false;
    const id = setTimeout(() => {
      import("@/components/home/HomeScreenGuide").then(
        (loaded) => gone || setGuide({ Guide: loaded.default }),
        () => {}, // offline before it loaded: no guide this time
      );
    }, 1500);
    return () => {
      gone = true;
      clearTimeout(id);
    };
  }, []);
  return guide;
}
