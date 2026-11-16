/* Live demos for the motion pick page. Each demo builds its stage and returns reset(play).
   `mode()` is "now" (the built site) or "new" (the proposal). Uses EASE, K, RM, anim, heart from index.html. */
const DEMOS = {};
const later = (list, fn, ms) => list.push(setTimeout(fn, ms));
const clear = (list) => { list.forEach(clearTimeout); list.length = 0; };
const stop = (root) => root.getAnimations({ subtree: true }).forEach((a) => a.cancel());

/* 1. Swipe the sheet down */
DEMOS.sheet = (stage, mode) => {
  const films = [["A Land Apart", "Filmhouse Lekki", "18:40", "p1"], ["Clayface", "Genesis Lekki", "19:15", "p2"], ["First Lady", "EbonyLife Place", "19:50", "p3"], ["Banished Scroll", "Filmhouse IMAX", "20:30", "p4"]];
  stage.innerHTML = `<div class="m-top">Starting soon in Lekki</div><div class="m-sub">Tap a time</div>
    ${films.map(([t, c, at, p]) => `<div class="m-row"><div class="m-post ${p}"></div><div><b>${t}</b><small>${c}</small></div><button class="m-time" data-t="${t}" data-c="${c}" data-at="${at}">${at}</button></div>`).join("")}
    <div class="scrim"></div>
    <div class="sheet" role="dialog" aria-label="Showing"><div class="grab"></div><button class="x" aria-label="Close">✕</button>
      <h5></h5><div class="meta"></div>
      <div class="opt"><i></i>Add to calendar</div><div class="opt"><i></i>Keep a countdown</div><div class="opt"><i></i>Share this showing</div>
      <button class="book">Book on the cinema's site</button></div>`;
  const sheet = stage.querySelector(".sheet"), scrim = stage.querySelector(".scrim");
  const H = () => sheet.offsetHeight + 8;
  const yNow = () => new DOMMatrix(getComputedStyle(sheet).transform).m42;
  let moving = [], loop = 0, open = false;
  const paintScrim = () => { scrim.style.opacity = String(0.4 * Math.max(0, Math.min(1, 1 - yNow() / H())) * Number(getComputedStyle(sheet).opacity)); };
  const tick = () => { paintScrim(); loop = requestAnimationFrame(tick); };
  const halt = () => { const y = yNow(); moving.forEach((a) => a.cancel()); moving = []; sheet.style.transform = `translateY(${y}px)`; return y; };
  function moveTo(to, ms, ease, done) {
    const from = halt();
    sheet.style.transform = `translateY(${to}px)`;
    const a = sheet.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }], { duration: ms * K(), easing: EASE[ease] });
    moving = [a];
    cancelAnimationFrame(loop); tick();
    a.onfinish = () => { cancelAnimationFrame(loop); paintScrim(); done?.(); };
  }
  function show(row) {
    sheet.querySelector("h5").textContent = row.dataset.t;
    sheet.querySelector(".meta").textContent = `${row.dataset.at} · ${row.dataset.c} · Today`;
    open = true; scrim.style.pointerEvents = "auto"; sheet.style.opacity = "1";
    if (RM()) { halt(); sheet.style.transform = "translateY(0px)"; const a = sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 * K(), easing: EASE.out }); cancelAnimationFrame(loop); tick(); a.onfinish = () => { cancelAnimationFrame(loop); paintScrim(); }; return; }
    moveTo(0, 450, "drawer");
  }
  function hide(fromDrag) {
    open = false; scrim.style.pointerEvents = "none";
    if (RM()) { const a = sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 * K(), easing: EASE.out, fill: "forwards" }); cancelAnimationFrame(loop); tick(); a.onfinish = () => { a.cancel(); halt(); sheet.style.transform = `translateY(${H()}px)`; cancelAnimationFrame(loop); paintScrim(); }; return; }
    moveTo(H(), fromDrag ? 300 : 220, fromDrag ? "drawer" : "out");
  }
  stage.querySelectorAll(".m-time").forEach((b) => (b.onclick = () => show(b)));
  sheet.querySelector(".x").onclick = () => hide(false);
  scrim.onclick = () => hide(false);
  // Drag: only in the proposal. Tracks the finger 1:1; upward is rubber-banded.
  let drag = null;
  sheet.addEventListener("pointerdown", (e) => {
    if (mode() !== "new" || !open || e.target.closest("button")) return;
    const y = halt(); sheet.setPointerCapture(e.pointerId);
    drag = { start: e.clientY - Math.max(0, y), samples: [{ y, t: e.timeStamp }] };
    cancelAnimationFrame(loop); sheet.style.cursor = "grabbing";
  });
  sheet.addEventListener("pointermove", (e) => {
    if (!drag) return;
    let dy = e.clientY - drag.start;
    if (dy < 0) dy = -Math.sqrt(-dy) * 2.5;
    sheet.style.transform = `translateY(${dy}px)`; paintScrim();
    drag.samples.push({ y: dy, t: e.timeStamp }); if (drag.samples.length > 6) drag.samples.shift();
  });
  const release = () => {
    if (!drag) return;
    const s = drag.samples, last = s[s.length - 1], first = s[0];
    const v = (last.y - first.y) / Math.max(1, last.t - first.t);
    drag = null; sheet.style.cursor = "";
    if (last.y > H() * 0.25 || v > 0.11) hide(true); else moveTo(0, 220, "out");
  };
  sheet.addEventListener("pointerup", release);
  sheet.addEventListener("pointercancel", release);
  const reset = (play) => {
    halt(); cancelAnimationFrame(loop); open = false; drag = null;
    sheet.style.opacity = "1"; sheet.style.transform = `translateY(${H()}px)`; scrim.style.opacity = "0"; scrim.style.pointerEvents = "none";
    if (play) setTimeout(() => show(stage.querySelector(".m-time")), 150);
  };
  reset(false);
  return { reset };
};

