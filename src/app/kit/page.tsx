import type { Metadata } from "next";
import { KitDemo } from "./KitDemo";

// The shared components (D-82, build unit 2) with Figma's example values, one section per Doc frame
// on the Design System page, to check against Figma. Not linked from the site and not indexed.

export const metadata: Metadata = {
  title: "Components · Sinima",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  return <KitDemo />;
}
