import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Container } from "@/components/public/Container";
import { Eyebrow } from "@/components/public/Eyebrow";
import { PMark } from "@/components/public/PMark";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { building } = await getSiteContent();
  return {
    title: building.heading,
    description: building.subheading || building.heading,
    alternates: { canonical: "/building" },
  };
}

/**
 * Eyebrow, header, sub-header, then the projects — each a logo, a
 * name, a description, one piece of media and a linked line.
 */
export default async function BuildingPage() {
  const { building } = await getSiteContent();

  return (
    <article className="pb-20 pt-10 sm:pt-16 lg:pb-32">
      <Container>
        <header className="reveal max-w-[44rem]">
          {building.eyebrow ? <Eyebrow className="mb-5">{building.eyebrow}</Eyebrow> : null}
          <h1 className="type-display text-[clamp(2.75rem,8vw,5.5rem)]">
            {building.heading}
          </h1>
          {building.subheading ? (
            <p className="type-heading mt-6 text-[clamp(1.375rem,3vw,1.875rem)] text-ink-soft">
              {building.subheading}
            </p>
          ) : null}
        </header>
      </Container>

      <Container className="mt-16 lg:mt-24">
        <Eyebrow as="h2" className="border-t border-line pt-6">
          {building.projectsLabel}
        </Eyebrow>

        {building.projects.length > 0 ? (
          <ol className="mt-4">
            {building.projects.map((project, i) => (
              <li
                key={i}
                className="reveal-view grid gap-y-8 border-b border-line py-12 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16"
              >
                <div>
                  <h3 className="flex items-center gap-4">
                    {project.logo ? (
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[6px] border border-line bg-paper-raised sm:h-14 sm:w-14">
                        <Image
                          src={project.logo.src}
                          alt={project.logo.alt}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="type-heading flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border border-line bg-paper-raised text-xl text-ink-faint sm:h-14 sm:w-14"
                      >
                        {project.name.trim().charAt(0)}
                      </span>
                    )}
                    <span className="type-display text-[clamp(1.75rem,4.5vw,2.75rem)]">
                      {project.name}
                    </span>
                  </h3>

                  {project.description ? (
                    <div className="mt-6 max-w-[34rem] space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft">
                      {project.description
                        .split(/\n\s*\n/)
                        .map((paragraph, j) => (
                          <p key={j}>{paragraph}</p>
                        ))}
                    </div>
                  ) : null}

                  {project.link.href && project.link.label ? (
                    <p className="mt-8">
                      <ArrowLink href={project.link.href} className="min-h-11 text-lg">
                        {project.link.label}
                      </ArrowLink>
                    </p>
                  ) : null}
                </div>

                {project.media ? (
                  <figure
                    className="relative w-full overflow-hidden rounded-[3px] bg-paper-sunken"
                    style={{ aspectRatio: `${project.media.width} / ${project.media.height}` }}
                  >
                    <Image
                      src={project.media.src}
                      alt={project.media.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                    />
                  </figure>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-6 max-w-[34rem] leading-relaxed text-ink-soft">
            Nothing to show yet.
          </p>
        )}

        <footer className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 lg:mt-16">
          <ArrowLink href="/now" className="min-h-11 text-lg">
            What’s current
          </ArrowLink>
          <PMark className="ml-auto text-2xl text-ink-faint" />
        </footer>
      </Container>
    </article>
  );
}
