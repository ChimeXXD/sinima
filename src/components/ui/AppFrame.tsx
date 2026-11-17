"use client";

import { Link, useCity } from "@/components/ui/CityLink";
import { createContext, useEffect, useRef, useState } from "react";
import { useDesktop } from "./useDesktop";
import "./inputMode"; // which input came last, for no motion on keys (D-112)
import { ThemeToggle } from "@/components/ThemeToggle";
import { useServiceWorker } from "@/lib/offline";
import { useSaved } from "@/lib/saved";
import { ABOUT_LINK, FOOTER_NOTE, LOGO_NOTE } from "@/lib/wording/films";
import { Icon } from "./Icon";
import { SearchBar, type CityChoice } from "./SearchBar";
import { SectionNav, type SectionId } from "./SectionNav";
import { useTabSlide } from "./tabSlide";
import { TicketFace } from "./Stickers";
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

/** Who opened the city picker: the search bar's pill or the Films title. */
type CityFrom = "bar" | "title";
/** Opens the city picker, and says which trigger has it open: the Films title's "Lagos ⌄" uses it. */
export const OpenCity = createContext<{ open: (event: React.MouseEvent<HTMLElement>, from: CityFrom) => void; from: CityFrom | null }>({ open: () => {}, from: null });

/** The Sinima lockup: the ticket face and the wordmark. Links home. */
export function Lockup() {
  return (
    <Link href="/" className={s.lockup} data-testid="wordmark">
      <TicketFace height={30} />
      <span className={s.hidden}>Sinima</span>
      {/* The wordmark (Figma 112:1291) is a static file painted in the text colour, not paths in
          the page's script: 2.4 KB less on every page (D-112). */}
      <span className={s.wordmark} aria-hidden="true" />
    </Link>
  );
}

/** The top bar's back button (Figma's 40 circle inside a 44 touch area), on phones and iPads. */
export function BarBack({ href, label, testId }: { href: string; label: string; testId: string }) {
  return (
    <Link href={href} className={s.round} aria-label={label} data-testid={testId}>
      <Icon name="chevron-left" size={20} />
    </Link>
  );
}

/** The screen's name in the top bar: "Area", "Cinema". */
export const BarTitle = ({ children }: { children: React.ReactNode }) => <span className={s.barTitle}>{children}</span>;

/** The footer line under a screen that shows cinema logos (D-57). */
export function LogoNote() {
  return (
    <p data-testid="footer.logos">
      {LOGO_NOTE.before}
      <a href={LOGO_NOTE.href}>{LOGO_NOTE.link}</a>
      {LOGO_NOTE.after}
    </p>
  );
}

/** The desktop's way back, above the title (Figma Area and Cinema: "All cinemas in Lagos"). */
export function Crumb({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={s.crumb}>
      <Icon name="chevron-left" size={18} />
      {children}
    </Link>
  );
}

/**
 * A screen below the home screens (Figma Film) passes `bar`: on phones and iPads it takes the
 * header's place, a back button, the screen's name and a share button; the desktop navbar stays.
 */
export function AppFrame({ active, search, city: chosen, bg, bar, footer, onAbout = false, children }: { active: SectionId; search: { value: string; onChange: (text: string) => void; onSubmit?: () => void }; city?: CityChoice; bg: { light: string; dark: string }; bar?: React.ReactNode; /** The page's own footer lines, in place of the note (Figma Cinemas). */ footer?: React.ReactNode; /** About itself: no link to About in the footer. */ onAbout?: boolean; children: React.ReactNode }) {
  const saved = useSaved().length;
  const pageCity = useCity();
  const cityChoice: CityChoice = chosen ?? pageCity;
  useServiceWorker();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState<boolean | null>(null); // null until first opened
  const [cityFrom, setCityFrom] = useState<CityFrom | null>(null);
  /** Opened with Enter or Space: the computer's menu appears at once. */
  const [cityKeys, setCityKeys] = useState(false);
  const cityAt = useRef<HTMLElement | null>(null);
  const desktop = useDesktop();
  const [loaded, setLoaded] = useState<Parts | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const quiet = useRef(false);
  const content = useRef<HTMLElement>(null);
  useTabSlide(content);
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
  // On a computer the trigger stays in view under its menu, so a second click closes it (D-109 c).
  const openCity = (event: React.MouseEvent<HTMLElement>, from: CityFrom) => {
    const again = desktop && city === true && cityAt.current === event.currentTarget;
    cityAt.current = event.currentTarget;
    setCityKeys(event.detail === 0);
    setCityFrom(again ? null : from);
    load();
    setCity(!again);
  };
  const closeCity = (refocus = false) => {
    setCity(false);
    setCityFrom(null);
    if (refocus) cityAt.current?.focus();
  };
  return (
    <OpenCity value={{ open: openCity, from: city ? cityFrom : null }}>
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
            onCity={(event) => openCity(event, "bar")}
            cityOpen={city === true && cityFrom === "bar"}
            inputRef={field}
          />
          {open && loaded && <loaded.Search query={search.value} onQuery={search.onChange} onSubmit={() => (close(), search.onSubmit?.())} onClose={close} city={cityChoice} />}
        </div>
        <div className={s.nav}>
          <SectionNav active={active} saved={saved} />
        </div>
        <ThemeToggle bg={bg} className={s.theme} />
      </header>
      <main className={s.main} ref={content}>
        {children}
      </main>
      <footer className={s.footer} data-own={footer ? "" : undefined}>
        {footer ?? <p data-testid="footer.note">{FOOTER_NOTE}</p>}
        {!onAbout && (
          <p>
            <Link href="/about" className={s.aboutLink} data-testid="footer.about">
              {ABOUT_LINK}
            </Link>
          </p>
        )}
      </footer>
      {city !== null && loaded && <loaded.City open={city} onClose={closeCity} anchor={cityAt} instant={cityKeys} />}
    </OpenCity>
  );
}
