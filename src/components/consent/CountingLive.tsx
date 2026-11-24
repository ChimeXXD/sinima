"use client";

import { Analytics } from "@vercel/analytics/next";
import { getConsent } from "@/lib/consent";

// The counter itself (D-191), loaded by Counting after a yes. Once here it stays mounted: a later
// "Stop counting" can't unload Vercel's script, and mounting it again would count the page a second
// time. Instead `beforeSend` reads the answer for every view and drops each one after a no.

const stillYes = <T,>(event: T): T | null => (getConsent().consent === "yes" ? event : null);

export default function CountingLive() {
  return <Analytics beforeSend={stillYes} />;
}
