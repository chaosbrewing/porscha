import type { Metadata } from "next";
import Link from "next/link";
import { ProjectForm } from "@/components/console/ProjectForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div>
      <p className="mb-3">
        <Link
          href="/console/projects"
          className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
        >
          ← Projects
        </Link>
      </p>
      <h1 className="type-display text-4xl sm:text-5xl">New project</h1>
      <p className="mt-3 text-ink-soft max-w-xl">
        Everything here can change later. Nothing becomes public until you
        say so — new projects start hidden with every signal off.
      </p>
      <div className="mt-10">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
