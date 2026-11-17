// A fake headless browser for readers of pages whose days are tabs a visitor taps (D-125): it
// serves a saved page for each (address, clicked control) pair and records what was asked.
export function fakeTabs(served: Record<string, string>) {
  const asked: string[] = [];
  const renderText = Object.assign(
    async (url: string, opts: { click?: string } = {}) => {
      const key = `${url} ${opts.click ?? "(no click)"}`;
      asked.push(key);
      const page = served[key];
      if (page === undefined) throw new Error(`unexpected render ${key}`);
      return page;
    },
    { close: async () => {} },
  );
  const fetchText = async (url: string): Promise<string> => {
    throw new Error(`a script-built page was fetched: ${url}`);
  };
  return { asked, renderText, fetchText };
}
