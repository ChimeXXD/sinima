"use client";

import { useEffect, useState } from "react";
import { bannerDue, getConsent } from "@/lib/consent";

// The Cookie bite banner (D-191) on a page in the frame: only while this phone hasn't answered, and
// its code loads only then, 1.5 s after the page is up (the first visit's location question is on
// "/", before any framed page). Once answered it never loads again.

type Banner = typeof import("./ConsentBanner").default;
const DELAY_MS = 1500;

export function useConsentBanner(): { Banner: Banner; done: () => void } | null {
  const [banner, setBanner] = useState<{ Banner: Banner } | null>(null);
  useEffect(() => {
    const { consent, storage } = getConsent();
    if (!bannerDue(consent, storage)) return;
    let gone = false;
    const id = setTimeout(() => {
      import("./ConsentBanner").then(
        (loaded) => gone || (bannerDue(getConsent().consent, true) && setBanner({ Banner: loaded.default })),
        () => {}, // offline before it loaded: asked another time
      );
    }, DELAY_MS);
    return () => {
      gone = true;
      clearTimeout(id);
    };
  }, []);
  return banner && { ...banner, done: () => setBanner(null) };
}
