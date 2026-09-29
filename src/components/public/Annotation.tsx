import { PMark } from "./PMark";

/**
 * A handwritten-feeling aside. Kept for the handful of places where a
 * note in the margin earns its place; the seal is optional and small.
 */
export function Annotation({
  children,
  mark = false,
  className = "",
}: {
  children: string;
  mark?: boolean;
  className?: string;
}) {
  return (
    <p className={`type-annotation text-[1.125rem] sm:text-[1.25rem] ${className}`}>
      {mark ? <PMark className="mr-2 text-[0.85em] text-accent" /> : null}
      {children}
    </p>
  );
}
