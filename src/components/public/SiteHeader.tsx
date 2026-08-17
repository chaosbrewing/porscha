"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Public navigation, kept visually light: serif wordmark, plain text
 * links, thin rule beneath. No console entry point lives here — the
 * only mark on the right is the light/dark switch.
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
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
