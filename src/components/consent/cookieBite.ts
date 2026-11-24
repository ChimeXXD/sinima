import { critical, spring, step, type Spring } from "@/components/ui/spring";

// Cookie bite's motion (Design Bookmark's cookie.js, D-191), on its own springs, "stiffness damping":
// pop 520/16, settle 280/22, soft 260/24, fade 420/32. Sure eats the cookie in three bites, each a
// cut in its mask that springs open, with a wobble and crumbs that fall with weight; No thanks flicks
// it off the card. Then the card's width, height and corners spring down to a one-line note with a
// tick that draws itself, and the note goes. Reduced motion: every spring critically damped, no crumbs.
// The fold springs the card's width and height, as the reference does (a scale would squash its
// words and corners); the last bite shrinks the cookie to a fifth while it fades, never to scale 0.
// The loop sleeps whenever nothing moves, so a banner left waiting costs no frames.

const POP = [520, 16] as const;
const SETTLE = [280, 22] as const;
const SOFT = [260, 24] as const;
const FADE = [420, 32] as const;
const NOTE_H = 48;
const SVG = "http://www.w3.org/2000/svg";

export type CookieParts = { card: HTMLElement; body: HTMLElement; cookie: SVGSVGElement; bites: SVGGElement; crumbs: HTMLElement; sure: HTMLElement; no: HTMLElement; note: HTMLElement; tick: SVGPathElement };

