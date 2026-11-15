"use client";

import Link from "next/link";
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
// says where times come from.

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
export function AppFrame({ active, search, city = "lagos", bg, areas, bar, children }: { active: SectionId; search: { value: string; onChange: (text: string) => void; onSubmit?: () => void }; city?: CityChoice; bg: { light: string; dark: string }; areas: string[]; bar?: React.ReactNode; children: React.ReactNode }) {
  const saved = useSaved().length;
  // Cinemas goes straight to the saved area's cinemas, if there is one (D-18).
  const area = useSavedArea();
  const hrefs = area && areas.includes(area) ? { cinemas: `/area/${area}` } : {};
  return (
    <>
      <header className={s.header} data-bar={bar ? "" : undefined}>
        {bar && <div className={s.bar}>{bar}</div>}
        <Lockup />
        <div className={s.search}>
          <SearchBar city={city} value={search.value} onChange={search.onChange} onSubmit={search.onSubmit} />
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
    </>
  );
}
