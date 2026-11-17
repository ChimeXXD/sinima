"use client";

import registry from "../../../data/cinemas.json";
import { usePathname, useRouter } from "next/navigation";
import { useCity } from "@/components/ui/CityLink";
import { OptionRow, Sheet } from "@/components/ui/Sheet";
import { SpringMenu } from "@/components/ui/SpringMenu";
import { useDesktop } from "@/components/ui/useDesktop";
import { CitySticker } from "@/components/ui/Stickers";
import { CITIES, CITY_KEY, cityOfPath, type City } from "@/lib/city";
import { CITY_SHEET, cityLine } from "@/lib/wording/search";
import s from "./city.module.css";

// City sheet (Figma Search and city › City sheet): opens from "Lagos ⌄" in the search bar and in
// the Films title. Picking a city keeps it on this phone and opens the same tab there, or its Films
// for a page that city doesn't have (D-98). Each city's line counts its own cinemas and names its
// first areas (D-120). Loaded only when first opened. On a computer it is the Spring dropdown under
// the trigger, which stays in view (D-109 c).

/** "22 cinemas in Lekki, Victoria Island, Ikeja and 9 more areas", for each city. */
const LINES = Object.fromEntries(
  CITIES.map((city) => {
    const areas = registry.areas.filter((area) => area.city === city);
    const slugs = new Set(areas.map((area) => area.slug));
    return [city, cityLine(registry.cinemas.filter((cinema) => slugs.has(cinema.area)).length, areas.map((area) => area.name))];
  }),
) as Record<City, string>;
const TABS = ["", "/cinemas", "/soon", "/yours"];

/** The same tab in the other city, or its Films; a page for both cities (About) stays. */
export function switchPath(pathname: string, city: City): string {
  if (!cityOfPath(pathname)) return pathname;
  const rest = pathname.replace(/^\/(lagos|abuja)(?=\/|$)/, "");
  return `/${city}${TABS.includes(rest) ? rest : ""}`;
}

export default function CitySheet({
  open,
  onClose,
  anchor,
  instant,
}: {
  open: boolean;
  onClose: (refocus?: boolean) => void;
  /** The trigger, for the computer's menu. */
  anchor: React.RefObject<HTMLElement | null>;
  /** Opened with a key: the menu appears at once. */
  instant: boolean;
}) {
  const current = useCity();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const desktop = useDesktop();
  const keep = (city: City) => {
    try {
      localStorage.setItem(CITY_KEY, city);
    } catch {
      // not kept: the address still carries the city
    }
    const next = switchPath(pathname, city);
    if (next !== pathname) router.push(next);
  };
  const pick = (city: City) => (onClose(), keep(city));
  if (desktop)
    return (
      <SpringMenu
        open={open}
        anchor={anchor}
        instant={instant}
        width={340}
        label={CITY_SHEET.title}
        footer={CITY_SHEET.footer}
        options={(["lagos", "abuja"] as const).map((city) => ({
          id: city,
          label: city === "lagos" ? "Lagos" : "Abuja",
          desc: LINES[city],
          lead: (
            <span aria-hidden="true">
              <CitySticker city={city} />
            </span>
          ),
          selected: current === city,
          testId: `city.${city}`,
        }))}
        onPick={(id) => id !== current && keep(id as City)}
        onClose={onClose}
        testId="city"
      />
    );
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={CITY_SHEET.title}
      subtitle={CITY_SHEET.subtitle}
      className={s.sheet}
      testId="city"
    >
      <OptionRow
        icon="map-pin"
        lead={
          <span aria-hidden="true">
            <CitySticker city="lagos" />
          </span>
        }
        title="Lagos"
        desc={LINES.lagos}
        selected={current === "lagos"}
        onClick={() => pick("lagos")}
        testId="city.lagos"
      />
      <OptionRow
        icon="map-pin"
        lead={
          <span aria-hidden="true">
            <CitySticker city="abuja" />
          </span>
        }
        title="Abuja"
        desc={LINES.abuja}
        selected={current === "abuja"}
        onClick={() => pick("abuja")}
        testId="city.abuja"
      />
      <p className={s.footer}>{CITY_SHEET.footer}</p>
    </Sheet>
  );
}