export function cookieBite(p: CookieParts, opts: { reduce: boolean; width: () => number; onFold: () => void; onGone: () => void }) {
  const springs: Spring[] = [];
  const s = (x: number, [k, c]: readonly [number, number]) => {
    const made = spring(x, k, c);
    if (opts.reduce) critical(made);
    springs.push(made);
    return made;
  };
  const tune = (sp: Spring, [k, c]: readonly [number, number]) => {
    sp.k = k;
    sp.c = opts.reduce ? 2 * Math.sqrt(k) : c;
  };
  // Three bites, each a round cut on the rim with three teeth marks on its inner edge.
  const bites = [-42, 28, 196].map((deg) => {
    const r = (deg * Math.PI) / 180;
    const cx = 32 + Math.cos(r) * 30;
    const cy = 32 + Math.sin(r) * 30;
    const parts: [number, number, number][] = [[cx, cy, 13]];
    for (const t of [-52, 0, 52]) {
      const q = r + Math.PI + (t * Math.PI) / 180;
      parts.push([cx + Math.cos(q) * 11.5, cy + Math.sin(q) * 11.5, 5.2]);
    }
    const els = parts.map(() => p.bites.appendChild(document.createElementNS(SVG, "circle")));
    return { parts, els, s: s(0, [700, 22]), x: cx, y: cy };
  });
  const crumbs = Array.from({ length: 18 }, () => ({ el: p.crumbs.appendChild(document.createElement("i")), life: 0, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0 }));
  let ci = 0;

  const M = s(0, SOFT); // 0 the card, 1 the note
  const WW = s(0, SOFT);
  const HH = s(0, [230, 22]);
  const CS = s(0.4, POP); // the cookie's scale: it pops onto the plate as the card arrives
  const CR = s(0, [190, 9]); // its wobble
  const CY = s(-46, SETTLE); // dropping onto the plate
  const PY = s(1, POP);
  const PN = s(1, POP);
  const TK = s(0, [160, 20]); // the tick drawing itself
  const GO = s(1, FADE); // 1 away (below and clear), 0 here
  CS.t = 1;
  CY.t = 0;
  GO.t = 0;
  if (opts.reduce) CY.x = 0; // fades in, no drop

  let W0 = 0;
  let H0 = 0;
  let busy = false;
  let eaten = false;
  let flick: { x: number; y: number; vx: number; vy: number } | null = null;
  const timers: { t: number; fn: () => void }[] = [];
  const after = (sec: number, fn: () => void) => timers.push({ t: sec, fn });

  function measure() {
    wake();
    W0 = opts.width();
    p.body.style.width = `${W0}px`;
    H0 = p.body.offsetHeight;
    WW.t = M.t ? p.note.offsetWidth : W0;
    HH.t = M.t ? NOTE_H : H0;
    if (!WW.x) {
      WW.x = WW.t;
      HH.x = HH.t;
    }
  }
  function spray(x: number, y: number, n: number, power: number) {
    if (opts.reduce) return;
    for (let i = 0; i < n; i++) {
      const c = crumbs[ci++ % crumbs.length]!;
      const a = Math.random() * Math.PI * 2;
      c.life = 0.75 + Math.random() * 0.35;
      c.x = x - 32;
      c.y = y - 32;
      c.vx = Math.cos(a) * power * (0.4 + Math.random());
      c.vy = -Math.abs(Math.sin(a)) * power * (0.6 + Math.random()) - 40;
      c.r = 0;
      c.vr = (Math.random() - 0.5) * 900;
    }
  }
  function bite(i: number) {
    const b = bites[i]!;
    b.s.t = 1;
    CR.v += (i % 2 ? -1 : 1) * 520;
    CS.x = 0.86;
    spray(b.x, b.y, 5, 150);
  }
  function fold() {
    opts.onFold();
    M.t = 1;
    WW.t = p.note.offsetWidth;
    HH.t = NOTE_H;
    TK.x = TK.t = 0;
    after(0.28, () => (TK.t = 1));
    after(2.4, () => (GO.t = 1));
    after(3.2, opts.onGone);
  }

  let raf = 0;
  let last = performance.now();
  const still = () =>
    timers.length === 0 && flick === null && crumbs.every((c) => c.life <= 0) && springs.every((sp) => Math.abs(sp.x - sp.t) < 1e-3 && Math.abs(sp.v) < 1e-3);
  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    for (let i = timers.length - 1; i >= 0; i--) if ((timers[i]!.t -= dt) <= 0) timers.splice(i, 1)[0]!.fn();
    for (let k = 0; k < 4; k++) {
      const d = dt / 4;
      springs.forEach((sp) => step(sp, d));
      if (flick) {
        flick.vx -= 620 * d;
        flick.x += flick.vx * d;
        if (flick.x < -46) {
          flick.vy += 1500 * d;
          flick.y += flick.vy * d;
        }
      }
      for (const c of crumbs) {
        if (c.life <= 0) continue;
        c.life -= d;
        c.vy += 900 * d;
        c.x += c.vx * d;
        c.y += c.vy * d;
        c.r += c.vr * d;
      }
    }
    render();
    raf = still() ? 0 : requestAnimationFrame(frame);
  }
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  function render() {
    const m = clamp(M.x, 0, 1);
    const g = clamp(GO.x, 0, 1);
    const { card, body, note, tick, cookie } = p;
    card.style.width = `${WW.x.toFixed(1)}px`;
    card.style.height = `${HH.x.toFixed(1)}px`;
    card.style.transform = `translate(${(-WW.x / 2).toFixed(1)}px, ${(g * 8).toFixed(2)}px)`;
    card.style.opacity = (1 - g).toFixed(3);
    card.style.borderRadius = `${Math.min(24, HH.x / 2).toFixed(1)}px`;
    card.style.overflow = M.t || m > 0.01 ? "hidden" : "visible"; // open, the cookie and its crumbs may leave the card
    body.style.opacity = clamp(1 - m * 2.2, 0, 1).toFixed(3);
    body.style.transform = `translateX(${((WW.x - W0) / 2).toFixed(1)}px)`;
    const d = clamp(m * 2.2 - 1.2, 0, 1);
    note.style.opacity = d.toFixed(3);
    note.style.transform = `translate(-50%, -50%) translateY(${((1 - d) * 8).toFixed(2)}px)`;
    tick.style.strokeDashoffset = (1 - clamp(TK.x, 0, 1)).toFixed(4);
    for (const b of bites) {
      const r = Math.max(0, b.s.x);
      b.parts.forEach(([x, y, size], i) => {
        b.els[i]!.setAttribute("cx", x.toFixed(2));
        b.els[i]!.setAttribute("cy", y.toFixed(2));
        b.els[i]!.setAttribute("r", (size * r).toFixed(2));
      });
    }
    const fx = flick ? flick.x : 0;
    const fy = flick ? flick.y : 0;
    cookie.style.transform = `translate(${fx.toFixed(1)}px, ${(fy + CY.x).toFixed(1)}px) rotate(${(CR.x * 0.012 + fx / 28).toFixed(4)}rad) scale(${Math.max(0.2, CS.x).toFixed(4)})`;
    cookie.style.opacity = eaten ? clamp((CS.x - 0.2) / 0.5, 0, 1).toFixed(3) : "1";
    for (const c of crumbs) {
      const o = c.life <= 0 ? 0 : Math.min(1, c.life * 3);
      c.el.style.opacity = o.toFixed(2);
      if (o) c.el.style.transform = `translate(${(32 + c.x).toFixed(1)}px, ${(32 + c.y).toFixed(1)}px) rotate(${c.r.toFixed(0)}deg)`;
    }
    p.sure.style.transform = `scale(${PY.x.toFixed(4)})`;
    p.no.style.transform = `scale(${PN.x.toFixed(4)})`;
  }

  measure();
  render();
  addEventListener("resize", measure);
  void document.fonts?.ready.then(measure);

  return {
    accept() {
      if (busy) return;
      busy = true;
      PY.x = 0.92;
      wake();
      [0, 1, 2].forEach((i) => after(0.1 + i * 0.27, () => bite(i)));
      after(0.1 + 3 * 0.27, () => {
        tune(CS, [600, 34]);
        eaten = true;
        CS.t = 0.2;
        spray(32, 32, 6, 110);
      });
      after(1.2, fold);
    },
    decline() {
      if (busy) return;
      busy = true;
      PN.x = 0.92;
      flick = { x: 0, y: 0, vx: -60, vy: 0 }; // rolls off the left edge of the card, then drops
      wake();
      after(0.8, fold);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      removeEventListener("resize", measure);
    },
  };
}
