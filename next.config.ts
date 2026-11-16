import type { NextConfig } from "next";

// Static export (D-02): `next build` writes the whole site to out/.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Posters through Sinima's own /poster/ on Vercel, where vercel.json hands it on to TMDB (D-113).
  env: { POSTER_BASE: process.env.VERCEL ? "/poster/" : "" },
  // Turbopack's graph CSS chunking with a low request cost: each page loads mostly its own screen's
  // styles instead of one sheet holding every screen's (D-94, the page budget D-21).
  experimental: { cssChunking: { type: "graph", requestCost: 8000 } },
};

export default nextConfig;
