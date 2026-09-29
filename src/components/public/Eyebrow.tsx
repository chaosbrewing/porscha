import type { ReactNode } from "react";

/** Small mono label above a heading or a table row. */
export function Eyebrow({
  children,
  className = "",
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "dt" | "h2";
}) {
  return <Tag className={`type-meta text-ink-faint ${className}`}>{children}</Tag>;
}
