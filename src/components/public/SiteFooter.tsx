import Link from "next/link";
import Image from "next/image";
import { roleLine, siteConfig } from "@/config/site";
import { SocialLinks } from "./editorial/SocialLinks";
import { Wordmark } from "./editorial/Wordmark";

/**
 * The colophon.
 *
 * Identity, the three worlds, the rooms inside Headquarters, and the
 * copper mark. The mark is the P symbol alone, cropped from the brand
 * lockup: the full lockup carries the retired "Art. Apps. Stories.
 * Origins." line and is never shown on the site. It is copper leaf
 * photographed on white, so it carries its own ground and sits on a
 * deliberate ivory plate — knocking it out would need an alpha channel
 * the file does not have.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-[88rem] px-5 sm:px-10 py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          <div>
            <Wordmark className="text-3xl" />
            <p className="type-kicker mt-4 text-ink-faint">{roleLine()}</p>
            <SocialLinks className="mt-6" />
          </div>

          <nav aria-label="Sections">
            <p className="type-kicker text-ink-faint">Sections</p>
            <ul className="mt-4 space-y-2">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="type-heading text-lg text-ink-soft hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Inside Headquarters">
            <p className="type-kicker text-ink-faint">Inside Headquarters</p>
            <ul className="mt-4 space-y-2">
              {siteConfig.secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start gap-6 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-caption">
            © {new Date().getFullYear()} Porscha · {siteConfig.domain}
          </p>
          <span className="inline-flex items-center justify-center bg-[#fbfaf7] p-1">
            <Image
              src="/brand/porscha-mark.png"
              alt="The Porscha copper mark"
              width={640}
              height={640}
              sizes="72px"
              className="h-auto w-[72px]"
            />
          </span>
        </div>
      </div>
    </footer>
  );
}
