import type { NextConfig } from "next";

// Static export (D-02): `next build` writes the whole site to out/.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Turbopack's graph CSS chunking with a low request cost: each page loads mostly its own screen's
  // styles instead of one sheet holding every screen's (D-94, the page budget D-21).
  experimental: { cssChunking: { type: "graph", requestCost: 8000 } },
};

export default nextConfig;
