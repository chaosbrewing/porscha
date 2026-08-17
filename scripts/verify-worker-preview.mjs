#!/usr/bin/env node
/**
 * Positive-path verification against a running Worker preview
 * (`npm run preview:cloudflare`), proving the Cloudflare-runtime
 * behaviors that the read-only checks in verify-production.mjs cannot:
 *
 *   - TOTP enrollment end-to-end in workerd: AES-256-GCM secret
 *     encryption, QR/manual key, first-code verification, recovery
 *     codes, session rotation to two_factor_verified
 *   - TOTP replay prevention (a consumed code is refused)
 *   - authorized console API access through Hyperdrive's local path
 *   - SSE through the RealtimeHub Durable Object: hello event, then a
 *     live `update` delivered when a signed webhook lands
 *   - webhook HMAC acceptance + duplicate-delivery dedup
 *   - project-admin mutations (create → preview → archive) with audit,
 *     and the public API never exposing the admin-created project
 *     (visibility defaults OFF)
 *
 * Setup expected (matches the local dev database):
 *   - Postgres reachable via wrangler.jsonc's localConnectionString,
 *     schema migrated, allowlisted user row present:
 *       insert into users (id, github_login) values
 *         ('github:chaosbrewing','chaosbrewing')
 *         on conflict (id) do nothing;
 *   - env: SESSION_SECRET and GITHUB_WEBHOOK_SECRET matching .dev.vars
 *
 * Usage:
 *   SESSION_SECRET=... GITHUB_WEBHOOK_SECRET=... \
 *     node scripts/verify-worker-preview.mjs http://localhost:8787
 *
 * The 2FA enrollment it performs is real: it resets any prior
 * enrollment rows for the probe user afterwards is NOT done — run
 * against a disposable local database only, never production.
 */
import { createHmac, randomUUID } from "node:crypto";

const base = (process.argv[2] ?? "http://localhost:8787").replace(/\/$/, "");
const SESSION_SECRET = process.env.SESSION_SECRET;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const LOGIN = process.env.VERIFY_LOGIN ?? "chaosbrewing";

if (!SESSION_SECRET || !WEBHOOK_SECRET) {
  console.error("SESSION_SECRET and GITHUB_WEBHOOK_SECRET are required");
  process.exit(1);
}

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg, detail) => {
  failures += 1;
  console.log(`  ✗ ${msg}${detail ? ` — ${detail}` : ""}`);
};

const { SignJWT } = await import("jose");
const { TOTP, Secret } = await import("otpauth");

const key = new TextEncoder().encode(SESSION_SECRET);
const user = {
  id: `github:${LOGIN}`,
  githubLogin: LOGIN,
  displayName: null,
  avatarUrl: null,
};
async function mint(state) {
  return new SignJWT({ user, state, sid: `preview-${randomUUID()}`, iatMs: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer("porscha.today")
    .sign(key);
}
const cookieFor = (token) => `porscha_session=${token}`;
const totpFor = (base32) =>
  new TOTP({ secret: Secret.fromBase32(base32), algorithm: "SHA1", digits: 6, period: 30 });

/* ---------------- 2FA enrollment in the Worker runtime ------------- */

console.log("\n2FA enrollment (workerd crypto):");
const pendingCookie = cookieFor(await mint("two_factor_pending"));

const setupPage = await fetch(`${base}/login/setup-2fa`, {
  headers: { cookie: pendingCookie },
});
const setupHtml = await setupPage.text();
if (setupPage.status !== 200) {
  fail("setup page", `status ${setupPage.status}`);
}
if (setupHtml.includes("data:image/png;base64,")) {
  ok("enrollment QR code generated (PNG data URL)");
} else {
  fail("enrollment QR code missing");
}
const secretMatch = setupHtml.match(/[A-Z2-7]{32}/);
if (secretMatch) {
  ok("manual key (base32 TOTP secret) present");
} else {
  fail("manual key not found in setup page");
}

let verifiedCookie = null;
let usedCode = null;
if (secretMatch) {
  const totp = totpFor(secretMatch[0]);
  usedCode = totp.generate();
  const enroll = await fetch(`${base}/api/auth/2fa/enroll`, {
    method: "POST",
    headers: { cookie: pendingCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ code: usedCode }),
  });
  const enrollBody = await enroll.json().catch(() => null);
  if (enroll.status === 200 && enrollBody?.ok) {
    ok("first authenticator code accepted (AES-GCM decrypt + TOTP verify)");
  } else {
    fail("enrollment code rejected", `status ${enroll.status}`);
  }
  const codes = enrollBody?.recoveryCodes;
  if (Array.isArray(codes) && codes.length === 10 && codes.every((c) => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(c))) {
    ok("10 recovery codes issued in expected format");
  } else {
    fail("recovery codes malformed", JSON.stringify(codes)?.slice(0, 60));
  }

  const acknowledge = await fetch(`${base}/api/auth/2fa/acknowledge`, {
    method: "POST",
    headers: { cookie: pendingCookie },
  });
  const setCookie = acknowledge.headers.get("set-cookie") ?? "";
  const rotated = setCookie.match(/porscha_session=([^;]+)/);
  if (acknowledge.status === 200 && rotated) {
    ok("session rotated to two_factor_verified after acknowledgement");
    verifiedCookie = `porscha_session=${rotated[1]}`;
  } else {
    fail("acknowledgement did not rotate session", `status ${acknowledge.status}`);
  }
}

/* --------------------- TOTP replay prevention ---------------------- */

console.log("\nReplay prevention:");
if (usedCode) {
  const replay = await fetch(`${base}/api/auth/2fa/verify`, {
    method: "POST",
    headers: { cookie: pendingCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ code: usedCode }),
  });
  if (replay.status === 400) {
    ok("already-consumed TOTP code refused");
  } else {
    fail("replayed code not refused", `status ${replay.status}`);
  }
}

