import type { Metadata } from "next";
import { CityComingScreen } from "@/components/city/CityComingScreen";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

export const metadata: Metadata = { title: `${sectionTitle("yours", "abuja")} · Sinima` };

/** Abuja's yours tab while Abuja has no cinemas in the data (D-98). */
export default function Abuja() {
  return <CityComingScreen city="abuja" section="yours" bg={pageColours()} />;
}
