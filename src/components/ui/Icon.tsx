import { ICON_PATHS, type IconName } from "./icon-paths";

export type { IconName };

/**
 * A Lucide line icon (Figma 5 · Iconography): round caps and joins on a 24 grid, coloured by the
 * text around it. `stroke` is in grid units, so Figma's 1.83 px at 22 px is stroke 2. Decorative:
 * the control it sits in carries the label.
 */
export function Icon({ name, size = 18, stroke = 2, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
