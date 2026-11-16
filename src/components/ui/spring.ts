// A spring, "stiffness damping", stepped by hand (Design Bookmark's motion.js and cord.js): the nav
// (navSprings.ts) and the pull cord (pullCordPhysics.ts) both run on it.

export type Spring = { x: number; v: number; t: number; k: number; c: number };
/** At rest at `x`, aimed at `x`. */
export const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
/** One step of `dt` seconds toward the target. */
export const step = (s: Spring, dt: number): void => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};
/** Reduced motion: the same move, critically damped (no overshoot). */
export const critical = (s: Spring): void => {
  s.c = 2 * Math.sqrt(s.k);
};
