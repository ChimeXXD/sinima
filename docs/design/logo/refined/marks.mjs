// Refined geometry for the six shortlisted Sinima marks. Every number sits on a 4-unit grid unless noted.
// Tokens in templates: {B} body, {F} features (eyes, smile, glasses), {A} accent, {C} cut colour (the background
// the mark sits on, used where a feature is a hole drawn in the background colour).

const n2 = (v) => Number(v.toFixed(2));
const hole = (cx, cy, r) => `M${n2(cx - r)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// 1. Ticket face (Chime's main pick): a cinema ticket with a face, tilted 8 degrees.
// Body 112 x 84 (4:3), corner radius 16, side notches r12 at mid-height, tear line of 5 real holes at x = 84.
const TF = { W: 112, H: 84, r: 16, notch: 12, tear: 84, dot: 2.5, dots: [18, 30, 42, 54, 66], eyes: [38, 62], eyeY: 42, rx: 7, ry: 10.5 };
const tfBody = (() => {
  const { W, H, r, notch: n, tear, dot, dots } = TF, m = H / 2;
  return `M${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${m - n}A${n} ${n} 0 0 0 ${W} ${m + n}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}H${r}A${r} ${r} 0 0 1 0 ${H - r}V${m + n}A${n} ${n} 0 0 0 0 ${m - n}V${r}A${r} ${r} 0 0 1 ${r} 0Z` + dots.map((y) => hole(tear, y, dot)).join("");
})();
const ticketFace = {
  id: "ticket-face", name: "Ticket face", tag: "Your main pick",
  wordmark: "eyes", // the two i-dots drawn as the mark's eyes (wordmark-builder.js)
  idea: "A cinema ticket that looks back at you. The stub, the tear line and two eyes: friendly, and it says cinema at once.",
  changes: ["Face centred between the left edge and the tear line", "Tear line made of five real holes, so it works in one colour", "Notches, corners and eyes set to one 4-unit grid", "Gloss and gradient kept for the app icon only; the mark is flat"],
  vb: [-5.3, -7.4, 122.6, 98.8], vbUp: [0, 0, 112, 84], rot: 8,
  svg: (rot) => `<g transform="rotate(${-rot} 56 42)"><path fill-rule="evenodd" d="${tfBody}" fill="{B}"/>${TF.eyes.map((x) => `<ellipse cx="${x}" cy="${TF.eyeY}" rx="${TF.rx}" ry="${TF.ry}" fill="{F}"/>`).join("")}</g>`,
  guides: { v: [0, 12, 31, 38, 45, 55, 62, 69, 84, 100, 112], h: [0, 16, 30, 42, 54, 68, 84], c: [[16, 16, 16], [0, 42, 12], [112, 42, 12]] },
  build: ["Body 112 × 84, a 4:3 ticket", "Corner radius 16; side notches r12 on the centre line", "Tear line at 3/4 of the width: five holes r2.5, 12 apart", "Eyes 14 × 21 ovals, centred on the face, 24 apart", "Whole mark tilted 8° for movement"],
  x: 24, xName: "x = the notch's diameter (24)",
  palette: [["Lilac", "#8E80EA", "The ticket"], ["Ink", "#2A1F4A", "Eyes and the name"], ["Mist", "#F3F0FF", "Light backgrounds"], ["Deep lilac", "#5B4BB0", "Dark backgrounds, icon shade"]],
  v: { light: { bg: "#F3F0FF", B: "#8E80EA", F: "#2A1F4A", W: "#2A1F4A" }, dark: { bg: "#1C1533", B: "#A79BF3", F: "#1C1533", W: "#F3F0FF" }, brand: { bg: "#8E80EA", B: "#F3F0FF", F: "#2A1F4A", W: "#F3F0FF" }, monoDark: { bg: "#FFFFFF", B: "#2A1F4A", F: "#FFFFFF", W: "#2A1F4A" }, monoLight: { bg: "#2A1F4A", B: "#FFFFFF", F: "#2A1F4A", W: "#FFFFFF" } },
  icon: { bg: "#2A1F4A", B: "#A79BF3", F: "#2A1F4A", grad: ["#E9E4FF", "#AB9FF2", "#6D5BB6"] }, iconScale: 0.62,
};

// 2. Screen face: a cinema screen with two eyes glancing up and across, toward the name.
const screenFace = {
  id: "screen-face", name: "Screen face", tag: "Round 2 · option 2",
  wordmark: "eyes",
  idea: "A cinema screen that looks back at you, eyes glancing toward what is about to start.",
  changes: ["Screen set to 112 × 80 with radius 28, softer and more like a phone", "Eyes are 2/5 of the height and spaced by their own radius", "Pupils look up and to the right, toward the name in every lockup", "One accent: the pupils carry the blue"],
  vb: [0, 0, 112, 80], vbUp: [0, 0, 112, 80], rot: 0,
  svg: () => `<rect width="112" height="80" rx="28" fill="{B}"/><circle cx="36" cy="40" r="16" fill="{C}"/><circle cx="76" cy="40" r="16" fill="{C}"/><circle cx="41" cy="36" r="8" fill="{A}"/><circle cx="81" cy="36" r="8" fill="{A}"/>`,
  guides: { v: [0, 20, 36, 52, 60, 76, 92, 112], h: [0, 24, 36, 40, 56, 80], c: [[28, 28, 28], [36, 40, 16], [76, 40, 16]] },
  build: ["Screen 112 × 80, radius 28", "Eyes r16 on the centre line, centres 40 apart", "Pupils r8, moved 5 right and 4 up", "Everything on a 4-unit grid"],
  x: 32, xName: "x = one eye's diameter (32)",
  palette: [["Ink", "#0A0A0A", "The screen and the name"], ["Paper", "#FFFFFF", "Eyes and light backgrounds"], ["Screen blue", "#2F5FB3", "Pupils"], ["Sky", "#8FB4F5", "Pupils on dark"]],
  v: { light: { bg: "#FFFFFF", B: "#0A0A0A", C: "#FFFFFF", A: "#2F5FB3", W: "#0A0A0A" }, dark: { bg: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5", W: "#FFFFFF" }, brand: { bg: "#2F5FB3", B: "#FFFFFF", C: "#2F5FB3", A: "#0A0A0A", W: "#FFFFFF" }, monoDark: { bg: "#FFFFFF", B: "#0A0A0A", C: "#FFFFFF", A: "#0A0A0A", W: "#0A0A0A" }, monoLight: { bg: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#FFFFFF", W: "#FFFFFF" } },
  icon: { bg: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5" }, iconScale: 0.46,
};

// 3. 3D glasses: the doodle character in cinema glasses, one lens blue.
const glassesBody = "M0 84V32A32 32 0 0 1 64 32V76A8 8 0 0 1 56 84H8A8 8 0 0 1 0 76Z";
const glasses = {
  id: "3d-glasses", name: "3D glasses", tag: "Round 2 · option 13",
  idea: "The Sinima character in cinema glasses, one lens blue. The most 'film' of the characters.",
  changes: ["Body made a clean arch: 64 × 84, top r32, base corners r8", "Lenses sit on one eye line with a 6-unit bridge", "Every line is 5 units thick: tufts, frame and smile", "Tufts mirrored, so the head is symmetrical"],
  vb: [-4, -16, 72, 100], vbUp: [-4, -16, 72, 100], rot: 0,
  svg: () => `<path d="${glassesBody}" fill="{B}"/><path d="M24 4Q19 -4 25 -11M40 4Q45 -4 39 -11" fill="none" stroke="{B}" stroke-width="5" stroke-linecap="round"/><path d="M0 40H64" stroke="{C}" stroke-width="5"/><rect x="6" y="31" width="23" height="18" rx="6" fill="{C}"/><rect x="35" y="31" width="23" height="18" rx="6" fill="{A}"/><path d="M24 62Q32 69 40 62" fill="none" stroke="{C}" stroke-width="5" stroke-linecap="round"/>`,
  guides: { v: [0, 6, 29, 32, 35, 58, 64], h: [-11, 0, 31, 40, 49, 62, 84], c: [[32, 32, 32], [8, 76, 8], [56, 76, 8]] },
  build: ["Arch body 64 × 84: a half circle r32 on a 64-wide block", "Base corners r8", "Lenses 23 × 18, radius 6, bridge 6", "All strokes 5, round ends"],
  x: 23, xName: "x = one lens's width (23)",
  palette: [["Ink", "#0A0A0A", "The character and the name"], ["Paper", "#FFFFFF", "Face details and light backgrounds"], ["Screen blue", "#2F5FB3", "The right lens"], ["Sky", "#8FB4F5", "The lens on dark"]],
  v: { light: { bg: "#FFFFFF", B: "#0A0A0A", C: "#FFFFFF", A: "#2F5FB3", W: "#0A0A0A" }, dark: { bg: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5", W: "#FFFFFF" }, brand: { bg: "#2F5FB3", B: "#FFFFFF", C: "#2F5FB3", A: "#0A0A0A", W: "#FFFFFF" }, monoDark: { bg: "#FFFFFF", B: "#0A0A0A", C: "#FFFFFF", A: "#FFFFFF", W: "#0A0A0A" }, monoLight: { bg: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#0A0A0A", W: "#FFFFFF" } },
  icon: { bg: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5" }, iconScale: 0.62,
};

// 4. Peeking: the character leans in from the lower-left corner of a screen-shaped tile, eyes up at the screen.
const peeking = {
  id: "peeking", name: "Peeking", tag: "Round 2 · option 14",
  wordmark: "eyes",
  idea: "The character leaning in from the corner of the screen, eyes up at what is starting.",
  changes: ["The tile is the screen: 96 × 96, radius 24, so the mark is also the app icon", "Body leans in 12° from the lower-left corner", "Eyes enlarged to r9 with pupils looking up and to the right", "Crop set so the head always clears the tile's centre line"],
  vb: [0, 0, 96, 96], vbUp: [0, 0, 96, 96], rot: 0, tile: { r: 24 },
  svg: () => `<g transform="translate(4 36) rotate(12 28 40)"><path d="M0 96V28A28 28 0 0 1 56 28V96Z" fill="{B}"/><path d="M21 3Q18 -5 23 -11M35 3Q39 -5 33 -11" fill="none" stroke="{B}" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="30" r="9" fill="{C}"/><circle cx="38" cy="30" r="9" fill="{C}"/><circle cx="21" cy="26" r="4.5" fill="{A}"/><circle cx="41" cy="26" r="4.5" fill="{A}"/></g>`,
  guides: { v: [0, 12, 48, 68, 96], h: [0, 24, 48, 72, 96], c: [[24, 24, 24], [48, 48, 48]] },
  build: ["Tile 96 × 96, radius 24: the screen", "Body: a 56-wide arch, top r28", "Leans in 12° around its own centre", "Eyes r9, pupils r4.5 looking up-right"],
  x: 24, xName: "x = the tile's corner radius (24)",
  palette: [["Ink", "#0A0A0A", "The tile (screen) and the name"], ["Paper", "#FFFFFF", "The character"], ["Sky", "#8FB4F5", "Pupils on dark"], ["Screen blue", "#2F5FB3", "Pupils on light"]],
  v: { light: { bg: "#FFFFFF", T: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5", W: "#0A0A0A" }, dark: { bg: "#0A0A0A", T: "#FFFFFF", B: "#0A0A0A", C: "#FFFFFF", A: "#2F5FB3", W: "#FFFFFF" }, brand: { bg: "#2F5FB3", T: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5", W: "#FFFFFF" }, monoDark: { bg: "#FFFFFF", T: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#FFFFFF", W: "#0A0A0A" }, monoLight: { bg: "#0A0A0A", T: "#FFFFFF", B: "#0A0A0A", C: "#FFFFFF", A: "#0A0A0A", W: "#FFFFFF" } },
  icon: { bg: "#0A0A0A", T: "#0A0A0A", B: "#FFFFFF", C: "#0A0A0A", A: "#8FB4F5" }, iconScale: 1,
};

// 5. Ticket S: a ticket whose two notches make an S (D-42), re-based on the 4-unit grid.
const TS = { L: 0, R: 64, T: 0, B: 84, corner: 16, notch: 14, shoulder: 4, dot: 3.5, dots: [22, 32, 42] };
const tsPath = (() => {
  const { L, R, T, B, corner: c, notch: n, shoulder: f, dot, dots } = TS;
  const h = Math.sqrt((n + f) ** 2 - f ** 2);
  const yR = T + c + h, yL = B - c - h;
  const touch = (cx, cy, fx, fy) => [n2(cx + (n / (n + f)) * (fx - cx)), n2(cy + (n / (n + f)) * (fy - cy))];
  const r1 = touch(R, yR, R - f, yR - h), r2 = touch(R, yR, R - f, yR + h);
  const l1 = touch(L, yL, L + f, yL + h), l2 = touch(L, yL, L + f, yL - h);
  const body = `M${L + c} ${T}H${R - c}A${c} ${c} 0 0 1 ${R} ${T + c}A${f} ${f} 0 0 1 ${r1}A${n} ${n} 0 0 0 ${r2}A${f} ${f} 0 0 1 ${R} ${n2(yR + h)}V${B - c}A${c} ${c} 0 0 1 ${R - c} ${B}H${L + c}A${c} ${c} 0 0 1 ${L} ${B - c}A${f} ${f} 0 0 1 ${l1}A${n} ${n} 0 0 0 ${l2}A${f} ${f} 0 0 1 ${L} ${n2(yL - h)}V${T + c}A${c} ${c} 0 0 1 ${L + c} ${T}Z`;
  return { body: body + dots.map((x) => hole(x, 42, dot)).join(""), yR: n2(yR), yL: n2(yL) };
})();
const ticketS = {
  id: "ticket-s", name: "Ticket S", tag: "Round 4 · logo 4",
  idea: "A cinema ticket with two bites out of it, high on the right and low on the left, so the ticket itself is an S.",
  changes: ["Re-based on a 4-unit grid: 64 × 84, corners r16", "Notches r14 (up from 12), so the S reads at 16 px", "Shoulders r4 where each notch meets the edge", "Tear-line dots r3.5, 10 apart, as real holes"],
  vb: [0, 0, 64, 84], vbUp: [0, 0, 64, 84], rot: 0,
  svg: () => `<path fill-rule="evenodd" d="${tsPath.body}" fill="{B}"/>${TS.dots.map((x) => `<circle cx="${x}" cy="42" r="${TS.dot}" fill="{A}"/>`).join("")}`,
  guides: { v: [0, 16, 22, 32, 42, 48, 64], h: [0, 16, tsPath.yR, 42, tsPath.yL, 68, 84], c: [[64, tsPath.yR, 14], [0, tsPath.yL, 14], [16, 16, 16]] },
  build: ["Body 64 × 84, corners r16", `Notches r14: right at y ${tsPath.yR}, left mirrored at y ${tsPath.yL}`, "Shoulders r4 join each notch to the edge", "Three holes r3.5 on the centre line"],
  x: 28, xName: "x = a notch's diameter (28)",
  palette: [["Ink", "#0A0A0A", "The ticket and the name"], ["Paper", "#FFFFFF", "Light backgrounds"], ["Screen blue", "#2F5FB3", "Tear-line dots"], ["Sky", "#8FB4F5", "Dots on dark"]],
  v: { light: { bg: "#FFFFFF", B: "#0A0A0A", A: "#2F5FB3", W: "#0A0A0A" }, dark: { bg: "#0A0A0A", B: "#FFFFFF", A: "#8FB4F5", W: "#FFFFFF" }, brand: { bg: "#2F5FB3", B: "#FFFFFF", A: "#2F5FB3", W: "#FFFFFF" }, monoDark: { bg: "#FFFFFF", B: "#0A0A0A", A: "#FFFFFF", W: "#0A0A0A" }, monoLight: { bg: "#0A0A0A", B: "#FFFFFF", A: "#0A0A0A", W: "#FFFFFF" } },
  icon: { bg: "#0A0A0A", B: "#FFFFFF", A: "#8FB4F5" }, iconScale: 0.6,
};

// 6. Front row: you, seen from behind, in front of the screen. Also a sun going down.
const frontRow = {
  id: "front-row", name: "Front row", tag: "Round 4 · logo 5",
  idea: "You, seen from behind, in front of the screen. It also reads as the sun going down: the evening shows begin.",
  changes: ["A 6-unit gap now separates the head from the screen, so it reads as a person in front", "Screen 112 × 80, radius 24; head r22 sits on the bottom edge", "Gap and head share one centre, so the cut is even all round", "Works in one colour: the gap is real space"],
  vb: [0, 0, 112, 80], vbUp: [0, 0, 112, 80], rot: 0,
  svg: () => `<path d="M24 0H88A24 24 0 0 1 112 24V56A24 24 0 0 1 88 80H84A28 28 0 0 0 28 80H24A24 24 0 0 1 0 56V24A24 24 0 0 1 24 0Z" fill="{B}"/><path d="M34 80A22 22 0 0 1 78 80Z" fill="{A}"/>`,
  guides: { v: [0, 24, 28, 34, 56, 78, 84, 88, 112], h: [0, 24, 52, 58, 80], c: [[56, 80, 28], [56, 80, 22], [24, 24, 24]] },
  build: ["Screen 112 × 80, radius 24", "Head: half circle r22 centred on the bottom edge", "Gap: the screen is cut by r28 on the same centre, a 6-unit ring", "4-unit grid throughout"],
  x: 22, xName: "x = the head's radius (22)",
  palette: [["Night", "#1E2657", "The screen and the name"], ["Cream", "#F6EFDD", "Light backgrounds"], ["Marigold", "#E9A93C", "The head, the sun"], ["Midnight", "#11163A", "Dark backgrounds"]],
  v: { light: { bg: "#F6EFDD", B: "#1E2657", A: "#E9A93C", W: "#1E2657" }, dark: { bg: "#11163A", B: "#F6EFDD", A: "#E9A93C", W: "#F6EFDD" }, brand: { bg: "#E9A93C", B: "#1E2657", A: "#F6EFDD", W: "#1E2657" }, monoDark: { bg: "#FFFFFF", B: "#1E2657", A: "#1E2657", W: "#1E2657" }, monoLight: { bg: "#1E2657", B: "#FFFFFF", A: "#FFFFFF", W: "#FFFFFF" } },
  icon: { bg: "#1E2657", B: "#F6EFDD", A: "#E9A93C" }, iconScale: 0.6,
};

// 1b. Ticket face in blue: the same geometry, only the colours change.
const ticketFaceBlue = {
  ...ticketFace, id: "ticket-face-blue", name: "Ticket face, blue", tag: "Variant of your main pick",
  changes: ["Same geometry as Ticket face: only the colours change", "Cornflower ticket with navy eyes: 5.2:1, clearer than the purple's 4.6:1", "The icon keeps the soft gradient, in blues", "Screen blue (#2F5FB3), already in the app, becomes the deep shade"],
  palette: [["Cornflower", "#5B8DEF", "The ticket"], ["Navy", "#0B1B3F", "Eyes and the name"], ["Ice", "#EEF3FF", "Light backgrounds"], ["Screen blue", "#2F5FB3", "Dark backgrounds, icon shade"]],
  v: { light: { bg: "#EEF3FF", B: "#5B8DEF", F: "#0B1B3F", W: "#0B1B3F" }, dark: { bg: "#0A1630", B: "#8FB4F5", F: "#0A1630", W: "#EEF3FF" }, brand: { bg: "#5B8DEF", B: "#EEF3FF", F: "#0B1B3F", W: "#EEF3FF" }, monoDark: { bg: "#FFFFFF", B: "#0B1B3F", F: "#FFFFFF", W: "#0B1B3F" }, monoLight: { bg: "#0B1B3F", B: "#FFFFFF", F: "#0B1B3F", W: "#FFFFFF" } },
  icon: { bg: "#0B1B3F", B: "#A79BF3", F: "#0B1B3F", grad: ["#E6EEFF", "#8FB4F5", "#2F5FB3"] },
};

export const LOGOS = [ticketFace, screenFace, glasses, peeking, ticketS, frontRow, ticketFaceBlue];

// Fill a template with a colour variant.
export function render(logo, v, { upright = false, w, h } = {}) {
  const vb = upright ? logo.vbUp : logo.vb;
  const inner = logo.svg(upright ? 0 : logo.rot).replace(/\{([BFACT])\}/g, (_, k) => v[k] ?? (k === "C" ? v.bg : v.B));
  const tile = logo.tile ? `<rect x="0" y="0" width="96" height="96" rx="${logo.tile.r}" fill="${v.T}"/>` : "";
  const clip = logo.tile ? `<defs><clipPath id="t"><rect width="96" height="96" rx="${logo.tile.r}"/></clipPath></defs>` : "";
  const body = logo.tile ? `${clip}${tile}<g clip-path="url(#t)">${inner}</g>` : inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}"${w ? ` width="${w}"` : ""}${h ? ` height="${h}"` : ""}>${body}</svg>`;
}
