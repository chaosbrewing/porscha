import type { Metadata } from "next";
import Link from "next/link";
import { getConsoleOverview } from "@/server/projects/service";
import { StatusMark } from "@/components/shared/StatusMark";
import { CiBadge } from "@/components/console/CiBadge";
import { timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Projects" };

export default async function ConsoleProjectsPage() {
  const overview = await getConsoleOverview();

  return (
    <div>
      <h1 className="type-display text-4xl sm:text-5xl">Projects</h1>
      <p className="mt-3 text-ink-soft">
        Every registered project — connected or not.
      </p>

      <ul className="mt-8 divide-y divide-line border-t border-line-strong">
        {overview.projects.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/console/projects/${p.slug}`}
              className="group grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <span>
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="type-heading text-lg group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                    {p.name}
                  </span>
                  <StatusMark status={p.status} />
                  {p.attention.length > 0 ? (
                    <span className="type-meta text-alert">
                      {p.attention.length} item{p.attention.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {p.repository ?? "No GitHub connection"}
                </span>
              </span>
              <span className="flex items-center gap-5 text-sm text-ink-soft">
                {p.repository ? <CiBadge status={p.ciStatus} /> : null}
                <span className="text-xs text-ink-faint">
                  {p.lastActivityAt ? timeAgo(p.lastActivityAt) : "—"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
