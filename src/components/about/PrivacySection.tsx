"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { setConsent, type Consent } from "@/lib/consent";
import { useConsent } from "@/components/consent/useConsent";
import { PRIVACY } from "@/lib/wording/consent";
import s from "./about.module.css";

// About › Privacy (D-191, mockup/consent/): what Sinima keeps and never does, and the one switch to
// change the answer given on the Cookie bite banner. The static page says "Off" until the browser
// has read this phone's answer.

export function PrivacySection() {
  const { consent, storage } = useConsent();
  const [told, setTold] = useState<{ text: string; stamp: string } | null>(null);
  const flip = () => {
    const next: Consent = consent === "yes" ? "no" : "yes";
    if (!setConsent(next)) return;
    setTold({ text: PRIVACY.toast(next), stamp: `${next}${Date.now()}` });
  };
  return (
    <section className={s.block} aria-labelledby="about.privacy">
      <h2 id="about.privacy">{PRIVACY.title}</h2>
      <p className={s.privacyLead}>{PRIVACY.lead}</p>
      <ul className={s.facts}>
        {PRIVACY.facts.map((fact, i) => (
          <li key={fact.title} data-testid={`about.privacy.fact.${i + 1}`}>
            <h3>{fact.title}</h3>
            <p>{fact.body}</p>
          </li>
        ))}
        <li data-testid="about.privacy.count">
          <h3>{PRIVACY.countTitle}</h3>
          <p>{PRIVACY.countBody}</p>
          {storage && (
            <div className={s.switch}>
              <span className={s.state} data-testid="about.privacy.state">
                {PRIVACY.state(consent)}
              </span>
              <button type="button" className={`${s.toggle} ${consent === "yes" ? s.toggleOff : s.toggleOn}`} onClick={flip} data-testid="about.privacy.toggle">
                {PRIVACY.action(consent)}
              </button>
            </div>
          )}
        </li>
      </ul>
      {told && <Toast icon="check" text={told.text} stamp={told.stamp} onDone={() => setTold(null)} />}
    </section>
  );
}
