import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import s from "./nav.module.css";

// 9 · Navigation (Figma 167:68, D-64): one nav. On a phone or iPad it is the floating tab bar at
// the bottom, the current tab a labelled button and the others icons; from 1200 px wide it is the
// labelled pill in the top bar, wherever the page puts it.

export const SECTIONS = [
  { id: "films", label: "Films", href: "/", icon: "film" },
  { id: "cinemas", label: "Cinemas", href: "/cinemas", icon: "store" },
  { id: "soon", label: "Starting soon", href: "/soon", icon: "clock" },
  { id: "yours", label: "Your cinemas", href: "/yours", icon: "heart" },
] as const satisfies readonly { id: string; label: string; href: string; icon: IconName }[];

export type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * `saved` is how many cinemas are kept on Your cinemas: a count sticker on its tab, hidden on
 * that tab itself and when there are none. `hrefs` replaces a tab's link (the /kit page keeps
 * its tabs on itself).
 */
export function SectionNav({ active, saved = 0, hrefs = {} }: { active: SectionId; saved?: number; hrefs?: Partial<Record<SectionId, string>> }) {
  return (
    <nav className={s.nav} aria-label="Sections" data-testid="nav">
      {SECTIONS.map(({ id, label, href, icon }) => {
        const on = id === active;
        const count = id === "yours" && !on && saved > 0 ? saved : null;
        return (
          <Link key={id} href={hrefs[id] ?? href} className={s.tab} aria-current={on ? "page" : undefined} aria-label={count === null ? undefined : `${label}, ${count} saved`} data-testid={`tab.${id}`}>
            <Icon name={icon} size={22} className={s.icon} />
            <span className={s.label}>{label}</span>
            {count !== null && (
              <span className={s.count} aria-hidden="true" data-testid="nav.count">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
