import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg loads `pg-cloudflare` behind a conditional require, and its
  // `workerd` export condition points at files the default trace
  // condition prunes. Force the whole package into the standalone
  // output so the OpenNext Worker bundle can resolve it.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/**/*"],
  },
};

export default nextConfig;
