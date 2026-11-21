// Switches the film's voice-over between the two reads (D-173, D-174): `node scripts/voice.mjs us|ng`.
// Rewrites each <audio id="vo-…"> in index.html with that read's file, start and length. One root
// composition only: two would play the audio twice in the preview.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const read = process.argv[2];
if (read !== "us" && read !== "ng") throw new Error("usage: node scripts/voice.mjs us|ng");
const lines = JSON.parse(readFileSync("assets/voice/lines.json", "utf8"));
// Ezinne reads slower than Kokoro's Heart: these lines start a little earlier or later to keep their beats
const moved = read === "ng" ? { v01: 0.3, v02: 4.35, v04: 11.35, v09: 36.3, v09b: 39.95 } : {};
const length = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
let html = readFileSync("index.html", "utf8");
for (const [id, start] of lines) {
  const file = `assets/voice/${read}/${id}.wav`;
  const at = (moved[id] ?? start).toFixed(2);
  const re = new RegExp(`<audio id="vo-${id}"[^>]*></audio>`);
  if (!re.test(html)) throw new Error(`no <audio id="vo-${id}"> in index.html`);
  html = html.replace(re, (tag) => tag.replace(/data-start="[\d.]+"/, `data-start="${at}"`).replace(/data-duration="[\d.]+"/, `data-duration="${length(file).toFixed(3)}"`).replace(/src="[^"]+"/, `src="${file}"`));
}
writeFileSync("index.html", html);
console.log(`voice: ${read} (${lines.length} lines)`);
