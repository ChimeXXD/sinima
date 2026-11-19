import s from "./status.module.css";

// 11 · Status (Figma 167:76), apart from the times so a page without them carries only this (D-21).

/** 11.4 Format badge on a poster: "IMAX · 4D". */
export function FormatBadge({ formats }: { formats: string[] }) {
  return formats.length > 0 ? <span className={s.format}>{formats.join(" · ")}</span> : null;
}
