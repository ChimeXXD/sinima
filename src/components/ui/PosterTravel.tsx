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
    <ViewTransition name={`poster-${film}`} share="poster" default="none" onShare={onlyTransform}>
      {children}
    </ViewTransition>
  );
}

/**
 * D-112 F7: the browser moves the travelling poster by animating its box's width and height, which
 * a phone can't hand to its graphics chip. The box already rests at the new poster's size, so its
 * keyframes become one transform that scales the old box into place: the same path and timing, with
 * nothing laid out each frame. With reduced motion there is no animation to change.
 */
function onlyTransform({ name }: { name: string }) {
  for (const animation of document.getAnimations()) {
    const effect = animation.effect as KeyframeEffect | null;
    if (effect?.pseudoElement !== `::view-transition-group(${name})`) continue;
    const [from, to] = effect.getKeyframes();
    const size = (frame: ComputedKeyframe | undefined) => [parseFloat(String(frame?.width)), parseFloat(String(frame?.height))];
    const [w0, h0] = size(from);
    const [w1, h1] = size(to);
    if (!from?.transform || !to?.transform || ![w0, h0, w1, h1].every((n) => n! > 0)) return;
    // About the new box's centre: shift by the difference of the centres, then the old place, then
    // the old size. It ends on the browser's own last frame.
    const start = `translate(${(w0! - w1!) / 2}px, ${(h0! - h1!) / 2}px) ${from.transform} scale(${w0! / w1!}, ${h0! / h1!})`;
    effect.setKeyframes([{ transform: start }, { transform: String(to.transform) }]);
  }
}
