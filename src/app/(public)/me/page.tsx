import type { Metadata } from "next";
import Image from "next/image";
import { Annotation } from "@/components/public/Annotation";
import { ArrowLink } from "@/components/public/ArrowLink";
import { Container } from "@/components/public/Container";
import { Eyebrow } from "@/components/public/Eyebrow";
import { Lines } from "@/components/public/Lines";
import { PMark } from "@/components/public/PMark";
import type { Fragment } from "@/content/site/schema";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { me } = await getSiteContent();
  return {
    title: "Who I am",
    description: `${me.fragments.intro} Fragments, a few chapters, and the little things — an introduction, not a biography.`,
    alternates: { canonical: "/me" },
  };
}

/* ---------------------------- Fragments --------------------------- */

const SPAN: Record<"small" | "wide" | "tall", string> = {
  small: "",
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
};

function FragmentCard({ fragment }: { fragment: Fragment }) {
  const span = SPAN[fragment.size];

  if (fragment.kind === "image") {
    return (
      <li className={`reveal-view ${span}`}>
        <figure className="h-full">
          <div
            className="relative h-full min-h-[14rem] w-full overflow-hidden rounded-[3px] bg-paper-sunken"
            style={{ aspectRatio: `${fragment.image.width} / ${fragment.image.height}` }}
          >
            <Image
              src={fragment.image.src}
              alt={fragment.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          {fragment.caption ? (
            <figcaption className="mt-2 text-sm text-ink-faint">
              {fragment.caption}
            </figcaption>
          ) : null}
        </figure>
      </li>
    );
  }

  const annotation = fragment.tone === "annotation";
  return (
    <li
      className={`reveal-view flex min-h-[9rem] items-end rounded-[3px] border border-line bg-paper-raised p-5 sm:min-h-[11rem] sm:p-6 ${span}`}
    >
      {annotation ? (
        <Annotation mark>{fragment.text}</Annotation>
      ) : (
        <p className="type-heading text-[1.375rem] leading-snug sm:text-2xl">
          {fragment.text}
        </p>
      )}
    </li>
  );
}

/* ------------------------------ Page ------------------------------ */

export default async function MePage() {
  const { me } = await getSiteContent();
  const { fragments, making, chapters, littleThings, ending } = me;

  return (
    <div className="pt-10 sm:pt-16">
      {/* Fragments */}
      <Container>
        <header className="reveal">
          <h1 className="type-display text-[clamp(2.75rem,8vw,5.5rem)]">
            {fragments.heading}
          </h1>
          <p className="mt-6 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft sm:text-lg">
            {fragments.intro}
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          {fragments.items.map((fragment, index) => (
            <FragmentCard key={index} fragment={fragment} />
          ))}
        </ul>
      </Container>

      {/* Making — the interlude */}
      <section
        aria-labelledby="making-heading"
        className="reveal-view relative mt-24 lg:mt-36"
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[2/1] lg:max-h-[46rem]">
          <Image
            src={making.image.src}
            alt={making.image.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-well/70 via-ink-well/15 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0">
            <Container className="pb-10 sm:pb-14 lg:pb-20">
              <h2
                id="making-heading"
                className="type-display text-[clamp(2.5rem,7.5vw,5.5rem)] text-ink-inverse"
              >
                <Lines lines={making.overlay} />
              </h2>
              {making.annotation ? (
                <p className="type-annotation mt-5 text-[1.125rem] text-ink-inverse-soft sm:text-[1.25rem]">
                  <PMark className="mr-2 text-[0.85em]" />
                  {making.annotation}
                </p>
              ) : null}
              <ArrowLink
                href={making.cta.href}
                className="mt-8 min-h-11 text-base text-ink-inverse hover:text-ink-inverse focus-visible:text-ink-inverse"
              >
                {making.cta.label}
              </ArrowLink>
            </Container>
          </div>
        </div>
      </section>

      {/* Selected chapters */}
      <Container className="mt-24 lg:mt-36">
        <section aria-labelledby="chapters-heading" className="reveal-view">
          <h2 id="chapters-heading" className="type-display text-[clamp(2.25rem,6vw,4rem)]">
            {chapters.heading}
          </h2>
          <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft">
            {chapters.intro}
          </p>

          <ol className="relative mt-12 border-l border-line pl-8 lg:mt-16 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-8">
            {chapters.items.map((chapter, index) => (
              <li key={index} className="relative pb-10 last:pb-0 lg:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-8 top-2 h-px w-4 bg-line-strong lg:-top-8 lg:left-0 lg:h-4 lg:w-px"
                />
                <Eyebrow>{String(index + 1).padStart(2, "0")}</Eyebrow>
                <h3 className="type-heading mt-3 text-2xl uppercase tracking-[0.06em] sm:text-[1.625rem]">
                  {chapter.title}
                </h3>
                <p className="mt-2 max-w-[18rem] leading-relaxed text-ink-soft">
                  {chapter.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </Container>

      {/* The little things */}
      <Container className="mt-24 lg:mt-36">
        <section
          aria-labelledby="little-heading"
          className="reveal-view grid gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16"
        >
          <div>
            <h2 id="little-heading" className="type-display text-[clamp(2.25rem,6vw,4rem)]">
              {littleThings.heading}
            </h2>
            <p className="mt-5 max-w-[26rem] text-[1.0625rem] leading-relaxed text-ink-soft">
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
              <li
                key={i}
                className="type-heading border-b border-line py-4 text-xl sm:text-2xl"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* Ending */}
      <section aria-labelledby="ending-heading" className="mt-24 lg:mt-36">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[38rem]">
          <Image
            src={ending.image.src}
            alt={ending.image.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <Container className="pb-24 pt-14 sm:pt-20 lg:pb-32">
          <h2 id="ending-heading" className="type-display text-[clamp(2.5rem,8vw,6rem)]">
            <Lines lines={ending.heading} />
          </h2>
          <ul className="mt-10 flex flex-col gap-2 sm:mt-12">
            {ending.links.map((link, i) => (
              <li key={i}>
                <ArrowLink
                  href={link.href}
                  className="type-heading min-h-11 py-1 text-[1.375rem] sm:text-2xl"
                >
                  {link.label}
                </ArrowLink>
              </li>
            ))}
          </ul>
          <p className="mt-14">
            <PMark className="text-3xl text-ink-faint" />
          </p>
        </Container>
      </section>
    </div>
  );
}
