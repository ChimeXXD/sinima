import { CITY_KEY } from "@/lib/city";

// An old address (before D-98 put the city first) forwards to its Lagos page at once, keeping
// anything after ? and # (a shared showing's #s=…). A small inline script forwards; with no script,
// the plain link does it (a plain <a>: a full page load, so the next page's own script runs).

export function Forward({ to }: { to: string }) {
  const go = `location.replace(${JSON.stringify(to)}+location.search+location.hash)`;
  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: go }} />
      <p>
        <a href={to}>Sinima has moved this page to {to}</a>
      </p>
    </main>
  );
}

/** "/" goes to the city kept on this phone, or Lagos (unit 12 asks on a first visit). */
export function ForwardToCity() {
  const go = `var c;try{c=localStorage.getItem(${JSON.stringify(CITY_KEY)})}catch(e){}location.replace("/"+(c==="abuja"?"abuja":"lagos")+location.search+location.hash)`;
  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: go }} />
      <p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load, see above */}
        <a href="/lagos">What&apos;s on in Lagos</a>
      </p>
    </main>
  );
}
