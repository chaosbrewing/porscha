import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg loads `pg-cloudflare` behind a conditional require, and its
  // `workerd` export condition points at files the default trace
  // condition prunes. Force the whole package into the standalone
  // output so the OpenNext Worker bundle can resolve it.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/**/*"],
  },

  // The 2026 rebuild replaced the old public routes. Old links keep
  // landing somewhere sensible.
  async redirects() {
    return [
      { source: "/porscha", destination: "/me", permanent: true },
      { source: "/workshop", destination: "/work", permanent: true },
      { source: "/workshop/:slug", destination: "/work", permanent: true },
      { source: "/apps", destination: "/work", permanent: true },
      { source: "/apps/:slug", destination: "/work", permanent: true },
      { source: "/lab", destination: "/work/experiments", permanent: true },
      { source: "/lab/:slug", destination: "/work/experiments", permanent: true },
      { source: "/notes", destination: "/", permanent: true },
      { source: "/notes/:slug", destination: "/", permanent: true },
      { source: "/gallery", destination: "/art", permanent: true },
      { source: "/gallery/:slug", destination: "/art/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
