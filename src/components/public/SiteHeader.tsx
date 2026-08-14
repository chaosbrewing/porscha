"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";

/**
 * Public navigation, kept visually light: serif wordmark, plain text
 * links, thin rule beneath. The console stays out of the nav — owner
 * access is the small, quiet mark on the far right.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-7xl px-5 sm:px-10">
        <div className="flex items-center justify-between gap-6 py-5">
          <Link
            href="/"
            className="type-heading text-xl tracking-tight hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
          >
            porscha.today
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-9">
              {siteConfig.nav.map((item) => {
                const current =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={`text-[0.9375rem] transition-colors duration-[var(--duration-micro)] ${
                        current
                          ? "text-ink font-medium"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            {/* The discreet owner door. */}
            <Link
              href="/login"
              aria-label="Owner sign-in"
              title="Owner sign-in"
              className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="9" cy="9" r="2.4" />
                <path d="M9 1.5v2.2M9 14.3v2.2M1.5 9h2.2M14.3 9h2.2M3.7 3.7l1.6 1.6M12.7 12.7l1.6 1.6M14.3 3.7l-1.6 1.6M5.3 12.7l-1.6 1.6" />
              </svg>
            </Link>

            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center -mr-2 text-ink"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                {open ? (
                  <path d="M4 4l12 12M16 4L4 16" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open ? (
          <nav aria-label="Main" id="mobile-nav" className="md:hidden pb-4">
            <ul className="flex flex-col gap-1">
              {siteConfig.nav.map((item) => {
                const current =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block py-2.5 text-base ${
                        current ? "text-accent-deep" : "text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2 border-t border-line mt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-sm text-ink-faint"
                >
                  Owner sign-in
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
