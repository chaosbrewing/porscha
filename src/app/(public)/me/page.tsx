import type { Metadata } from "next";
import Image from "next/image";
import { Annotation } from "@/components/public/Annotation";
import { ArrowLink } from "@/components/public/ArrowLink";
import { ButtonLink } from "@/components/public/ButtonLink";
import { Container } from "@/components/public/Container";
import { Doodle } from "@/components/public/Doodle";
import { FragmentsGrid } from "@/components/public/FragmentsGrid";
import { Lines } from "@/components/public/Lines";
import { PMark } from "@/components/public/PMark";
import { site } from "@/content/site";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { me } = await getSiteContent();
  return {
    title: "Who I am",
    description: `${me.about.paragraphs[0]} Fragments, a few chapters, and the little things — an introduction, not a biography.`,
    alternates: { canonical: "/me" },
  };
}

/**
 * Who I am: a little about, then the fragments, the making interlude,
 * a few chapters on a line, the little things, and the ending.
 */
export default async function MePage() {
  const { me } = await getSiteContent();
  const { about, fragments, making, chapters, littleThings, ending } = me;
  const [aboutSmall, ...aboutBig] = about.heading;

  return (
    <div className="pt-8 sm:pt-12">
      {/* A little about */}
      <Container>
        <section
          aria-labelledby="about-heading"
          className="grid gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-x-16"
        >
          <div className="reveal max-w-[34rem] lg:pt-6">
            <h1 id="about-heading" className="type-display text-[clamp(2.5rem,6.5vw,4.5rem)]">
              {aboutBig.length > 0 ? (
                <>
                  <span className="type-heading block text-[0.5em] text-ink-soft">{aboutSmall}</span>
                  <Lines lines={aboutBig} />
                </>
              ) : (
                aboutSmall
              )}
            </h1>
            {about.tagline ? (
              <p className="type-heading mt-6 text-[1.25rem] sm:text-[1.5rem]">{about.tagline}</p>
            ) : null}
            <div className="mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
              {about.paragraphs.map((paragraph, i) => (
                <p key={i} className={i > 0 ? "mt-5 before:mb-5 before:block before:h-px before:w-8 before:bg-line-strong" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <figure
            className="reveal relative mx-auto w-full max-w-[22rem] lg:mx-0 lg:ml-auto lg:max-w-[28rem]"
            style={{ ["--reveal-step" as string]: 1 }}
          >
            <div className="overflow-hidden rounded-[3px] bg-paper-sunken">
              <Image
                src={about.image.src}
                alt={about.image.alt}
                width={about.image.width}
                height={about.image.height}
                priority
                sizes="(max-width: 1024px) 352px, 448px"
                className="aspect-[4/5] h-auto w-full object-cover object-[50%_20%]"
              />
            </div>
            {about.annotation ? (
              <figcaption className="type-annotation mt-4 flex items-start justify-end gap-2 text-right text-[1.125rem] sm:text-[1.25rem]">
                <Doodle direction="up-right" className="mt-1 shrink-0" />
                <span className="-rotate-2">{about.annotation}</span>
              </figcaption>
            ) : null}
          </figure>
        </section>
      </Container>

      {/* Fragments */}
      <Container className="mt-20 lg:mt-28">
        <section aria-labelledby="fragments-heading" className="reveal-view">
          <div className="grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start">
            <div>
              <h2 id="fragments-heading" className="type-display text-[clamp(2.25rem,6vw,4rem)]">
                {fragments.heading}
              </h2>
              {fragments.intro ? (
                <p className="mt-4 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft">
                  {fragments.intro}
                </p>
              ) : null}
            </div>
          </div>
          <FragmentsGrid items={fragments.items} />
        </section>
      </Container>

      {/* Making — the interlude */}
      <section aria-labelledby="making-heading" className="reveal-view relative mt-20 lg:mt-28">
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[2/1] lg:max-h-[42rem]">
          <Image
            src={making.image.src}
            alt={making.image.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-well/75 via-ink-well/20 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0">
            <Container className="pb-10 sm:pb-14 lg:pb-16">
              <h2
                id="making-heading"
                className="type-display text-[clamp(2.25rem,6.5vw,4.5rem)] text-ink-inverse"
              >
                <Lines lines={making.overlay} />
              </h2>
              {making.annotation ? (
                <p className="type-annotation mt-4 text-[1.125rem] text-ink-inverse-soft sm:text-[1.25rem]">
                  <PMark className="mr-2 text-[0.85em]" />
                  {making.annotation}
                </p>
              ) : null}
              <ArrowLink
                href={making.cta.href}
                className="mt-6 min-h-11 text-base text-ink-inverse hover:text-ink-inverse focus-visible:text-ink-inverse"
              >
                {making.cta.label}
              </ArrowLink>
            </Container>
          </div>
        </div>
      </section>

      {/* Selected chapters */}
      <Container className="mt-20 lg:mt-28">
        <section aria-labelledby="chapters-heading" className="reveal-view">
          <h2 id="chapters-heading" className="type-display text-[clamp(2.25rem,6vw,4rem)]">
            {chapters.heading}
          </h2>
          {chapters.intro ? (
            <p className="mt-4 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft">
              {chapters.intro}
            </p>
          ) : null}

          <ol className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 border-b border-line-strong lg:mt-14 lg:grid-cols-4 lg:gap-x-8">
            {chapters.items.map((chapter, index) => (
              <li
                key={index}
                className="relative pb-8 after:absolute after:-bottom-[5px] after:left-0 after:h-[9px] after:w-[9px] after:rounded-full after:bg-ink"
              >
                <h3 className="type-heading text-[1.25rem] sm:text-[1.375rem]">{chapter.title}</h3>
                <p className="mt-2 max-w-[16rem] text-[0.9375rem] leading-relaxed text-ink-soft">
                  {chapter.description}
                </p>
                {chapter.image ? (
                  <div className="relative mt-5 aspect-[3/2] w-full max-w-[14rem] overflow-hidden rounded-[3px] bg-paper-sunken">
                    <Image
                      src={chapter.image.src}
                      alt={chapter.image.alt}
                      fill
                      sizes="(max-width: 1024px) 45vw, 224px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          {chapters.annotation ? (
            <p className="type-annotation mt-6 flex items-start justify-end gap-2 text-right text-[1.125rem] sm:text-[1.25rem]">
              <span className="-rotate-2">{chapters.annotation}</span>
              <Doodle direction="down-right" className="mt-1 shrink-0" />
            </p>
          ) : null}
        </section>
      </Container>

      {/* The little things */}
      <Container className="mt-20 lg:mt-28">
        <section
          aria-labelledby="little-heading"
          className="reveal-view grid gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16"
        >
          <div>
            <h2 id="little-heading" className="type-display text-[clamp(2.25rem,6vw,4rem)]">
              {littleThings.heading}
            </h2>
            <p className="mt-4 max-w-[26rem] text-[1.0625rem] leading-relaxed text-ink-soft">
              {littleThings.intro}
            </p>
            {littleThings.annotation ? (
              <Annotation mark className="mt-8">
                {littleThings.annotation}
              </Annotation>
            ) : null}
          </div>
          <ul className="grid grid-cols-1 border-t border-line sm:grid-cols-2 sm:gap-x-10">
            {littleThings.items.map((item, i) => (
              <li key={i} className="type-heading border-b border-line py-3.5 text-lg sm:text-xl">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* Ending */}
      <section aria-labelledby="ending-heading" className="relative mt-20 overflow-hidden bg-ink-well text-ink-inverse lg:mt-28">
        <Image
          src={ending.image.src}
          alt={ending.image.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-ink-well/55" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink-well/70 via-transparent to-ink-well/30"
        />
        <Container className="relative flex min-h-[32rem] flex-col items-center justify-center py-24 text-center sm:min-h-[36rem] lg:min-h-[40rem]">
          <h2 id="ending-heading" className="type-display text-[clamp(2.25rem,6.5vw,4.5rem)] text-ink-inverse">
            <Lines lines={ending.heading} />
          </h2>
          <span aria-hidden="true" className="mt-8 block h-px w-10 bg-ink-inverse/70" />
          {ending.links.length > 0 ? (
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {ending.links.map((link, i) => (
                <li key={i}>
                  <ButtonLink href={link.href} variant={i === 0 ? "inverse-solid" : "inverse"}>
                    {link.label}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
        <div className="absolute inset-x-0 bottom-0">
          <Container className="flex items-end justify-between gap-6 pb-6 sm:pb-8">
            <span className="type-meta text-ink-inverse-soft">{site.domain}</span>
            {ending.annotation ? (
              <span className="type-annotation text-right text-[1.125rem] text-ink-inverse-soft sm:text-[1.25rem]">
                <span className="inline-block -rotate-3">{ending.annotation}</span>
              </span>
            ) : null}
          </Container>
        </div>
      </section>
    </div>
  );
}
