import Link from "next/link";
import type { PublicProjectView } from "@/types/core";
import { StatusMark } from "@/components/shared/StatusMark";
import { ProgressMeter } from "@/components/shared/ProgressMeter";
import { formatDate } from "@/lib/dates";

/**
 * A public project entry — an editorial list row, not a card. Shows
 * only what the project's visibility flags allowed the transformer to
 * include.
 */
export function ProjectEntry({
  project,
  headingLevel = "h3",
}: {
  project: PublicProjectView;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const showProgress = project.progress != null;
  const showActiveDev =
    !showProgress &&
    project.currentMilestone !== undefined &&
    (project.status === "building" || project.status === "active");

  return (
    <article className="group grid gap-4 py-8 md:grid-cols-[1fr_260px] md:gap-10">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <Heading className="type-heading text-2xl">
            <Link
              href={`/workshop/${project.slug}`}
              className="hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
            >
              {project.name}
            </Link>
          </Heading>
          <StatusMark status={project.status} />
        </div>
        <p className="mt-2 max-w-xl text-ink-soft leading-relaxed">
          {project.description}
        </p>
        {project.currentMilestone ? (
          <p className="mt-3 text-sm text-ink">
            <span className="type-meta text-ink-faint mr-2">Milestone</span>
            {project.currentMilestone.title}
            {project.currentMilestone.publicSummary ? (
              <span className="text-ink-soft">
                {" "}
                — {project.currentMilestone.publicSummary}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col justify-center gap-3 md:border-l md:border-line md:pl-8">
        {showProgress && project.progress ? (
          <ProgressMeter
            done={project.progress.done}
            total={project.progress.total}
            label={`${project.name} milestone progress`}
          />
        ) : showActiveDev ? (
          <p className="text-sm text-ink-soft">Active development</p>
        ) : null}

        {project.activitySignal ? (
          <p className="text-sm text-ink-soft">{project.activitySignal}</p>
        ) : null}

        {project.latestRelease ? (
          <p className="text-sm text-ink-soft">
            <span className="type-meta text-ink-faint mr-2">Release</span>
            {project.latestRelease.tag} ·{" "}
            {formatDate(project.latestRelease.publishedAt)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
