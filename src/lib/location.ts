import type { City } from "@/lib/city";

// Where are you watching? (D-65): the phone's position picks the city whose centre is near
// enough, or neither (then the page offers Lagos). The position is only read here, on the phone:
// it is never stored or sent (rule 11); only the city's slug is kept.

const CENTRES: Record<City, [number, number]> = { lagos: [6.5244, 3.3792], abuja: [9.0765, 7.3986] };
/** In a straight line: Lagos State from Badagry to Epe is within 70 km of the centre, Abuja's FCT within 100;
 * Ibadan (114 km from Lagos) and Minna (110 km from Abuja) are out. */
const RADIUS_KM: Record<City, number> = { lagos: 80, abuja: 100 };

function km([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function cityFromPosition(latitude: number, longitude: number): City | null {
  const near = (Object.keys(CENTRES) as City[]).map((city) => ({ city, distance: km([latitude, longitude], CENTRES[city]) })).sort((a, b) => a.distance - b.distance)[0]!;
  return near.distance <= RADIUS_KM[near.city] ? near.city : null;
}
