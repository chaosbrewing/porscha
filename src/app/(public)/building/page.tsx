import type { Metadata } from "next";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Container } from "@/components/public/Container";
import { Eyebrow } from "@/components/public/Eyebrow";
import { PMark } from "@/components/public/PMark";
import { sulit } from "@/content/site";

export const metadata: Metadata = {
  title: `${sulit.name} — what I’m building`,
  description: `${sulit.name}: ${sulit.tagline}`,
  alternates: { canonical: "/building" },
};

export default function BuildingPage() {
  return (
    <article className="pb-20 pt-10 sm:pt-16 lg:pb-32">
      <Container>
        <header className="reveal max-w-[44rem]">
          <Eyebrow className="mb-5">{sulit.label}</Eyebrow>
          <h1 className="type-display text-[clamp(2.75rem,8vw,5.5rem)]">
            {sulit.name}
          </h1>
          <p className="type-heading mt-6 text-[clamp(1.375rem,3vw,1.875rem)] text-ink">
            {sulit.tagline}
          </p>
        </header>

        <div className="mt-12 max-w-[36rem] space-y-5 text-[1.0625rem] leading-relaxed text-ink-soft sm:text-lg lg:mt-16">
          {sulit.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Container>

      <Container className="mt-20 lg:mt-28">
        <div className="border-t border-line">
          {sulit.sections.map((section) => (
            <section
              key={section.number}
              aria-labelledby={`sulit-${section.number}`}
              className="reveal-view grid gap-y-4 border-b border-line py-10 sm:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16"
            >
              <h2
                id={`sulit-${section.number}`}
                className="type-heading flex items-baseline gap-4 text-[clamp(1.75rem,4vw,2.5rem)]"
              >
                <span className="type-meta text-ink-faint">{section.number}</span>{" "}
                <span>{section.title}</span>
              </h2>
              <div className="max-w-[34rem] space-y-4 leading-relaxed text-ink-soft">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 lg:mt-16">
          {sulit.link.url ? (
            <ArrowLink href={sulit.link.url} className="min-h-11 text-lg">
              {sulit.link.label}
            </ArrowLink>
          ) : null}
          <ArrowLink href="/now" className="min-h-11 text-lg">
            What’s current
          </ArrowLink>
          <PMark className="ml-auto text-2xl text-ink-faint" />
        </footer>
      </Container>
    </article>
  );
}
