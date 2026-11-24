"use client";

import { useEffect, useState, type ComponentType } from "react";
import { counts, getConsent, onConsent, type Consent } from "@/lib/consent";

// Vercel Web Analytics (D-191), in the root layout so it lives across page changes and counts each
// one. Every page carries only this loader (the page budget, D-21): the counter's code loads after a
// yes, and only on the production site (`ANALYTICS`, set at build). Once loaded it stays (see
// CountingLive) and drops every view after a later no.

const ON_VERCEL = process.env.ANALYTICS === "1";

export function Counting() {
  const [Live, setLive] = useState<ComponentType | null>(null);
  useEffect(() => {
    if (!ON_VERCEL) return;
    const load = (consent: Consent | null) =>
      counts(consent, ON_VERCEL) &&
      import("./CountingLive").then(
        (module) => setLive(() => module.default),
        () => {}, // offline: counted from the next page that loads it
      );
    load(getConsent().consent);
    return onConsent(load);
  }, []);
  return Live ? <Live /> : null;
}
