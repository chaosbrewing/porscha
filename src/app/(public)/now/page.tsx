import type { Metadata } from "next";
import Link from "next/link";
import { Annotation } from "@/components/public/Annotation";
import { Container } from "@/components/public/Container";
import { currently } from "@/content/site";

export const metadata: Metadata = {
  title: "Currently",
  description: `What Porscha is building, exploring, making and thinking about — updated ${currently.updated}.`,
  alternates: { canonical: "/now" },
};

export default function NowPage() {
  return (
    <Container width="text" className="pb-20 pt-10 sm:pt-16 lg:pb-32">
      <header className="reveal">
        <h1 className="type-display text-[clamp(3rem,9vw,6rem)]">
          {currently.heading}
        </h1>
      </header>

      <dl className="reveal mt-12 border-t border-line lg:mt-16" style={{ ["--reveal-step" as string]: 1 }}>
        {currently.entries.map((entry) => (
          <div
            key={entry.label}
            className="grid gap-y-1 border-b border-line py-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-x-8 sm:py-7"
          >
            <dt className="type-meta pt-1.5 text-ink-faint">{entry.label}</dt>
            <dd className="type-heading text-[clamp(1.5rem,3.5vw,2rem)]">
              {entry.href ? (
                <Link
                  href={entry.href}
                  className="underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors duration-[var(--duration-micro)] hover:decoration-accent hover:text-accent-deep"
                >
                  {entry.value}
                </Link>
              ) : (
                entry.value
              )}
            </dd>
          </div>
        ))}
        <div className="grid gap-y-1 border-b border-line py-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-x-8 sm:py-7">
          <dt className="type-meta pt-1.5 text-ink-faint">Updated</dt>
          <dd className="type-heading text-[clamp(1.5rem,3.5vw,2rem)] text-ink-soft">
            {currently.updated}
          </dd>
        </div>
      </dl>

      <Annotation mark className="reveal mt-10" >
        {currently.annotation}
      </Annotation>
    </Container>
  );
}
