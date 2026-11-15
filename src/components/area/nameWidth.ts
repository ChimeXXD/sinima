// How wide an area's name sets in Urbanist Light, in thousandths of the font size: each letter's
// advance width, measured in the browser from public/fonts/urbanist-sinima.woff2 (15 Nov 2026).
// Kerning is left out, so it runs about 1.5% wide. Unknown characters count as a wide letter.

const ADVANCE: Record<string, number> = {
  a: 576, b: 596, c: 510, d: 596, e: 559, f: 324, g: 580, h: 529, i: 174, j: 214, k: 478, l: 174, m: 889,
  n: 529, o: 560, p: 596, q: 596, r: 349, s: 428, t: 341, u: 509, v: 493, w: 801, x: 513, y: 499, z: 507,
  A: 661, B: 549, C: 709, D: 672, E: 532, F: 478, G: 768, H: 620, I: 204, J: 389, K: 517, L: 495, M: 869,
  N: 625, O: 770, P: 514, Q: 774, R: 543, S: 606, T: 630, U: 658, V: 608, W: 817, X: 640, Y: 583, Z: 646,
  " ": 240, "-": 440, "'": 120, "’": 135, ".": 166,
};

export const nameWidth = (name: string) => [...name].reduce((sum, char) => sum + (ADVANCE[char] ?? 700), 0);
