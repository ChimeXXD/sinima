"use client";

import Link from "next/link";
import { createContext, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSavedArea } from "@/lib/browser";
import { useSaved } from "@/lib/saved";
import { FOOTER_NOTE } from "@/lib/wording/films";
import { Icon } from "./Icon";
import { SearchBar, type CityChoice } from "./SearchBar";
import { SectionNav, type SectionId } from "./SectionNav";
import { TicketFace } from "./Stickers";
import { WORDMARK } from "./wordmark-paths";
import s from "./frame.module.css";

// The frame every rebuilt screen shares (Figma Design screens): on phones and iPads the lockup and
// theme switch on one row with search under it, and the tab bar floating at the bottom; from
// 1200 px (D-86) one navbar with the lockup, search, the labelled nav and the theme switch. The footer
// says where times come from. Search and the city sheet are loaded apart from the page, while the
// browser is idle, so they add nothing to what a page sends first.

type Parts = { Search: typeof import("@/components/search/SearchOverlay").default; City: typeof import("@/components/search/CitySheet").default };
let parts: Promise<Parts> | null = null;
/** Loads both once; a failed load is tried again next time. Rendered when here, never behind Suspense. */
function loadParts(): Promise<Parts> {
  parts ??= Promise.all([import("@/components/search/SearchOverlay"), import("@/components/search/CitySheet")]).then(([search, city]) => ({ Search: search.default, City: city.default }));
  parts.catch(() => (parts = null));
  return parts;
}

/** Opens the city sheet: the Films title's "Lagos ⌄" uses it. */
export const OpenCity = createContext<() => void>(() => {});

/** The Sinima lockup: the ticket face and the wordmark. Links home. */
export function Lockup() {
  return (
    <Link href="/" className={s.lockup} data-testid="wordmark">
      <TicketFace height={30} />
      <span className={s.hidden}>Sinima</span>
      <svg viewBox={WORDMARK.viewBox} width={53.5} height={13.3} aria-hidden="true" focusable="false">
        {WORDMARK.paths.map((d) => (
          <path key={d} d={d} fill="currentColor" />
        ))}
      </svg>
    </Link>
  );
}

/**
 * A screen below the home screens (Figma Film) passes `bar`: on phones and iPads it takes the
 * header's place, a back button, the screen's name and a share button; the desktop navbar stays.
 */
export function AppFrame({ active, search, city: cityChoice = "lagos", bg, areas, bar, children }: { active: SectionId; search: { value: string; onChange: (text: string) => void; onSubmit?: () => void }; city?: CityChoice; bg: { light: string; dark: string }; areas: string[]; bar?: React.ReactNode; children: React.ReactNode }) {
  const saved = useSaved().length;
  // Cinemas goes straight to the saved area's cinemas, if there is one (D-18).
  const area = useSavedArea();
  const hrefs = area && areas.includes(area) ? { cinemas: `/area/${area}` } : {};
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState<boolean | null>(null); // null until first opened
  const [loaded, setLoaded] = useState<Parts | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const quiet = useRef(false);
  const load = () => void loadParts().then(setLoaded, () => {});
  useEffect(() => {
    const id = setTimeout(load, 2000);
    return () => clearTimeout(id);
  }, []);
  /** Escape gives focus back to the bar without opening the panel again; a tap leaves it be. */
  const close = (refocus = false) => {
    setOpen(false);
    if (!refocus) return;
    quiet.current = true;
    field.current?.focus();
    quiet.current = false;
  };
  const openCity = () => (load(), setCity(true));
  return (
    <OpenCity value={openCity}>
      <header className={s.header} data-bar={bar ? "" : undefined}>
        {bar && <div className={s.bar}>{bar}</div>}
        <Lockup />
        <div className={s.search}>
          <SearchBar
            city={cityChoice}
            value={search.value}
            onChange={(text) => (search.onChange(text), load(), setOpen(true))}
            onSubmit={search.onSubmit}
            onFocus={() => quiet.current || (load(), setOpen(true))}
            onCity={openCity}
            inputRef={field}
          />
          {open && loaded && <loaded.Search query={search.value} onQuery={search.onChange} onSubmit={() => (close(), search.onSubmit?.())} onClose={close} city={cityChoice} />}
        </div>
        <div className={s.nav}>
          <SectionNav active={active} saved={saved} hrefs={hrefs} />
        </div>
        <ThemeToggle bg={bg} className={s.theme} icons={{ sun: <Icon name="sun" size={20} />, moon: <Icon name="moon" size={20} /> }} />
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.footer}>
        <p data-testid="footer.note">{FOOTER_NOTE}</p>
      </footer>
      {city !== null && loaded && <loaded.City open={city} onClose={() => setCity(false)} />}
    </OpenCity>
  );
}
