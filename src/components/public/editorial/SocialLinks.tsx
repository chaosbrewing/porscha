import type { ReactNode } from "react";
import { configuredSocials, type SocialId } from "@/config/site";

/**
 * Social links, set beside the identity.
 *
 * Only accounts configured in `src/config/site.ts` are rendered — an
 * unset handle is a held slot there, not a dead link here.
 */

const MARKS: Record<SocialId, ReactNode> = {
  instagram: (
    <>
      <rect x="2.6" y="2.6" width="12.8" height="12.8" rx="4" />
      <circle cx="9" cy="9" r="3.1" />
      <circle cx="13.1" cy="4.9" r="0.75" fill="currentColor" stroke="none" />
    </>
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M9 1.2A7.8 7.8 0 0 0 6.53 16.4c.39.07.53-.17.53-.37v-1.45c-2.17.47-2.63-1.05-2.63-1.05-.35-.9-.87-1.14-.87-1.14-.71-.49.06-.48.06-.48.79.06 1.2.81 1.2.81.7 1.2 1.83.85 2.28.65.07-.51.27-.85.5-1.05-1.74-.2-3.56-.87-3.56-3.86 0-.86.3-1.55.8-2.1-.08-.2-.35-.99.08-2.06 0 0 .65-.21 2.14.8a7.4 7.4 0 0 1 3.9 0c1.49-1.01 2.14-.8 2.14-.8.43 1.07.16 1.86.08 2.06.5.55.8 1.24.8 2.1 0 3-1.83 3.66-3.57 3.85.28.25.53.72.53 1.46v2.17c0 .21.14.45.54.37A7.8 7.8 0 0 0 9 1.2Z"
    />
  ),
  linkedin: (
    <>
      <rect x="2.6" y="2.6" width="12.8" height="12.8" rx="2" />
      <path d="M5.9 7.6v4.9M5.9 5.3v.05M9 12.5V7.6M9 9.4c0-1 .7-1.8 1.7-1.8s1.6.8 1.6 1.8v3.1" />
    </>
  ),
  mail: (
    <>
      <rect x="2.2" y="4" width="13.6" height="10" rx="1.5" />
      <path d="m2.8 5.2 6.2 4.4 6.2-4.4" />
    </>
  ),
};

export function SocialLinks({
  className = "",
  labelled = false,
}: {
  className?: string;
  /** Prints the platform name beside the mark, for the footer. */
  labelled?: boolean;
}) {
  const links = configuredSocials();
  if (links.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            rel={link.id === "mail" ? undefined : "me noopener"}
            aria-label={link.label}
            title={link.label}
            className="group inline-flex items-center gap-2 py-1 text-ink-soft transition-colors duration-[var(--duration-micro)] hover:text-accent-deep"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {MARKS[link.id]}
            </svg>
            {labelled ? (
              <span className="type-kicker">{link.label}</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
