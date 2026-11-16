"use client";

import { useLayoutEffect, useRef } from "react";
import { Link } from "@/components/ui/CityLink";
import { Icon, type IconName } from "./Icon";
import { tabTapped } from "./tabSlide";
import s from "./nav.module.css";

// 9 · Navigation (Figma 167:68, D-64): one nav. On a phone or iPad it is the floating tab bar at
// the bottom, the current tab a labelled button and the others icons; from 1200 px wide it is the
// labelled pill in the top bar, wherever the page puts it.

// The springs (R9) load after the page is up, or at the first tap: until then the picked tab draws
// its own pill, which looks the same at rest (D-104: the page budget).
type Springs = typeof import("./navSprings");
let springs: Springs | null = null;
let loading: Promise<Springs> | null = null;
const loadSprings = () => (loading ??= import("./navSprings").then((module) => (springs = module)));

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
export function SectionNav({ active, saved = 0, hrefs = {}, live = true }: { active: SectionId; saved?: number; hrefs?: Partial<Record<SectionId, string>>; /** The springs (R9); off on /kit, where the tabs don't go anywhere. */ live?: boolean }) {
  const from = SECTIONS.findIndex(({ id }) => id === active);
  const nav = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = nav.current;
    if (!live || !el) return;
    const tabs = [...el.querySelectorAll<HTMLElement>("[data-tab]")].map((tab) => ({ id: tab.dataset.tab!, el: tab, label: tab.querySelector<HTMLElement>("[data-label]")!, icon: tab.querySelector("svg") }));
    const parts = { nav: el, hl: el.querySelector<HTMLElement>("[data-hl]")!, tabs };
    if (springs) return springs.navMounted(parts, active);
    let detach: (() => void) | undefined;
    let gone = false;
    const id = setTimeout(() => void loadSprings().then((module) => !gone && (detach = module.navMounted(parts, active))), 2000);
    return () => {
      gone = true;
      clearTimeout(id);
      detach?.();
    };
  }, [active, live]);
  return (
    <nav ref={nav} className={s.nav} aria-label="Sections" data-testid="nav">
      {live && <span className={s.hl} aria-hidden="true" data-hl />}
      {SECTIONS.map(({ id, label, href, icon }, to) => {
        const on = id === active;
        const count = id === "yours" && !on && saved > 0 ? saved : null;
        return (
          <Link key={id} href={hrefs[id] ?? href} className={s.tab} aria-current={on ? "page" : undefined} aria-label={count === null ? undefined : `${label}, ${count} saved`} onClick={(event) => {
              tabTapped(from, to, event);
              if (!live || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; // a new browser tab: this nav stays
              if (springs) springs.navPicked(id, event.detail === 0); // a key press: the next page's nav just shows the pick
              else void loadSprings();
            }}
            data-tab={id}
            data-testid={`tab.${id}`}
          >
            <Icon name={icon} size={22} className={s.icon} />
            <span className={s.label} data-label>
              {label}
            </span>
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
