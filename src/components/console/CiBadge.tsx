import type { CiStatus } from "@/types/core";

const CI_META: Record<CiStatus, { label: string; className: string }> = {
  passing: { label: "CI passing", className: "text-ok" },
  failing: { label: "CI failing", className: "text-alert" },
  pending: { label: "CI running", className: "text-warn" },
  none: { label: "No CI", className: "text-ink-faint" },
  unknown: { label: "CI unknown", className: "text-ink-faint" },
};

/** CI health as text + color; the words carry the meaning. */
export function CiBadge({ status }: { status: CiStatus }) {
  const meta = CI_META[status] ?? CI_META.unknown;
  return <span className={`type-meta ${meta.className}`}>{meta.label}</span>;
}
