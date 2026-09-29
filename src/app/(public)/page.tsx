import type { Metadata } from "next";
import { Annotation } from "@/components/public/Annotation";
import { Container } from "@/components/public/Container";
import { Doodle } from "@/components/public/Doodle";
import { Lines } from "@/components/public/Lines";
import { PhotoTile } from "@/components/public/PhotoTile";
import { site } from "@/content/site";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { global } = await getSiteContent();
  return {
    title: { absolute: `${site.name} — ${site.domain}` },
    description: global.description,
    alternates: { canonical: "/" },
  };
}

/**
 * The opening screen. A name, two lines, a handwritten question, and
 * a row of doors — each a photograph with a label. Nothing else.
 */
export default async function HomePage() {
  const { home, global } = await getSiteContent();
  const siteUrl = process.env.SITE_URL ?? site.fallbackUrl;
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: global.name,
    url: siteUrl,
    sameAs: global.social.map((s) => s.url),
  };
  const columns = Math.min(Math.max(home.paths.length, 2), 4);

  return (
    <Container className="flex flex-1 flex-col justify-center pb-16 pt-4 sm:pt-8 lg:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-end">
        <div className="max-w-[40rem]">
          <h1
            className="reveal type-display text-[clamp(3.25rem,11vw,8rem)] tracking-[-0.01em]"
            style={{ ["--reveal-step" as string]: 0 }}
          >
            {site.name}
          </h1>
          <p
            className="reveal type-heading mt-6 text-[clamp(1.25rem,2.6vw,1.75rem)] text-ink-soft"
            style={{ ["--reveal-step" as string]: 1 }}
          >
            <Lines lines={home.intro} />
          </p>
        </div>

        <p
          className="reveal type-annotation flex items-end gap-2 text-[1.25rem] sm:text-[1.375rem] lg:justify-end lg:pb-2"
          style={{ ["--reveal-step" as string]: 2 }}
        >
          <span className="-rotate-3 whitespace-nowrap">{home.question}</span>
          <Doodle direction="down-left" className="-mb-2 shrink-0" />
        </p>
      </div>

      <nav
        aria-label="Where to go"
        className="reveal mt-10 lg:mt-12"
        style={{ ["--reveal-step" as string]: 3 }}
      >
        <ul
          className="grid grid-cols-2 gap-2 sm:gap-3 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
          style={{ ["--cols" as string]: columns }}
        >
          {home.paths.map((path, index) => (
            <li key={path.href + path.label}>
              <PhotoTile
                href={path.href}
                label={path.label}
                image={path.image}
                priority={index < 2}
                sizes="(max-width: 640px) 50vw, 25vw"
                className="aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]"
              />
            </li>
          ))}
        </ul>
      </nav>

      {home.annotation ? (
        <Annotation mark className="mt-8 lg:mt-10">
          {home.annotation}
        </Annotation>
      ) : null}
    </Container>
  );
}
