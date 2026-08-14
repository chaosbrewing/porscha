import Link from "next/link";
import type { Metadata } from "next";
import { Portrait } from "@/components/public/Portrait";
import { ProjectEntry } from "@/components/public/ProjectEntry";
import { EmptyState } from "@/components/shared/EmptyState";
import { getPublicProjects } from "@/server/projects/service";
import { siteConfig, workshopStateCopy } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Porscha makes things",
  description:
    "Software, experiments, art, and whatever currently has Porscha's attention. This is her workshop on the internet.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { projects } = await getPublicProjects();
  const workbench = projects.filter((p) => p.featured).slice(0, 3);
  const state = workshopStateCopy[siteConfig.workshopState];

  return (
    <>
      {/* Hero — personal first, operational second. */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 py-14 md:grid-cols-[11fr_9fr] md:gap-14 md:py-20">
          <div className="reveal">
            <h1 className="type-display text-[17vw] leading-[0.95] sm:text-7xl lg:text-8xl">
              Porscha
              <br />
              <span className="type-display-italic text-accent-deep">
                makes things.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink-soft leading-relaxed">
              Software, experiments, art, and whatever currently has my
              attention.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/workshop"
                className="inline-flex items-center gap-2 bg-ink-well text-ink-inverse px-5 py-3 text-sm rounded-[3px] hover:bg-ink-well-soft transition-colors duration-[var(--duration-micro)]"
              >
                Step into the workshop
                <span aria-hidden="true">→</span>
              </Link>
              <p className="text-sm text-ink-soft">
                <span className="type-meta text-ink-faint mr-2">
                  {state.label}
                </span>
                {siteConfig.currently}
              </p>
            </div>
          </div>

          <div className="reveal-late order-last md:order-none">
            <Portrait />
          </div>
        </div>
      </section>

      {/* Currently on the workbench */}
      <section
        aria-labelledby="workbench-heading"
        className="mx-auto max-w-6xl px-5 sm:px-8 mt-8"
      >
        <div className="flex items-baseline justify-between border-b border-line-strong pb-3">
          <h2 id="workbench-heading" className="type-heading text-xl">
            Currently on the workbench
          </h2>
          <Link
            href="/workshop"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
          >
            All projects →
          </Link>
        </div>

        {workbench.length > 0 ? (
          <div className="divide-y divide-line">
            {workbench.map((project) => (
              <ProjectEntry key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState title="The workbench is clear">
              Nothing is pinned up right now — the full collection lives in
              the <Link href="/workshop" className="underline">workshop</Link>.
            </EmptyState>
          </div>
        )}
      </section>

      {/* Quiet pointers to the rest of the site */}
      <section
        aria-label="Explore"
        className="mx-auto max-w-6xl px-5 sm:px-8 mt-20"
      >
        <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
          {[
            {
              href: "/lab",
              title: "Lab",
              blurb: "Numbered experiments, honestly unfinished.",
            },
            {
              href: "/gallery",
              title: "Gallery",
              blurb: "Pictures, sketches, and studies from around the bench.",
            },
            {
              href: "/notes",
              title: "Notes",
              blurb: "Short writing — discoveries, dead ends, design thoughts.",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-paper px-6 py-8 hover:bg-paper-raised transition-colors duration-[var(--duration-micro)]"
            >
              <h3 className="type-heading text-lg group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">
                {item.blurb}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
