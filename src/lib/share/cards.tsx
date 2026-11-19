import type { CSSProperties, ReactNode } from "react";
import { posterTint } from "@/lib/theme/posterTint";
import { ICON_PATHS } from "@/components/ui/icon-paths";
import { TICKET_FACE } from "@/components/ui/ticket-paths";
import { sticker, ticketSticker, wordmark } from "@/lib/share/assets";
import { lightToken, withAlpha } from "@/lib/share/tokens";
import { NO_POSTER } from "@/lib/wording/films";
import { CARD_LINE, CARD_NOTE, cardTitleSize, SITE_CARD_WORDS } from "@/lib/wording/share";

// The share cards, 1200 × 630, drawn by next/og (Satori) at build time: Figma › Design screens ›
// "Share card" (292:8687), direction A (D-149). Positions are Figma's. Figma turns a layer about its
// top-left corner (its x, y) and gives its bounding box; Satori turns one about its centre, so each
// turned layer is placed by the centre worked out from those. Satori takes inline styles only, and
// every box with more than one child is a flex box.

const t = (name: string) => lightToken(name);
const at = (left: number, top: number, width: number, height: number, rotate = 0): CSSProperties => ({
  position: "absolute",
  left,
  top,
  width,
  height,
  display: "flex",
  ...(rotate ? { transform: `rotate(${rotate}deg)` } : {}),
});
/** A turned layer, by its unrotated size and its centre. */
const turned = (cx: number, cy: number, width: number, height: number, rotate: number) => at(cx - width / 2, cy - height / 2, width, height, rotate);

const sans = "Urbanist";
const hand = "Story Script";

/** The logo: the ticket face (64 × 51.5) and the wordmark, as Figma's "Logo" frame. */
function Logo({ left, top }: { left: number; top: number }) {
  return (
    <div style={at(left, top, 214.89, 51.54)}>
      <svg width={64} height={51.54} viewBox={TICKET_FACE.viewBox} style={{ position: "absolute", left: 0, top: 0 }}>
        <path fill={t("brand-ticket")} fillRule="evenodd" d={TICKET_FACE.ticket} />
        {TICKET_FACE.eyes.map((d) => (
          <path key={d} fill={t("brand-eyes")} d={d} />
        ))}
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- drawn by Satori, not a page */}
      <img src={wordmark()} alt="" width={136.89} height={34} style={{ position: "absolute", left: 78, top: 8.77 }} />
    </div>
  );
}

