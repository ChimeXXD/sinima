"use client";

import { Link, useCity } from "@/components/ui/CityLink";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/Actions";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Status";
import { CitySticker, TicketFaceSticker } from "@/components/ui/Stickers";
import { hasCinemas, searchFilms, type Scope, type SearchFilm, type SearchGroup, type SearchIndex } from "@/lib/data/search";
import type { City } from "@/lib/city";
import { posterSrc, posterSrcSet } from "@/lib/data/posters";
import { pageBanner } from "@/lib/data/select";
import { useNow } from "@/lib/time/useNow";
import { ABUJA_SOON, CITY_NAME, comingMeta, enterHint, matchCount, noMatch, resultMeta, resultNext, SEARCH_FAILED } from "@/lib/wording/search";
import a from "@/components/ui/actions.module.css";
import s from "./search.module.css";

// Search (Figma Search and city, 192:7519). Loaded only when the search bar is first used, so no
// page carries it. On a phone it takes the whole screen, with Cancel; on an iPad or desktop it is a
// panel over the search bar, the page dimmed behind. The field here takes over from the bar's.

let loading: Promise<SearchIndex> | null = null;
function loadIndex(): Promise<SearchIndex> {
  loading ??= fetch("/data/search.json").then((response) => {
    if (!response.ok) throw new Error(`search.json: ${response.status}`);
    return response.json() as Promise<SearchIndex>;
  });
  loading.catch(() => (loading = null)); // a failed load is tried again next time
  return loading;
}

const SCOPES: { id: Scope; name: string }[] = [
  { id: "both", name: "Both cities" },
  { id: "lagos", name: "Lagos" },
  { id: "abuja", name: "Abuja" },
];

export type SearchOverlayProps = { query: string; onQuery: (text: string) => void; onSubmit: () => void; /** `true` gives focus back to the search bar (Escape). */ onClose: (refocus?: boolean) => void; /** The scope it opens on. */ city: Scope };

