import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabExperiment, getLabExperiments } from "@/server/content/loader";
import { getPublicProject } from "@/server/projects/service";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ experiment: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { experiment } = await params;
  const exp = getLabExperiment(experiment);
  if (!exp) return { title: "Not found" };
  return {
    title: `Lab №${String(exp.number).padStart(2, "0")} — ${exp.name}`,
    description: exp.hypothesis,
    alternates: { canonical: `/lab/${exp.slug}` },
  };
}

export function generateStaticParams() {
  return getLabExperiments().map((e) => ({ experiment: e.slug }));
}

export default async function ExperimentPage({ params }: Props) {
  const { experiment } = await params;
  const exp = getLabExperiment(experiment);
  if (!exp) notFound();

  const related = exp.project ? await getPublicProject(exp.project) : null;

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-8">
      <header className="py-14 md:py-20">
        <p className="mb-4">
          <Link
            href="/lab"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
          >
            ← Lab
          </Link>
        </p>
        <p className="font-mono text-sm text-ink-faint">
          Experiment №{String(exp.number).padStart(2, "0")} ·{" "}
          {formatDate(exp.date)}
        </p>
        <h1 className="type-display text-4xl sm:text-5xl mt-3">{exp.name}</h1>

        <dl className="mt-8 space-y-5 border-l-2 border-accent pl-5">
          <div>
            <dt className="type-meta text-ink-faint">Hypothesis</dt>
            <dd className="mt-1 leading-relaxed">{exp.hypothesis}</dd>
          </div>
          {exp.result ? (
            <div>
              <dt className="type-meta text-ink-faint">Result</dt>
              <dd className="mt-1 leading-relaxed">{exp.result}</dd>
            </div>
          ) : (
            <div>
              <dt className="type-meta text-ink-faint">Result</dt>
              <dd className="mt-1 text-ink-soft italic">
                Still running — no verdict yet.
              </dd>
            </div>
          )}
        </dl>
      </header>

      <div
        className="prose-workshop pb-10"
        dangerouslySetInnerHTML={{ __html: exp.html }}
      />

      <footer className="border-t border-line py-8 flex flex-wrap gap-6 text-sm">
        {related ? (
          <p>
            <span className="type-meta text-ink-faint mr-2">Related project</span>
            <Link
              href={`/workshop/${related.slug}`}
              className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
            >
              {related.name}
            </Link>
          </p>
        ) : null}
        {exp.link ? (
          <p>
            <a
              href={exp.link}
              rel="noopener"
              className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
            >
              Source / demo
            </a>
          </p>
        ) : null}
      </footer>
    </article>
  );
}
