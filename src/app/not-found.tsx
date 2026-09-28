import Link from "next/link";
import { PMark } from "@/components/public/PMark";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SITE_DEFAULTS, site } from "@/content/site";

/**
 * Global 404. Lives at the app root (the only place Next.js reads it
 * from for unmatched URLs), so it renders the public shell itself.
 */
export default function NotFound() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader name={site.name} nav={SITE_DEFAULTS.global.navigation} />
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <PMark className="text-3xl text-ink-faint" />
          <h1 className="type-display mt-5 text-5xl">Nothing here.</h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Whatever you were looking for has moved, or never existed. Both
            happen.
          </p>
          <Link href="/" className="link-arrow mt-8 inline-flex min-h-11 text-base">
            <span>Start again</span>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </Link>
        </div>
      </main>
      <SiteFooter
        name={site.name}
        nav={SITE_DEFAULTS.global.navigation}
        social={SITE_DEFAULTS.global.social}
      />
    </>
  );
}
