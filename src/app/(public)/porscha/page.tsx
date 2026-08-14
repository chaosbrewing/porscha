import type { Metadata } from "next";
import { Portrait } from "@/components/public/Portrait";
import { EmptyState } from "@/components/shared/EmptyState";
import { getBiography } from "@/server/content/loader";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Porscha",
  description: "Who Porscha is, how she got here, and what she cares about.",
  alternates: { canonical: "/porscha" },
};

export default function PorschaPage() {
  const bio = getBiography();

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="grid gap-12 py-14 md:py-20 md:grid-cols-[7fr_5fr] md:gap-16">
        <div>
          <h1 className="type-display text-5xl sm:text-6xl">Porscha</h1>
          {bio ? (
            <div
              className="prose-workshop mt-8"
              dangerouslySetInnerHTML={{ __html: bio.html }}
            />
          ) : (
            <div className="mt-10">
              <EmptyState title="The bio is still in the drawer">
                In the meantime, the work in the workshop speaks for itself.
              </EmptyState>
            </div>
          )}

          <section aria-labelledby="elsewhere-heading" className="mt-12 border-t border-line pt-8">
            <h2 id="elsewhere-heading" className="type-meta text-ink-faint">
              Elsewhere
            </h2>
            <ul className="mt-3 flex flex-wrap gap-6">
              {siteConfig.elsewhere.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    rel="me noopener"
                    className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="order-first md:order-none">
          <Portrait className="md:sticky md:top-8" />
        </div>
      </div>
    </div>
  );
}
