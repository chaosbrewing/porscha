import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/public/ButtonLink";
import { Container } from "@/components/public/Container";
import { Eyebrow } from "@/components/public/Eyebrow";
import { ArrowLink } from "@/components/public/ArrowLink";
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

const number = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Eyebrow, header, sub-header, then the projects. Each project opens
 * as a full-width picture with its name, description, link and the
 * titles of its numbered sections over it; the sections follow in
 * full beneath.
 */
export default async function BuildingPage() {
  const { building } = await getSiteContent();

  return (
    <article className="pb-20 pt-8 sm:pt-12 lg:pb-32">
      <Container>
        <header className="reveal max-w-[44rem]">
          {building.eyebrow ? <Eyebrow className="mb-4">{building.eyebrow}</Eyebrow> : null}
          <h1 className="type-display text-[clamp(2.5rem,6.5vw,4.5rem)]">{building.heading}</h1>
          {building.subheading ? (
            <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft">
              {building.subheading}
            </p>
          ) : null}
        </header>
      </Container>

      <Container className="mt-10 lg:mt-14">
        <Eyebrow as="h2" className="border-t border-line pt-5">
          {building.projectsLabel}
        </Eyebrow>

        {building.projects.length > 0 ? (
          <ol className="mt-6 space-y-16 lg:space-y-24">
            {building.projects.map((project, i) => (
              <li key={i} className="reveal-view">
                <section aria-labelledby={`project-${i}`}>
                  {/* The picture, with the project's opening over it */}
                  <div className="relative overflow-hidden rounded-[3px] bg-ink-well text-ink-inverse">
                    {project.media ? (
                      <Image
                        src={project.media.src}
                        alt={project.media.alt}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 1280px) 100vw, 1200px"
                        className="object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,#3a352c_0%,#1f1d18_60%)]"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-ink-well/85 via-ink-well/55 to-ink-well/20"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-ink-well/70 to-transparent"
                    />

                    <div className="relative flex min-h-[30rem] flex-col justify-end p-6 sm:min-h-[34rem] sm:p-10 lg:min-h-[38rem] lg:p-14">
                      <div className="max-w-[36rem]">
                        {building.eyebrow ? (
                          <p className="type-meta text-ink-inverse-soft">{building.eyebrow}</p>
                        ) : null}
                        <h3 id={`project-${i}`} className="mt-3 flex items-center gap-4">
                          {project.logo ? (
                            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[6px] bg-paper-raised sm:h-12 sm:w-12">
                              <Image
                                src={project.logo.src}
                                alt={project.logo.alt}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </span>
                          ) : null}
                          <span className="type-display text-[clamp(2.25rem,6vw,4rem)] text-ink-inverse">
                            {project.name}
                          </span>
                        </h3>

                        {project.description ? (
                          <div className="mt-5 space-y-3 text-[0.9375rem] leading-relaxed text-ink-inverse-soft sm:text-base">
                            {project.description.split(/\n\s*\n/).map((paragraph, j) => (
                              <p key={j} className={j === 0 ? "type-heading text-[1.25rem] text-ink-inverse sm:text-[1.5rem]" : ""}>
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : null}

                        {project.link.href && project.link.label ? (
                          <p className="mt-7">
                            <ButtonLink href={project.link.href} variant="inverse">
                              {project.link.label}
                            </ButtonLink>
                          </p>
                        ) : null}

                        {project.sections.length > 0 ? (
                          <ol className="mt-8 space-y-1.5">
                            {project.sections.map((section, j) => (
                              <li key={j} className="flex items-baseline gap-4 text-sm">
                                <span className="type-meta text-ink-inverse-soft">{number(j)}</span>
                                <a
                                  href={`#project-${i}-section-${j}`}
                                  className="inline-flex min-h-7 items-center text-ink-inverse underline decoration-transparent underline-offset-4 transition-colors duration-[var(--duration-micro)] hover:decoration-ink-inverse-soft"
                                >
                                  {section.title}
                                </a>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                      </div>

                      {building.annotation ? (
                        <p className="type-annotation mt-8 self-end text-right text-[1.125rem] text-ink-inverse-soft sm:text-[1.25rem] lg:absolute lg:bottom-14 lg:right-14 lg:mt-0">
                          <span className="inline-block -rotate-2">{building.annotation}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* The sections in full */}
                  {project.sections.length > 0 ? (
                    <ol className="mt-4 border-t border-line">
                      {project.sections.map((section, j) => (
                        <li
                          key={j}
                          id={`project-${i}-section-${j}`}
                          className="grid scroll-mt-24 gap-y-3 border-b border-line py-8 sm:grid-cols-[4rem_minmax(0,1fr)] sm:py-10 lg:grid-cols-[6rem_minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-10"
                        >
                          <span className="type-meta text-ink-faint">{number(j)}</span>
                          <h4 className="type-heading text-[1.5rem] sm:text-[1.75rem]">{section.title}</h4>
                          <div className="space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft sm:col-start-2 lg:col-start-3">
                            {section.paragraphs.map((paragraph, k) => (
                              <p key={k}>{paragraph}</p>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </section>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-6 max-w-[34rem] leading-relaxed text-ink-soft">Nothing to show yet.</p>
        )}

        <footer className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 lg:mt-16">
          <ArrowLink href="/now" className="min-h-11 text-lg">
            What’s current
          </ArrowLink>
        </footer>
      </Container>
    </article>
  );
}
