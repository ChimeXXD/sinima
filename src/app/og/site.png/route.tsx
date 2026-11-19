import { ImageResponse } from "next/og";
import { cardFonts } from "@/lib/share/assets";
import { SiteCard } from "@/lib/share/cards";
import { CARD_SIZE } from "@/lib/share/meta";

// The site's own share card (D-149), written to out/og/site.png at build time: the picture every
// page but a film's gives WhatsApp and X (lib/share/meta).
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<SiteCard />, { ...CARD_SIZE, fonts: cardFonts() });
}
