import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { StatusMark } from "@/components/shared/StatusMark";
import { ProgressMeter } from "@/components/shared/ProgressMeter";
import { getPublicProject } from "@/server/projects/service";
import { getProjectStory } from "@/server/content/loader";
import { formatDate, timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ project: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project: slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) return { title: "Not found" };
  return {
    title: project.name,
    description: project.description,
    alternates: { canonical: `/workshop/${project.slug}` },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { project: slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) notFound();
  const story = getProjectStory(slug);

  return (
    <article className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="py-14 md:py-20 max-w-2xl">
        <p className="mb-4">
          <Link
            href="/workshop"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
          >
            ← Workshop
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
          <h1 className="type-display text-5xl sm:text-6xl">{project.name}</h1>
          <StatusMark status={project.status} />
        </div>
        <p className="mt-5 text-lg text-ink-soft leading-relaxed">
          {project.description}
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {story?.why ? (
            <section aria-labelledby="why-heading" className="max-w-2xl">
              <h2 id="why-heading" className="type-meta text-ink-faint">
                Why it exists
              </h2>
              <p className="mt-3 text-lg leading-relaxed">{story.why}</p>
            </section>
          ) : null}

          {story ? (
            <section aria-label="Project story" className="mt-10">
              <div
                className="prose-workshop"
                dangerouslySetInnerHTML={{ __html: story.html }}
              />
            </section>
          ) : (
            <p className="text-ink-soft max-w-2xl">
              The longer story for this project hasn&rsquo;t been written yet
              — the state panel on this page is live in the meantime.
            </p>
          )}

          {story && story.screenshots.length > 0 ? (
            <section aria-label="Screenshots" className="mt-12 grid gap-6">
              {story.screenshots.map((shot) => (
                <figure key={shot.src}>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={1400}
                    height={900}
                    className="w-full h-auto rounded-[4px] border border-line"
                  />
                  {shot.caption ? (
                    <figcaption className="mt-2 text-sm text-ink-faint">
                      {shot.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </section>
          ) : null}

          {story && story.lessons.length > 0 ? (
            <section aria-labelledby="lessons-heading" className="mt-12 max-w-2xl">
              <h2 id="lessons-heading" className="type-heading text-2xl">
                Lessons so far
              </h2>
              <ul className="mt-4 space-y-3">
                {story.lessons.map((lesson) => (
                  <li key={lesson} className="flex gap-3 leading-relaxed">
                    <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                    {lesson}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Live state panel — only visibility-approved signals. */}
        <aside aria-label="Current state" className="lg:border-l lg:border-line lg:pl-8">
          <div className="sticky top-8 space-y-7">
            {project.currentMilestone ? (
              <div>
                <h2 className="type-meta text-ink-faint">Current milestone</h2>
                <p className="mt-2 font-medium">{project.currentMilestone.title}</p>
                {project.currentMilestone.publicSummary ? (
                  <p className="mt-1 text-sm text-ink-soft leading-relaxed">
                    {project.currentMilestone.publicSummary}
                  </p>
                ) : null}
                <div className="mt-4">
                  {project.progress ? (
                    <ProgressMeter
                      done={project.progress.done}
                      total={project.progress.total}
                    />
                  ) : (
                    <p className="text-sm text-ink-soft">Active development</p>
                  )}
                </div>
              </div>
            ) : null}

            {project.activitySignal ? (
              <div>
                <h2 className="type-meta text-ink-faint">Recent activity</h2>
                <p className="mt-2 text-sm">
                  {project.activitySignal}
                  {project.lastPublicActivityAt ? (
                    <span className="text-ink-faint">
                      {" "}
                      · {timeAgo(project.lastPublicActivityAt)}
                    </span>
                  ) : null}
                </p>
              </div>
            ) : null}

            {project.latestRelease ? (
              <div>
                <h2 className="type-meta text-ink-faint">Latest release</h2>
                <p className="mt-2 text-sm">
                  {project.latestRelease.tag} ·{" "}
                  {formatDate(project.latestRelease.publishedAt)}
                </p>
              </div>
            ) : null}

            {(project.links?.length || project.repositoryUrl) ? (
              <div>
                <h2 className="type-meta text-ink-faint">Links</h2>
                <ul className="mt-2 space-y-1.5">
                  {project.repositoryUrl ? (
                    <li>
                      <a
                        href={project.repositoryUrl}
                        rel="noopener"
                        className="text-sm underline underline-offset-4 decoration-line-strong hover:decoration-accent"
                      >
                        Source on GitHub
                      </a>
                    </li>
                  ) : null}
                  {project.links?.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        rel="noopener"
                        className="text-sm underline underline-offset-4 decoration-line-strong hover:decoration-accent"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </article>
  );
}
