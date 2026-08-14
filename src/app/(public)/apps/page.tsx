import type { Metadata } from "next";
import { ProjectEntry } from "@/components/public/ProjectEntry";
import { EmptyState } from "@/components/shared/EmptyState";
import { getPublicProjects } from "@/server/projects/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apps",
  description: "The product-shaped side of the workshop — apps you can use.",
  alternates: { canonical: "/apps" },
};

/** Apps — a filtered, product-oriented view of the same project model. */
export default async function AppsPage() {
  const { projects } = await getPublicProjects();
  const apps = projects.filter((p) => p.isApp);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="py-14 md:py-20 max-w-2xl">
        <h1 className="type-display text-5xl sm:text-6xl">Apps</h1>
        <p className="mt-5 text-lg text-ink-soft leading-relaxed">
          The product-shaped side of the workshop. Each of these lives in the
          workshop too — this is just the shelf where the usable things sit.
        </p>
      </header>

      {apps.length > 0 ? (
        <div className="divide-y divide-line border-t border-line-strong">
          {apps.map((project) => (
            <ProjectEntry key={project.slug} project={project} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <EmptyState title="No apps on the shelf yet">
          When a project grows into something usable, it appears here.
        </EmptyState>
      )}
    </div>
  );
}
