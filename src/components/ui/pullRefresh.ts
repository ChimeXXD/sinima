import { critical, spring, step, type Spring } from "./spring";
import s from "./pullRefresh.module.css";

// Pull to refresh (D-161), Design Bookmark's "Pull to refresh" (designbookmark.com/motion#db-pull-
// refresh) in Sinima's colours. Only in the app added to the Home Screen, where the browser has none:
// AppFrame loads this file there and nowhere else (the page budget, D-21). Dragging the page down
// from the top meets rubber resistance; a drop stretches out of a handle (the goo filter keeps them
// fused); past 88 px it pops, and on release it becomes the spinner while the page's data is read
// again; then the page springs home. The springs are the reference's, "stiffness damping".

const THRESHOLD = 88; // px of pull that refreshes
const HOLD = 64; // px the page waits at while the spinner turns
const HOLD_MS = 1300; // the spinner turns at least this long
const REST_Y = 5;
const REST_S = 0.25;
const SLOP = 8; // px before a touch counts as a pull, or as a sideways swipe

/** Half speed at first so the threshold is easy to reach, then real resistance (the reference's). */
const rubber = (d: number) => {
  const pull = Math.max(0, d);
  return pull <= 180 ? pull * 0.55 : 99 + 60 * (1 - 1 / (((pull - 180) * 0.55) / 60 + 1));
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const still = (sp: Spring) => Math.abs(sp.x - sp.t) < 0.05 && Math.abs(sp.v) < 0.05;

export type PullParts = {
  /** What moves: the page's content and footer. The bar above them stays, as the reference's header. */
  moves: HTMLElement[];
  /** The drop is drawn just above the first of `moves`. */
  refresh: () => Promise<void>;
  /** Said aloud as the refresh starts and ends. */
  words: { checking: string; done: string };
};

/** Attaches the gesture; returns the function that takes it off again. */
export function attachPullRefresh({ moves, refresh, words }: PullParts): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tune = (sp: Spring, k: number, c: number) => {
    sp.k = k;
    sp.c = c;
    if (reduce) critical(sp);
  };
  const P = spring(0, 260, 18); // the page's offset
  const D = spring(REST_Y, 380, 20); // the drop's centre
  const DS = spring(REST_S, 420, 18); // the drop's scale
  const SP = spring(0, 400, 26); // the spinner
  [P, D, DS, SP].forEach((sp) => tune(sp, sp.k, sp.c));

  // The drop, the handle and the spinner, in a layer just above the content.
  const anchor = moves[0]!;
  const layer = document.createElement("div");
  layer.className = s.layer!;
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `<svg class="${s.defs}" width="0" height="0"><filter id="sinima-goo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></svg><div class="${s.goo}"><div class="${s.handle}"></div><div class="${s.drop}"></div></div><div class="${s.spin}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 4a8 8 0 0 1 8 8"/></svg></div>`;
  const live = document.createElement("p");
  live.className = s.live!;
  live.setAttribute("role", "status");
  anchor.before(layer, live);
  const drop = layer.querySelector<HTMLElement>(`.${s.drop}`)!;
  const spin = layer.querySelector<HTMLElement>(`.${s.spin}`)!;

  let mode: "idle" | "pulling" | "loading" | "settling" = "idle";
  let touch: { id: number; x0: number; y0: number; decided: boolean } | null = null;
  let frame = 0;
  let last = 0;

  function render() {
    const y = P.x < 0.5 ? null : `0 ${P.x.toFixed(2)}px`;
    for (const el of moves) el.style.translate = y ?? "";
    // At rest the layer isn't drawn at all, so the spinner's turn and the goo filter cost nothing.
    layer.style.display = P.x < 0.5 && SP.x < 0.01 ? "" : "block";
    // The drop stretches up and down while it is pulled fast.
    const st = 1 + clamp(Math.abs(D.v) / 1600, 0, 0.35);
    drop.style.transform = `translateY(${D.x - 16}px) scale(${DS.x / st},${DS.x * st})`;
    // While it spins, a clean circle sits on top and the goo drop fades out under it.
    spin.style.transform = `translateY(${D.x - 16}px) scale(${0.6 + 0.4 * SP.x})`;
    drop.style.opacity = (1 - clamp(SP.x, 0, 1)).toFixed(3);
    spin.style.opacity = clamp(SP.x, 0, 1).toFixed(3);
  }

  function tick(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const p = clamp(P.x / THRESHOLD, 0, 1);
    if (mode === "pulling") {
      D.t = Math.max(REST_Y, P.x * 0.5);
      DS.t = REST_S + (1 - REST_S) * p;
      SP.t = 0;
    } else if (mode === "loading") {
      D.t = HOLD / 2;
      DS.t = 1;
      SP.t = 1;
    } else {
      D.t = REST_Y;
      DS.t = REST_S;
      SP.t = 0;
    }
    for (let k = 0; k < 4; k++) [P, D, DS, SP].forEach((sp) => step(sp, dt / 4));
    render();
    // Asleep when nothing moves and no finger is down: no frames spent on a page at rest.
    if (mode === "idle" && [P, D, DS, SP].every(still)) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  const wake = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  /**
   * On something that takes the drag itself (the light switch's cord: touch-action none), or in a
   * box of its own that is scrolled down: the finger is that thing's, not the page's.
   */
  const ownsDrag = (target: EventTarget | null) => {
    for (let el = target instanceof Element ? target : null; el && el !== document.documentElement; el = el.parentElement) {
      if (el.scrollTop > 0 || getComputedStyle(el).touchAction === "none") return true;
    }
    return false;
  };
  /** A finger that may pull: at the very top, not in an open sheet, search or menu. */
  const mayPull = (target: EventTarget | null) =>
    mode === "idle" && window.scrollY <= 0 && !(target instanceof Element && target.closest('dialog, [role="dialog"], [role="search"], [role="listbox"]')) && !ownsDrag(target);

  /** The finger is off: past the threshold a lift refreshes; a cancel (a system gesture) only goes home. */
  function letGo(mayRefresh: boolean) {
    const pulled = touch?.decided;
    touch = null;
    if (!pulled) return;
    tune(P, 260, 18);
    if (mayRefresh && P.t >= THRESHOLD) void run();
    else {
      mode = "idle";
      P.t = 0;
      wake();
    }
  }

  function onStart(event: TouchEvent) {
    if (event.touches.length !== 1) return;
    // One finger down, and it is this new one: a touch still held here lost its end (iOS can drop it).
    if (touch) letGo(false);
    if (!mayPull(event.target)) return;
    const t = event.touches[0]!;
    touch = { id: t.identifier, x0: t.clientX, y0: t.clientY, decided: false };
  }
  function onMove(event: TouchEvent) {
    if (!touch) return;
    const t = [...event.changedTouches].find((one) => one.identifier === touch!.id);
    if (!t) return;
    const dx = t.clientX - touch.x0;
    const dy = t.clientY - touch.y0;
    if (!touch.decided) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      // Sideways (the day tiles, a row of posters) or up (a scroll): not a pull.
      if (Math.abs(dx) > Math.abs(dy) || dy < 0 || window.scrollY > 0) {
        touch = null;
        return;
      }
      touch.decided = true;
      touch.y0 = t.clientY;
      mode = "pulling";
      tune(P, 900, 50);
      wake();
    }
    // The page under the finger, not the browser's own bounce (once the browser has taken the
    // scroll the move can't be cancelled, and trying only warns).
    if (event.cancelable) event.preventDefault();
    const was = P.t >= THRESHOLD;
    P.t = rubber(t.clientY - touch.y0);
    if (P.t >= THRESHOLD && !was) DS.v += 4; // the drop pops as it passes the threshold
  }
  function onEnd(event: TouchEvent) {
    if (!touch || ![...event.changedTouches].some((one) => one.identifier === touch!.id)) return;
    letGo(event.type === "touchend");
  }

  async function run() {
    mode = "loading";
    P.t = HOLD;
    live.textContent = words.checking;
    wake();
    const started = performance.now();
    try {
      await refresh();
    } catch {
      // Offline or a failed read: the page keeps what it had, and says when it was read (rule 2).
    }
    const wait = HOLD_MS - (performance.now() - started);
    if (wait > 0) await new Promise((done) => setTimeout(done, wait));
    mode = "settling";
    P.t = 0;
    live.textContent = words.done;
    wake();
    setTimeout(() => {
      if (mode === "settling") mode = "idle";
      wake();
    }, 600);
  }

  // Not passive: a pull holds the page still instead of letting it bounce.
  document.addEventListener("touchstart", onStart, { passive: true });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("touchcancel", onEnd);
  document.documentElement.classList.add(s.pullable!);
  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener("touchstart", onStart);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onEnd);
    document.removeEventListener("touchcancel", onEnd);
    document.documentElement.classList.remove(s.pullable!);
    for (const el of moves) el.style.translate = "";
    layer.remove();
    live.remove();
  };
}
