import type { Metadata } from "next";
import Link from "next/link";
import { getActivityFeed, getConsoleOverview } from "@/server/projects/service";
import { AttentionList } from "@/components/console/AttentionList";
import { ActivityStream, filterActivity } from "@/components/console/ActivityStream";
import { CiBadge } from "@/components/console/CiBadge";
import { StatusMark } from "@/components/shared/StatusMark";
import { SyncButton } from "@/components/console/SyncButton";
import { timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Overview" };

export default async function ConsoleOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; timeframe?: string; project?: string }>;
}) {
  const { type, timeframe, project } = await searchParams;
  const [overview, feed] = await Promise.all([
    getConsoleOverview(),
    getActivityFeed({ projectSlug: project, limit: 60 }),
  ]);

  const activity = filterActivity(feed.items, {
    typeGroup: type,
    timeframe,
  });

  const trackedProjects = overview.projects.filter((p) => p.repository);

  return (
    <div className="space-y-12">
      {/* Greeting + calculated counts */}
      <header>
        <h1 className="type-display text-4xl sm:text-5xl">
          {overview.greetingName}
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          <strong className="text-ink font-semibold">
            {overview.counts.active} active
          </strong>
          {" · "}
          <span className={overview.counts.needsAttention > 0 ? "text-alert" : ""}>
            {overview.counts.needsAttention} need
            {overview.counts.needsAttention === 1 ? "s" : ""} attention
          </span>
          {" · "}
          {overview.counts.quiet} quiet
        </p>
        {overview.degraded ? (
          <p className="mt-3 text-sm text-warn border border-warn/40 bg-warn-wash rounded px-4 py-2.5 max-w-xl">
            The database is unreachable — showing registry data without live
            GitHub state.
          </p>
        ) : null}
      </header>

      {/* Attention */}
      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="type-heading text-xl mb-4">
          Needs attention
        </h2>
        <AttentionList items={overview.attention} />
      </section>

      {/* Workbench */}
      <section aria-labelledby="workbench-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="workbench-heading" className="type-heading text-xl">
            Workbench
          </h2>
          <SyncButton />
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[640px] text-sm sm:min-w-0">
            <thead>
              <tr className="text-left border-b border-line-strong">
                <th scope="col" className="type-meta text-ink-faint font-medium py-2.5 pr-4">
                  Project
                </th>
                <th scope="col" className="type-meta text-ink-faint font-medium py-2.5 pr-4">
                  Status
                </th>
                <th scope="col" className="type-meta text-ink-faint font-medium py-2.5 pr-4">
                  Branch
                </th>
                <th scope="col" className="type-meta text-ink-faint font-medium py-2.5 pr-4">
                  CI
                </th>
                <th scope="col" className="type-meta text-ink-faint font-medium py-2.5 pr-4">
                  Milestone
                </th>
                <th scope="col" className="type-meta text-ink-faint font-medium py-2.5">
                  Last activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {trackedProjects.map((p) => (
                <tr key={p.slug} className={p.attention.length > 0 ? "bg-alert-wash/40" : ""}>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/console/projects/${p.slug}`}
                      className="font-medium hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
                    >
                      {p.name}
                    </Link>
                    {p.snapshotStale ? (
                      <span className="ml-2 type-meta text-warn" title="Snapshot may be out of date">
                        Stale
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusMark status={p.status} />
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-ink-soft">
                    {p.isArchived ? "archived" : p.defaultBranch ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <CiBadge status={p.ciStatus} />
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {p.currentMilestone ? (
                      <>
                        {p.currentMilestone.title}
                        {p.currentMilestone.percent !== null ? (
                          <span className="text-ink-faint">
                            {" "}
                            · {p.currentMilestone.percent}%
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 text-ink-soft">
                    {p.lastActivityAt ? timeAgo(p.lastActivityAt) : "No data yet"}
                  </td>
                </tr>
              ))}
              {trackedProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-ink-soft">
                    No projects have GitHub connections yet — register one in{" "}
                    <code className="font-mono text-xs">src/config/registry.ts</code>.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent activity */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="type-heading text-xl mb-4">
          Recent activity
        </h2>
        {feed.degraded ? (
          <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
            The activity stream is unavailable while the database is
            unreachable.
          </p>
        ) : (
          <ActivityStream
            items={activity}
            basePath="/console/overview"
            currentType={type}
            currentTimeframe={timeframe}
            currentProject={project}
            projectOptions={trackedProjects.map((p) => ({
              slug: p.slug,
              name: p.name,
            }))}
          />
        )}
      </section>
    </div>
  );
}
