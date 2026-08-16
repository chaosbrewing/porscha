#!/usr/bin/env node
/**
 * Origin diagnostics: prints status, identifying headers, and a body
 * excerpt for a handful of paths, to identify what is actually serving
 * a domain. Read-only.
 */
const origin = (process.argv[2] ?? "https://porscha.today").replace(/\/$/, "");

const INTERESTING_HEADERS = [
  "server",
  "via",
  "cf-ray",
  "cf-cache-status",
  "x-powered-by",
  "x-vercel-id",
  "x-railway-request-id",
  "x-served-by",
  "x-github-request-id",
  "x-nextjs-prerender",
  "x-render-origin-server",
  "fly-request-id",
  "location",
  "content-type",
];

for (const path of ["/", "/robots.txt", "/favicon.ico", "/api/public/projects"]) {
  try {
    const res = await fetch(`${origin}${path}`, { redirect: "manual" });
    console.log(`\n=== ${path} → ${res.status} ${res.statusText}`);
    for (const h of INTERESTING_HEADERS) {
      const v = res.headers.get(h);
      if (v) console.log(`  ${h}: ${v}`);
    }
    const body = await res.text();
    console.log(`  body (${body.length} bytes): ${JSON.stringify(body.slice(0, 400))}`);
  } catch (err) {
    console.log(`\n=== ${path} → request failed: ${err}`);
  }
}
