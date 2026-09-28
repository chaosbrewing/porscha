import type { Metadata } from "next";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Container } from "@/components/public/Container";
import { PageIntro } from "@/components/public/PageIntro";
import { work } from "@/content/site";

export const metadata: Metadata = {
  title: "My work",
  description: work.intro,
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <Container className="pb-20 pt-10 sm:pt-16 lg:pb-32">
      <PageIntro heading={work.heading} intro={work.intro} />

      <ol className="mt-16 border-t border-line lg:mt-24">
        {work.categories.map((category, index) => (
          <li
            key={category.href}
            className="reveal-view grid gap-y-3 border-b border-line py-9 sm:grid-cols-[4rem_minmax(0,1fr)] sm:py-12 lg:grid-cols-[6rem_minmax(0,5fr)_minmax(0,6fr)_auto] lg:items-baseline lg:gap-x-10"
          >
            <span className="type-meta text-ink-faint">
              0{index + 1}
            </span>
            <h2 className="type-display text-[clamp(2rem,5vw,3.25rem)]">
              {category.name}
            </h2>
            <p className="max-w-[30rem] text-[1.0625rem] leading-relaxed text-ink-soft sm:col-start-2 lg:col-start-3">
              {category.description}
            </p>
            <ArrowLink
              href={category.href}
              className="mt-2 min-h-11 text-base sm:col-start-2 lg:col-start-4 lg:mt-0"
            >
              {category.cta}
            </ArrowLink>
          </li>
        ))}
      </ol>
    </Container>
  );
}
