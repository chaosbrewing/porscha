#!/usr/bin/env node
/**
 * Origin diagnostics: prints status, identifying headers, and a body
 * excerpt for a handful of paths, to identify what is actually serving
 * a domain. Read-only.
 *
 * With the Cloudflare Workers deployment, healthy output shows
 * `server: cloudflare` + `cf-ray` on every path, the app's HTML on `/`
 * (the Worker → Next.js hop), JSON from `/api/public/projects` (the
 * Worker → Hyperdrive → Supabase hop), and a 301 from the www host to
 * the apex. A leftover host fingerprint (x-railway-request-id,
 * x-vercel-id, fly-request-id, ...) means DNS/routes still point at a
 * retired origin.
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

async function probe(url, label) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    console.log(`\n=== ${label} → ${res.status} ${res.statusText}`);
    for (const h of INTERESTING_HEADERS) {
      const v = res.headers.get(h);
      if (v) console.log(`  ${h}: ${v}`);
    }
    const body = await res.text();
    console.log(`  body (${body.length} bytes): ${JSON.stringify(body.slice(0, 400))}`);
  } catch (err) {
    console.log(`\n=== ${label} → request failed: ${err}`);
  }
}

for (const path of ["/", "/robots.txt", "/favicon.ico", "/api/public/projects"]) {
  await probe(`${origin}${path}`, path);
}

// Canonical-host redirect (www → apex) when diagnosing the apex domain.
const originUrl = new URL(origin);
if (!originUrl.hostname.startsWith("www.") && originUrl.hostname.includes(".")) {
  await probe(`${originUrl.protocol}//www.${originUrl.hostname}/`, "www → apex redirect");
}
