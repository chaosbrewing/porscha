import type { Metadata } from "next";
import { Container } from "@/components/public/Container";
import { Doodle } from "@/components/public/Doodle";
import { PhotoTile } from "@/components/public/PhotoTile";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { work } = await getSiteContent();
  return { title: work.heading, description: work.intro, alternates: { canonical: "/work" } };
}

/**
 * Things I've made: a heading, a handwritten aside, then the windows —
 * wide photographic bands, each one a link.
 */
export default async function WorkPage() {
  const { work } = await getSiteContent();
  return (
    <Container className="pb-20 pt-8 sm:pt-12 lg:pb-32">
      <header className="reveal grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start">
        <div>
          <h1 className="type-display text-[clamp(2.5rem,6.5vw,4.5rem)]">{work.heading}</h1>
          {work.intro ? (
            <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft">
              {work.intro}
            </p>
          ) : null}
        </div>
        {work.annotation ? (
          <p className="type-annotation flex items-start gap-2 text-[1.125rem] sm:text-[1.25rem] lg:justify-end lg:pt-3">
            <Doodle direction="left" className="mt-1 shrink-0" />
            <span className="-rotate-2">{work.annotation}</span>
          </p>
        ) : null}
      </header>

      <ol className="mt-10 flex flex-col gap-3 lg:mt-14 lg:gap-4">
        {work.categories.map((category, index) => (
          <li key={category.href + category.name} className="reveal-view">
            <PhotoTile
              href={category.href}
              label={category.name}
              description={category.description}
              image={category.image}
              layout="banner"
              priority={index === 0}
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="aspect-[16/10] sm:aspect-[3/1] lg:aspect-[9/2]"
            />
          </li>
        ))}
      </ol>
    </Container>
  );
}