/* 2. Today ↔ Tomorrow */
DEMOS.day = (stage, mode) => {
  const days = [
    [["A Land Apart", "Filmhouse Lekki", "18:40", "p1"], ["Clayface", "Genesis Lekki", "19:15", "p2"], ["First Lady", "EbonyLife Place", "19:50", "p3"], ["Banished Scroll", "Filmhouse IMAX", "20:30", "p4"], ["Forgotten Island", "Genesis Lekki", "21:10", "p5"]],
    [["Arnie & Barney", "Filmhouse Lekki", "12:20", "p6"], ["A Land Apart", "EbonyLife Place", "13:05", "p1"], ["Clayface", "Filmhouse IMAX", "14:40", "p2"], ["Alahun (The Weaver)", "Genesis Lekki", "16:00", "p5"], ["First Lady", "Filmhouse Lekki", "17:30", "p3"]],
  ];
  stage.innerHTML = `<div class="m-top">Films in Lagos</div>
    <div class="dseg" role="radiogroup" aria-label="Day" data-i="0"><span class="thumb"></span><button role="radio" aria-checked="true">Today</button><button role="radio" aria-checked="false">Tomorrow</button></div>
    <div class="dlist"></div>`;
  const seg = stage.querySelector(".dseg"), list = stage.querySelector(".dlist"), btns = [...seg.querySelectorAll("button")];
  let day = 0;
  const render = () => { list.innerHTML = days[day].map(([t, c, at, p]) => `<div class="m-row"><div class="m-post ${p}"></div><div><b>${t}</b><small>${c}</small></div><span class="m-time">${at}</span></div>`).join(""); };
  function set(i, viaKeys) {
    if (i === day) return;
    const dir = i > day ? 1 : -1; day = i;
    seg.dataset.i = i; btns.forEach((b, j) => b.setAttribute("aria-checked", j === i));
    seg.querySelector(".thumb").style.transition = viaKeys ? "none" : "";
    render(); stop(list);
    if (mode() !== "new" || viaKeys) return;
    if (RM()) anim(list, [{ opacity: 0 }, { opacity: 1 }], 160);
    else anim(list, [{ opacity: 0, transform: `translateX(${dir * 8}px)` }, { opacity: 1, transform: "none" }], 200);
  }
  btns.forEach((b, i) => (b.onclick = () => set(i, false)));
  seg.addEventListener("keydown", (e) => { const s = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!s) return; e.preventDefault(); const n = (day + s + 2) % 2; set(n, true); btns[n].focus(); });
  const reset = (play) => { day = 1; set(0, true); if (play) setTimeout(() => set(1, false), 300); };
  render();
  return { reset };
};

