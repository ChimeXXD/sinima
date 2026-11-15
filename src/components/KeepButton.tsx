"use client";

import { Icon } from "@/components/ui/Icon";
import { toggleSaved, useSaved } from "@/lib/saved";

/**
 * Keep this cinema on Your cinemas. A bridge on the old cinema page: an area's page no longer has a
 * heart on every row (Figma Area, unit 7); build unit 8 rebuilds the cinema page from Figma.
 */
export function KeepButton({ id, name }: { id: string; name: string }) {
  const kept = useSaved().includes(id);
  return (
    // The visible word starts the accessible name (WCAG 2.5.3); aria-pressed says whether it is kept.
    <button type="button" className="btn" aria-pressed={kept} onClick={() => toggleSaved(id)} data-testid="cinema.save">
      <Icon name="heart" size={18} />
      {kept ? "Kept" : "Keep"}
      <span className="sr-only"> {name} on Your cinemas</span>
    </button>
  );
}
