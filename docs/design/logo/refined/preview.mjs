import { LOGOS, render } from "./marks.mjs";
import { writeFileSync } from "node:fs";
const cells = LOGOS.map(l => `<section><h2>${l.name}</h2><div class="row">${["light","dark","brand","monoDark","monoLight"].map(k => `<div class="t" style="background:${l.v[k].bg}">${render(l, l.v[k], { h: 120 })}</div>`).join("")}
<div class="t" style="background:#fff">${render(l, l.v.light, { upright: true, h: 120 })}</div>
<div class="t sm" style="background:${l.v.light.bg}">${render(l, l.v.light, { h: 16 })}${render(l, l.v.light, { h: 24 })}${render(l, l.v.light, { h: 32 })}</div></div></section>`).join("");
writeFileSync("preview.html", `<!doctype html><meta charset="utf-8"><style>body{font:14px system-ui;margin:24px;background:#eee}.row{display:flex;gap:12px;flex-wrap:wrap}.t{width:200px;height:170px;display:grid;place-items:center;border-radius:16px}.sm{display:flex;gap:16px;align-items:center;justify-content:center}h2{margin:16px 0 8px;font-size:16px}</style>${cells}`);
