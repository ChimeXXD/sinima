"use client";

import { useCityRouter as useRouter } from "@/components/ui/CityLink";
import { useState } from "react";
import { Button } from "@/components/ui/Actions";
import { AppFrame } from "@/components/ui/AppFrame";
import { CitySticker } from "@/components/ui/Stickers";
import { PrivacySection } from "./PrivacySection";
import type { City } from "@/lib/city";
import type { CityReading, SourceRow } from "@/lib/data/about";
import { ABOUT, ISSUES_URL, REPO_URL, STEPS, cityReadingLine, sourceStatus } from "@/lib/wording/about";
import s from "./about.module.css";

// About (Figma 208:9122): how it works, where each city's times come from with each source's real
// status (data/sources.json), the TMDB notice, and how a cinema has its times or logo taken down.

const NONE: CityReading = { own: 0, through: 0, none: 0 };

export function AboutScreen({ sources, reading, bg }: { sources: SourceRow[]; reading: Partial<Record<City, CityReading>>; bg: { light: string; dark: string } }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const footer = (
    <>
      <p data-testid="footer.note">{ABOUT.footer}</p>
      <p data-testid="footer.stickers">{ABOUT.stickers}</p>
    </>
  );
  return (
    <AppFrame active="films" search={{ value: typed, onChange: setTyped, onSubmit: () => router.push(`/?q=${encodeURIComponent(typed.trim())}`) }} bg={bg} footer={footer} onAbout>
      <div className={s.title}>
        <div className={s.row}>
          <h1>{ABOUT.title}</h1>
          <span className={s.hand} aria-hidden="true">
            {ABOUT.note}
          </span>
        </div>
        <p className={s.lead}>{ABOUT.lead}</p>
      </div>

      <section className={s.block} aria-labelledby="about.how">
        <h2 id="about.how">{ABOUT.how}</h2>
        <ol className={s.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={s.step}>
              <span className={s.number} aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.block} aria-labelledby="about.sources">
        <h2 id="about.sources">{ABOUT.sources}</h2>
        <p className={s.city}>
          <CitySticker city="lagos" tilt={0} />
          <span data-testid="about.reading.lagos">{cityReadingLine("lagos", reading.lagos ?? NONE)}</span>
        </p>
        <table className={s.table} data-testid="about.sources">
          <thead>
            <tr>
              {ABOUT.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} data-testid={`about.source.${source.id}`}>
                <th scope="row">
                  {/* Each source credited with a link to its own site (D-132). */}
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener" className={s.sourceLink}>
                      {source.name}
                    </a>
                  ) : (
                    source.name
                  )}
                </th>
                <td>{source.cinemas}</td>
                <td>{sourceStatus(source.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.abuja}>
          <CitySticker city="abuja" tilt={0} />
          <span data-testid="about.reading.abuja">{cityReadingLine("abuja", reading.abuja ?? NONE)}</span>
        </p>
      </section>

      <PrivacySection />

      <section className={s.block} aria-labelledby="about.films">
        <h2 id="about.films">{ABOUT.films}</h2>
        <p className={s.tmdb} data-testid="about.tmdb">
          <span className={s.mark} aria-hidden="true">
            TMDB
          </span>
          <span>{ABOUT.tmdb}</span>
        </p>
      </section>

      <section className={s.block} aria-labelledby="about.logos">
        <h2 id="about.logos">{ABOUT.logos}</h2>
        <p className={s.text}>{ABOUT.owners}</p>
        <p className={s.text}>{ABOUT.removal}</p>
        <div className={s.links}>
          <Button kind="secondary" href={ISSUES_URL} testId="about.removal">
            {ABOUT.ask}
          </Button>
          <Button kind="secondary" href={REPO_URL} testId="about.code">
            {ABOUT.code}
          </Button>
        </div>
      </section>
    </AppFrame>
  );
}
