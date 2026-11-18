// Joining names in a sentence. Apart from credits.ts so the screens that only join names don't carry
// the Stay or Go wording (the page budget, D-21).

/** "TMDB", "TMDB and RunPee", "TMDB, RunPee and aftercredits.com"; with "or", "Victoria Island or Sangotedo". */
export function list(items: string[], last: "and" | "or" = "and"): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${last} ${items.at(-1)}`;
}
