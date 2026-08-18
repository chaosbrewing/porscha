import type { Metadata } from "next";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
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
    <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
      <header className="pt-12 lg:pt-20">
        <SectionLabel label="Headquarters · Workshop" />
        <h1 className="type-feature mt-8 text-[clamp(2.75rem,8vw,5rem)]">
          Workshop
        </h1>
        <p className="type-standfirst mt-6 max-w-xl">
          Everything on the bench and on the shelves — building, resting, and
          finished alike. A workshop isn&rsquo;t a showroom; some of this is
          mid-cut.
        </p>
      </header>

      <div className="mt-14" />

      {degraded ? (
        <p className="mb-6 type-caption border border-line px-4 py-3">
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
