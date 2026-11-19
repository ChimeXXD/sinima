"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Actions";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { afterAnswer, cardDue, closeCard, pageSeen, readGuide, sheetDue, sheetShown, type GuideState } from "@/lib/homeScreen";
import { HOME_CARD, HOME_SHEET, HOME_STEPS_TITLE, homeSteps, type HomeStep } from "@/lib/wording/homeScreen";
import { installOffer, onInstallOffer, type InstallOffer } from "@/components/ui/useHomeGuide";
import s from "./home.module.css";

// The Home Screen guide (D-162, mockup/home-screen/): A, a sheet on a second visit; B, a card at the
// end of Films (its slot, #home-screen-card). Never on a first visit, never in the Home Screen app
// (AppFrame loads this file only in a phone's or tablet's browser). On Android, when Chrome offers
// its own install, the button installs in one tap; otherwise the steps. Kept on the phone only.

const KEY = "sinima.homeScreen";
const SHEET_DELAY_MS = 2500;
export const CARD_SLOT = "home-screen-card";

/** This page seen: counted as a new visit after 30 minutes away (pageSeen). */
function load(): GuideState {
  try {
    const next = pageSeen(readGuide(localStorage.getItem(KEY)), Date.now());
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return readGuide(null); // storage blocked (a private tab): a first visit, so nothing shows
  }
}
/** What this phone kept, without counting a page. */
function stored(): GuideState {
  try {
    return readGuide(localStorage.getItem(KEY));
  } catch {
    return readGuide(null);
  }
}
function keep(state: GuideState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the guide simply asks again another time.
  }
}

const phone = (): "ios" | "android" => (/Android/i.test(navigator.userAgent) ? "android" : "ios");

export default function HomeScreenGuide() {
  // Loaded only in the browser, after the page is up (useHomeGuide), so storage and the page are there to read.
  const [state, setState] = useState<GuideState>(load);
  const [sheet, setSheet] = useState(false);
  const [steps, setSteps] = useState(false);
  const [offer, setOffer] = useState<InstallOffer | null>(installOffer);
  const [slot] = useState(() => document.getElementById(CARD_SLOT));
  const kind = phone();

  const save = (next: GuideState) => {
    setState(next);
    keep(next);
  };

  useEffect(() => {
    const first = state;
    // Added from the browser's own menu: the guide's work is done, so the sheet goes too.
    const added = () => {
      setSheet(false);
      save(afterAnswer(stored(), "added", Date.now()));
    };
    addEventListener("appinstalled", added);
    const stopHearing = onInstallOffer(() => setOffer(installOffer()));
    let timer = 0;
    // Once a visit, a moment after the page is up, and not over another sheet or search.
    if (sheetDue(first, Date.now())) {
      timer = window.setTimeout(() => {
        if (document.querySelector("dialog[open], [role='search']")) return;
        save(sheetShown(first)); // once a visit: not again on the next page
        setSheet(true);
      }, SHEET_DELAY_MS);
    }
    return () => {
      clearTimeout(timer);
      removeEventListener("appinstalled", added);
      stopHearing();
    };
    // Once per page: the visit's state as it opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (how: "not-now" | "got-it" | "added") => {
    setSheet(false);
    save(afterAnswer(state, how, Date.now()));
  };
  /** Chrome's own install box, in one tap; the answer it gives decides what follows. */
  const install = async () => {
    if (!offer) return;
    const accepted = await offer.ask();
    setOffer(installOffer());
    if (accepted) answer("added");
  };

  const card = slot && cardDue(state) && (
    <aside className={s.card} aria-labelledby="home.card.title" data-testid="home.card">
      <AppSticker small />
      <div className={s.cardText}>
        <h2 id="home.card.title" className={s.cardTitle}>
          {HOME_CARD.title}
        </h2>
        <p className={s.cardWhy}>{HOME_CARD.why}</p>
        {offer ? (
          <Button onClick={() => void install()} testId="home.card.add">
            {HOME_SHEET.add}
          </Button>
        ) : (
          <Button onClick={() => setSteps(true)} testId="home.card.show">
            {HOME_CARD.show}
          </Button>
        )}
      </div>
      <button type="button" className={s.close} aria-label={HOME_CARD.close} onClick={() => save(closeCard(state))} data-testid="home.card.close">
        <Icon name="x" size={18} stroke={2.4} />
      </button>
    </aside>
  );

  return (
    <>
      {card && createPortal(card, slot)}
      <Sheet open={sheet} onClose={() => sheet && answer("not-now")} title={HOME_SHEET.title} lead={<AppSticker />} testId="home.sheet">
        <p className={s.why}>{kind === "android" ? HOME_SHEET.whyAndroid : HOME_SHEET.why}</p>
        {!offer && <Steps steps={homeSteps(kind)} />}
        <div className={s.actions}>
          <Button kind="secondary" onClick={() => answer("not-now")} testId="home.sheet.not-now">
            {HOME_SHEET.notNow}
          </Button>
          {offer ? (
            <Button onClick={() => void install()} testId="home.sheet.add">
              {HOME_SHEET.add}
            </Button>
          ) : (
            <Button onClick={() => answer("got-it")} testId="home.sheet.got-it">
              {HOME_SHEET.gotIt}
            </Button>
          )}
        </div>
      </Sheet>
      <Sheet open={steps} onClose={() => setSteps(false)} title={HOME_STEPS_TITLE} testId="home.steps">
        <Steps steps={homeSteps(kind)} />
        <div className={s.actions}>
          <Button onClick={() => setSteps(false)} testId="home.steps.got-it">
            {HOME_SHEET.gotIt}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

/** The app's icon as a Keepsy sticker: white outline, tilted, the sticker shadow. */
function AppSticker({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? `${s.sticker} ${s.small}` : s.sticker} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser */}
      <img src="/icons/icon-192.png" alt="" width={74} height={74} />
    </span>
  );
}

function Steps({ steps }: { steps: HomeStep[] }) {
  return (
    <ol className={s.steps} data-testid="home.steps.list">
      {steps.map((step, i) => (
        <li key={step.title} className={s.step} data-testid={`home.step.${i + 1}`}>
          <span className={s.num} aria-hidden="true">
            {i + 1}
          </span>
          <span className={s.stepText}>
            {step.title}
            {step.note && <small>{step.note}</small>}
          </span>
          <span className={s.glyph} aria-hidden="true">
            <Glyph step={step} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** What the step's button looks like on the phone: Safari's Share, Add to Home Screen's square, ⋮, or the word. */
function Glyph({ step }: { step: HomeStep }) {
  if (step.glyph === "word") return <span className={s.word}>{step.word}</span>;
  if (step.glyph === "menu") return <span className={s.menu}>⋮</span>;
  const d = step.glyph === "share" ? "M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" : "M12 8v8M8 12h8";
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={step.glyph === "share" ? s.share : undefined}>
      {step.glyph === "add" && <rect x="4" y="4" width="16" height="16" rx="4" />}
      <path d={d} />
    </svg>
  );
}
