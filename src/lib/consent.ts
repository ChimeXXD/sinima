// Counting visits (D-191): asked once with the Cookie bite banner, the answer kept on this phone.
// Nothing is counted without a yes, and nothing at all off Vercel (the e2e run, `next dev`).
// Sinima still sets no cookies: Vercel Web Analytics counts without them.

export const CONSENT_KEY = "ls.count"; // with ls.city, ls.area, ls.theme: everything kept on the phone
export type Consent = "yes" | "no";

/** A kept value as an answer; anything else is "not asked yet". */
export function readConsent(raw: string | null): Consent | null {
  return raw === "yes" || raw === "no" ? raw : null;
}

/** The banner asks only when there is no answer and one can be kept (else it would ask on every page). */
export function bannerDue(consent: Consent | null, storage: boolean): boolean {
  return consent === null && storage;
}

/** Whether this page counts the visit: a yes, on Vercel. */
export function counts(consent: Consent | null, onVercel: boolean): boolean {
  return consent === "yes" && onVercel;
}

/** This phone's answer, and whether storage works at all (a private tab may switch it off). */
export function getConsent(): { consent: Consent | null; storage: boolean } {
  try {
    return { consent: readConsent(localStorage.getItem(CONSENT_KEY)), storage: true };
  } catch {
    return { consent: null, storage: false };
  }
}

const listeners = new Set<(consent: Consent | null) => void>();

/** Keeps the answer and tells this page; false when storage is switched off (nothing kept, nothing counted). */
export function setConsent(consent: Consent): boolean {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    return false;
  }
  listeners.forEach((tell) => tell(consent));
  return true;
}

/** Hears the answer change, on this page or in another tab; returns the way to stop. */
export function onConsent(tell: (consent: Consent | null) => void): () => void {
  const other = (event: StorageEvent) => event.key === CONSENT_KEY && tell(readConsent(event.newValue));
  listeners.add(tell);
  window.addEventListener("storage", other);
  return () => {
    listeners.delete(tell);
    window.removeEventListener("storage", other);
  };
}
