"use client";

import { useEffect, useId, useRef, useState } from "react";
import { onConsent, setConsent, type Consent } from "@/lib/consent";
import { CONSENT } from "@/lib/wording/consent";
import { byKeys } from "@/components/ui/inputMode";
import { cookieBite, type CookieParts } from "./cookieBite";
import s from "./consent.module.css";

// The Cookie bite banner (D-191, mockup/consent/): once, on a first visit, floating 12 px over the
// tab bar with no scrim, so the page stays usable. The answer is kept the moment it is tapped (a page
// left mid-bite keeps it); the card then folds into its note and goes. An answer given elsewhere
// first (About's switch, another tab) closes it unasked. A keyboard user who answered is handed back
// to where they were. Loaded only while it is due (useConsentBanner), so it adds nothing to the pages
// a returning visitor loads.

export default function ConsentBanner({ onGone }: { onGone: () => void }) {
  const k = useId().replace(/:/g, "");
  const [choice, setChoice] = useState<Consent | null>(null);
  const [folded, setFolded] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const cookie = useRef<SVGSVGElement>(null);
  const bites = useRef<SVGGElement>(null);
  const crumbs = useRef<HTMLElement>(null);
  const sure = useRef<HTMLButtonElement>(null);
  const no = useRef<HTMLButtonElement>(null);
  const note = useRef<HTMLDivElement>(null);
  const tick = useRef<SVGPathElement>(null);
  const engine = useRef<ReturnType<typeof cookieBite> | null>(null);
  const gone = useRef(onGone);
  const mine = useRef(false); // this banner gave the answer
  const keys = useRef(false); // and with a key: focus is then handed on, never after a tap
  const cameFrom = useRef<HTMLElement | null>(null); // where focus was before it entered the banner
  useEffect(() => {
    gone.current = onGone;
  }, [onGone]);
  useEffect(() => onConsent(() => mine.current || gone.current()), []);

  useEffect(() => {
    const parts = { card: card.current, body: body.current, cookie: cookie.current, bites: bites.current, crumbs: crumbs.current, sure: sure.current, no: no.current, note: note.current, tick: tick.current } as CookieParts;
    engine.current = cookieBite(parts, {
      reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
      width: () => Math.min(384, document.documentElement.clientWidth - 32),
      onFold: () => {
        // The buttons fade out under the note. A keyboard answer moves focus to the note, which says
        // what happened; after a tap focus just leaves (handing it back could reopen a phone's keyboard).
        if (parts.card.contains(document.activeElement)) {
          if (keys.current) parts.note.focus({ preventScroll: true });
          else (document.activeElement as HTMLElement).blur();
        }
        setFolded(true);
      },
      onGone: () => {
        if (parts.note === document.activeElement) {
          const back = cameFrom.current;
          if (back?.isConnected) back.focus({ preventScroll: true });
          else parts.note.blur();
        }
        gone.current();
      },
    });
    return () => engine.current?.stop();
  }, []);

  const answer = (consent: Consent) => {
    if (choice) return;
    mine.current = true;
    keys.current = byKeys();
    if (!setConsent(consent)) return gone.current(); // not kept: no thanks to say, and it asks another time
    setChoice(consent);
    if (consent === "yes") engine.current?.accept();
    else engine.current?.decline();
  };

  return (
    <div
      className={s.card}
      role="region"
      aria-label={CONSENT.label}
      data-testid="consent.banner"
      ref={card}
      onFocus={(event) => {
        const from = event.relatedTarget as HTMLElement | null;
        if (!cameFrom.current && from && !card.current?.contains(from)) cameFrom.current = from;
      }}
    >
      <div className={s.body} ref={body} inert={folded}>
        <div className={s.top}>
          <div className={s.plate}>
            <svg className={s.cookie} viewBox="0 0 64 64" aria-hidden="true" ref={cookie}>
              <defs>
                <radialGradient id={`dough${k}`} cx=".34" cy=".26" r=".86">
                  <stop className={s.d0} offset="0" />
                  <stop className={s.d1} offset=".5" />
                  <stop className={s.d2} offset="1" />
                </radialGradient>
                <radialGradient id={`chip${k}`} cx=".36" cy=".3" r=".8">
                  <stop className={s.c0} offset="0" />
                  <stop className={s.c1} offset="1" />
                </radialGradient>
                <radialGradient id={`dent${k}`} cx=".5" cy=".62" r=".6">
                  <stop className={s.n0} offset="0" />
                  <stop className={s.n1} offset="1" />
                </radialGradient>
                <mask id={`bites${k}`} maskUnits="userSpaceOnUse" x="-8" y="-8" width="80" height="80">
                  <rect className={s.keep} x="-8" y="-8" width="80" height="80" />
                  <g className={s.bites} ref={bites} />
                </mask>
              </defs>
              <g mask={`url(#bites${k})`}>
                <circle className={s.edge} cx="32" cy="32" r="30" />
                <circle cx="32" cy="31.2" r="29" fill={`url(#dough${k})`} />
                <g fill={`url(#dent${k})`}>
                  <ellipse cx="14" cy="27" rx="3.2" ry="2.4" />
                  <ellipse cx="34" cy="26" rx="2.6" ry="2" />
                  <ellipse cx="50" cy="42" rx="2.8" ry="2.2" />
                  <ellipse cx="27" cy="43" rx="2.2" ry="1.7" />
                </g>
                <g fill={`url(#chip${k})`}>
                  <circle cx="22" cy="19" r="4.4" />
                  <circle cx="41" cy="16" r="3.3" />
                  <circle cx="46" cy="31" r="4.2" />
                  <circle cx="30" cy="34" r="3.5" />
                  <circle cx="17" cy="38" r="3.1" />
                  <circle cx="38" cy="48" r="4.4" />
                  <circle cx="24" cy="51" r="2.7" />
                </g>
              </g>
            </svg>
            <i className={s.crumbs} ref={crumbs} />
          </div>
          <div className={s.copy}>
            <h2 data-testid="consent.title">{CONSENT.title}</h2>
            <p data-testid="consent.body">{CONSENT.body}</p>
          </div>
        </div>
        <div className={s.actions}>
          <button type="button" className={`${s.button} ${s.no}`} onClick={() => answer("no")} data-testid="consent.no" ref={no}>
            {CONSENT.no}
          </button>
          <button type="button" className={`${s.button} ${s.sure}`} onClick={() => answer("yes")} data-testid="consent.sure" ref={sure}>
            {CONSENT.sure}
          </button>
        </div>
      </div>
      <div className={s.note} data-yes={choice === "yes" || undefined} aria-live="polite" tabIndex={-1} data-testid="consent.note" ref={note}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path pathLength={1} d="M6.5 12.5l3.8 3.8 7.2-8.1" ref={tick} />
        </svg>
        <span>{choice === "yes" ? CONSENT.noteYes : choice === "no" ? CONSENT.noteNo : ""}</span>
      </div>
    </div>
  );
}