function Sticker({ name, box }: { name: Parameters<typeof sticker>[0]; box: CSSProperties }) {
  return (
    <div style={{ ...box, filter: `drop-shadow(${t("fx-sticker-large")})` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- drawn by Satori, not a page */}
      <img src={sticker(name)} alt="" width={Number(box.width)} height={Number(box.height)} style={{ objectFit: "contain" }} />
    </div>
  );
}

/**
 * Story Script, `--text-accent`, 50 px: Pangea's handwritten note, centred on Figma's text box (Satori
 * sets it a little wider than Figma, so centring keeps it closest).
 */
function Note({ text, box }: { text: string; box: CSSProperties }) {
  return <div style={{ ...box, alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", fontFamily: hand, fontSize: 50, color: t("text-accent") }}>{text}</div>;
}

/** The poster sticker's 10 px white outline and shadow, 300 × 450 inside, tilted 6°. */
function Frame({ children }: { children: ReactNode }) {
  // Figma: a 300 × 450 poster at (815, 60) turned 6° (bounding box 345.4 × 478.9). Its centre works
  // out at 940.7, 299.4; Figma's own render puts it 3 right and 6 down (measured against get_screenshot).
  return (
    <div style={{ ...turned(943.66, 305.45, 320, 470, 6), padding: 10, borderRadius: 32, backgroundColor: t("sticker-outline"), boxShadow: t("fx-sticker-large") }}>
      {children}
    </div>
  );
}

/** The app's NoPoster face (components/ui/Cards), drawn at Figma's 1.734× (a 173 px card made 300). */
function NoPosterFace({ title }: { title: string }) {
  const s = 300 / 173;
  return (
    <div style={{ display: "flex", position: "relative", width: 300, height: 450, borderRadius: 22, backgroundColor: t(`poster-${posterTint(title)}`) }}>
      <div style={{ ...at(14 * s, 16 * s, 200, 50), flexDirection: "column", fontFamily: sans, fontWeight: 500, fontSize: 12 * s, lineHeight: 1.2, color: withAlpha(t("text-brand-deep"), 0.72) }}>
        <span>{NO_POSTER[0]}</span>
        <span>{NO_POSTER[1]}</span>
      </div>
      {/* The die-cut ticket as the app has it: a 55.4 × 46 box 12 from the top and 9 from the right, turned
          10° (Figma's frame turns it the other way); the file has 3 units of room round the box. */}
      <div style={turned(300 - 9 * s - (55.4 * s) / 2, 12 * s + (46 * s) / 2, 61.4 * s, 52 * s, 10)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn by Satori, not a page */}
        <img src={ticketSticker()} alt="" width={61.4 * s} height={52 * s} style={{ filter: `drop-shadow(${t("fx-sticker-small")})` }} />
      </div>
      <div style={{ position: "absolute", left: 14 * s, right: 14 * s, bottom: 28 * s, display: "flex", fontFamily: sans, fontWeight: 600, fontSize: 26 * s, lineHeight: 1.05, color: t("text-brand-deep"), wordBreak: "break-word" }}>{title}</div>
    </div>
  );
}

function Pin() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={t("text-accent")} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS["map-pin"].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const page: CSSProperties = { display: "flex", position: "relative", width: 1200, height: 630, backgroundColor: t("bg-page"), fontFamily: sans, color: t("text-primary") };

/** A film's card (Figma 292:8689; no poster 292:8712). `poster` is a data URL or null. */
export function FilmCard({ title, city, poster }: { title: string; city: string; poster: string | null }) {
  return (
    <div style={page}>
      <Logo left={72} top={56} />
      <div style={{ ...at(72, 168, 640, 400), flexDirection: "column" }}>
        <div style={{ display: "flex", alignSelf: "flex-start", alignItems: "center", height: 58, padding: "0 24px 0 18px", borderRadius: 999, backgroundColor: t("bg-surface") }}>
          <Pin />
          <span style={{ marginLeft: 10, fontSize: 28, fontWeight: 600, lineHeight: "34px" }}>{city}</span>
        </div>
        {/* Two lines at most: a longer title would run into the note (the full title is in og:title). */}
        <div style={{ display: "block", marginTop: 22, width: 640, fontSize: cardTitleSize(title), fontWeight: 700, lineHeight: 0.98, letterSpacing: -0.02 * cardTitleSize(title), lineClamp: 2, wordBreak: "break-word" }}>{title}</div>
        <div style={{ display: "flex", marginTop: 22, width: 600, fontSize: 30, fontWeight: 500, lineHeight: 1.3, color: t("text-secondary") }}>{CARD_LINE}</div>
      </div>
      <Frame>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- drawn by Satori, not a page
          <img src={poster} alt="" width={300} height={450} style={{ borderRadius: 22, objectFit: "cover" }} />
        ) : (
          <NoPosterFace title={title} />
        )}
      </Frame>
      {/* Popcorn: 120 × 150 at (1060, 420) turned -8°. */}
      <Sticker name="popcorn" box={turned(1129.85, 485.92, 120, 150, -8)} />
      {/* "who's coming?": 257 × 65 at (430, 516) turned -4°. */}
      <Note text={CARD_NOTE} box={turned(560.45, 539.46, 257, 65, -4)} />
      <svg style={{ position: "absolute", left: 690, top: 410 }} width={160} height={110} viewBox="0 0 160 110" fill="none" stroke={t("text-accent")} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 100 C 50 70, 70 50, 105 34 M105 34 l-22 -2 M105 34 l-8 20" />
      </svg>
    </div>
  );
}

/** The site's own card (Figma 292:8743): every page but a film's. */
export function SiteCard() {
  const light = { fontFamily: sans, fontWeight: 300, whiteSpace: "nowrap" } as const;
  return (
    <div style={page}>
      {/* Each sticker's Figma box and turn: clapper 170 × 150 at (70, 80) -10°, glasses 190 × 110 at
          (960, 70) 8°, popcorn 130 × 160 at (110, 380) 6°, drink 120 × 170 at (990, 360) -6°. The popcorn
          and the drink are nudged (-1, 3 and 6, -3) to where Figma's own render has them. */}
      <Sticker name="clapper" box={turned(166.73, 139.1, 170, 150, -10)} />
      <Sticker name="glasses" box={turned(1046.42, 137.69, 190, 110, 8)} />
      <Sticker name="popcorn" box={turned(165.28, 469.36, 130, 160, 6)} />
      <Sticker name="drink" box={turned(1064.56, 435.26, 120, 170, -6)} />
      <div style={{ ...at(0, 150, 1200, 125), ...light, justifyContent: "center", fontSize: 104, lineHeight: 1.2 }}>{SITE_CARD_WORDS.lead}</div>
      <svg style={{ position: "absolute", left: 384, top: 250 }} width={339} height={150} viewBox="0 0 339 150" fill="none" stroke={t("action-primary")} strokeWidth={5}>
        <ellipse cx={169.5} cy={75} rx={167} ry={72.5} />
      </svg>
      <div style={{ ...at(420, 262, 267, 125), ...light, fontSize: 104, lineHeight: 1.2 }}>{SITE_CARD_WORDS.circled}</div>
      <div style={{ ...at(711, 300, 209, 72), ...light, fontSize: 60, lineHeight: 1.2, color: t("text-secondary") }}>{SITE_CARD_WORDS.rest}</div>
      {/* "tonight!": 138 × 65 at (720, 470) turned -5°. */}
      <Note text={SITE_CARD_WORDS.note} box={turned(791.57, 496.36, 138, 65, -5)} />
      <Logo left={424.5} top={548} />
    </div>
  );
}
