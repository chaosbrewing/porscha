import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkConsoleAccess } from "@/server/auth/guard";
import { ConsoleLive } from "@/components/console/ConsoleLive";
import { ConsoleNav } from "@/components/console/ConsoleNav";

export const metadata: Metadata = {
  title: { default: "Console", template: "%s · Console" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Console shell. Authorization happens here server-side for pages (and
 * again in every console API route — the pages and the data they fetch
 * are guarded independently).
 */
export default async function ConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const access = await checkConsoleAccess();

  if (access.state === "unauthenticated") {
    redirect("/login");
  }

  if (access.state === "two_factor_pending") {
    redirect(access.needsEnrollment ? "/login/setup-2fa" : "/login/verify");
  }

  if (access.state === "unauthorized") {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-24">
        <div className="max-w-md text-center">
          <h1 className="type-display text-4xl">Not your bench.</h1>
          <p className="mt-4 text-ink-soft leading-relaxed">
            You&rsquo;re signed in as{" "}
            <strong>{access.user.githubLogin}</strong>, but this console
            belongs to Porscha. The rest of the workshop is open, though.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/"
              className="bg-ink-well text-ink-inverse px-5 py-3 text-sm rounded-[3px] hover:bg-ink-well-soft transition-colors duration-[var(--duration-micro)]"
            >
              Back to the workshop
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="border border-line-strong px-5 py-3 text-sm rounded-[3px] text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConsoleLive>
      <a href="#console-main" className="skip-link">
        Skip to content
      </a>
      <ConsoleNav
        userName={access.user.displayName ?? access.user.githubLogin}
      />
      <main id="console-main" className="md:pl-56 flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 md:py-12">
          {children}
        </div>
      </main>
    </ConsoleLive>
  );
}
