import type { Metadata } from "next";
import { WhereScreen } from "@/components/where/WhereScreen";
import { CITIES, CITY_KEY } from "@/lib/city";
import { areasIn } from "@/lib/data/load";
import { pageColours } from "@/lib/theme/pageColours";
import { areasLine } from "@/lib/wording/where";

export const metadata: Metadata = { title: "Where are you watching? · Sinima" };

// A city kept on this phone opens at once, before this page is drawn (D-98); only a first visit
// sees the question.
const kept = `try{var c=localStorage.getItem(${JSON.stringify(CITY_KEY)});if(${JSON.stringify(CITIES)}.indexOf(c)>=0)location.replace("/"+c+location.search+location.hash)}catch(e){}`;

/** "/": the city kept on this phone, or Where are you watching? on a first visit (Figma, build unit 12, D-65). */
export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: kept }} />
      <WhereScreen lines={{ lagos: areasLine(areasIn("lagos").map((area) => area.name)), abuja: areasLine(areasIn("abuja").map((area) => area.name)) }} bg={pageColours()} />
    </>
  );
}
