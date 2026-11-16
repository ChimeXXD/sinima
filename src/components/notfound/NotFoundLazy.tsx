"use client";

import dynamic from "next/dynamic";

// The 404's own code sits in the root layout's error boundary, which every page loads; loaded
// lazily, it is fetched only when a 404 is shown (the page budget, D-21). Still drawn into 404.html.
export const NotFoundLazy = dynamic(() => import("./NotFoundScreen").then((loaded) => loaded.NotFoundScreen));
