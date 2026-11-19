import { CITY_NAMES, type City } from "@/lib/city";

// The words of a shared link's preview (D-145, D-149): what the card picture says, and the title,
// description and alt text WhatsApp and X read from the page. Chats keep a link's picture for days,
// so none of these carries a count, a time or "today".

/** The line under a film's title on its card. */
export const CARD_LINE = "Every showing at every sinima, in one place.";

/** The handwritten note pointing at the poster. */
export const CARD_NOTE = "who's coming?";

/** The site's own card: "What's on in" over "Lagos" (circled) "& Abuja", and the note. */
export const SITE_CARD_WORDS = { lead: "What's on in", circled: "Lagos", rest: "& Abuja", note: "tonight!" } as const;

/** The site's preview: its title and alt text, and the description every page has had. */
export const SITE_SHARE = {
  title: "Sinima: what's on in Lagos & Abuja",
  description: "What's starting soon at Lagos and Abuja sinimas, and should you stay after the credits?",
  alt: "What's on in Lagos & Abuja, on Sinima.",
} as const;

/** A film's preview in a city: "Ghost Soldier: showtimes in Lagos · Sinima". */
export function filmShare(title: string, city: City): { title: string; description: string; alt: string } {
  const name = CITY_NAMES[city];
  return {
    title: `${title}: showtimes in ${name} · Sinima`,
    description: `Every showing at every sinima in ${name}, with times and where to book.`,
    alt: `${title} in ${name}, on Sinima: ${CARD_LINE.charAt(0).toLowerCase()}${CARD_LINE.slice(1)}`,
  };
}

/** The title's size on a card: 96 px, or 80 when it is longer than 16 characters (D-149). */
export const cardTitleSize = (title: string): 96 | 80 => ([...title].length > 16 ? 80 : 96);
