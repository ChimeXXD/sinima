import logos from "../../../data/logos.json";
import { TICKET_FACE } from "./ticket-paths";
import s from "./stickers.module.css";

// 13 · Stickers (Figma 167:84): Keepsy die-cut stickers. All decorative: the words beside them
// carry the meaning, so each is hidden from screen readers unless it says otherwise.

/** The ticket face, flat, for UI (the countdown pill, the logo). `height` in px; Figma's is 24. */
export function TicketFace({ height = 24, className }: { height?: number; className?: string }) {
  return (
    <svg className={className} viewBox={TICKET_FACE.viewBox} height={height} width={(height * 29.8) / 24} aria-hidden="true" focusable="false">
      <path fill="var(--brand-ticket)" fillRule="evenodd" d={TICKET_FACE.ticket} />
      {TICKET_FACE.eyes.map((d) => (
        <path key={d} fill="var(--brand-eyes)" d={d} />
      ))}
    </svg>
  );
}

/**
 * The ticket face as a die-cut sticker, for decoration and the freshness line. Figma's is 46 tall.
 * One cached file (Figma's colours are the same in both themes), so a page of no-poster cards does
 * not repeat its path data (the page budget, D-21).
 */
export function TicketFaceSticker({ height = 46, className }: { height?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser
    <img className={`${s.sticker} ${className ?? ""}`} src="/stickers/ticket.svg" alt="" height={height} width={(height * 55.4) / 46} decoding="async" />
  );
}

/** A drink, die-cut (Fluent Emoji 3D, MIT; credited on /about). The white border is in the PNG. */
export function DrinkSticker({ width = 55, className }: { width?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser
    <img className={`${s.drink} ${className ?? ""}`} src="/stickers/drink.png" alt="" width={width} height={(width * 80) / 55} loading="lazy" decoding="async" />
  );
}

/** The 404 picture (D-75): the brand ticket torn into "40" and "4". The page says "not found" in words. */
export function NotFoundTicket({ width = 282, className }: { width?: number; className?: string }) {
  return (
    // The export is 284 × 232: the ticket's 282 plus its shadow, and 28 below Figma's 204 frame for
    // the left half's edge and shadow, which Figma draws past the frame. The margin gives the 28 back.
    // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser
    <img className={className} src="/stickers/not-found.svg" alt="" width={(width * 284) / 282} height={(width * 232) / 282} decoding="async" style={{ marginBottom: -(width * 28) / 282 }} />
  );
}

// Figma's city pin: filled, with the hole cut out (13.2).
const PIN =
  "M7.00065 1.16669C5.76297 1.16669 4.57599 1.65835 3.70082 2.53352C2.82565 3.40869 2.33398 4.59568 2.33398 5.83335C2.33398 8.75002 5.95065 12.1917 6.65065 12.7167C6.75162 12.7924 6.87443 12.8334 7.00065 12.8334C7.12687 12.8334 7.24968 12.7924 7.35065 12.7167C8.05065 12.1917 11.6673 8.75002 11.6673 5.83335C11.6673 4.59568 11.1757 3.40869 10.3005 2.53352C9.42531 1.65835 8.23833 1.16669 7.00065 1.16669ZM7.00065 7.58335C6.53652 7.58335 6.0914 7.39898 5.76321 7.07079C5.43503 6.7426 5.25065 6.29748 5.25065 5.83335C5.25065 5.36922 5.43503 4.92411 5.76321 4.59592C6.0914 4.26773 6.53652 4.08335 7.00065 4.08335C7.46478 4.08335 7.9099 4.26773 8.23809 4.59592C8.56628 4.92411 8.75065 5.36922 8.75065 5.83335C8.75065 6.29748 8.56628 6.7426 8.23809 7.07079C7.9099 7.39898 7.46478 7.58335 7.00065 7.58335Z";

/** A die-cut city tag. It shows the city's name, so it is read out. Tilted ±5°. */
export function CitySticker({ city, tilt = city === "lagos" ? -5 : 5 }: { city: "lagos" | "abuja"; tilt?: number }) {
  return (
    <span className={`${s.city} ${s[city]}`} style={{ rotate: `${tilt}deg` }} data-testid={`city-sticker.${city}`}>
      <svg viewBox="0 0 14 14" width={14} height={14} aria-hidden="true" focusable="false">
        <path fill="currentColor" fillRule="evenodd" d={PIN} />
      </svg>
      {city === "lagos" ? "Lagos" : "Abuja"}
    </span>
  );
}

const LOGOS: Record<string, { file: string; tile: string }> = logos.chains;

/**
 * The chain's own logo on a die-cut tile (D-57): dark tile for white logos, white for dark ones,
 * Ozone fills its tile. `scale` sizes it from Figma's 72 × 44 (the folder uses 0.78). Hidden from
 * screen readers: the cinema's name is always beside it. Null for a chain with no logo.
 */
export function LogoSticker({ chain, scale = 1, tilt = -6 }: { chain: string; scale?: number; tilt?: number }) {
  const logo = LOGOS[chain];
  if (!logo) return null;
  return (
    <span className={`${s.logo} ${s[logo.tile]}`} style={{ "--k": scale, rotate: `${tilt}deg` } as React.CSSProperties} aria-hidden="true" data-testid="logo-sticker">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser */}
      <img src={`/logos/${logo.file}`} alt="" loading="lazy" decoding="async" />
    </span>
  );
}
