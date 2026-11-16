"use client";

import registry from "../../../data/cinemas.json";
import { usePathname, useRouter } from "next/navigation";
import { useCity } from "@/components/ui/CityLink";
import { OptionRow, Sheet } from "@/components/ui/Sheet";
import { SpringMenu } from "@/components/ui/SpringMenu";
import { useDesktop } from "@/components/ui/useDesktop";
import { CitySticker } from "@/components/ui/Stickers";
import { CITY_KEY, cityOfPath, type City } from "@/lib/city";
import { ABUJA_SOON, CITY_SHEET, cityLine } from "@/lib/wording/search";
import s from "./city.module.css";

// City sheet (Figma Search and city › City sheet): opens from "Lagos ⌄" in the search bar and in
// the Films title. Picking a city keeps it on this phone and opens the same tab there, or its Films
// for a page that city doesn't have (D-98). Abuja has no cinemas in the data yet, so its line says
// they are being added: nothing invented stands in for them. Loaded only when first opened. On a
// computer it is the Spring dropdown under the trigger, which stays in view (D-109 c).

const LAGOS = cityLine(
  registry.cinemas.length,
  registry.areas.map((area) => area.name),
);
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
        options={(["lagos", "abuja"] as const).map((city) => ({
          id: city,
          label: city === "lagos" ? "Lagos" : "Abuja",
          desc: city === "lagos" ? LAGOS : ABUJA_SOON,
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
        desc={LAGOS}
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
        desc={ABUJA_SOON}
        selected={current === "abuja"}
        onClick={() => pick("abuja")}
        testId="city.abuja"
      />
      <p className={s.footer}>{CITY_SHEET.footer}</p>
    </Sheet>
  );
}
