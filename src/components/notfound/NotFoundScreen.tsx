"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { NotFoundTicket } from "@/components/ui/Stickers";
import { NOT_FOUND } from "@/lib/wording/about";
import s from "./notfound.module.css";

// 404 (Figma 208:9467, D-75): the torn ticket, "this one's not showing", and the way back to Films.

const CITY = "Lagos"; // one city until the city layer (unit 13)

export function NotFoundScreen({ bg }: { bg: { light: string; dark: string } }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  return (
    <AppFrame active="films" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} footer={<></>}>
      <section className={s.page} aria-labelledby="notfound.title" data-testid="notfound">
        <NotFoundTicket className={s.ticket} />
        <span className={s.hand} aria-hidden="true">
          {NOT_FOUND.note}
        </span>
        <h1 id="notfound.title">{NOT_FOUND.title}</h1>
        <p>{NOT_FOUND.body}</p>
        <Button href="/" testId="notfound.home">
          {NOT_FOUND.action(CITY)}
        </Button>
      </section>
    </AppFrame>
  );
}
