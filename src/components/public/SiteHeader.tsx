"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig, workshopStateCopy } from "@/config/site";

/**
 * Public navigation. The console is deliberately absent — owner access
 * is the discreet "workshop door" link in the footer.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const state = workshopStateCopy[siteConfig.workshopState];

  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="type-heading text-lg tracking-tight hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
          >
            porscha<span className="text-accent">.</span>today
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {siteConfig.nav.map((item) => {
                const current =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={`text-sm transition-colors duration-[var(--duration-micro)] ${
                        current
                          ? "text-ink underline underline-offset-8 decoration-accent decoration-2"
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

          <div className="hidden md:flex items-center" title={state.description}>
            <span className="type-meta text-ink-faint">{state.label}</span>
          </div>

          <button
            type="button"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center -mr-2 text-ink"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
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
                <span className="type-meta text-ink-faint">{state.label}</span>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
