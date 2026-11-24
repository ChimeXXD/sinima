"use client";

import { useSyncExternalStore } from "react";
import { getConsent, onConsent, readConsent, type Consent } from "@/lib/consent";

// This phone's answer to the Cookie bite banner (D-191), kept up to date on this page and from other
// tabs. The static HTML knows no answer (null) and storage as working.

const subscribe = (tell: () => void) => onConsent(() => tell());
// One snapshot holds both, "yes|1": storage switched off reads as no answer too, so a snapshot of
// the answer alone would never change from the static page's and the page would never redraw.
const snapshot = () => {
  const { consent, storage } = getConsent();
  return `${consent}|${storage ? 1 : 0}`;
};

export function useConsent(): { consent: Consent | null; storage: boolean } {
  const [consent, storage] = useSyncExternalStore(subscribe, snapshot, () => "null|1").split("|");
  return { consent: readConsent(consent ?? null), storage: storage === "1" };
}
