import type { ReactNode } from "react";

/**
 * A running head: section numeral, label, and a hairline that carries
 * the eye across the spread. The numeral is what makes the site read
 * as an issue rather than a menu.
 */
export function SectionLabel({
  number,
  label,
  aside,
  className = "",
}: {
  /** Two-digit section numeral, e.g. "01". Omitted for unnumbered rows. */
  number?: string;
  label: string;
  /** Right-hand marginalia — a count, a year, a state. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 sm:gap-6 ${className}`}>
      {number ? (
        <span className="type-numeral text-2xl text-accent tabular-nums">
          {number}
        </span>
      ) : null}
      <span className="type-kicker text-ink-faint whitespace-nowrap">
        {label}
      </span>
      <span aria-hidden="true" className="rule flex-1" />
      {aside ? (
        <span className="type-kicker text-ink-faint whitespace-nowrap">
          {aside}
        </span>
      ) : null}
    </div>
  );
}
