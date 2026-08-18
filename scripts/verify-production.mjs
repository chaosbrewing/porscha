#!/usr/bin/env node
/**
 * Production verification for porscha.today.
 *
 * Usage:
 *   node scripts/verify-production.mjs [origin]
 *
 * Defaults to https://porscha.today; pass http://localhost:3000 to
 * verify a local production build. Exits non-zero on any failure.
 */

const origin = (process.argv[2] ?? "https://porscha.today").replace(/\/$/, "");

let failures = 0;
const ok = (label) => console.log(`  ✓ ${label}`);
const fail = (label, detail) => {
  failures += 1;
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
};

async function get(path, init) {
  try {
    return await fetch(`${origin}${path}`, { redirect: "manual", ...init });
  } catch {
    return null;
  }
}

async function expectStatus(path, expected, label) {
  const res = await get(path);
  if (!res) {
    fail(label ?? path, "request failed");
    return null;
  }
  if (res.status === expected) ok(label ?? `${path} → ${expected}`);
  else fail(label ?? path, `expected ${expected}, got ${res.status}`);
  return res;
}

console.log(`Verifying ${origin}\n`);

console.log("Public routes:");
for (const path of [
  "/",
  "/porscha",
  "/workshop",
  "/workshop/kubli",
  "/workshop/prism",
  "/workshop/habi",
  "/apps",
  "/lab",
  "/lab/whispering-city",
  "/gallery",
  "/gallery/reservoir-walk",
  "/notes",
  "/notes/webhooks-not-polling",
  "/login",
  "/robots.txt",
  "/sitemap.xml",
]) {
  await expectStatus(path, 200);
}
await expectStatus("/workshop/does-not-exist", 404, "unknown project → 404");

console.log("\nHomepage content:");
try {
  const res = await get("/");
  if (!res) throw new Error("request failed");
  const html = await res.text();
  const checks = [
    ["Porscha is", "canonical headline present"],
    ["the process.", "canonical headline complete"],
    ["/portrait/porscha", "portrait asset referenced"],
    ["On the workbench.", "workbench section present"],
    ["The deeper layer.", "console teaser present"],
    ["Enter the workshop", "primary CTA present"],
  ];
  for (const [needle, label] of checks) {
    if (html.includes(needle)) ok(label);
    else fail(label, `"${needle}" not found`);
  }
  // Portrait asset actually loads
  const m = html.match(/src="([^"]*portrait[^"]*)"/);
  const portraitPath = m
    ? m[1].replace(/&amp;/g, "&")
    : "/portrait/porscha.jpg";
  const img = await get(portraitPath);
  if (img?.status === 200) ok("portrait image loads");
  else fail("portrait image loads", `status ${img?.status} for ${portraitPath}`);
} catch (err) {
  fail("homepage fetch", String(err));
}

