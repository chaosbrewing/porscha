import type { Metadata } from "next";
import Image from "next/image";
import { Annotation } from "@/components/public/Annotation";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Container } from "@/components/public/Container";
import { Lines } from "@/components/public/Lines";
import { site } from "@/content/site";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { global } = await getSiteContent();
  return {
    title: { absolute: `${global.name} — ${site.domain}` },
    description: global.description,
    alternates: { canonical: "/" },
  };
}

/**
 * The opening screen. A name, two lines, a question, four doors, and
 * one image. Nothing else.
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

  return (
    <Container className="flex flex-1 flex-col justify-center pb-16 pt-6 sm:pt-10 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
        <div className="max-w-[40rem]">
          <h1
            className="reveal type-display uppercase text-[clamp(3.5rem,13vw,9.5rem)] tracking-[0.02em]"
            style={{ ["--reveal-step" as string]: 0 }}
          >
            {global.name}
          </h1>
          <p
            className="reveal type-heading mt-8 text-[clamp(1.5rem,3.4vw,2.25rem)] text-ink"
            style={{ ["--reveal-step" as string]: 1 }}
          >
            <Lines lines={home.intro} />
          </p>

          <nav
            aria-label="Where to go"
            className="reveal mt-12 lg:mt-16"
            style={{ ["--reveal-step" as string]: 2 }}
          >
            <p className="type-meta text-ink-faint">{home.question}</p>
            <ul className="mt-5 flex flex-col gap-1">
              {home.paths.map((path) => (
                <li key={path.href + path.label}>
                  <ArrowLink
                    href={path.href}
                    className="type-heading min-h-11 py-1 text-[1.5rem] sm:text-[1.75rem]"
                  >
                    {path.label}
                  </ArrowLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <figure
          className="reveal relative mx-auto w-full max-w-[22rem] lg:mx-0 lg:ml-auto lg:max-w-[26rem]"
          style={{ ["--reveal-step" as string]: 2 }}
        >
          <div className="overflow-hidden rounded-[3px] bg-paper-sunken">
            <Image
              src={home.visual.src}
              alt={home.visual.alt}
              width={home.visual.width}
              height={home.visual.height}
              priority
              sizes="(max-width: 1024px) 352px, 416px"
              className="aspect-[4/5] h-auto w-full object-cover object-[50%_20%]"
            />
          </div>
          {home.annotation ? (
            <figcaption className="mt-4 flex items-start justify-between gap-6">
              <Annotation mark>{home.annotation}</Annotation>
            </figcaption>
          ) : null}
        </figure>
      </div>
    </Container>
  );
}
