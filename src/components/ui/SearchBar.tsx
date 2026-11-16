"use client";

import { Icon } from "./Icon";
import { useDesktop } from "./useDesktop";
import s from "./inputs.module.css";

// 8 · Inputs (Figma 167:64): search, with the city switch inside it.

export type CityChoice = "lagos" | "abuja" | "both";
const CITY_NAMES: Record<CityChoice, string> = { lagos: "Lagos", abuja: "Abuja", both: "Both cities" };

/**
 * 8.1 Search bar. The field finds a film; the pill on the right shows the city and opens the city
 * sheet. Both cities shows a globe instead of the pin. Enter calls `onSubmit`. In the app, focus
 * opens the search panel (components/search), which takes over from this field.
 */
export function SearchBar({ city, value, onChange, onSubmit, onCity, cityOpen = false, onFocus, inputRef, testId = "search" }: { city: CityChoice; value: string; onChange: (text: string) => void; onSubmit?: () => void; onCity?: (event: React.MouseEvent<HTMLButtonElement>) => void; /** The city picker is open from this pill: its chevron turns up. */ cityOpen?: boolean; onFocus?: () => void; inputRef?: React.Ref<HTMLInputElement>; testId?: string }) {
  const desktop = useDesktop();
  const pill = (
    <>
      <Icon name={city === "both" ? "globe" : "map-pin"} size={14} />
      <span>{CITY_NAMES[city]}</span>
      <Icon name="chevron-down" size={14} stroke={2.4} />
    </>
  );
  return (
    <div className={s.bar} data-testid={testId}>
      <Icon name="search" size={18} className={s.searchIcon} />
      <input ref={inputRef} onFocus={onFocus} className={s.field} type="search" placeholder="Find a film" aria-label="Find a film" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && !event.nativeEvent.isComposing && onSubmit?.()} autoComplete="off" enterKeyHint="search" data-testid={`${testId}.field`} />
      {onCity ? (
        <button type="button" className={s.city} aria-haspopup={desktop ? "listbox" : "dialog"} aria-expanded={cityOpen} aria-label={`City: ${CITY_NAMES[city]}. Change city`} onClick={onCity} data-testid={`${testId}.city`}>
          {pill}
        </button>
      ) : (
        // Without `onCity` (the kit) the pill only says which city this is.
        <span className={s.city} data-testid={`${testId}.city`}>
          {pill}
        </span>
      )}
    </div>
  );
}
