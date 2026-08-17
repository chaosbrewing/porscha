"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LiveStatusIndicator } from "./ConsoleLive";

const NAV = [
  { label: "Overview", href: "/console/overview" },
  { label: "Projects", href: "/console/projects" },
  { label: "Settings", href: "/console/settings" },
  { label: "Security", href: "/console/security" },
];

/**
 * Console navigation: a restrained dark rail on desktop, a compact top
 * bar with a disclosure menu on mobile.
 */
export function ConsoleNav({
  userName,
}: {
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <ul className="flex flex-col gap-1">
      {NAV.map((item) => {
        const current =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`block rounded-[3px] px-3 py-2 text-sm transition-colors duration-[var(--duration-micro)] ${
                current
                  ? "bg-ink-well-soft text-ink-inverse"
                  : "text-ink-inverse-soft hover:text-ink-inverse"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Console"
        className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col justify-between bg-ink-well px-4 py-6"
      >
        <div>
          <Link href="/console/overview" className="block px-3">
            <span className="type-heading text-ink-inverse text-lg">
              Console
            </span>
          </Link>
          <div className="mt-8">{links}</div>
        </div>
        <div className="px-3 space-y-4">
          <LiveStatusIndicator />
          <div className="border-t border-ink-inverse-soft/20 pt-4">
            <p className="text-xs text-ink-inverse-soft truncate">{userName}</p>
            <div className="mt-2 flex items-center gap-4">
              <Link
                href="/"
                className="text-xs text-ink-inverse-soft hover:text-ink-inverse transition-colors duration-[var(--duration-micro)]"
              >
                Public site
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-xs text-ink-inverse-soft hover:text-ink-inverse transition-colors duration-[var(--duration-micro)]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 bg-ink-well text-ink-inverse">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/console/overview" className="type-heading text-base">
            Console
          </Link>
          <div className="flex items-center gap-4">
            <LiveStatusIndicator />
            <button
              type="button"
              aria-expanded={open}
              aria-controls="console-mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center -mr-2"
            >
              <span className="sr-only">
                {open ? "Close console menu" : "Open console menu"}
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
          <nav
            aria-label="Console"
            id="console-mobile-nav"
            className="px-4 pb-4 border-t border-ink-inverse-soft/20 pt-3"
          >
            {links}
            <div className="mt-3 flex items-center gap-5 px-3">
              <Link href="/" className="text-xs text-ink-inverse-soft">
                Public site
              </Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-xs text-ink-inverse-soft">
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        ) : null}
      </div>
    </>
  );
}
