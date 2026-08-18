import Link from "next/link";
import type { ActivityFeedItem, ActivityType } from "@/types/core";
import { timeAgo } from "@/lib/dates";

/**
 * Unified activity stream, server-rendered. Filters are plain links
 * (query params), so the stream stays fast, crawl-proof, and boring.
 */

const TYPE_GROUPS: Array<{ key: string; label: string; types: ActivityType[] }> =
  [
    { key: "code", label: "Code", types: ["push"] },
    {
      key: "prs",
      label: "PRs",
      types: [
        "pull_request_opened",
        "pull_request_merged",
        "pull_request_closed",
      ],
    },
    { key: "issues", label: "Issues", types: ["issue_opened", "issue_closed"] },
    {
      key: "ci",
      label: "CI",
      types: ["workflow_started", "workflow_passed", "workflow_failed"],
    },
    { key: "releases", label: "Releases", types: ["release_published"] },
  ];

const TIMEFRAMES: Array<{ key: string; label: string; days: number | null }> = [
  { key: "all", label: "All time", days: null },
  { key: "day", label: "24 hours", days: 1 },
  { key: "week", label: "7 days", days: 7 },
  { key: "month", label: "30 days", days: 30 },
];

const TYPE_ICON: Partial<Record<ActivityType, string>> = {
  push: "↑",
  pull_request_opened: "⇄",
  pull_request_merged: "⇄",
  pull_request_closed: "⇄",
  issue_opened: "◦",
  issue_closed: "•",
  workflow_started: "⟳",
  workflow_passed: "✓",
  workflow_failed: "✗",
  release_published: "◆",
};

export function filterActivity(
  items: ActivityFeedItem[],
  opts: { typeGroup?: string; timeframe?: string },
): ActivityFeedItem[] {
  let result = items;
  const group = TYPE_GROUPS.find((g) => g.key === opts.typeGroup);
  if (group) {
    result = result.filter((i) => group.types.includes(i.type));
  }
  const frame = TIMEFRAMES.find((t) => t.key === opts.timeframe);
  if (frame?.days) {
    const cutoff = Date.now() - frame.days * 86_400_000;
    result = result.filter((i) => new Date(i.occurredAt).getTime() >= cutoff);
  }
  return result;
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-2.5 py-1.5 rounded-[3px] border transition-colors duration-[var(--duration-micro)] ${
        active
          ? "border-accent bg-accent text-accent-on"
          : "border-line text-ink-soft hover:text-ink hover:border-line-strong"
      }`}
    >
      {label}
    </Link>
  );
}

export function ActivityStream({
  items,
  basePath,
  currentType,
  currentTimeframe,
  currentProject,
  projectOptions,
}: {
  items: ActivityFeedItem[];
  basePath: string;
  currentType?: string;
  currentTimeframe?: string;
  currentProject?: string;
  projectOptions?: Array<{ slug: string; name: string }>;
}) {
  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      type: currentType,
      timeframe: currentTimeframe,
      project: currentProject,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
          <FilterLink
            href={buildHref({ type: undefined })}
            label="Everything"
            active={!currentType}
          />
          {TYPE_GROUPS.map((g) => (
            <FilterLink
              key={g.key}
              href={buildHref({ type: g.key })}
              label={g.label}
              active={currentType === g.key}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by timeframe">
          {TIMEFRAMES.map((t) => (
            <FilterLink
              key={t.key}
              href={buildHref({ timeframe: t.key === "all" ? undefined : t.key })}
              label={t.label}
              active={
                currentTimeframe === t.key ||
                (!currentTimeframe && t.key === "all")
              }
            />
          ))}
        </div>
      </div>

      {projectOptions && projectOptions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by project">
          <FilterLink
            href={buildHref({ project: undefined })}
            label="All projects"
            active={!currentProject}
          />
          {projectOptions.map((p) => (
            <FilterLink
              key={p.slug}
              href={buildHref({ project: p.slug })}
              label={p.name}
              active={currentProject === p.slug}
            />
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-ink-soft border border-line rounded-md px-4 py-4">
          No activity matches this view. Either the filters are narrow or the
          workshop has been genuinely quiet — both are fine.
        </p>
      ) : (
        <ol className="mt-5 divide-y divide-line border-t border-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-4 py-3">
              <span
                aria-hidden="true"
                className={`font-mono text-sm shrink-0 w-4 text-center ${
                  item.type === "workflow_failed" ? "text-alert" : "text-ink-faint"
                }`}
              >
                {TYPE_ICON[item.type] ?? "·"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed break-words">
                  {item.summary}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  <Link
                    href={`/console/projects/${item.projectSlug}`}
                    className="hover:text-ink transition-colors duration-[var(--duration-micro)]"
                  >
                    {item.projectName}
                  </Link>
                </p>
              </div>
              <time
                dateTime={item.occurredAt}
                className="text-xs text-ink-faint shrink-0"
              >
                {timeAgo(item.occurredAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
