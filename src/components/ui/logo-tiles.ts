// Each chain's logo file and tile (D-56, D-57): the part of data/logos.json a sticker draws. Pages
// carry only this, not the file's notes and sources (the page budget, D-21); tests/unit/logos.test.ts
// keeps it equal to data/logos.json, which stays the record.
export const LOGO_TILES: Record<string, [file: string, tile: "dark" | "light" | "fill"]> = {
  "Filmhouse": ["filmhouse.png", "dark"],
  "Genesis": ["genesis.png", "light"],
  "EbonyLife": ["ebonylife.png", "dark"],
  "Silverbird": ["silverbird.png", "light"],
  "Blue Pictures": ["bluepictures.png", "light"],
  "Filmworld": ["filmworld.png", "light"],
  "Grand": ["grand.png", "dark"],
  "Ozone": ["ozone.png", "fill"],
  "Sky": ["sky.png", "dark"],
  "THC": ["thc.png", "dark"],
  "Viva": ["viva.png", "dark"],
  "Magnificent": ["magnificent.png", "light"],
  "Nova": ["nova.png", "dark"],
  "The Jays": ["jays.png", "fill"],
};
