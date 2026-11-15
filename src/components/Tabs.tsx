"use client";

import Link from "next/link";
import { Heart } from "@/components/Icons";

// Films first (D-55): a visitor has a film in mind, picks it, then sees every cinema showing it.
const TABS = [
  ["films", "Films", "/"],
  ["cinemas", "Cinemas", "/cinemas"],
  ["soon", "Starting soon", "/soon"],
  ["yours", "Your cinemas", "/yours"], // the hearted cinemas, on their own tab (D-61)
] as const;

export type TabId = (typeof TABS)[number][0];

/** The four ways in. Cinemas keeps the saved area on its own page (D-91). */
export function Tabs({ tab }: { tab: TabId }) {
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map(([id, label, href]) => (
        <Link key={id} href={href} className={id === tab ? "tab on" : "tab"} aria-current={id === tab ? "page" : undefined} aria-label={id === "yours" ? label : undefined} data-testid={`tab.${id}`}>
          {id === "yours" ? (
            // On a phone four names do not fit: this tab is the heart, with its name for screen readers.
            <>
              <Heart on={id === tab} />
              <span>{label}</span>
            </>
          ) : (
            label
          )}
        </Link>
      ))}
    </nav>
  );
}