/* 3. Where are you watching? */
DEMOS.where = (stage, mode) => {
  stage.innerHTML = `<div class="w-stage"><span class="stk a"></span><span class="stk b"></span><span class="stk c"></span><span class="stk d"></span>
    <div class="w-title">Where are you watching?</div>
    <div class="w-lead">Showtimes for every cinema in Lagos and Abuja, in one place.</div>
    <div class="w-cards"><button class="w-card" data-c="Lagos" aria-pressed="false"><b>Lagos</b><small>Lekki, Victoria Island, Ikeja, Surulere, Yaba and 7 more areas</small><span class="w-check">✓</span></button>
    <button class="w-card" data-c="Abuja" aria-pressed="false"><b>Abuja</b><small>Wuse, Maitama, Jabi, Garki, Central Area and more</small><span class="w-check">✓</span></button></div>
    <div class="w-note"></div><button class="w-go">Continue</button></div>`;
  const cards = [...stage.querySelectorAll(".w-card")], note = stage.querySelector(".w-note"), go = stage.querySelector(".w-go");
  const timers = [];
  function pick(card, found) {
    cards.forEach((c) => c.setAttribute("aria-pressed", c === card));
    go.classList.add("on"); go.textContent = `Continue with ${card.dataset.c}`;
    const now = mode() !== "new";
    cards.forEach((c) => (c.style.transition = now ? "none" : ""));
    if (found) note.textContent = `found you in ${card.dataset.c}!`;
    if (now) return;
    const check = card.querySelector(".w-check");
    if (RM()) { anim(check, [{ opacity: 0 }, { opacity: 1 }], 160); if (found) anim(note, [{ opacity: 0 }, { opacity: 1 }], 160); return; }
    anim(check, [{ transform: "scale(0.6)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], 320, "spring");
    if (found) anim(note, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], 450);
  }
  cards.forEach((c) => (c.onclick = () => { clear(timers); pick(c, false); }));
  const reset = (play) => {
    clear(timers); stop(stage);
    cards.forEach((c) => c.setAttribute("aria-pressed", "false"));
    go.classList.remove("on"); go.textContent = "Continue"; note.textContent = "finding your city…";
    if (!play) return;
    if (mode() === "new") stage.querySelectorAll(".stk").forEach((s, i) =>
      RM() ? anim(s, [{ opacity: 0 }, { opacity: 1 }], 160) : anim(s, [{ opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1 }], 220, "out", { delay: 60 * i * K() }));
    later(timers, () => pick(cards[0], true), 1100 * K());
  };
  reset(false);
  return { reset };
};

/* 4. Poster travels from the grid to the film page */
DEMOS.poster = (stage, mode) => {
  const films = [["A Land Apart", "p1"], ["Clayface", "p2"], ["First Lady", "p3"], ["Banished Scroll", "p4"]];
  stage.innerHTML = `<div class="pg"><div class="m-top">Films in Lagos</div><div class="m-sub" style="margin-bottom:8px">Showing today</div>
    <div class="fgrid">${films.map(([t, p], i) => `<button class="fcard" data-i="${i}"><div class="post ${p}"></div><b>${t}</b></button>`).join("")}</div></div>
    <div class="fp"><button class="back" aria-label="Back">‹</button><div class="hero"></div>
      <div class="info"><b></b><small>Today in Lagos</small><small>Stay: scene after the credits · TMDB</small></div>
      <div class="times"><div class="t"><span>Filmhouse Lekki</span><b>18:40</b></div><div class="t"><span>Genesis Lekki</span><b>19:15</b></div><div class="t"><span>EbonyLife Place</span><b>20:30</b></div></div></div>`;
  const fp = stage.querySelector(".fp"), hero = fp.querySelector(".hero"), rest = [fp.querySelector(".info"), fp.querySelector(".times"), fp.querySelector(".back")];
  let from = null;
  const rect = (el) => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
  function fly(a, b, cls, ms, done) {
    const f = document.createElement("div"); f.className = `fly ${cls}`;
    Object.assign(f.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
    stage.append(f);
    const t = `translate(${a.x - b.x}px, ${a.y - b.y}px) scale(${a.w / b.w})`;
    const an = f.animate([{ transform: t }, { transform: "none" }], { duration: ms * K(), easing: EASE.out });
    an.onfinish = () => { f.remove(); done(); };
  }
  function openFilm(card) {
    from = card; const [t, p] = films[card.dataset.i];
    hero.className = `hero ${p}`; fp.querySelector(".info b").textContent = t;
    stop(stage); fp.style.visibility = "visible";
    if (mode() !== "new") return;
    if (RM()) { anim(fp, [{ opacity: 0 }, { opacity: 1 }], 160); return; }
    const post = card.querySelector(".post"), a = rect(post), b = rect(hero);
    post.style.opacity = "0"; hero.style.opacity = "0";
    anim(fp, [{ opacity: 0 }, { opacity: 1 }], 160);
    rest.forEach((el) => anim(el, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], 200, "out", { delay: 80 * K() }));
    fly(a, b, p, 300, () => { hero.style.opacity = ""; post.style.opacity = ""; });
  }
  function back() {
    stop(stage);
    if (mode() !== "new" || !from) { fp.style.visibility = "hidden"; return; }
    if (RM()) { anim(fp, [{ opacity: 1 }, { opacity: 0 }], 160).onfinish = () => { fp.style.visibility = "hidden"; stop(fp); }; return; }
    const post = from.querySelector(".post"), a = rect(hero), b = rect(post), cls = hero.className.split(" ")[1];
    hero.style.opacity = "0"; post.style.opacity = "0";
    anim(fp, [{ opacity: 1 }, { opacity: 0 }], 160).onfinish = () => { fp.style.visibility = "hidden"; stop(fp); };
    fly(a, b, cls, 250, () => { post.style.opacity = ""; hero.style.opacity = ""; });
  }
  stage.querySelectorAll(".fcard").forEach((c) => (c.onclick = () => openFilm(c)));
  fp.querySelector(".back").onclick = back;
  const reset = (play) => { stop(stage); stage.querySelectorAll(".fly").forEach((f) => f.remove()); fp.style.visibility = "hidden"; stage.querySelectorAll(".post").forEach((p) => (p.style.opacity = "")); hero.style.opacity = ""; if (play) setTimeout(() => openFilm(stage.querySelector(".fcard")), 300); };
  return { reset };
};

/* 5. The moment a showing starts */
DEMOS.starts = (stage, mode) => {
  stage.innerHTML = `<div class="s-card"><div class="s-post p2"><span class="badge"><span class="ring"><span class="dot"></span></span><span><span class="lead">Starts in</span><span class="val">3 min</span></span></span></div>
    <div class="s-body"><b>Clayface</b><small>Genesis Lekki · 2D</small>
    <div class="pill"><span class="tm">19:15</span><span class="end"><span class="bk">↗</span><span class="nb">No booking</span></span></div></div></div>
    <div class="chiprow"><span class="tchip"><span class="tt">19:15<span class="strike"></span></span><small>2D</small></span><span class="later">Started just now</span></div>`;
  const ring = stage.querySelector(".ring"), dot = stage.querySelector(".dot"), lead = stage.querySelector(".lead"), val = stage.querySelector(".val");
  const bk = stage.querySelector(".bk"), nb = stage.querySelector(".nb"), strike = stage.querySelector(".strike"), lat = stage.querySelector(".later"), row = stage.querySelector(".chiprow");
  const timers = [];
  function start() {
    lead.textContent = "Started"; val.textContent = "just now"; ring.style.setProperty("--share", 1); row.classList.add("started");
    if (mode() !== "new") { bk.style.opacity = "0"; nb.style.opacity = "1"; strike.style.transform = "scaleX(1)"; lat.style.opacity = "1"; dot.style.opacity = "1"; ring.style.setProperty("--share", 0); return; }
    const o = (el, a, b, ms, d = 0) => anim(el, [{ opacity: a }, { opacity: b }], ms, "out", { delay: d * K() });
    if (RM()) { o(bk, 1, 0, 160); o(nb, 0, 1, 160); strike.style.transform = "scaleX(1)"; o(strike, 0, 1, 160); o(lat, 0, 1, 160); o(dot, 0, 1, 160); ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 * K(), fill: "forwards", pseudoElement: "::before" }); return; }
    anim(bk, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.6)", opacity: 0 }], 200);
    o(nb, 0, 1, 160, 60);
    anim(strike, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], 240);
    o(lat, 0, 1, 160, 60);
    ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 * K(), easing: EASE.out, fill: "forwards", pseudoElement: "::before" });
    o(dot, 0, 1, 200);
  }
  const reset = (play) => {
    clear(timers); stop(stage);
    [bk, nb, strike, lat, dot].forEach((e) => { e.style.opacity = ""; e.style.transform = ""; });
    row.classList.remove("started"); lead.textContent = "Starts in"; val.textContent = "3 min"; ring.style.setProperty("--share", 0.95);
    if (!play) return;
    [2, 1].forEach((n, i) => later(timers, () => { val.textContent = `${n} min`; ring.style.setProperty("--share", 1 - n * 0.02); }, 1000 * (i + 1)));
    later(timers, start, 3000);
  };
  reset(false);
  return { reset };
};

