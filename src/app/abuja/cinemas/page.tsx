import type { Metadata } from "next";
import { CityComingScreen } from "@/components/city/CityComingScreen";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

export const metadata: Metadata = { title: `${sectionTitle("cinemas", "abuja")} · Sinima` };

/** Abuja's cinemas tab while Abuja has no cinemas in the data (D-98). */
export default function Abuja() {
  return <CityComingScreen city="abuja" section="cinemas" bg={pageColours()} />;
}
