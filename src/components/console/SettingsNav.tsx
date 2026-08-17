"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Section tabs inside Settings. Gallery is the only section that has
 * graduated from file-backed content so far; lab and notes will sit
 * beside it when they do.
 */
const SECTIONS = [{ label: "Gallery", href: "/console/settings/gallery" }];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="mt-6 border-b border-line">
      <ul className="flex flex-wrap gap-1">
        {SECTIONS.map((s) => {
          const current = pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={current ? "page" : undefined}
                className={`-mb-px block border-b-2 px-4 py-2.5 text-sm transition-colors duration-[var(--duration-micro)] ${
                  current
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