/* 6. Keeping a cinema, and letting one go */
DEMOS.keep = (stage, mode) => {
  const timers = [];
  const build = () => {
    stage.innerHTML = `<div class="m-top">Filmhouse Lekki</div><div class="m-sub" style="margin-bottom:12px">Lekki · 5 screens</div>
      <div style="padding:0 16px 18px"><button class="save" aria-pressed="false">${heart}<span>Save</span></button></div>
      <div class="m-sub" style="font-weight:600;color:var(--text-primary);font-size:14px;margin-bottom:8px">Your cinemas in Lekki</div>
      <div class="kept">${[["Genesis Lekki", "p2", "Next 19:15"], ["EbonyLife Place", "p3", "Next 19:50"], ["Filmhouse IMAX", "p6", "Next 20:30"]].map(([n, p, l]) => `<div class="kwrap"><div class="kcard"><div class="in"><span class="lg ${p}"></span><div><b>${n}</b><small>${l}</small></div><button class="hrt" aria-label="Remove ${n}">${heart}</button></div></div></div>`).join("")}</div>
      <div class="toast"><span>Saved to Your cinemas. Only on this phone.</span><u>Undo</u></div>`;
    const btn = stage.querySelector(".save"), toast = stage.querySelector(".toast");
    btn.onclick = () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on); btn.querySelector("span").textContent = on ? "Saved" : "Save";
      clear(timers); stop(toast);
      if (!on) { toast.style.opacity = "0"; return; }
      if (mode() === "new" && !RM()) anim(btn.querySelector("svg"), [{ transform: "scale(1)" }, { transform: "scale(1.25)", offset: 0.4 }, { transform: "scale(1)" }], 280);
      anim(toast, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], 220);
      later(timers, () => anim(toast, [{ opacity: 1 }, { opacity: 0 }], 160), 2600);
    };
    stage.querySelectorAll(".hrt").forEach((h) => (h.onclick = () => {
      const wrap = h.closest(".kwrap"), card = wrap.querySelector(".kcard");
      if (mode() !== "new") { wrap.remove(); return; }
      const fade = RM() ? anim(card, [{ opacity: 1 }, { opacity: 0 }], 160) : anim(card, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.98)" }], 160);
      fade.onfinish = () => { if (RM()) { wrap.remove(); return; } anim(wrap, [{ gridTemplateRows: "1fr" }, { gridTemplateRows: "0fr" }], 220, "inout").onfinish = () => wrap.remove(); };
    }));
  };
  const reset = (play) => { clear(timers); build(); if (play) setTimeout(() => stage.querySelector(".save").click(), 300); };
  build();
  return { reset };
};

