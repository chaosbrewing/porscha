import type { ReactNode } from "react";

/** Quiet, human empty/error state used across the site and console. */
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border border-line rounded-md px-6 py-10 text-center max-w-lg mx-auto">
      <p className="type-heading text-lg text-ink">{title}</p>
      {children ? (
        <div className="mt-2 text-sm text-ink-soft leading-relaxed">
          {children}
        </div>
      ) : null}
    </div>
  );
}