export default function SearchOverlay({ query, onQuery, onSubmit, onClose, city }: SearchOverlayProps) {
  const [scope, setScope] = useState<Scope>(city);
  const [index, setIndex] = useState<SearchIndex | "failed" | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const now = useNow();
  const home = useCity();

  useEffect(() => {
    field.current?.focus();
    let live = true;
    loadIndex().then(
      (loaded) => live && setIndex(loaded),
      () => live && setIndex("failed"),
    );
    return () => {
      live = false;
    };
  }, []);

  const text = query.trim();
  const groups = typeof index === "object" && index !== null && now && text ? searchFilms(index, text, scope, now) : null;
  const found = groups?.reduce((n, group) => n + group.results.length + group.coming.length, 0) ?? 0;
  const loaded = typeof index === "object" && index !== null ? index : null;
  // Search covers the page's banner on a phone, so it says the same (rules 2 and 8).
  const banner = loaded && pageBanner(loaded, now);
  // A city with no cinemas in the index (Abuja before a live run reads it): say so, rather than suggest a spelling mistake.
  const abujaSoon = loaded !== null && !hasCinemas(loaded, "abuja");
  // Enter shows today's matches on Films, in its city (Lagos when both are searched): only those count.
  const filmsCity = city === "both" ? "lagos" : city;
  const listed = groups?.find((group) => group.city === filmsCity)?.results.filter((result) => result.day === 0).length ?? 0;

  return (
    <>
      <div className={s.scrim} onClick={() => onClose()} aria-hidden="true" />
      <form
        className={s.box}
        role="search"
        aria-label="Find a film"
        onSubmit={(event) => {
          event.preventDefault();
          if (text) onSubmit();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault(); // a search field clears itself on Escape; keep the query
          onClose(true);
        }}
        data-testid="search.panel"
      >
        <div className={s.head}>
          <div className={s.field}>
            <Icon name="search" size={20} className={s.glass} />
            <input ref={field} type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Find a film" aria-label="Find a film" autoComplete="off" enterKeyHint="search" data-testid="search.query" />
            {query && (
              <button type="button" className={s.clear} aria-label="Clear" onClick={() => (onQuery(""), field.current?.focus())} data-testid="search.clear">
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
          <button type="button" className={s.cancel} onClick={() => (onQuery(""), onClose())} data-testid="search.cancel">
            Cancel
          </button>
        </div>

        <div className={s.body}>
          <div className={s.scopes} role="group" aria-label="Cities">
            {SCOPES.map(({ id, name }) => (
              <Chip key={id} selected={scope === id} onClick={() => setScope(id)} testId={`search.scope.${id}`}>
                {name}
              </Chip>
            ))}
          </div>

          <div className={s.results} aria-live="polite" data-testid="search.results">
            {index === "failed" && <p className={s.line}>{SEARCH_FAILED}</p>}
            {groups && banner && <Notice kind={banner.kind} text={banner.text} />}
            {groups && scope === "abuja" && abujaSoon ? (
              // Abuja has nothing to show yet, so the way out is Lagos's Films, whatever the page's city.
              <NoMatch words={{ ...noMatch(text, scope, "lagos"), title: ABUJA_SOON, body: null }} href="/lagos" onHome={() => (onQuery(""), onClose())} />
            ) : (
              groups && found === 0 && <NoMatch words={noMatch(text, scope, home)} onHome={() => (onQuery(""), onClose())} />
            )}
            {groups && found > 0 && scope !== "both" && (
              <>
                <p className={s.line} data-testid="search.count">
                  {matchCount(found, scope, text)}
                </p>
                <Rows group={groups[0]!} now={now!} onOpen={() => onClose()} />
              </>
            )}
            {groups &&
              found > 0 &&
              scope === "both" &&
              groups.map((group) =>
                group.results.length + group.coming.length > 0 ? (
                  <section key={group.city} className={s.group} aria-label={`In ${CITY_NAME[group.city]}`} data-testid={`search.group.${group.city}`}>
                    <h3 className={s.groupHead}>
                      <span aria-hidden="true">
                        <CitySticker city={group.city} />
                      </span>
                      In {CITY_NAME[group.city]}
                    </h3>
                    <Rows group={group} now={now!} onOpen={() => onClose()} />
                  </section>
                ) : group.city === "abuja" && abujaSoon ? (
                  <p key={group.city} className={s.soon} data-testid="search.abuja-soon">
                    {ABUJA_SOON}.
                  </p>
                ) : null,
              )}
            {listed > 0 && <p className={s.line}>{enterHint(listed)}</p>}
          </div>
        </div>
      </form>
    </>
  );
}

/** The rows of one city: the films with times, then those only coming (D-151). */
function Rows({ group, now, onOpen }: { group: SearchGroup; now: string; onOpen: () => void }) {
  return (
    <>
      {group.results.map((result) => (
        <Result key={result.film.id} city={group.city} film={result.film} meta={resultMeta(result.film, result.formats, result.cinemas, result.day, now, result.next.at)} next={resultNext(result.next, result.day, now)} onOpen={onOpen} />
      ))}
      {group.coming.map(({ film, opens }) => (
        <Result key={film.id} city={group.city} film={film} meta={comingMeta(film)} next={opens} onOpen={onOpen} />
      ))}
    </>
  );
}

/** A result opens the film in its own city's pages, whatever city the page is in. */
function Result({ city, film, meta, next, onOpen }: { city: City; film: SearchFilm; meta: string; next: string; onOpen: () => void }) {
  return (
    <Link href={`/${city}/film/${film.id}`} className={s.result} onClick={onOpen} data-testid={`search.hit.${film.id}`}>
      {film.poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser; TMDB serves sized files
        <img className={s.poster} src={posterSrc("w154", film.poster)} srcSet={posterSrcSet("w154", "w342", film.poster)} alt="" crossOrigin="anonymous" width={52} height={78} loading="lazy" decoding="async" />
      ) : (
        <span className={`${s.poster} ${s.noPoster}`}>
          <TicketFaceSticker height={25} />
        </span>
      )}
      <span className={s.text}>
        <span className={s.title}>{film.title}</span>
        <span className={s.meta}>{meta}</span>
        <span className={s.next}>{next}</span>
      </span>
      <Icon name="chevron-right" size={20} className={s.chevron} />
    </Link>
  );
}

/** `href` is the Films the action opens: the page's own city's unless given. */
function NoMatch({ words, href = "/", onHome }: { words: { title: string; body: string | null; action: string }; href?: string; onHome: () => void }) {
  return (
    <div className={s.none} data-testid="search.none">
      <TicketFaceSticker height={64} />
      <h3>{words.title}</h3>
      {words.body && <p>{words.body}</p>}
      <Link href={href} className={`${a.button} ${a.secondary}`} onClick={onHome} data-testid="search.home">
        {words.action}
      </Link>
    </div>
  );
}
