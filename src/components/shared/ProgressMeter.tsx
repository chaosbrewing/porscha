/**
 * Milestone progress as a thin segmented meter. Only rendered when
 * progress derives from real scoped work items; callers show
 * "Active development" otherwise.
 */
export function ProgressMeter({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label?: string;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? `Milestone progress: ${done} of ${total} items done`}
        className="flex gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-[var(--duration-normal)] ${
              i < done ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        {done} of {total} · {percent}%
      </p>
    </div>
  );
}
