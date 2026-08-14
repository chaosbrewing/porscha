import type { Metadata } from "next";
import { ProjectEntry } from "@/components/public/ProjectEntry";
import { EmptyState } from "@/components/shared/EmptyState";
import { getPublicProjects } from "@/server/projects/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workshop",
  description:
    "The central project index — everything Porscha is building, tending, or letting rest.",
  alternates: { canonical: "/workshop" },
};

export default async function WorkshopPage() {
  const { projects, degraded } = await getPublicProjects();

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="py-14 md:py-20 max-w-2xl">
        <h1 className="type-display text-5xl sm:text-6xl">Workshop</h1>
        <p className="mt-5 text-lg text-ink-soft leading-relaxed">
          Everything on the bench and on the shelves — building, resting, and
          finished alike. A workshop isn&rsquo;t a showroom; some of this is
          mid-cut.
        </p>
      </header>

      {degraded ? (
        <p className="mb-6 text-sm text-ink-faint border border-line rounded px-4 py-3">
          Live project signals are briefly unavailable — showing the registry
          without recent activity.
        </p>
      ) : null}

      {projects.length > 0 ? (
        <div className="divide-y divide-line border-t border-line-strong">
          {projects.map((project) => (
            <ProjectEntry
              key={project.slug}
              project={project}
              headingLevel="h2"
            />
          ))}
        </div>
      ) : (
        <EmptyState title="The shelves are empty">
          Projects appear here once they are added to the registry.
        </EmptyState>
      )}
    </div>
  );
}
