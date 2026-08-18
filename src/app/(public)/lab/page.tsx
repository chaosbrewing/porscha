import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { getLabExperiments } from "@/server/content/loader";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Numbered experiments — hypotheses, results, and honest dead ends.",
  alternates: { canonical: "/lab" },
};

const STATUS_LABEL: Record<string, string> = {
  running: "Running",
  concluded: "Concluded",
  abandoned: "Abandoned",
  resting: "Resting",
};

export default function LabPage() {
  const experiments = getLabExperiments();

  return (
    <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
      <header className="pt-12 pb-14 lg:pt-20">
        <SectionLabel label="Headquarters · Lab" />
        <h1 className="type-feature mt-8 text-[clamp(2.75rem,8vw,5rem)]">Lab</h1>
        <p className="type-standfirst mt-6 max-w-xl">
          Numbered experiments. Some conclude, some get abandoned, some
          quietly become projects. Unfinished is the point.
        </p>
      </header>

      {experiments.length > 0 ? (
        <ol className="border-t border-line-strong">
          {experiments.map((exp) => (
            <li key={exp.slug} className="border-b border-line">
              <Link
                href={`/lab/${exp.slug}`}
                className="group grid gap-2 py-7 sm:grid-cols-[90px_1fr_auto] sm:items-baseline sm:gap-8"
              >
                <span className="font-mono text-sm text-ink-faint">
                  №{String(exp.number).padStart(2, "0")}
                </span>
                <span>
                  <span className="type-heading text-xl group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                    {exp.name}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft leading-relaxed max-w-xl">
                    {exp.hypothesis}
                  </span>
                </span>
                <span className="type-kicker text-ink-faint">
                  {STATUS_LABEL[exp.status]} · {formatDate(exp.date)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="The lab is empty tonight">
          Experiments are written up as they happen — check back soon.
        </EmptyState>
      )}
    </div>
  );
}
