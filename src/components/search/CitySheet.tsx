"use client";

import registry from "../../../data/cinemas.json";
import { OptionRow, Sheet } from "@/components/ui/Sheet";
import { CitySticker } from "@/components/ui/Stickers";
import { ABUJA_SOON, CITY_SHEET, cityLine } from "@/lib/wording/search";
import s from "./city.module.css";

// City sheet (Figma Search and city › City sheet): opens from "Lagos ⌄" in the search bar and in
// the Films title. Lagos is the only city with cinemas until the city layer (unit 13) adds Abuja's,
// so Abuja is shown, said to be coming, and cannot be picked yet: nothing invented stands in for it.
// Loaded only when first opened.

const LAGOS = cityLine(
  registry.cinemas.length,
  registry.areas.map((area) => area.name),
);

export default function CitySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
        selected
        onClick={onClose}
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
        testId="city.abuja"
      />
      <p className={s.footer}>{CITY_SHEET.footer}</p>
    </Sheet>
  );
}
