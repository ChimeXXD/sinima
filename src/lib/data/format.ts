// The format of a showing as the app says it (D-50): IMAX, 4D or 3D. Standard 2D, and a format
// we do not know, give no tag. A format is never guessed.

export type FormatTag = "IMAX" | "4D" | "3D";
export const FORMAT_TAGS: FormatTag[] = ["IMAX", "4D", "3D"];

/** "IMAX 2D" is IMAX; "MX4D" and "4DX" are 4D (moving seats); "3D" is 3D. */
export function formatTag(format: string | null | undefined): FormatTag | null {
  const text = (format ?? "").trim().toUpperCase();
  if (text.startsWith("IMAX")) return "IMAX";
  if (text === "MX4D" || text === "4DX" || text === "4D") return "4D";
  if (text === "3D") return "3D";
  return null;
}

/**
 * A showing's format as the cinema names it, for a time chip and the film's facts: "IMAX" for
 * "IMAX 2D", "MX4D" and "4DX" as they are, "3D". Standard 2D and an unknown format say nothing.
 */
export function formatLabel(format: string | null | undefined): string | null {
  const tag = formatTag(format);
  if (tag === null) return null;
  return tag === "4D" ? (format ?? "").trim().toUpperCase() : tag;
}
