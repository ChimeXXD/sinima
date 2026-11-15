# Stickers

| File | What | Source |
|---|---|---|
| `drink.png` | Drink sticker in the Films title, next to "tonight!" (D-74) | Microsoft Fluent Emoji 3D, "Cup with straw" (MIT, see `LICENSE-fluentui-emoji.txt`), with a white die-cut border added by `diecut.py` |

`diecut.py` adds the border: `python3 diecut.py <src-dir> <out-dir> <name>…` (Pillow). It pads by 9 % and grows the alpha by about 4.5 % of the width, then fills that with white.

When the site is built, the PNG goes in `public/stickers/` and Fluent Emoji is credited on `/about`.
