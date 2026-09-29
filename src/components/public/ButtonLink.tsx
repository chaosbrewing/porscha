import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A small, quiet button: words, an arrow, a hairline border. Used
 * where a link should read as an action rather than a sentence.
 *
 * "outline" and "solid" sit on paper; "inverse" and "inverse-solid"
 * sit over a photograph.
 */
export function ButtonLink({
  href,
  children,
  variant = "outline",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "outline" | "solid" | "inverse" | "inverse-solid";
  className?: string;
}) {
  const classes = `btn btn-${variant} ${className}`;
  const content = (
    <>
      <span>{children}</span>
      <span aria-hidden="true" className="arrow">
        →
      </span>
    </>
  );
  const internal = href.startsWith("/") || href.startsWith("#");
  if (!internal) {
    return (
      <a href={href} rel="me noopener" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
