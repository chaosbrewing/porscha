import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm text-ink-soft">
            Made by hand in the workshop.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            © {new Date().getFullYear()} Porscha
          </p>
        </div>
        <ul className="flex items-center gap-6">
          {siteConfig.elsewhere.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                rel="me noopener"
                className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            {/* The discreet owner door. Not hidden — just quiet. */}
            <Link
              href="/login"
              className="text-sm text-ink-faint hover:text-ink transition-colors duration-[var(--duration-micro)]"
            >
              Workshop door
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
