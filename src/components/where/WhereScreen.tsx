"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Actions";
import { Lockup } from "@/components/ui/AppFrame";
import { Icon } from "@/components/ui/Icon";
import { CitySticker, DrinkSticker, TicketFaceSticker } from "@/components/ui/Stickers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CITY_KEY, isCity, type City } from "@/lib/city";
import { cityFromPosition } from "@/lib/location";
import { WHERE, continueLabel, foundNote } from "@/lib/wording/where";
import s from "./where.module.css";

// Where are you watching? (Figma 162:215 Asking, 162:262 Found you in Abuja, 162:302 Elsewhere →
// Lagos; D-65): a first visit asks for the phone's location as the page opens, only to pick the
// city. Lagos or Abuja is picked for you; anywhere else, or no answer, offers Lagos. A tap on a
// card picks by hand. Continue keeps the city on this phone (its slug only) and opens it. The
// position is read on the phone and never kept or sent (rule 11).

type State = { kind: "asking" } | { kind: "found"; city: City } | { kind: "fallback" } | { kind: "picked"; city: City };

const picked = (state: State): City | null => (state.kind === "found" || state.kind === "picked" ? state.city : state.kind === "fallback" ? "lagos" : null);

const Sticker = ({ name, className }: { name: "clapper" | "popcorn" | "glasses"; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser
  <img className={`${s.sticker} ${className}`} src={`/stickers/${name}.png`} alt="" loading="lazy" decoding="async" fetchPriority="low" />
);

export function WhereScreen({ lagosLine, bg }: { lagosLine: string; bg: { light: string; dark: string } }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "asking" });
  const city = picked(state);

  // The answer comes back later; no answer, or a phone with no location, offers Lagos. Only the
  // latest ask is heard: a tap on a card, or a newer ask, makes an older answer stale.
  const asked = useRef(0);
  const ask = useCallback(() => {
    const id = ++asked.current;
    const answer = (next: State) => {
      if (asked.current !== id) return;
      asked.current++;
      setState(next);
    };
    const fallback = () => answer({ kind: "fallback" });
    if (!("geolocation" in navigator)) return void setTimeout(fallback);
    // A permission prompt left unanswered never calls back, and the browser's own timeout only
    // starts once it is allowed: this one covers the prompt too.
    setTimeout(fallback, 15_000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const found = cityFromPosition(coords.latitude, coords.longitude);
        answer(found ? { kind: "found", city: found } : { kind: "fallback" });
      },
      fallback,
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }, []);
  // Asked as the page opens (D-65).
  // Not when a city is kept: the script at the top of the page is already opening it.
  useEffect(() => {
    try {
      if (isCity(localStorage.getItem(CITY_KEY))) return;
    } catch {
      // storage switched off: nothing is kept, so ask
    }
    return ask();
  }, [ask]);
  const locate = () => (setState({ kind: "asking" }), ask());
  const pick = (which: City) => {
    asked.current++; // a pick by hand outranks an answer still on its way
    setState({ kind: "picked", city: which });
  };

  function go() {
    if (!city) return;
    try {
      localStorage.setItem(CITY_KEY, city);
    } catch {
      // not kept: the address carries the city
    }
    router.push(`/${city}`);
  }

  const card = (which: City, line: string) => (
    <button type="button" className={s.card} data-city={which} aria-pressed={city === which} onClick={() => pick(which)} data-testid={`where.${which}`}>
      <CitySticker city={which} large />
      <span className={s.line}>{line}</span>
      {city === which && (
        <span className={s.check} aria-hidden="true">
          <Icon name="check" size={16} stroke={2.4} />
        </span>
      )}
    </button>
  );

  return (
    <div className={s.page}>
      <header className={s.top}>
        <Lockup />
        <ThemeToggle bg={bg} className={s.theme} icons={{ sun: <Icon name="sun" size={20} />, moon: <Icon name="moon" size={20} /> }} />
      </header>
      <main className={s.main}>
        <div className={s.stage}>
          <Sticker name="clapper" className={s.clapper} />
          <Sticker name="glasses" className={s.glasses} />
          <Sticker name="popcorn" className={s.popcorn} />
          <DrinkSticker width={83} className={`${s.sticker} ${s.drink}`} />
          <TicketFaceSticker height={64} className={`${s.sticker} ${s.ticket}`} />
          <h1 className={s.title}>{WHERE.title}</h1>
          <p className={s.lead}>{WHERE.lead}</p>
          <div className={s.cards} role="group" aria-label="City">
            {card("lagos", lagosLine)}
            {card("abuja", WHERE.abuja)}
          </div>
          <div className={s.status} aria-live="polite" data-testid="where.status">
            {state.kind === "asking" && <span className={s.hand}>{WHERE.asking}</span>}
            {state.kind === "found" && (
              <span className={s.hand} data-city={state.city}>
                {foundNote(state.city)}
              </span>
            )}
            {state.kind === "fallback" && <p className={s.note}>{WHERE.fallback}</p>}
          </div>
          <div className={s.actions}>
            <Button disabled={!city} onClick={go} testId="where.continue">
              {continueLabel(city)}
            </Button>
            <Button kind="secondary" icon="navigation" onClick={locate} testId="where.locate">
              {WHERE.locate}
            </Button>
          </div>
          <p className={s.foot}>
            <span className={s.phoneOnly}>{state.kind === "asking" ? WHERE.footAsking : WHERE.footPhone}</span>
            <span className={s.wideOnly}>{WHERE.footWide}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
