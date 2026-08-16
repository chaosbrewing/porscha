import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivityFeed, getPrivateProject } from "@/server/projects/service";
import { listAdminEvents } from "@/server/projects/store";
import { ActivityStream, filterActivity } from "@/components/console/ActivityStream";
import { CiBadge } from "@/components/console/CiBadge";
import { StatusMark } from "@/components/shared/StatusMark";
import { ProgressMeter } from "@/components/shared/ProgressMeter";
import { SyncButton } from "@/components/console/SyncButton";
import { formatDate, timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ type?: string; timeframe?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project } = await params;
  return { title: project };
}

export default async function ConsoleProjectPage({ params, searchParams }: Props) {
  const { project: slug } = await params;
  const { type, timeframe } = await searchParams;
  const [project, feed, adminEvents] = await Promise.all([
    getPrivateProject(slug),
    getActivityFeed({ projectSlug: slug, limit: 40 }),
    listAdminEvents(slug, 8).catch(() => []),
  ]);
  if (!project) notFound();

  const detail = project.detail;
  const activity = filterActivity(feed.items, { typeGroup: type, timeframe });
  const hasSnapshot = project.snapshotUpdatedAt !== null;

  return (
    <div className="space-y-10">
      <header>
        <p className="mb-3">
          <Link
            href="/console/projects"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
          >
            ← Projects
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <h1 className="type-display text-4xl sm:text-5xl">{project.name}</h1>
          <StatusMark status={project.status} />
          {project.isArchived ? (
            <span className="type-meta text-ink-faint">Repository archived</span>
          ) : null}
        </div>
        <p className="mt-3 text-ink-soft max-w-2xl leading-relaxed">
          {project.description}
        </p>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link
            href={`/console/projects/${project.slug}/edit`}
            className="rounded-[4px] bg-accent px-4 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep transition-colors duration-[var(--duration-micro)]"
          >
            Edit project
          </Link>
          <SyncButton />
          {project.repositoryUrl ? (
            <a
              href={project.repositoryUrl}
              rel="noopener"
              className="border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
            >
              View repository
            </a>
          ) : null}
          <Link
            href={`/console/projects/${project.slug}/edit#ms-h`}
            className="border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
          >
            Manage milestones
          </Link>
          <Link
            href={`/workshop/${project.slug}`}
            className="border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
          >
            Preview public page
          </Link>
        </div>

        {project.repository ? (
          <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <a
              href={project.repositoryUrl}
              rel="noopener"
              className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
            >
              {project.repository}
            </a>
            {project.defaultBranch ? (
              <span className="font-mono text-xs text-ink-soft">
                {project.defaultBranch}
              </span>
            ) : null}
            <CiBadge status={project.ciStatus} />
            <span className="text-ink-faint text-xs">
              {project.lastActivityAt
                ? `Last activity ${timeAgo(project.lastActivityAt)}`
                : "No activity recorded"}
            </span>
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink-soft border border-line rounded-md px-4 py-3 max-w-xl">
            This project has no GitHub connection. Add one in the registry to
            see repository state here.
          </p>
        )}

        {project.repository && !hasSnapshot ? (
          <p className="mt-4 text-sm text-warn border border-warn/40 bg-warn-wash rounded px-4 py-3 max-w-xl">
            No snapshot yet — run a sync to pull this repository&rsquo;s state
            for the first time. <span className="ml-2"><SyncButton /></span>
          </p>
        ) : project.snapshotStale ? (
          <p className="mt-4 text-sm text-warn border border-warn/40 bg-warn-wash rounded px-4 py-3 max-w-xl">
            Snapshot last updated {timeAgo(project.snapshotUpdatedAt)} — it may
            be out of date. <span className="ml-2"><SyncButton /></span>
          </p>
        ) : null}
      </header>

      {/* Attention for this project */}
      {project.attention.length > 0 ? (
        <section aria-labelledby="proj-attention">
          <h2 id="proj-attention" className="type-heading text-lg mb-3">
            Needs attention
          </h2>
          <ul className="space-y-2">
            {project.attention.map((a, i) => (
              <li key={i} className="text-sm text-ink border border-alert/30 bg-alert-wash/60 rounded px-4 py-2.5">
                {a.url ? (
                  <a href={a.url} rel="noopener" className="underline underline-offset-4">
                    {a.message}
                  </a>
                ) : (
                  a.message
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Milestones */}
      <section aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="type-heading text-lg mb-3">
          Milestones
        </h2>
        {project.milestones.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {project.milestones.map((m) => (
              <div
                key={m.slug}
                className={`border rounded-md px-5 py-4 ${
                  m.isCurrent ? "border-accent" : "border-line"
                }`}
              >
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{m.title}</span>
                  {m.isCurrent ? (
                    <span className="type-meta text-accent">Current</span>
                  ) : null}
                </p>
                {m.publicSummary ? (
                  <p className="mt-1 text-sm text-ink-soft">{m.publicSummary}</p>
                ) : null}
                <div className="mt-3">
                  {m.percent !== null ? (
                    <ProgressMeter done={m.done} total={m.total} label={`${m.title} progress`} />
                  ) : (
                    <p className="text-sm text-ink-soft">No scoped work items</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
            No milestones defined. Add them to this project&rsquo;s registry
            entry when the work has shape.
          </p>
        )}
      </section>

      {/* Open PRs and issues */}
      {project.repository ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="prs-heading">
            <h2 id="prs-heading" className="type-heading text-lg mb-3">
              Open pull requests{" "}
              <span className="text-ink-faint text-sm font-normal">
                {project.openPullRequestCount}
              </span>
            </h2>
            {detail?.openPullRequests?.length ? (
              <ul className="divide-y divide-line border border-line rounded-md">
                {detail.openPullRequests.map((pr) => (
                  <li key={pr.number} className="px-4 py-3">
                    <a href={pr.url} rel="noopener" className="group block">
                      <p className="text-sm font-medium group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                        #{pr.number} {pr.title}
                        {pr.draft ? (
                          <span className="ml-2 type-meta text-ink-faint">Draft</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {pr.author ?? "unknown"} · updated {timeAgo(pr.updatedAt)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
                {hasSnapshot ? "No open pull requests." : "No snapshot yet."}
              </p>
            )}
          </section>

          <section aria-labelledby="issues-heading">
            <h2 id="issues-heading" className="type-heading text-lg mb-3">
              Open issues{" "}
              <span className="text-ink-faint text-sm font-normal">
                {project.openIssueCount}
              </span>
            </h2>
            {detail?.openIssues?.length ? (
              <ul className="divide-y divide-line border border-line rounded-md">
                {detail.openIssues.map((issue) => (
                  <li key={issue.number} className="px-4 py-3">
                    <a href={issue.url} rel="noopener" className="group block">
                      <p className="text-sm font-medium group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                        #{issue.number} {issue.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        updated {timeAgo(issue.updatedAt)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
                {hasSnapshot ? "No open issues." : "No snapshot yet."}
              </p>
            )}
          </section>
        </div>
      ) : null}

      {/* Recent commits + release */}
      {project.repository ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="commits-heading">
            <h2 id="commits-heading" className="type-heading text-lg mb-3">
              Recent commits
            </h2>
            {detail?.recentCommits?.length ? (
              <ul className="divide-y divide-line border border-line rounded-md">
                {detail.recentCommits.map((c) => (
                  <li key={c.sha} className="px-4 py-2.5">
                    <a href={c.url} rel="noopener" className="group block">
                      <p className="text-sm break-words group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                        {c.message}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-faint font-mono">
                        {c.sha} · {c.author ?? "unknown"}
                        {c.committedAt ? ` · ${timeAgo(c.committedAt)}` : ""}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
                {hasSnapshot
                  ? "No commits in the snapshot."
                  : "No snapshot yet."}
              </p>
            )}
          </section>

          <section aria-labelledby="release-heading" className="space-y-8">
            <div>
              <h2 id="release-heading" className="type-heading text-lg mb-3">
                Latest release
              </h2>
              {project.latestRelease ? (
                <div className="border border-line rounded-md px-5 py-4">
                  <p className="font-medium">
                    {project.latestRelease.tag}
                    {project.latestRelease.name ? (
                      <span className="text-ink-soft font-normal">
                        {" "}
                        — {project.latestRelease.name}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-ink-faint">
                    {formatDate(project.latestRelease.publishedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
                  Nothing released yet.
                </p>
              )}
            </div>

            {detail?.activeBranches?.length ? (
              <div>
                <h2 className="type-heading text-lg mb-3">Branches</h2>
                <ul className="flex flex-wrap gap-2">
                  {detail.activeBranches.map((b) => (
                    <li
                      key={b}
                      className="font-mono text-xs text-ink-soft border border-line rounded px-2 py-1"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {/* Administration audit trail */}
      {adminEvents.length > 0 ? (
        <section aria-labelledby="admin-events-heading">
          <h2 id="admin-events-heading" className="type-heading text-lg mb-3">
            Recent changes
          </h2>
          <ol className="divide-y divide-line border border-line rounded-md text-sm">
            {adminEvents.map((e) => (
              <li key={e.id} className="flex justify-between gap-6 px-5 py-3">
                <span>
                  {(
                    {
                      project_created: "Project created",
                      project_edited: "Configuration edited",
                      repository_connected: "Repository connected",
                      repository_disconnected: "Repository disconnected",
                      visibility_changed: "Public visibility changed",
                      project_archived: "Project archived",
                    } as Record<string, string>
                  )[e.action] ?? e.action}
                </span>
                <time
                  dateTime={e.createdAt.toISOString()}
                  className="text-xs text-ink-faint shrink-0 self-center"
                >
                  {timeAgo(e.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Activity for this project */}
      <section aria-labelledby="proj-activity-heading">
        <h2 id="proj-activity-heading" className="type-heading text-lg mb-3">
          Activity
        </h2>
        {feed.degraded ? (
          <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
            The activity stream is unavailable while the database is
            unreachable.
          </p>
        ) : (
          <ActivityStream
            items={activity}
            basePath={`/console/projects/${project.slug}`}
            currentType={type}
            currentTimeframe={timeframe}
          />
        )}
      </section>
    </div>
  );
}
