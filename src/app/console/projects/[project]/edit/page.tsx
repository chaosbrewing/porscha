import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ProjectForm,
  type ProjectFormValue,
} from "@/components/console/ProjectForm";
import { getProjectAdminConfig } from "@/server/projects/admin";
import { ArchiveProjectButton } from "@/components/console/ProjectActions";
import type { ProjectVisibility } from "@/types/core";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ project: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project } = await params;
  return { title: `Edit ${project}` };
}

export default async function EditProjectPage({ params }: Props) {
  const { project: slug } = await params;
  const config = await getProjectAdminConfig(slug);
  if (!config) notFound();

  const visibility = config.visibility as ProjectVisibility;
  const initial: ProjectFormValue = {
    slug: config.slug,
    name: config.name,
    description: config.description,
    type: config.type,
    status: config.status,
    featured: config.featured,
    isApp: config.isApp,
    isPublic: config.isPublic,
    logoPath: config.logoPath,
    github: config.github,
    visibility: { ...visibility },
    currentMilestone: config.currentMilestone,
    milestones: config.milestones.map((m) => ({
      slug: m.slug,
      title: m.title,
      publicSummary: m.publicSummary ?? "",
      workItems: m.workItems.map((w) => ({ title: w.title, done: w.done })),
    })),
  };

  return (
    <div>
      <p className="mb-3">
        <Link
          href={`/console/projects/${slug}`}
          className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
        >
          ← {config.name}
        </Link>
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="type-display text-4xl sm:text-5xl">
          Edit {config.name}
        </h1>
        {config.status !== "archived" ? (
          <ArchiveProjectButton slug={slug} name={config.name} />
        ) : (
          <span className="type-meta text-ink-faint">Archived</span>
        )}
      </div>
      <div className="mt-10">
        <ProjectForm mode="edit" initial={initial} />
      </div>
    </div>
  );
}
