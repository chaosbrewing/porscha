import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "@/server/env";
import { checkConsoleAccess } from "@/server/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workshop door",
  robots: { index: false, follow: false },
};

const ERROR_COPY: Record<string, string> = {
  unauthorized:
    "That GitHub account isn't on the list for this workshop. If it should be, add it to ALLOWED_GITHUB_LOGINS.",
  state_mismatch:
    "The sign-in attempt looked tampered with, so it was abandoned. Try again.",
  exchange_failed:
    "GitHub didn't complete the sign-in. Try again in a moment.",
  not_configured:
    "GitHub sign-in isn't configured yet — set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await checkConsoleAccess();
  if (access.state === "authorized") redirect("/console/overview");
  if (access.state === "two_factor_pending") {
    redirect(access.needsEnrollment ? "/login/setup-2fa" : "/login/verify");
  }

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_COPY[error] ?? "Sign-in failed." : null;

  return (
    <div className="mx-auto max-w-md px-5 sm:px-8 py-24">
      <h1 className="type-display text-4xl">The workshop door</h1>
      <p className="mt-4 text-ink-soft leading-relaxed">
        This entrance is for Porscha. Visitors are warmly invited to everything
        else — the workshop, lab, gallery, and notes are all open.
      </p>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-6 rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm text-ink"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <a
          href="/api/auth/login"
          className="inline-flex items-center justify-center gap-2 bg-ink-well text-ink-inverse px-5 py-3 text-sm rounded-[3px] hover:bg-ink-well-soft transition-colors duration-[var(--duration-micro)]"
        >
          Sign in with GitHub
        </a>

        {env.devLoginEnabled ? (
          <form action="/api/auth/dev-login" method="post">
            <button
              type="submit"
              className="w-full border border-line-strong px-5 py-3 text-sm rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
            >
              Dev sign-in (local only)
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