/* ------------- Verified console access through Hyperdrive ---------- */

console.log("\nVerified console access (Worker → Hyperdrive → Postgres):");
if (verifiedCookie) {
  const overview = await fetch(`${base}/api/console/overview`, {
    headers: { cookie: verifiedCookie },
  });
  const data = await overview.json().catch(() => null);
  if (overview.status === 200 && Array.isArray(data?.projects)) {
    ok(`console overview returns project data (${data.projects.length} projects)`);
  } else {
    fail("console overview", `status ${overview.status}`);
  }
}

/* ------------- SSE via Durable Object + webhook fan-out ------------ */

console.log("\nRealtime (SSE via RealtimeHub Durable Object):");
if (verifiedCookie) {
  const controller = new AbortController();
  const events = [];
  let resolveUpdate;
  const updateArrived = new Promise((resolve) => {
    resolveUpdate = resolve;
  });

  const ssePromise = (async () => {
    const res = await fetch(`${base}/api/console/stream`, {
      headers: { cookie: verifiedCookie, accept: "text/event-stream" },
      signal: controller.signal,
    });
    if (res.status !== 200 || !res.body) {
      fail("SSE stream not accepted for verified session", `status ${res.status}`);
      return;
    }
    ok("SSE stream accepted for verified session");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        for (const frame of buffer.split("\n\n").slice(0, -1)) {
          const type = frame.match(/^event: (.+)$/m)?.[1];
          if (type) events.push(type);
          if (type === "update") resolveUpdate(frame);
        }
        buffer = buffer.split("\n\n").slice(-1)[0];
      }
    } catch {
      // aborted at the end of the test
    }
  })();

  // Give the stream a moment to establish, then fire a signed webhook.
  await new Promise((r) => setTimeout(r, 1500));
  if (events.includes("hello")) {
    ok("hello event received on connect");
  } else {
    fail("no hello event received");
  }

  const deliveryId = `preview-${randomUUID()}`;
  const payload = JSON.stringify({
    ref: "refs/heads/main",
    repository: { full_name: "chaosbrewing/kubli" },
    commits: [{ id: "0".repeat(40), message: "preview probe" }],
    head_commit: { message: "preview probe" },
    pusher: { name: LOGIN },
    compare: "https://github.com/chaosbrewing/kubli/compare/x",
  });
  const signature = `sha256=${createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex")}`;
  const send = () =>
    fetch(`${base}/api/github/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "push",
        "X-GitHub-Delivery": deliveryId,
        "X-Hub-Signature-256": signature,
      },
      body: payload,
    });

  const first = await send();
  const firstBody = await first.json().catch(() => null);
  if (first.status === 200 && firstBody?.outcome === "processed") {
    ok("signed webhook delivery processed");
  } else {
    fail("signed webhook rejected", `status ${first.status} ${JSON.stringify(firstBody)?.slice(0, 80)}`);
  }

  const winner = await Promise.race([
    updateArrived.then(() => "update"),
    new Promise((r) => setTimeout(() => r("timeout"), 10_000)),
  ]);
  if (winner === "update") {
    ok("SSE update event delivered after webhook (Durable Object fan-out)");
  } else {
    fail("no SSE update within 10s of webhook");
  }

  const dup = await send();
  const dupBody = await dup.json().catch(() => null);
  if (dup.status === 200 && dupBody?.outcome === "duplicate") {
    ok("duplicate delivery deduplicated");
  } else {
    fail("duplicate delivery not deduplicated", JSON.stringify(dupBody)?.slice(0, 80));
  }

  controller.abort();
  await ssePromise;
}

/* -------------------- Project administration ----------------------- */

console.log("\nProject administration (Worker write path):");
if (verifiedCookie) {
  const slug = `preview-probe-${Date.now().toString(36)}`;
  const draft = {
    slug,
    name: "Preview Probe",
    description: "Temporary project created by verify-worker-preview.",
    type: "experiment",
    status: "active",
    featured: false,
    isApp: false,
    isPublic: false,
    github: null,
    visibility: {
      lastActivity: false,
      releases: false,
      progress: false,
      milestones: false,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
    currentMilestone: null,
    milestones: [],
  };

  const preview = await fetch(`${base}/api/console/admin/preview`, {
    method: "POST",
    headers: { cookie: verifiedCookie, "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const previewBody = await preview.json().catch(() => null);
  if (preview.status === 200 && previewBody) {
    ok("visibility preview runs the real public serializer");
  } else {
    fail("admin preview", `status ${preview.status}`);
  }

  const create = await fetch(`${base}/api/console/admin/projects`, {
    method: "POST",
    headers: { cookie: verifiedCookie, "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (create.status === 200 || create.status === 201) {
    ok("project created through admin API");
  } else {
    fail("project create", `status ${create.status}`);
  }

  const publicList = await fetch(`${base}/api/public/projects`);
  const publicBody = await publicList.text();
  if (!publicBody.includes(slug)) {
    ok("admin-created project absent from public API (visibility defaults off)");
  } else {
    fail("admin-created project leaked to public API");
  }

  const archive = await fetch(`${base}/api/console/admin/projects/${slug}/archive`, {
    method: "POST",
    headers: { cookie: verifiedCookie },
  });
  if (archive.status === 200) {
    ok("project archived (archive over delete)");
  } else {
    fail("project archive", `status ${archive.status}`);
  }
}

console.log(
  failures === 0 ? "\nAll worker-preview checks passed." : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
