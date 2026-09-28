"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation, site } from "@/content/site";
import { PMark } from "./PMark";

/**
 * Header: the P. mark, five words, a hairline. On small screens the
 * words fold behind a plain "Menu" button.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-20">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-8 sm:py-6 lg:px-12">
        <Link
          href="/"
          aria-label={`${site.name} — home`}
          className="inline-flex h-11 min-w-11 items-center rounded-[3px] text-[1.6rem] text-ink transition-colors duration-[var(--duration-micro)] hover:text-accent-deep"
        >
          <PMark />
        </Link>

        <nav aria-label="Main" className="hidden sm:block">
          <ul className="flex items-center gap-5 lg:gap-7">
            {navigation.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center px-1 text-[0.9375rem] tracking-[0.01em] transition-colors duration-[var(--duration-micro)] ${
                      current
                        ? "text-ink underline decoration-accent decoration-1 underline-offset-[7px]"
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

        <button
          type="button"
          className="sm:hidden inline-flex h-11 items-center gap-2 rounded-[3px] px-1 text-[0.9375rem] text-ink"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? "Close" : "Menu"}</span>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M3 3l10 10M13 3L3 13" />
            ) : (
              <path d="M2 5h12M2 11h12" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <nav
          aria-label="Main"
          id="mobile-nav"
          className="sm:hidden border-y border-line bg-paper"
        >
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {navigation.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`type-heading flex min-h-12 items-center text-2xl ${
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
    </header>
  );
}