console.log("\nConsole protection (anonymous):");
{
  const page = await get("/console/overview");
  if (page && [302, 303, 307, 308].includes(page.status)) {
    ok("console page redirects unauthenticated visitors");
  } else {
    fail("console page redirect", `status ${page?.status}`);
  }
  await expectStatus("/api/console/overview", 401, "console API → 401");
  await expectStatus("/api/console/stream", 401, "SSE stream → 401");
  const sync = await get("/api/console/sync", { method: "POST" });
  if (sync && sync.status === 401) ok("sync endpoint → 401");
  else fail("sync endpoint", `status ${sync?.status}`);
  const admin = await get("/api/console/admin/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (admin && admin.status === 401) ok("project-admin API → 401");
  else fail("project-admin API", `status ${admin?.status}`);
}

/*
 * Session-state checks: with SESSION_SECRET available (local prod
 * builds, or explicitly provided for a production audit), mint
 * synthetic OAuth-only and pending-2FA sessions and prove neither can
 * enter the console or its APIs.
 */
if (process.env.SESSION_SECRET) {
  console.log("\nConsole protection (OAuth-only and pending-2FA sessions):");
  try {
    const { SignJWT } = await import("jose");
    const key = new TextEncoder().encode(process.env.SESSION_SECRET);
    const mint = (state) =>
      new SignJWT({
        user: {
          id: "github:verify-probe",
          githubLogin: process.env.VERIFY_LOGIN ?? "chaosbrewing",
          displayName: null,
          avatarUrl: null,
        },
        state,
        sid: `verify-${state}`,
        iatMs: Date.now(),
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m")
        .setIssuer("porscha.today")
        .sign(key);

    for (const state of ["oauth_authenticated", "two_factor_pending"]) {
      const cookie = `porscha_session=${await mint(state)}`;
      const page = await get("/console/overview", {
        headers: { cookie },
      });
      if (page && [302, 303, 307, 308].includes(page.status)) {
        ok(`${state} session cannot open /console (redirected)`);
      } else {
        fail(`${state} console page`, `status ${page?.status}`);
      }
      const api = await get("/api/console/overview", { headers: { cookie } });
      if (api && api.status === 401) {
        ok(`${state} session rejected by private APIs`);
      } else {
        fail(`${state} private API`, `status ${api?.status}`);
      }
      const admin = await get("/api/console/admin/projects", {
        method: "POST",
        headers: { cookie, "Content-Type": "application/json" },
        body: "{}",
      });
      if (admin && admin.status === 401) {
        ok(`${state} session rejected by project-admin APIs`);
      } else {
        fail(`${state} admin API`, `status ${admin?.status}`);
      }
      const stream = await get("/api/console/stream", { headers: { cookie } });
      if (stream && stream.status === 401) {
        ok(`${state} session rejected by SSE stream`);
      } else {
        fail(`${state} SSE`, `status ${stream?.status}`);
      }
    }
  } catch (err) {
    fail("session-state checks", String(err));
  }
} else {
  console.log(
    "\nConsole protection (session states): skipped — set SESSION_SECRET to mint probe sessions.",
  );
}

console.log("\nWebhook endpoint:");
{
  const res = await get("/api/github/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"probe":true}',
  });
  if (res && (res.status === 401 || res.status === 503)) {
    ok(`unsigned delivery rejected (${res.status})`);
  } else {
    fail("unsigned delivery rejected", `status ${res?.status}`);
  }
}

console.log("\nPublic privacy boundary:");
try {
  const res = await get("/api/public/projects");
  if (!res) throw new Error("request failed");
  const body = await res.text();
  const forbidden = [
    "privatePayload",
    "openIssueCount",
    "openPullRequestCount",
    "ciStatus",
    "defaultBranch",
    "recentCommits",
    "openPullRequests",
    "activeBranches",
    "lastWorkflow",
    "github.com/chaosbrewing/kubli",
    "github.com/chaosbrewing/PRISM",
    "github.com/chaosbrewing/habi",
  ];
  let leaked = false;
  for (const needle of forbidden) {
    if (body.includes(needle)) {
      leaked = true;
      fail("public API leak", `contains "${needle}"`);
    }
  }
  if (!leaked) ok("public API contains no private repository signals");
} catch (err) {
  fail("public API fetch", String(err));
}

/* --------------------------- Stripe webhook ----------------------- */

/**
 * The webhook is the only writer of `sold_at`, so the one thing worth
 * proving from outside is that it refuses anything unsigned.
 *
 * This runner holds no signing secret and must not obtain one — a
 * verifier that could forge a valid signature would be a second way to
 * mark pieces sold. So it asserts the negative: an unsigned POST is
 * rejected. No Checkout Session is ever created; nothing here is
 * capable of reserving a piece or charging anyone.
 *
 * Pass --expect-sales (or EXPECT_SALES=true) once selling is live. The
 * distinction matters: 503 means the endpoint is unconfigured, which is
 * a perfectly good answer before launch and a failure after it. Without
 * the flag both 401 and 503 pass; with it, only 401 does.
 */
const expectSales =
  process.argv.includes("--expect-sales") ||
  /^(1|true|yes)$/i.test(process.env.EXPECT_SALES ?? "");

console.log("\nStripe webhook:");
try {
  const res = await fetch(`${origin}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Deliberately unsigned, and referencing nothing real.
    body: JSON.stringify({
      id: "evt_verify_unsigned",
      type: "checkout.session.completed",
      data: { object: { id: "cs_verify_unsigned", payment_status: "paid" } },
    }),
    redirect: "manual",
  });

  if (res.status === 401) {
    ok("unsigned webhook rejected (401)");
  } else if (res.status === 503) {
    if (expectSales) {
      fail(
        "unsigned webhook",
        "got 503 (sales not configured) but --expect-sales was set — " +
          "STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are missing from the Worker",
      );
    } else {
      ok("webhook reports sales not configured (503)");
    }
  } else if (res.status === 404) {
    fail(
      "unsigned webhook",
      "404 — the endpoint is not deployed yet; this passes once the " +
        "Stripe build ships",
    );
  } else {
    fail(
      "unsigned webhook",
      `expected 401${expectSales ? "" : " or 503"}, got ${res.status} — ` +
        "an unsigned delivery must never be accepted",
    );
  }
} catch (err) {
  fail("stripe webhook probe", String(err));
}

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All checks passed.");
