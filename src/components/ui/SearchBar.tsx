"use client";

import { Icon } from "./Icon";
import s from "./inputs.module.css";

// 8 · Inputs (Figma 167:64): search, with the city switch inside it.

export type CityChoice = "lagos" | "abuja" | "both";
const CITY_NAMES: Record<CityChoice, string> = { lagos: "Lagos", abuja: "Abuja", both: "Both cities" };

/**
 * 8.1 Search bar. The field finds a film; the pill on the right shows the city and opens the city
 * sheet. Both cities shows a globe instead of the pin.
 */
export function SearchBar({ city, value, onChange, onCity, testId = "search" }: { city: CityChoice; value: string; onChange: (text: string) => void; onCity: () => void; testId?: string }) {
  return (
    <div className={s.bar} data-testid={testId}>
      <Icon name="search" size={18} className={s.searchIcon} />
      <input className={s.field} type="search" placeholder="Find a film" aria-label="Find a film" value={value} onChange={(event) => onChange(event.target.value)} autoComplete="off" enterKeyHint="search" data-testid={`${testId}.field`} />
      <button type="button" className={s.city} aria-haspopup="dialog" aria-label={`City: ${CITY_NAMES[city]}. Change city`} onClick={onCity} data-testid={`${testId}.city`}>
        <Icon name={city === "both" ? "globe" : "map-pin"} size={14} />
        <span>{CITY_NAMES[city]}</span>
        <Icon name="chevron-down" size={14} stroke={2.4} />
      </button>
    </div>
  );
}
