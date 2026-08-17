"use client";

import { useSyncExternalStore } from "react";

/**
 * Light/dark toggle — the sun mark in the header.
 *
 * Three states exist in CSS (light, dark, and "follow the system"),
 * but the control is a two-way switch: pressing it commits to the
 * opposite of whatever is currently showing. Until then the site
 * follows the system preference.
 *
 * The theme is browser state, not React state, so it's read through
 * `useSyncExternalStore` — the server can't know which theme is
 * showing, and this is the supported way to say so without a
 * hydration mismatch. The stamp on <html> is applied before paint by
 * the inline script in the root layout; this only keeps it in sync.
 */

export const THEME_STORAGE_KEY = "porscha-theme";
const THEME_EVENT = "porscha-theme-change";

type Theme = "light" | "dark";

function readTheme(): Theme {
  const stamped = document.documentElement.dataset.theme;
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

/** Undetermined on the server — rendering a guess flashes the wrong icon. */
const serverSnapshot = (): Theme | null => null;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverSnapshot);

  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice still applies to
      // this page view, it just won't survive a reload.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === null
          ? "Switch between light and dark"
          : `Switch to ${isDark ? "light" : "dark"} mode`
      }
      title={isDark ? "Switch to light" : "Switch to dark"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:text-accent-deep transition-colors duration-[var(--duration-micro)] ${className}`}
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
        {isDark ? (
          // Crescent — pressing returns to light.
          <path d="M15.2 11.1A6.6 6.6 0 0 1 6.9 2.8a6.6 6.6 0 1 0 8.3 8.3Z" />
        ) : (
          <>
            <circle cx="9" cy="9" r="2.4" />
            <path d="M9 1.5v2.2M9 14.3v2.2M1.5 9h2.2M14.3 9h2.2M3.7 3.7l1.6 1.6M12.7 12.7l1.6 1.6M14.3 3.7l-1.6 1.6M5.3 12.7l-1.6 1.6" />
          </>
        )}
      </svg>
    </button>
  );
}