/* 7. Show 8 more */
DEMOS.more = (stage, mode) => {
  const rows = [["20:10", "A Land Apart", "Filmhouse Lekki"], ["20:30", "Banished Scroll", "Filmhouse IMAX"], ["20:45", "Clayface", "Genesis Lekki"], ["21:00", "First Lady", "EbonyLife Place"], ["21:10", "Forgotten Island", "Genesis Lekki"], ["21:20", "Arnie & Barney", "Filmhouse Lekki"],
    ["21:35", "Alahun (The Weaver)", "EbonyLife Place"], ["21:50", "Clayface", "Filmhouse IMAX"], ["22:00", "A Land Apart", "Genesis Lekki"], ["22:05", "First Lady", "Filmhouse Lekki"], ["22:15", "Banished Scroll", "EbonyLife Place"], ["22:30", "Forgotten Island", "Filmhouse IMAX"], ["22:40", "Arnie & Barney", "Genesis Lekki"], ["22:45", "Clayface", "EbonyLife Place"]];
  const row = ([t, f, c]) => `<div class="lrow"><b>${t}</b>${f}<span>${c}</span></div>`;
  const build = () => {
    stage.innerHTML = `<div class="scroller"><div class="m-top">Later tonight</div><div class="m-sub" style="margin-bottom:8px">14 more in Lekki until 22:45</div><div class="lr">${rows.slice(0, 6).map(row).join("")}</div><button class="more">Show 8 more</button></div>`;
    const more = stage.querySelector(".more"), list = stage.querySelector(".lr");
    more.onclick = () => {
      more.remove();
      const add = rows.slice(6).map((r) => { const d = document.createElement("div"); d.innerHTML = row(r); return d.firstChild; });
      add.forEach((el) => list.append(el));
      if (mode() !== "new") return;
      add.forEach((el, i) => RM() ? anim(el, [{ opacity: 0 }, { opacity: 1 }], 160)
        : anim(el, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], 200, "out", { delay: Math.min(i, 6) * 30 * K() }));
    };
  };
  const reset = (play) => { build(); if (play) setTimeout(() => stage.querySelector(".more").click(), 300); };
  build();
  return { reset };
};
