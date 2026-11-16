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
