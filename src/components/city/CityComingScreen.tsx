"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { useCityRouter as useRouter } from "@/components/ui/CityLink";
import { TicketFaceSticker } from "@/components/ui/Stickers";
import type { City } from "@/lib/city";
import { comingWords, sectionTitle, type Section } from "@/lib/wording/city";
import s from "./city.module.css";

// A city's tab while it has no cinemas in the data (Abuja, D-98): its title, then that its
// cinemas are being added and the way to the other city. Never made-up times (rule 8). Enter in
// search lists the matches on the other city's Films, since this one has none to list.

export function CityComingScreen({ city, section, bg }: { city: City; section: Section; bg: { light: string; dark: string } }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const other: City = city === "lagos" ? "abuja" : "lagos";
  const words = comingWords(city, other);
  return (
    <AppFrame active={section} search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/${other}?q=${encodeURIComponent(typed.trim())}`) }} bg={bg}>
      <h1 className={s.title}>{sectionTitle(section, city)}</h1>
      <section className={s.coming} aria-labelledby="city.coming" data-testid="city.coming">
        <TicketFaceSticker height={69} className={s.ticket} />
        <h2 id="city.coming">{words.title}</h2>
        <p>{words.body}</p>
        <Button href={`/${other}`} testId="city.other">
          {words.action}
        </Button>
      </section>
    </AppFrame>
  );
}
