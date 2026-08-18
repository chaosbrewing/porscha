"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { Wordmark } from "./editorial/Wordmark";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The masthead bar.
 *
 * POR$CHA on the left, three words on the right — ART, APPS,
 * HEADQUARTERS — and a hairline beneath. Everything deeper (workshop,
 * notes, lab, the bio) is reached from Headquarters or the footer, so
 * the top of every page stays a magazine masthead rather than a menu.
 *
 * No console entry point lives here; the only other mark is the
 * light/dark switch.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
        <div className="flex items-center justify-between gap-6 py-5 sm:py-6">
          <Link
            href="/"
            aria-label={`${siteConfig.name} — home`}
            className="shrink-0 transition-opacity duration-[var(--duration-micro)] hover:opacity-80"
          >
            <Wordmark className="text-[1.4rem] sm:text-[1.7rem]" />
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-10">
              {siteConfig.nav.map((item) => {
                const current = isCurrent(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={`type-kicker py-1 transition-colors duration-[var(--duration-micro)] ${
                        current
                          ? "text-ink"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {item.label.toUpperCase()}
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 block h-px ${
                          current ? "bg-accent" : "bg-transparent"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            {/* The sun mark is the light/dark switch. The owner door is
                not in the header at all — it's the magnifying glass on
                the home page. */}
            <ThemeToggle />

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
                strokeWidth="1.5"
              >
                {open ? (
                  <path d="M4 4l12 12M16 4L4 16" />
                ) : (
                  <path d="M3 6.5h14M3 13.5h14" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open ? (
          <nav aria-label="Main" id="mobile-nav" className="md:hidden pb-6">
            <ul className="border-t border-line">
              {siteConfig.nav.map((item) => (
                <li key={item.href} className="border-b border-line">
                  <Link
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`type-feature block py-4 text-3xl ${
                      isCurrent(item.href) ? "text-accent" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {siteConfig.secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="type-kicker text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
