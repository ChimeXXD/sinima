// Data for the "in use" slides (8–12): per kit, the two marks the Radesk mockups need and the colours to swap in.
import { LOGOS, render } from "./marks.mjs";

const ROWS = ["94:2", "96:2", "97:2", "98:2", "99:2", "99:357", "108:1112"];
const kits = LOGOS.map((L, i) => {
  let icon = render(L, { ...L.icon, C: L.icon.C ?? L.icon.bg });
  if (L.icon.grad) {
    const [a, b, c] = L.icon.grad;
    icon = icon.replace(/fill="#A79BF3"/, 'fill="url(#g)"').replace(/<g /, `<defs><radialGradient id="g" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${a}"/><stop offset="0.45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><g `);
  }
  // One-colour white mark for menu bars and small UI.
  const mono = render(L, { ...L.v.monoLight, bg: "#000000", C: L.tile ? "#FFFFFF" : "#1C1C1E", T: "#FFFFFF", B: L.tile ? "#1C1C1E" : "#FFFFFF" });
  return { row: ROWS[i], name: L.name, tile: !!L.tile, s: L.iconScale, iconBg: L.icon.bg, brand: L.v.brand.bg, icon, mono };
});
process.stdout.write(JSON.stringify(kits));
