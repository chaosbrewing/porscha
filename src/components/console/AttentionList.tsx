import Link from "next/link";
import type { AttentionItem } from "@/types/core";
import { timeAgo } from "@/lib/dates";

const KIND_LABEL: Record<AttentionItem["kind"], string> = {
  ci_failing: "CI",
  pr_awaiting_review: "Review",
  stale_pr: "Stale PR",
  milestone_stalled: "Milestone",
  repo_inactive: "Inactive",
  sync_failed: "Sync",
};

/**
 * The attention feed. Empty is a good outcome and is presented as one —
 * items appear only for genuinely actionable problems.
 */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
        Nothing needs you right now. The workbench is calm.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line border border-line rounded-md">
      {items.map((item, i) => (
        <li key={`${item.kind}-${item.projectSlug}-${i}`} className="px-4 py-3.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="type-meta text-alert shrink-0">
              {KIND_LABEL[item.kind]}
            </span>
            <Link
              href={`/console/projects/${item.projectSlug}`}
              className="text-sm font-medium hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
            >
              {item.projectName}
            </Link>
            {item.since ? (
              <span className="text-xs text-ink-faint ml-auto shrink-0">
                {timeAgo(item.since)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed">
            {item.url ? (
              <a
                href={item.url}
                rel="noopener"
                className="hover:text-ink underline underline-offset-4 decoration-line-strong hover:decoration-accent"
              >
                {item.message}
              </a>
            ) : (
              item.message
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
