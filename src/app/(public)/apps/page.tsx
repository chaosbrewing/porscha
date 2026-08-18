import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { PublicProjectView } from "@/types/core";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusMark } from "@/components/shared/StatusMark";
import { ProjectGlyph } from "@/components/public/ProjectGlyph";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { EditorialPhoto } from "@/components/public/editorial/EditorialPhoto";
import { getPublicProjects } from "@/server/projects/service";
import { getProjectStory } from "@/server/content/loader";
import { getPhoto } from "@/server/photography/service";
import { appFrameDefault, appFrameSlot, aspectRatio } from "@/config/photography";
import { sectionNumber } from "@/config/site";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apps — by Chaos Origins",
  description:
    "Apps by Chaos Origins — small software built for people rather than funnels. Kubli, PRISM, habi and what follows.",
  alternates: { canonical: "/apps" },
};

/**
 * APPS — Apps by Chaos Origins.
 *
 * A technology feature, not a portfolio grid: each product gets a
 * spread with its own frame, the sentence that explains why it exists,
 * and only the operational signals its visibility flags allow. The
 * company here is Chaos Origins — the art practice is OBRA, and the
 * two are kept visibly separate.
 */

/**
 * The frame beside a product.
 *
 * Whatever the console has set for this app, falling back to the
 * screenshot in the project's own story, and finally to a typographic
 * plate carrying the product's mark — deliberate, and the slot a device
 * shot drops into later.
 */
async function ProductFrame({
  project,
  shot,
}: {
  project: PublicProjectView;
  shot?: { src: string; alt: string; caption?: string };
}) {
  const photo = await getPhoto(
    appFrameSlot(project.slug),
    appFrameDefault(project.name, shot),
  );

  if (!photo.held) {
    return (
      <figure>
        <div
          className="photo"
          style={{ aspectRatio: aspectRatio(photo.aspect) }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            style={{ objectPosition: photo.focal ?? "50% 50%" }}
          />
        </div>
        {photo.caption ? (
          <figcaption className="type-caption mt-3 flex items-center gap-3">
            <span aria-hidden="true" className="rule-copper w-6 shrink-0" />
            {photo.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure>
      <div
        className="photo-plate flex flex-col justify-between p-6 sm:p-8"
        style={{ aspectRatio: aspectRatio(photo.aspect) }}
      >
        <ProjectGlyph slug={project.slug} logo={project.logoPath} />
        <div>
          <p className="type-feature text-4xl sm:text-5xl">{project.name}</p>
          <p className="type-kicker mt-3 text-accent">Screenshot slot</p>
        </div>
      </div>
      <figcaption className="type-caption mt-3 flex items-center gap-3">
        <span aria-hidden="true" className="rule-copper w-6 shrink-0" />
        {photo.brief}
      </figcaption>
    </figure>
  );
}

async function ProductSpread({
  project,
  index,
}: {
  project: PublicProjectView;
  index: number;
}) {
  const story = getProjectStory(project.slug);
  const shot = story?.screenshots[0];
  const flip = index % 2 === 1;

  return (
    <article className="border-t border-line pt-8 sm:pt-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
        <div className={flip ? "lg:order-2" : undefined}>
          <div className="flex items-baseline gap-5">
            <span className="type-numeral text-2xl text-accent">
              {sectionNumber(index + 1)}
            </span>
            <StatusMark status={project.status} />
          </div>

          <h2 className="type-feature mt-4 text-[clamp(2.25rem,5.5vw,3.75rem)]">
            <Link
              href={`/workshop/${project.slug}`}
              className="transition-colors duration-[var(--duration-micro)] hover:text-accent-deep"
            >
              {project.name}
            </Link>
          </h2>

          <p className="type-standfirst mt-5 max-w-lg">{project.description}</p>

          {story?.why ? (
            <blockquote className="mt-7 max-w-lg border-l border-accent pl-5">
              <p className="type-heading text-lg leading-snug">{story.why}</p>
              <footer className="type-kicker mt-3 text-ink-faint">
                Why it exists
              </footer>
            </blockquote>
          ) : null}

          <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 max-w-lg">
            {project.currentMilestone ? (
              <div>
                <dt className="type-kicker text-ink-faint">Current milestone</dt>
                <dd className="mt-1.5 text-sm">
                  {project.currentMilestone.title}
                  {project.progress ? (
                    <span className="text-ink-faint">
                      {" "}
                      · {project.progress.percent}%
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}

            {project.latestRelease ? (
              <div>
                <dt className="type-kicker text-ink-faint">Latest release</dt>
                <dd className="mt-1.5 text-sm">
                  {project.latestRelease.tag} ·{" "}
                  {formatDate(project.latestRelease.publishedAt)}
                </dd>
              </div>
            ) : null}

            {project.activitySignal ? (
              <div>
                <dt className="type-kicker text-ink-faint">Recent activity</dt>
                <dd className="mt-1.5 text-sm">{project.activitySignal}</dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-8">
            <Link
              href={`/workshop/${project.slug}`}
              className="group type-kicker inline-flex items-center gap-3 text-ink hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
            >
              Read the build
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </p>
        </div>

        <div className={flip ? "lg:order-1" : undefined}>
          <ProductFrame project={project} shot={shot} />
        </div>
      </div>
    </article>
  );
}

export default async function AppsPage() {
  const { projects } = await getPublicProjects();
  const apps = projects.filter((p) => p.isApp);

  return (
    <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
      <header className="pt-12 lg:pt-20">
        <SectionLabel
          number={sectionNumber(2)}
          label="Apps"
          aside={`${apps.length} ${apps.length === 1 ? "product" : "products"}`}
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16">
          <div>
            <h1 className="type-feature text-[clamp(2.75rem,8vw,5.5rem)]">
              Apps by
              <br />
              Chaos Origins
            </h1>
            <p className="type-standfirst mt-7 max-w-lg">
              Chaos Origins is the company. It makes small software for
              people: capture that remembers where you were, reflection that
              isn&rsquo;t a quarterly report, a habit companion built around
              coming back.
            </p>
            <p className="type-caption mt-6 max-w-lg">
              The art practice is OBRA, and it lives in{" "}
              <Link
                href="/art"
                className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
              >
                ART
              </Link>
              . This section is the software side of the house.
            </p>
          </div>

          <EditorialPhoto
            slot="apps-opening"
            sizes="(max-width: 1024px) 100vw, 42vw"
          />
        </div>
      </header>

      {apps.length > 0 ? (
        <div className="mt-20 space-y-16 lg:space-y-24">
          {apps.map((project, index) => (
            <ProductSpread
              key={project.slug}
              project={project}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="mt-20">
          <EmptyState title="No products on the shelf yet">
            When a project grows into something usable, it appears here.
          </EmptyState>
        </div>
      )}

      <p className="mt-20 border-t border-line pt-6">
        <Link
          href="/headquarters"
          className="group type-kicker inline-flex items-center gap-3 text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
        >
          Everything else being built lives in Headquarters
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </p>
    </div>
  );
}
