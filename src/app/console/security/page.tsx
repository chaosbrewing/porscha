import type { Metadata } from "next";
import { checkConsoleAccess } from "@/server/auth/guard";
import {
  getTwoFactorStatus,
  listSecurityEvents,
} from "@/server/auth/twofactor";
import {
  RegenerateRecoveryCodes,
  ReplaceAuthenticator,
} from "@/components/auth/SecurityActions";
import { formatDate, timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Security" };

const EVENT_LABEL: Record<string, string> = {
  twofactor_enrolled: "Two-factor authentication enabled",
  twofactor_verified: "Signed in with authenticator",
  totp_failed: "Failed authenticator attempt",
  recovery_code_used: "Recovery code used",
  recovery_failed: "Failed recovery-code attempt",
  recovery_codes_regenerated: "Recovery codes regenerated",
  authenticator_replaced: "Authenticator replaced",
  verification_rate_limited: "Verification rate-limited",
  login_denied_unauthorized: "Sign-in denied (not on allowlist)",
};

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ recovery?: string }>;
}) {
  const access = await checkConsoleAccess();
  // The console layout has already enforced authorization; this is
  // defense in depth for direct renders.
  if (access.state !== "authorized") return null;
  const { recovery } = await searchParams;

  const isDevUser = access.user.id.startsWith("dev:");
  const [status, events] = isDevUser
    ? [null, []]
    : await Promise.all([
        getTwoFactorStatus(access.user.id),
        listSecurityEvents(access.user.id, 20),
      ]);

  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <h1 className="type-display text-4xl sm:text-5xl">Security</h1>
        <p className="mt-3 text-ink-soft">
          Who can open the workshop door, and how.
        </p>
        {recovery === "used" ? (
          <p className="mt-4 rounded border border-warn/40 bg-warn-wash px-4 py-3 text-sm max-w-xl">
            You signed in with a recovery code
            {status ? ` — ${status.recoveryCodesRemaining} remaining` : ""}.
            If your authenticator is gone for good, replace it below.
          </p>
        ) : null}
      </header>

      <section aria-labelledby="account-heading">
        <h2 id="account-heading" className="type-heading text-lg mb-3">
          Account
        </h2>
        <dl className="border border-line rounded-md divide-y divide-line text-sm">
          <div className="flex justify-between gap-6 px-5 py-3.5">
            <dt className="text-ink-soft">GitHub account</dt>
            <dd className="font-mono text-xs self-center">
              {access.user.githubLogin}
            </dd>
          </div>
          <div className="flex justify-between gap-6 px-5 py-3.5">
            <dt className="text-ink-soft">Two-factor authentication</dt>
            <dd>
              {isDevUser ? (
                <span className="type-meta text-ink-faint">
                  Dev session (local only)
                </span>
              ) : status?.enrolled ? (
                <span className="type-meta text-ok">Enabled</span>
              ) : (
                <span className="type-meta text-alert">Not enrolled</span>
              )}
            </dd>
          </div>
          {status?.enabledAt ? (
            <div className="flex justify-between gap-6 px-5 py-3.5">
              <dt className="text-ink-soft">Authenticator since</dt>
              <dd>{formatDate(status.enabledAt)}</dd>
            </div>
          ) : null}
          {status?.enrolled ? (
            <div className="flex justify-between gap-6 px-5 py-3.5">
              <dt className="text-ink-soft">Recovery codes remaining</dt>
              <dd
                className={
                  status.recoveryCodesRemaining <= 2 ? "text-alert" : ""
                }
              >
                {status.recoveryCodesRemaining}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {status?.enrolled ? (
        <section aria-labelledby="actions-heading" className="space-y-4">
          <h2 id="actions-heading" className="type-heading text-lg">
            Authenticator
          </h2>
          <RegenerateRecoveryCodes />
          <ReplaceAuthenticator />
        </section>
      ) : null}

      <section aria-labelledby="events-heading">
        <h2 id="events-heading" className="type-heading text-lg mb-3">
          Recent security events
        </h2>
        {events.length > 0 ? (
          <ol className="divide-y divide-line border border-line rounded-md text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-6 px-5 py-3">
                <span>{EVENT_LABEL[e.type] ?? e.type}</span>
                <time
                  dateTime={e.createdAt.toISOString()}
                  className="text-xs text-ink-faint shrink-0 self-center"
                >
                  {timeAgo(e.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
            Nothing recorded yet.
          </p>
        )}
      </section>
    </div>
  );
}
