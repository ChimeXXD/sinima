import { ViewTransition } from "react";

/**
 * M11 (D-103): a film's poster, named for the film, so React pairs the Films card with the film
 * page's hero on the navigation between them and the poster travels from one to the other. Only a
 * pair moves ("poster" share class, no default): elsewhere, and between tabs, it does nothing.
 * Without a film id it is just its child.
 */
export function PosterTravel({ film, children }: { film?: string; children: React.ReactNode }) {
  if (!film) return children;
  return (
    <ViewTransition name={`poster-${film}`} share="poster" default="none">
      {children}
    </ViewTransition>
  );
}
