// Switches the film's voice-over between the reads (D-173, D-174, D-185, D-186, D-190): `node scripts/voice.mjs us|ng|el|el3|el4`.
// Rewrites each <audio id="vo-…"> in index.html with that read's file, start and length. One root
// composition only: two would play the audio twice in the preview.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const read = process.argv[2];
if (!["us", "ng", "el", "el3", "el4"].includes(read)) throw new Error("usage: node scripts/voice.mjs us|ng|el|el3|el4");
// Takes 3 and 4 were written to the picture (D-186, D-189): each has its own 14 lines, with the start of the moment it names
const lines = JSON.parse(readFileSync(["el3", "el4"].includes(read) ? `assets/voice/lines-${read}.json` : "assets/voice/lines.json", "utf8"));
// Every read before take 4 is timed to the 46.2 s film. Take 4's film (D-190) moved the picture with the same cuts as the
// shiftChildren calls at the end of compositions/film.html: keep the two in step.
const toFilm = (t) => t + (t >= 5.99 ? 4.02 : 0) + (t >= 9.9 ? 1.18 : 0) + (t >= 13.75 ? 0.47 : 0) + (t >= 17.8 && t < 20.0 ? 0.5 : 0);
// Ezinne reads slower than Kokoro's Heart: these lines start a little earlier or later to keep their beats
const moved = read === "ng" ? { v01: 0.3, v02: 4.35, v04: 11.35, v09: 36.3, v09b: 39.95 } : {};
// ElevenLabs take 2 (Jessica) is one take cut at its pauses, 6 % faster: each line starts at its cue, up to
// 0.5 s early, never within 0.15 s of the line before; v09 waits for "Lagos and Abuja" to clear at 36.4 s.
if (read === "el") Object.assign(moved, { v01: 0.1, v02: 3.78, v03: 8.96, v04: 13.13, v05: 15.84, v06: 20.4, v07: 24.4, v07b: 31.2, v08: 32.45, v09: 36.4, v09b: 40.28, v10: 42.21 });
const length = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
let html = readFileSync("index.html", "utf8");
for (const [id, start] of lines) {
  const file = `assets/voice/${read}/${id}.wav`;
  const cue = moved[id] ?? start;
  const at = (read === "el4" ? cue : toFilm(cue)).toFixed(2);
  const re = new RegExp(`<audio id="vo-${id}"[^>]*></audio>`);
  if (!re.test(html)) throw new Error(`no <audio id="vo-${id}"> in index.html`);
  html = html.replace(re, (tag) => tag.replace(/data-start="[\d.]+"/, `data-start="${at}"`).replace(/data-duration="[\d.]+"/, `data-duration="${length(file).toFixed(3)}"`).replace(/src="[^"]+"/, `src="${file}"`).replace(/data-volume="[\d.]+"/, 'data-volume="1"'));
}
// A voice line this read doesn't have stays silent
const ids = new Set(lines.map(([id]) => id));
html = html.replace(/<audio id="vo-([a-z0-9]+)"[^>]*><\/audio>/g, (tag, id) => (ids.has(id) ? tag : tag.replace(/data-volume="[\d.]+"/, 'data-volume="0"')));
writeFileSync("index.html", html);
console.log(`voice: ${read} (${lines.length} lines)`);
