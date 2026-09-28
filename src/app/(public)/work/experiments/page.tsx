import type { Metadata } from "next";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Container } from "@/components/public/Container";
import { PageIntro } from "@/components/public/PageIntro";
import { experiments } from "@/content/site";

export const metadata: Metadata = {
  title: "Experiments",
  description: experiments.intro,
  alternates: { canonical: "/work/experiments" },
};

export default function ExperimentsPage() {
  return (
    <Container className="pb-20 pt-10 sm:pt-16 lg:pb-32">
      <PageIntro
        eyebrow="My work"
        heading={experiments.heading}
        intro={experiments.intro}
      />

      {experiments.items.length > 0 ? (
        <ul className="mt-16 border-t border-line lg:mt-24">
          {experiments.items.map((item) => (
            <li
              key={item.name}
              className="reveal-view grid gap-y-2 border-b border-line py-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] sm:items-baseline sm:gap-x-10"
            >
              <h2 className="type-heading text-2xl">{item.name}</h2>
              <p className="max-w-[30rem] leading-relaxed text-ink-soft">
                {item.description}
              </p>
              {item.href ? (
                <ArrowLink href={item.href} className="min-h-11 text-sm">
                  Have a look
                </ArrowLink>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-16 max-w-[34rem] border-t border-line pt-10 lg:mt-24">
          <p className="type-heading text-2xl">Being written up.</p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            {experiments.emptyNote}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href="/now" className="min-h-11 text-base">
              What’s current
            </ArrowLink>
            <ArrowLink href="/building" className="min-h-11 text-base">
              What I’m building
            </ArrowLink>
          </div>
        </div>
      )}
    </Container>
  );
}
