import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";
import { EditorialPhoto } from "@/components/public/editorial/EditorialPhoto";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { SocialLinks } from "@/components/public/editorial/SocialLinks";
import { Wordmark } from "@/components/public/editorial/Wordmark";
import { getBiography } from "@/server/content/loader";
import { roleLine } from "@/config/site";

export const metadata: Metadata = {
  title: "Porscha",
  description:
    "Who Porscha is, how she got here, and what she cares about — the person behind OBRA and Chaos Origins.",
  alternates: { canonical: "/porscha" },
};

/** The bio — a profile page inside Headquarters, set as a feature. */
export default function PorschaPage() {
  const bio = getBiography();

  return (
    <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
      <header className="pt-12 lg:pt-20">
        <SectionLabel label="Profile" aside="Headquarters" />
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
        <div>
          <Wordmark as="h1" className="text-[clamp(2.75rem,8vw,5rem)]" />
          <p className="type-kicker mt-6 text-ink-soft">{roleLine("  •  ")}</p>

          {bio ? (
            <div className="prose-workshop mt-10">
              <div dangerouslySetInnerHTML={{ __html: bio.html }} />
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState title="The bio is still in the drawer">
                In the meantime, the work speaks for itself.
              </EmptyState>
            </div>
          )}

          <section
            aria-labelledby="elsewhere-heading"
            className="mt-14 border-t border-line pt-8"
          >
            <h2 id="elsewhere-heading" className="type-kicker text-ink-faint">
              Elsewhere
            </h2>
            <SocialLinks className="mt-4 gap-x-8" labelled />
          </section>
        </div>

        <div className="order-first lg:order-none">
          <EditorialPhoto
            slot="porscha-portrait"
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="lg:sticky lg:top-8"
          />
        </div>
      </div>
    </div>
  );
}
