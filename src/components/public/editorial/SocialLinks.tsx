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
  snapchat: (
    // The ghost, drawn as one outline in the same weight as the rest.
    <path d="M9 2.4c2.3 0 3.8 1.7 3.8 3.9 0 .8-.08 1.5-.13 2 .5.22 1-.14 1.4-.14.42 0 .84.28.84.7 0 .55-.9.86-1.4 1.05-.3.11-.5.2-.5.44 0 .5 1.3 2.3 3 2.75.28.08.4.24.34.5-.12.5-1.2.8-2.1.94-.16.02-.24.16-.28.4-.06.36-.13.7-.5.7-.42 0-.9-.22-1.7-.22-1 0-1.4.9-2.77.9s-1.77-.9-2.77-.9c-.8 0-1.28.22-1.7.22-.37 0-.44-.34-.5-.7-.04-.24-.12-.38-.28-.4-.9-.14-1.98-.44-2.1-.94-.06-.26.06-.42.34-.5 1.7-.45 3-2.25 3-2.75 0-.24-.2-.33-.5-.44-.5-.19-1.4-.5-1.4-1.05 0-.42.42-.7.84-.7.4 0 .9.36 1.4.14-.05-.5-.13-1.2-.13-2C5.2 4.1 6.7 2.4 9 2.4Z" />
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
              <span className="flex flex-col">
                <span className="type-kicker">{link.label}</span>
                <span className="type-caption">{link.handle}</span>
              </span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
