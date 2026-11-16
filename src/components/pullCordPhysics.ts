// R10 (D-106 i, D-107): the pull cord's physics, loaded once the page is idle or the cord is first
// pressed (PullCord draws it at rest until then), so a page doesn't carry it from the start (the
// page budget, D-104). A port of Design Bookmark's cord.js, made small: see PullCord.tsx.

import { critical, spring, step, type Spring } from "./ui/spring";

const N = 5; // links in the cord
const SEG = 5; // px per link
const L = N * SEG;
const CLICK = 8; // stretch past the cord's length that flips the switch
const MAXS = 18; // the most it gives
const SHADE = 11;
const AX = 6; // where the cord leaves the shade, from its middle
const AY = SHADE - 2;


/** Brings the drawn cord to life. Returns `pull` (a tap's pull) and `detach`. */
export function attachCord(root: HTMLElement, button: HTMLButtonElement, flip: { current: (bulb: { x: number; y: number }) => void }): { pull: () => void; detach: () => void } {
  const svg = root.querySelector("svg")!;
  const lamp = svg.querySelector<SVGGElement>("[data-lamp]")!;
  const bulb = svg.querySelector<SVGCircleElement>("[data-bulb]")!;
  const cord = svg.querySelector<SVGPathElement>("[data-cord]")!;
  const wire = svg.querySelector<SVGPathElement>("[data-wire]")!;
  const bead = svg.querySelector<SVGRectElement>("[data-bead]")!;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tune = (sp: Spring) => reduce && critical(sp);

  // The wire runs from the top edge of the header down to the lamp; everything is drawn from the
  // middle of the 44 px cell.
  const header = root.closest("header") ?? root.parentElement!;
  const W = 44;
  const WIRE = Math.max(4, root.getBoundingClientRect().top - header.getBoundingClientRect().top);
  svg.style.top = `${-WIRE}px`;
  svg.setAttribute("height", String(WIRE + 80));

  const TH = spring(0, 46, 3); // the lamp's angle on its wire
  const TUG = spring(0, 300, 13); // the lamp pulled down
  const BP = spring(1, 420, 13); // the bulb's pop
  const K = spring(1, 300, 17); // how far the cord is stretched: it eases back, so letting go bounces
  const HX = spring(0, 210, 22);
  const HY = spring(0, 210, 22); // the hand that pulls on a tap
  [TH, TUG, BP, K, HX, HY].forEach(tune);

  const anchor = (): [number, number] => {
    const c = Math.cos(TH.x);
    const sn = Math.sin(TH.x);
    const y = WIRE + TUG.x + AY;
    return [W / 2 + AX * c - y * sn, AX * sn + y * c];
  };
  const pts = Array.from({ length: N + 1 }, (_, i) => ({ x: anchor()[0], y: anchor()[1] + i * SEG, vx: 0, vy: 0 }));
  let held: { id: number; x: number; y: number; ox: number; oy: number; moved: number; sx: number; sy: number; flipped: boolean } | null = null;
  let ghost = false;
  let armed = true;
  let side = 1;
  let frame = 0;
  let last = 0;
  let ghostEnd = 0;

  const page = (x: number, y: number) => {
    const r = svg.getBoundingClientRect();
    return { x: r.left + x, y: r.top + y };
  };
  const turn = () => {
    BP.x = 0.75;
    BP.v = 0;
    TUG.v += 150;
    const c = Math.cos(TH.x);
    const sn = Math.sin(TH.x);
    const y = WIRE + TUG.x + SHADE + 2;
    flip.current(page(W / 2 - y * sn, y * c));
  };
  const pull = () => {
    if (ghost || held) return;
    const b = pts[N]!;
    ghost = true;
    armed = true;
    side = -side;
    Object.assign(HX, { x: b.x, v: b.vx });
    Object.assign(HY, { x: b.y, v: b.vy });
    const [ax, ay] = anchor();
    HX.t = ax + side * 6;
    HY.t = ay + L + 24;
    ghostEnd = performance.now() + 700; // let go even if it never clicked
    run();
  };

  const draw = () => {
    const th = TH.x;
    const b = pts[N]!;
    const e = pts[N - 1]!;
    let d = `M${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
    for (let i = 1; i < N; i++) d += `Q${pts[i]!.x.toFixed(1)} ${pts[i]!.y.toFixed(1)} ${((pts[i]!.x + pts[i + 1]!.x) / 2).toFixed(1)} ${((pts[i]!.y + pts[i + 1]!.y) / 2).toFixed(1)}`;
    d += `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    cord.setAttribute("d", d);
    const wl = WIRE + TUG.x;
    wire.setAttribute("d", `M${W / 2} 0L${(W / 2 - Math.sin(th) * wl).toFixed(2)} ${(Math.cos(th) * wl).toFixed(2)}`);
    lamp.setAttribute("transform", `rotate(${((th * 180) / Math.PI).toFixed(3)} ${W / 2} 0) translate(0 ${(WIRE + TUG.x).toFixed(2)})`);
    bulb.setAttribute("transform", `translate(${W / 2} ${SHADE}) scale(${BP.x.toFixed(4)})`);
    const ang = (Math.atan2(e.x - b.x, b.y - e.y) * 180) / Math.PI;
    bead.setAttribute("transform", `translate(${b.x.toFixed(2)} ${b.y.toFixed(2)}) rotate(${ang.toFixed(2)})`);
    button.style.transform = `translate(${(b.x - W / 2).toFixed(2)}px, ${(b.y - WIRE - 26).toFixed(2)}px)`;
  };

  const frameStep = (dt: number) => {
    [TH, TUG, BP, K, HX, HY].forEach((sp) => step(sp, dt));
    if (ghost && performance.now() > ghostEnd) ghost = false;
    const [ax, ay] = anchor();
    const p = held ? [held.x, held.y] : ghost ? [HX.x, HY.x] : null;
    const b = pts[N]!;
    let px = 0;
    let py = 0;
    let stretch = 0;
    let lean = 0;
    if (p) {
      const dx = p[0]! - ax;
      const dy = p[1]! - ay;
      const dist = Math.hypot(dx, dy) || 1;
      const over = Math.max(0, dist - L);
      const give = MAXS * (1 - Math.exp(-over / 30));
      const r = Math.min(dist, L) + give;
      px = ax + (dx / dist) * r;
      py = ay + (dy / dist) * r;
      stretch = give;
      lean = over > 0 ? dx / dist : 0;
      if (over > 0) Object.assign(K, { x: r / L, t: r / L, v: 0 });
      if (armed && give > CLICK) {
        armed = false;
        turn();
        if (held) held.flipped = true;
        else ghost = false;
      }
    }
    if (!p || !stretch) K.t = 1;
    const seg = SEG * Math.max(1, K.x);
    TUG.t = stretch * 0.22;
    TH.t = Math.min(0.3, Math.max(-0.3, ((-lean * stretch) / MAXS) * 0.5));
    // The rope: gravity, then links pulled back to length a few times.
    const prev = pts.map((q) => [q.x, q.y] as const);
    for (let i = 1; i <= N; i++) {
      const q = pts[i]!;
      const k = Math.exp(-(i === N ? 1.1 : 2.4) * dt);
      q.vy += 2600 * dt;
      q.vx *= k;
      q.vy *= k;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    for (let it = 0; it < 8; it++) {
      Object.assign(pts[0]!, { x: ax, y: ay });
      if (p) Object.assign(b, { x: px, y: py });
      for (let i = 0; i < N; i++) {
        const a = pts[i]!;
        const c = pts[i + 1]!;
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const dist = Math.hypot(dx, dy) || 1e-6;
        const f = ((dist - seg) / dist) * 0.5;
        const wa = i === 0 ? 0 : 1;
        const wc = i + 1 === N ? (p ? 0 : 0.3) : 1; // the bead is heavy
        const sum = wa + wc || 1;
        a.x += ((dx * f * wa) / sum) * 2;
        a.y += ((dy * f * wa) / sum) * 2;
        c.x -= ((dx * f * wc) / sum) * 2;
        c.y -= ((dy * f * wc) / sum) * 2;
      }
    }
    Object.assign(pts[0]!, { x: ax, y: ay });
    if (p) Object.assign(b, { x: px, y: py });
    for (let i = 1; i <= N; i++) {
      pts[i]!.vx = (pts[i]!.x - prev[i]![0]) / dt;
      pts[i]!.vy = (pts[i]!.y - prev[i]![1]) / dt;
    }
  };

  const settled = () => !held && !ghost && [TH, TUG, BP, K].every((sp) => Math.abs(sp.x - sp.t) < 0.002 && Math.abs(sp.v) < 0.01) && pts.every((q) => Math.hypot(q.vx, q.vy) < 1);
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (dt > 0) for (let i = 0; i < 4; i++) frameStep(dt / 4);
    draw();
    frame = settled() ? 0 : requestAnimationFrame(loop);
  };
  function run() {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  }

  const local = (event: PointerEvent) => {
    const r = svg.getBoundingClientRect();
    return [event.clientX - r.left, event.clientY - r.top] as const;
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return; // a right or middle click isn't a pull
    const [x, y] = local(event);
    const b = pts[N]!;
    held = { id: event.pointerId, x: b.x, y: b.y, ox: b.x - x, oy: b.y - y, moved: 0, sx: x, sy: y, flipped: false };
    ghost = false;
    armed = true;
    button.setPointerCapture(event.pointerId);
    button.dataset.held = "";
    run();
  };
  const move = (event: PointerEvent) => {
    if (!held || event.pointerId !== held.id) return;
    const [x, y] = local(event);
    held.x = x + held.ox;
    held.y = y + held.oy;
    held.moved = Math.max(held.moved, Math.hypot(x - held.sx, y - held.sy));
  };
  const up = (event: PointerEvent) => {
    if (!held || event.pointerId !== held.id) return;
    const tap = held.moved < 5 && !held.flipped && event.type === "pointerup";
    held = null;
    delete button.dataset.held;
    if (tap) pull();
    run();
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointermove", move);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  // Settle into place before the first paint, then let it hang.
  for (let i = 0; i < 60; i++) frameStep(1 / 60);
  draw();
  button.dataset.ready = ""; // alive: dragging works from here
  return {
    pull,
    detach: () => {
      cancelAnimationFrame(frame);
      button.removeEventListener("pointerdown", down);
      button.removeEventListener("pointermove", move);
      button.removeEventListener("pointerup", up);
      button.removeEventListener("pointercancel", up);
    },
  };
}
