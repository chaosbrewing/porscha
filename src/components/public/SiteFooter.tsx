import Link from "next/link";
import { navigation, site, social } from "@/content/site";
import { PMark } from "./PMark";

/**
 * Footer: the mark, the same five words, outward links, a year. The
 * P. doubles as the quiet door to the owner's console.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-12">
        <div className="flex flex-col gap-5">
          <Link
            href="/login"
            aria-label="Owner sign-in"
            title="Owner sign-in"
            className="inline-flex h-11 w-11 items-center text-[1.6rem] text-ink-faint transition-colors duration-[var(--duration-micro)] hover:text-ink"
          >
            <PMark />
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center px-1 -mx-1 text-sm text-ink-soft transition-colors duration-[var(--duration-micro)] hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-start gap-2 text-sm text-ink-soft sm:items-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {social.map((item) => (
              <li key={item.url}>
                <a
                  href={item.url}
                  rel="me noopener"
                  className="inline-flex min-h-11 items-center transition-colors duration-[var(--duration-micro)] hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-ink-faint">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
