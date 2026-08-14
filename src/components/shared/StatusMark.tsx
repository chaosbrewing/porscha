import type { ProjectStatus } from "@/types/core";

/**
 * Project status as a small dot + mono label. Status is always
 * communicated by the label text, never by color alone.
 */

const STATUS_META: Record<
  ProjectStatus,
  { label: string; dotClass: string; live?: boolean }
> = {
  building: { label: "Building", dotClass: "bg-accent", live: true },
  active: { label: "Active", dotClass: "bg-ok" },
  experimenting: { label: "Experimenting", dotClass: "bg-warn" },
  quiet: { label: "Quiet", dotClass: "bg-ink-faint" },
  paused: { label: "Paused", dotClass: "bg-ink-faint" },
  shipped: { label: "Shipped", dotClass: "bg-ok" },
  archived: { label: "Archived", dotClass: "bg-line-strong" },
};

export function statusLabel(status: ProjectStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function StatusMark({
  status,
  className = "",
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.quiet;
  return (
    <span
      className={`inline-flex items-center gap-2 text-ink-soft type-meta ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${meta.dotClass} ${meta.live ? "pulse-live" : ""}`}
      />
      {meta.label}
    </span>
  );
}
