"use client";

import { Button } from "@/components/ui/Actions";
import { OptionRow, Sheet } from "@/components/ui/Sheet";
import { LogoSticker } from "@/components/ui/Stickers";
import type { ListCinema } from "@/lib/data/select";
import { toggleSaved, useSaved } from "@/lib/saved";
import { PICK } from "@/lib/wording/yours";
import s from "./yours.module.css";

/**
 * D-106 f: the list the + on Your cinemas opens. Every cinema in the city, by area (A to Z), each a
 * row to tick: a tap keeps it or lets it go at once, with no second step, and the tick fades in
 * (the option row's own transition). Done closes it; so do Escape and the scrim.
 */
export function PickCinemas({ open, onClose, cinemas, areas, city }: { open: boolean; onClose: () => void; cinemas: ListCinema[]; areas: { slug: string; name: string }[]; city: string }) {
  const kept = useSaved();
  const words = PICK(city);
  const name = (slug: string) => areas.find((area) => area.slug === slug)?.name ?? slug;
  const groups = [...new Set(cinemas.map((cinema) => cinema.area))]
    .sort((a, b) => name(a).localeCompare(name(b)))
    .map((area) => ({ area, cinemas: cinemas.filter((cinema) => cinema.area === area).sort((a, b) => a.name.localeCompare(b.name)) }));

  return (
    <Sheet open={open} onClose={onClose} title={words.title} subtitle={words.subtitle} testId="yours.pick" side>
      {groups.map((group) => (
        <section key={group.area} className={s.pickGroup} aria-labelledby={`pick.${group.area}`}>
          <h3 id={`pick.${group.area}`} className={s.pickArea}>
            {name(group.area)}
          </h3>
          {group.cinemas.map((cinema) => (
            <OptionRow
              key={cinema.id}
              icon="heart"
              lead={
                <span className={s.pickLogo} aria-hidden="true">
                  <LogoSticker chain={cinema.chain} scale={0.6} />
                </span>
              }
              title={cinema.name}
              selected={kept.includes(cinema.id)}
              onClick={() => toggleSaved(cinema.id)}
              testId={`pick.${cinema.id}`}
            />
          ))}
        </section>
      ))}
      <Button onClick={onClose} testId="yours.pick.done">
        {words.done}
      </Button>
    </Sheet>
  );
}
