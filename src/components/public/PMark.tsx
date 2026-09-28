/**
 * The "P." device — a quiet signature.
 *
 * Decorative by default (hidden from assistive tech); pass `label` to
 * make it a meaningful mark, e.g. as a link's only content.
 */
export function PMark({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      role={label ? "img" : undefined}
      className={`type-heading inline-block select-none leading-none ${className}`}
      style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40, "WONK" 1' }}
    >
      P.
    </span>
  );
}
