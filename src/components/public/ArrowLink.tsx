import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The site's one call-to-action style: words and an arrow. Internal
 * paths use next/link; anything else is a plain anchor.
 */
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const external = !href.startsWith("/");
  const classes = `link-arrow ${className}`;
  const content = (
    <>
      <span>{children}</span>
      <span aria-hidden="true" className="arrow">
        →
      </span>
    </>
  );
  if (external) {
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
